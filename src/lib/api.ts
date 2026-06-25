import type { IPublicClientApplication } from "@azure/msal-browser";
import { graphScopes } from "../authConfig";
import type { Badge, Collaborator, WrappedStats } from "../types";

type GraphCollection<T> = {
  value?: T[];
  "@odata.nextLink"?: string;
  "@odata.count"?: number;
};

type Profile = {
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
};

type CalendarEvent = {
  start?: { dateTime?: string };
  end?: { dateTime?: string };
  attendees?: Array<{ emailAddress?: { name?: string; address?: string } }>;
  organizer?: { emailAddress?: { name?: string; address?: string } };
  isOnlineMeeting?: boolean;
  onlineMeetingProvider?: string;
  isCancelled?: boolean;
};

type Message = {
  sentDateTime?: string;
  receivedDateTime?: string;
  from?: { emailAddress?: { name?: string; address?: string } };
  toRecipients?: Array<{ emailAddress?: { name?: string; address?: string } }>;
  ccRecipients?: Array<{ emailAddress?: { name?: string; address?: string } }>;
};

type Chat = {
  chatType?: "oneOnOne" | "group" | "meeting";
  members?: Array<{ displayName?: string; email?: string; userId?: string }>;
};

type CollaboratorAccumulator = Collaborator & {
  meetingMinutes: number;
};

const graphRoot = "https://graph.microsoft.com/v1.0";
const pageSize = 100;
const maxPages = 25;

export async function getGraphToken(instance: IPublicClientApplication): Promise<string> {
  const [account] = instance.getAllAccounts();
  if (!account) {
    throw new Error("No signed-in account found.");
  }

  try {
    const result = await instance.acquireTokenSilent({
      account,
      scopes: graphScopes,
    });
    return result.accessToken;
  } catch {
    const result = await instance.acquireTokenPopup({
      account,
      scopes: graphScopes,
    });
    return result.accessToken;
  }
}

export async function buildWrappedFromGraph(accessToken: string): Promise<WrappedStats> {
  const now = new Date();
  const periodEnd = now.toISOString();
  const periodStartDate = new Date(now);
  periodStartDate.setFullYear(periodStartDate.getFullYear() - 1);
  const periodStart = periodStartDate.toISOString();

  const profile = await graph<Profile>("/me?$select=displayName,mail,userPrincipalName", accessToken);
  const me = (profile.mail || profile.userPrincipalName || "").toLowerCase();

  const [events, sentMessages, receivedMessages, chats, sentCount, receivedCount] = await Promise.all([
    graphPaged<CalendarEvent>(
      `/me/calendarView?startDateTime=${encodeURIComponent(periodStart)}&endDateTime=${encodeURIComponent(periodEnd)}&$top=${pageSize}&$select=start,end,attendees,organizer,isOnlineMeeting,onlineMeetingProvider,isCancelled`,
      accessToken,
    ),
    graphPaged<Message>(
      `/me/mailFolders/sentitems/messages?$top=${pageSize}&$select=sentDateTime,toRecipients,ccRecipients&$filter=sentDateTime ge ${periodStart} and sentDateTime le ${periodEnd}`,
      accessToken,
    ).catch(() => []),
    graphPaged<Message>(
      `/me/mailFolders/inbox/messages?$top=${pageSize}&$select=receivedDateTime,from&$filter=receivedDateTime ge ${periodStart} and receivedDateTime le ${periodEnd}`,
      accessToken,
    ).catch(() => []),
    graphPaged<Chat>("/me/chats?$top=50&$select=chatType&$expand=members", accessToken, 3).catch(() => []),
    graphCount(`/me/mailFolders/sentitems/messages?$top=1&$count=true&$filter=sentDateTime ge ${periodStart} and sentDateTime le ${periodEnd}`, accessToken).catch(() => 0),
    graphCount(`/me/mailFolders/inbox/messages?$top=1&$count=true&$filter=receivedDateTime ge ${periodStart} and receivedDateTime le ${periodEnd}`, accessToken).catch(() => 0),
  ]);

  return aggregate({
    profile,
    me,
    periodStart,
    periodEnd,
    events,
    sentMessages,
    receivedMessages,
    chats,
    sentCount,
    receivedCount,
  });
}

async function graph<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${graphRoot}${path}`, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      consistencyLevel: "eventual",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Graph ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}

async function graphPaged<T>(path: string, accessToken: string, limit = maxPages): Promise<T[]> {
  const rows: T[] = [];
  let next: string | undefined = `${graphRoot}${path}`;
  let pages = 0;

  while (next && pages < limit) {
    const response = await fetch(next, {
      headers: {
        authorization: `Bearer ${accessToken}`,
        consistencyLevel: "eventual",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Graph ${response.status}: ${text}`);
    }

    const payload = (await response.json()) as GraphCollection<T>;
    rows.push(...(payload.value || []));
    next = payload["@odata.nextLink"];
    pages += 1;
  }

  return rows;
}

async function graphCount(path: string, accessToken: string): Promise<number> {
  const payload = await graph<GraphCollection<unknown>>(path, accessToken);
  return payload["@odata.count"] || 0;
}

function aggregate(input: {
  profile: Profile;
  me: string;
  periodStart: string;
  periodEnd: string;
  events: CalendarEvent[];
  sentMessages: Message[];
  receivedMessages: Message[];
  chats: Chat[];
  sentCount: number;
  receivedCount: number;
}): WrappedStats {
  const collaborators = new Map<string, CollaboratorAccumulator>();
  const weekdayMinutes = new Map<string, number>();
  const monthActivity = new Map<string, number>();
  const meetingDays = new Set<string>();
  let meetingMinutes = 0;
  let teamsMinutes = 0;
  let totalMeetings = 0;

  for (const event of input.events) {
    if (event.isCancelled) continue;
    const start = parseDate(event.start?.dateTime);
    const end = parseDate(event.end?.dateTime);
    if (!start || !end) continue;

    const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
    if (minutes <= 0) continue;

    totalMeetings += 1;
    meetingMinutes += minutes;
    meetingDays.add(start.toISOString().slice(0, 10));
    incrementMonth(monthActivity, event.start?.dateTime);

    if (event.isOnlineMeeting || event.onlineMeetingProvider) {
      teamsMinutes += minutes;
    }

    const weekday = new Intl.DateTimeFormat("sv-SE", { weekday: "long" }).format(start);
    weekdayMinutes.set(weekday, (weekdayMinutes.get(weekday) || 0) + minutes);

    for (const attendee of event.attendees || []) {
      addCollaborator(collaborators, attendee.emailAddress?.address, attendee.emailAddress?.name, input.me, "meetings", minutes);
    }
    addCollaborator(collaborators, event.organizer?.emailAddress?.address, event.organizer?.emailAddress?.name, input.me, "meetings", minutes);
  }

  for (const message of input.sentMessages) {
    incrementMonth(monthActivity, message.sentDateTime);
    for (const recipient of [...(message.toRecipients || []), ...(message.ccRecipients || [])]) {
      addCollaborator(collaborators, recipient.emailAddress?.address, recipient.emailAddress?.name, input.me, "mail");
    }
  }

  for (const message of input.receivedMessages) {
    incrementMonth(monthActivity, message.receivedDateTime);
    addCollaborator(collaborators, message.from?.emailAddress?.address, message.from?.emailAddress?.name, input.me, "mail");
  }

  const teams = { chats: input.chats.length, oneOnOneChats: 0, groupChats: 0, meetingChats: 0 };
  for (const chat of input.chats) {
    if (chat.chatType === "oneOnOne") teams.oneOnOneChats += 1;
    if (chat.chatType === "group") teams.groupChats += 1;
    if (chat.chatType === "meeting") teams.meetingChats += 1;
    for (const member of chat.members || []) {
      addCollaborator(collaborators, member.email || member.userId, member.displayName, input.me, "chats");
    }
  }

  const topCollaborators = [...collaborators.values()]
    .map((person) => ({
      name: person.name,
      email: person.email,
      meetings: person.meetings,
      mail: person.mail,
      chats: person.chats,
      score: person.meetings * 5 + person.mail * 2 + person.chats * 3,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const workdays = countWorkdays(new Date(input.periodStart), new Date(input.periodEnd));

  return {
    displayName: input.profile.displayName || "Wrapped user",
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    generatedAt: new Date().toISOString(),
    mail: {
      sent: input.sentCount || input.sentMessages.length,
      received: input.receivedCount || input.receivedMessages.length,
      busiestMonth: topEntry(monthActivity) || "unknown",
    },
    meetings: {
      total: totalMeetings,
      totalMinutes: meetingMinutes,
      teamsMinutes,
      busiestWeekday: topEntry(weekdayMinutes) || "unknown",
      noMeetingDays: Math.max(0, workdays - meetingDays.size),
      averageMinutesPerWorkday: meetingMinutes / Math.max(workdays, 1),
    },
    teams,
    topCollaborators,
    badges: makeBadges(input.sentCount, input.receivedCount, meetingMinutes, teamsMinutes, topCollaborators),
  };
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value.endsWith("Z") ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addCollaborator(
  map: Map<string, CollaboratorAccumulator>,
  address: string | undefined,
  name: string | undefined,
  me: string,
  field: "meetings" | "mail" | "chats",
  minutes = 0,
) {
  if (!address) return;
  const normalized = address.toLowerCase();
  if (normalized === me || normalized.includes("@teams.ms")) return;
  const current = map.get(normalized) || {
    name: name || address,
    email: address,
    meetings: 0,
    mail: 0,
    chats: 0,
    score: 0,
    meetingMinutes: 0,
  };
  if (field === "meetings") {
    current.meetings += 1;
    current.meetingMinutes += minutes;
  } else {
    current[field] += 1;
  }
  map.set(normalized, current);
}

function incrementMonth(map: Map<string, number>, value?: string) {
  const date = parseDate(value);
  if (!date) return;
  const key = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
  map.set(key, (map.get(key) || 0) + 1);
}

function topEntry(map: Map<string, number>): string | null {
  return [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

function countWorkdays(start: Date, end: Date): number {
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

function makeBadges(sent: number, received: number, meetingMinutes: number, teamsMinutes: number, collaborators: Collaborator[]): Badge[] {
  const badges: Badge[] = [];
  if (meetingMinutes > 30000) badges.push({ title: "Meeting Marathoner", text: "Your calendar had serious endurance energy." });
  if (teamsMinutes > meetingMinutes * 0.7) badges.push({ title: "Teams Socializer", text: "Most of your meeting time lived online." });
  if (received > sent * 2) badges.push({ title: "Inbox Ninja", text: "You survived a very active inbox." });
  if (collaborators.length >= 5) badges.push({ title: "Collaboration King", text: "A strong cast kept showing up in your work signals." });
  if (meetingMinutes < 12000) badges.push({ title: "Focus Time Champion", text: "You protected an impressive amount of calendar space." });
  return badges.length ? badges : [{ title: "Async Communicator", text: "You left a calm, controlled trail across the work graph." }];
}
