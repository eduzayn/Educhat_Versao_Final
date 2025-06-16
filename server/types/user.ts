export interface User {
  id: number;
  email: string;
  username: string;
  displayName: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  isActive: boolean;
  teamId?: number;
} 