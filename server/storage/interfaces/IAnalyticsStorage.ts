export interface IAnalyticsStorage {
  getConversationAnalytics(filters?: any): Promise<any>;
  getMessageAnalytics(filters?: any): Promise<any>;
  getDealAnalytics(filters?: any): Promise<any>;
  getResponseTimeAnalytics(filters?: any): Promise<any>;
  getChannelAnalytics(filters?: any): Promise<any>;
  getUserPerformanceAnalytics(filters?: any): Promise<any>;
  getTeamPerformanceAnalytics(filters?: any): Promise<any>;
  getDealConversionAnalytics(filters?: any): Promise<any>;
  getSalesFunnelAnalytics(filters?: any): Promise<any>;
  generateAnalyticsReport(reportType: string, filters?: any): Promise<any>;
  sendAnalyticsReport(reportId: string, recipients: string[]): Promise<any>;
  executeCustomAnalyticsQuery(query: string): Promise<any>;
  getRealtimeAnalytics(): Promise<any>;
  getAnalyticsTrends(metric: string, period: string): Promise<any>;
  getAnalyticsAlerts(): Promise<any>;
  createAnalyticsAlert(alert: any): Promise<any>;
  updateAnalyticsAlert(alertId: string, alert: any): Promise<any>;
  deleteAnalyticsAlert(alertId: string): Promise<any>;
} 