export type Badge = {
  title: string;
  text: string;
};

export type Collaborator = {
  name: string;
  email?: string;
  meetings: number;
  mail: number;
  chats: number;
  score: number;
};

export type WrappedStats = {
  displayName: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  mail: {
    sent: number;
    received: number;
    busiestMonth: string;
  };
  meetings: {
    total: number;
    totalMinutes: number;
    teamsMinutes: number;
    busiestWeekday: string;
    noMeetingDays: number;
    averageMinutesPerWorkday: number;
  };
  teams: {
    chats: number;
    oneOnOneChats: number;
    groupChats: number;
    meetingChats: number;
  };
  topCollaborators: Collaborator[];
  badges: Badge[];
};

export type Story = {
  kicker: string;
  title: string;
  value: string;
  body: string;
  badge?: string;
  collaborator?: Collaborator;
};

