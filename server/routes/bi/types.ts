import { Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';

export interface BIFilters {
  period?: string;
  equipe?: string;
  channel?: string;
  userId?: string;
  type?: string;
}

export interface BIKPIResponse {
  totalAtendimentos: number;
  novosContatos: number;
  taxaConversao: number;
  taxaDesistencia: number;
  satisfacaoMedia: number;
  tempoMedioResposta: number;
  tempoMedioResolucao: number;
}

export interface BIChannelStats {
  name: string;
  count: number;
  percentage: number;
}

export interface BIDashboardMetrics {
  totalConversations: number;
  totalMessages: number;
  totalDeals: number;
  avgResponseTime: number;
  satisfactionScore: number;
}

export interface BIChannelData {
  name: string;
  conversations: number;
  messages: number;
}

export interface BIDailyTrend {
  date: string;
  conversations: number;
  messages: number;
}

export interface BIDashboardResponse {
  metrics: BIDashboardMetrics;
  channels: BIChannelData[];
  trends: BIDailyTrend[];
}

export interface BIUserStats {
  id: number;
  name: string;
  conversations: number;
  messages: number;
  avgResponseTime: number;
  satisfaction: number;
  productivity: number;
}

export interface BIDailyActivity {
  date: string;
  conversations: number;
  messages: number;
}

export interface BIUserGoals {
  conversations: number;
  responseTime: number;
  satisfaction: number;
}

export interface BIUserResponse {
  user: BIUserStats;
  dailyActivity: BIDailyActivity[];
  goals: BIUserGoals;
}

export interface BITeamStats {
  id: number;
  name: string;
  teamType: string;
  totalConversations: number;
  activeMembers: number;
  avgResponseTime: number;
  satisfaction: number;
  efficiency: number;
  topPerformers: Array<{
    name: string;
    score: number;
  }>;
}

export interface BIReportConversion {
  totalLeads: number;
  convertedDeals: number;
  conversionRate: string;
  funnel: Array<{
    stage: string;
    count: number;
  }>;
}

export interface BIReportChannel {
  id: number;
  name: string;
  type: string;
  conversations: number;
  messages: number;
  avgResponseTime: number;
  satisfaction: number;
}

export interface BIReportGeneral {
  summary: {
    totalConversations: number;
    totalMessages: number;
    totalDeals: number;
    avgResponseTime: number;
  };
  trends: any[];
  topChannels: Array<{
    name: string;
    conversations: number;
  }>;
}

export type BIRequest = AuthenticatedRequest & {
  query: BIFilters;
}; 