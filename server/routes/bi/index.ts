import { Express } from 'express';
import { registerKPIRoutes } from './kpis';
import { registerChannelRoutes } from './channels';
import { registerDashboardRoutes } from './dashboard';
import { registerProductivityRoutes } from './productivity';
import { registerTeamRoutes } from './teams';
import { registerReportRoutes } from './reports';

export function registerBIRoutes(app: Express) {
  registerKPIRoutes(app);
  registerChannelRoutes(app);
  registerDashboardRoutes(app);
  registerProductivityRoutes(app);
  registerTeamRoutes(app);
  registerReportRoutes(app);
} 