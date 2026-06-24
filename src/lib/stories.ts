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
      kicker: "Teams & Outlook Wrapped",
      title: `${stats.displayName.split(" ")[0]}, det här var ditt arbetsår.`,
      value: "12 månader",
      body: "Vi har räknat metadata, inte innehåll. Inga mailtexter, chattmeddelanden eller mötesämnen visas.",
      badge: "Privacy-safe edition",
    },
    {
      kicker: "Du skickade",
      title: "Du var inte direkt tyst i Outlook.",
      value: number(stats.mail.sent),
      body: `Skickade mail senaste 12 månaderna. Mest intensiva mailmånaden: ${stats.mail.busiestMonth}.`,
      badge: stats.mail.sent > 1000 ? "Inbox Launcher" : "Selective Sender",
    },
    {
      kicker: "Du fick",
      title: "Inkorgen hade puls.",
      value: number(stats.mail.received),
      body: "Det här är ren mailmetadata från Inbox. Ämnesrader och innehåll lämnas helt utanför.",
      badge: stats.mail.received > stats.mail.sent * 2 ? "Inbox Survivor" : "Balanced Inbox",
    },
    {
      kicker: "Mötestid",
      title: "En liten del av livet gick till kalendern.",
      value: hours(stats.meetings.totalMinutes),
      body: `${number(stats.meetings.totalMinutes)} minuter i möten. I snitt ${number(stats.meetings.averageMinutesPerWorkday)} minuter per arbetsdag.`,
      badge: stats.meetings.totalMinutes > 30000 ? "Meeting Marathoner" : "Calendar Cruiser",
    },
    {
      kicker: "Teams-möten",
      title: "Du levde ganska mycket i Teams.",
      value: hours(stats.meetings.teamsMinutes),
      body: `${teamsShare}% av din mötestid verkar ha varit Teams/online-möten.`,
      badge: teamsShare > 70 ? "Teams Native" : "Hybrid Human",
    },
    {
      kicker: "Peak day",
      title: `${stats.meetings.busiestWeekday} var din kalenderboss.`,
      value: stats.meetings.busiestWeekday,
      body: `${number(stats.meetings.noMeetingDays)} vardagar hade inga möten alls. De förtjänar nästan en egen badge.`,
      badge: "Calendar Pattern Detected",
    },
    {
      kicker: "Top collaborator",
      title: top ? `${top.name} dök upp överallt.` : "Din top collaborator är hemlig.",
      value: top ? number(top.score) : "0",
      body: top
        ? `${top.meetings} möten, ${top.mail} mailinteraktioner och ${top.chats} Teams-chattar i metadataurvalet.`
        : "Vi hittade inte tillräckligt med metadata för en topplista.",
      badge: "Collaboration Gravity",
      collaborator: top,
    },
    {
      kicker: "Teams metadata",
      title: "Chattar, grupper och mötestrådar.",
      value: number(stats.teams.chats),
      body: `${stats.teams.oneOnOneChats} 1:1-chattar, ${stats.teams.groupChats} gruppchattar och ${stats.teams.meetingChats} möteschattar i Teams-listan.`,
      badge: stats.teams.groupChats > stats.teams.oneOnOneChats ? "Group Chat Citizen" : "1:1 Operator",
    },
    {
      kicker: "Din badge",
      title: stats.badges[0]?.title || "Wrapped Human",
      value: "Unlocked",
      body: stats.badges[0]?.text || "Du skapade spår i Outlook, Teams och kalendern.",
      badge: "Shareable moment",
    },
  ];
}

