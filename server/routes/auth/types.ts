declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      username: string;
      displayName: string;
      role: string;
      roleId: number;
      dataKey?: string;
      channels: string[];
      teams: string[];
      teamTypes: string[];
      teamId?: number | null;
      team?: string | null;
    }
  }
}

export {}; 