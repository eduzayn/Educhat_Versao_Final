declare namespace Express {
  export interface User {
    id: number;
    email: string;
    username: string;
    displayName: string | null;
    role: string | null;
    roleId: number | null;
    dataKey: string | null;
    channels: string[] | null;
    teams: string[] | null;
    teamTypes: string[] | null;
    teamId: number | null;
    team: string | null;
  }
} 