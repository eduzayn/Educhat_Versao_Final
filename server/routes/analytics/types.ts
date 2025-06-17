import { Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissionsRefactored';

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: number;
  teamId?: number;
  teamType?: string;
  period?: string;
  groupBy?: string;
  channel?: string;
  messageType?: string;
  metric?: string;
  stage?: string;
  active?: boolean;
  type?: string;
  severity?: string;
}

export interface AnalyticsResponse {
  data?: any;
  analytics?: any;
  trends?: any;
  alerts?: any;
  error?: string;
}

export type AnalyticsRequest = AuthenticatedRequest & {
  query: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    teamId?: string;
    teamType?: string;
    period?: string;
    groupBy?: string;
    channel?: string;
    messageType?: string;
    metric?: string;
    stage?: string;
    active?: string;
    type?: string;
    severity?: string;
    compareWith?: string;
  };
};

export type AnalyticsReportRequest = AuthenticatedRequest & {
  body: {
    reportType: string;
    period?: string;
    format?: string;
    filters?: any;
    includeCharts?: boolean;
    recipients?: string[];
  };
};

export type AnalyticsAlertRequest = AuthenticatedRequest & {
  body: {
    type: string;
    severity: string;
    message: string;
    conditions: any;
    recipients?: string[];
  };
}; 