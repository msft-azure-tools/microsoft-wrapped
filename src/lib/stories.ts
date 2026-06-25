import type { Story, WrappedStats } from "../types";

const formatter = new Intl.NumberFormat("en-US");

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
      title: `${stats.displayName.split(" ")[0]}, your work year has a story.`,
      value: "12 months",
      body: "We took a year of Microsoft 365 signals and turned them into something worth tapping through.",
      badge: "Limited work edition",
    },
    {
      kicker: "Outlook energy",
      title: "You left a mark on Outlook.",
      value: number(stats.mail.sent),
      body: `${stats.mail.busiestMonth} was the month Outlook felt the extra momentum.`,
      badge: stats.mail.sent > 1000 ? "Inbox Rocket" : "Selective Sender",
    },
    {
      kicker: "Inbox weather",
      title: "Your inbox had its own climate.",
      value: number(stats.mail.received),
      body: "Some days were clear skies. Other days arrived with notification-level winds.",
      badge: stats.mail.received > stats.mail.sent * 2 ? "Inbox Ninja" : "Balanced Inbox",
    },
    {
      kicker: "Calendar mode",
      title: "Your calendar took the stage.",
      value: hours(stats.meetings.totalMinutes),
      body: `${number(stats.meetings.totalMinutes)} minutes. Or, put differently: a pretty committed relationship with your calendar.`,
      badge: stats.meetings.totalMinutes > 30000 ? "Meeting Marathoner" : "Calendar Cruiser",
    },
    {
      kicker: "Teams hours",
      title: "Teams was there. A lot.",
      value: hours(stats.meetings.teamsMinutes),
      body: `${teamsShare}% of meeting time had online energy. Camera on? Maybe. Maybe not.`,
      badge: teamsShare > 70 ? "Teams Native" : "Hybrid Human",
    },
    {
      kicker: "Peak day",
      title: `${stats.meetings.busiestWeekday} was the main character.`,
      value: stats.meetings.busiestWeekday,
      body: `${number(stats.meetings.noMeetingDays)} weekdays stayed meeting-free. Rare. Beautiful.`,
      badge: "Calendar Pattern",
    },
    {
      kicker: "Collab gravity",
      title: top ? `${top.name} was in your orbit.` : "Your top collaborator is waiting in the wings.",
      value: top ? number(top.score) : "0",
      body: top
        ? `${top.meetings} meetings, ${top.mail} mail touchpoints, and ${top.chats} Teams threads. That’s a duo.`
        : "Not enough signals for a leaderboard yet.",
      badge: "Collaboration Gravity",
      collaborator: top,
    },
    {
      kicker: "Teams social",
      title: "The chats kept the rhythm.",
      value: number(stats.teams.chats),
      body: `${stats.teams.oneOnOneChats} 1:1s, ${stats.teams.groupChats} groups, and ${stats.teams.meetingChats} meeting threads. Just enough chaos. Very Teams.`,
      badge: stats.teams.groupChats > stats.teams.oneOnOneChats ? "Group Chat Citizen" : "1:1 Operator",
    },
    {
      kicker: "Unlocked",
      title: stats.badges[0]?.title || "Wrapped Human",
      value: "Unlocked",
      body: stats.badges[0]?.text || "You made the year happen. Microsoft 365 kept the signals. Now you have the card.",
      badge: "Share-ready",
    },
  ];
}

