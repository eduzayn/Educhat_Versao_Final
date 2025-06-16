import { Express } from 'express';
import { registerTeamsCrudRoutes } from './teams-crud';
import { registerTeamsMembersRoutes } from './teams-members';
import { registerTeamsAssignmentsRoutes } from './teams-assignments';

export function registerTeamsRoutes(app: Express) {
  registerTeamsCrudRoutes(app);
  registerTeamsMembersRoutes(app);
  registerTeamsAssignmentsRoutes(app);
}