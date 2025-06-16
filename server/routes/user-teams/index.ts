import { Express } from 'express';
import { registerUserTeamsCrudRoutes } from './user-teams-crud';
import { registerUserTeamsMembersRoutes } from './user-teams-members';

export function registerUserTeamsRoutes(app: Express) {
  registerUserTeamsCrudRoutes(app);
  registerUserTeamsMembersRoutes(app);
}