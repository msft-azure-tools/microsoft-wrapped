import type { Story, WrappedStats } from "../types";

const formatter = new Intl.NumberFormat("sv-SE");

export function number(value: number): string {
  return formatter.format(Math.round(value));
}

export function hours(minutes: number): string {
  return `${number(minutes / 60)} h`;
}

export function buildStories(stats: WrappedStats): Story[] {
  const top = stats.topCollaborators[0];
  const teamsShare = Math.round((stats.meetings.teamsMinutes / Math.max(stats.meetings.totalMinutes, 1)) * 100);

  return [
    {
      kicker: "Microsoft Wrapped",
      title: `${stats.displayName.split(" ")[0]}, ditt arbetsår har en story.`,
      value: "12 månader",
      body: "Vi tog årets signaler från Microsoft 365 och gjorde dem till något som faktiskt är kul att klicka igenom.",
      badge: "Limited work edition",
    },
    {
      kicker: "Outlook energy",
      title: "Du lämnade spår i inkorgen.",
      value: number(stats.mail.sent),
      body: `${stats.mail.busiestMonth} var månaden då Outlook fick lite extra puls.`,
      badge: stats.mail.sent > 1000 ? "Inbox Rocket" : "Selective Sender",
    },
    {
      kicker: "Inbox weather",
      title: "Din inbox hade ett eget klimat.",
      value: number(stats.mail.received),
      body: "Vissa dagar var det solsken. Andra dagar var det notiser med vindstyrka.",
      badge: stats.mail.received > stats.mail.sent * 2 ? "Inbox Ninja" : "Balanced Inbox",
    },
    {
      kicker: "Calendar mode",
      title: "Kalendern tog sin plats.",
      value: hours(stats.meetings.totalMinutes),
      body: `${number(stats.meetings.totalMinutes)} minuter. Eller uttryckt annorlunda: en ganska seriös relation med kalendern.`,
      badge: stats.meetings.totalMinutes > 30000 ? "Meeting Marathoner" : "Calendar Cruiser",
    },
    {
      kicker: "Teams hours",
      title: "Teams var där. Ofta.",
      value: hours(stats.meetings.teamsMinutes),
      body: `${teamsShare}% av mötestiden hade online-vibe. Kameran kanske var på. Kanske inte.`,
      badge: teamsShare > 70 ? "Teams Native" : "Hybrid Human",
    },
    {
      kicker: "Peak day",
      title: `${stats.meetings.busiestWeekday} var huvudkaraktären.`,
      value: stats.meetings.busiestWeekday,
      body: `${number(stats.meetings.noMeetingDays)} vardagar höll sig fria från möten. Sällsynt. Vackert.`,
      badge: "Calendar Pattern",
    },
    {
      kicker: "Collab gravity",
      title: top ? `${top.name} var i din omloppsbana.` : "Din top collaborator väntar i kulisserna.",
      value: top ? number(top.score) : "0",
      body: top
        ? `${top.meetings} möten, ${top.mail} mailtouchpoints och ${top.chats} Teams-trådar. Det är ändå en duo.`
        : "Inte tillräckligt med signaler för en topplista än.",
      badge: "Collaboration Gravity",
      collaborator: top,
    },
    {
      kicker: "Teams social",
      title: "Chattarna höll rytmen.",
      value: number(stats.teams.chats),
      body: `${stats.teams.oneOnOneChats} 1:1, ${stats.teams.groupChats} grupper och ${stats.teams.meetingChats} mötestrådar. Lagom kaos. Helt Teams.`,
      badge: stats.teams.groupChats > stats.teams.oneOnOneChats ? "Group Chat Citizen" : "1:1 Operator",
    },
    {
      kicker: "Unlocked",
      title: stats.badges[0]?.title || "Wrapped Human",
      value: "Unlocked",
      body: stats.badges[0]?.text || "Du gjorde året. Microsoft 365 sparade signalerna. Nu har du kortet.",
      badge: "Share-ready",
    },
  ];
}

