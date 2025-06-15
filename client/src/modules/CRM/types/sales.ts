// Tipos de vendas e CRM

export interface SalesTarget {
  id: number;
  salespersonId: number;
  salespersonName: string;
  targetValue: number;
  currentValue: number;
  period: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'overdue';
}

export interface Commission {
  id: number;
  salespersonId: number;
  salespersonName: string;
  dealId: number;
  dealValue: number;
  commissionRate: number;
  commissionValue: number;
  status: 'pending' | 'approved' | 'paid';
  dealClosedAt: string;
  paidAt?: string;
}

export interface LeaderboardEntry {
  id: number;
  name: string;
  position: number;
  totalSales: number;
  totalDeals: number;
  conversionRate: number;
  averageTicket: number;
  targetAchievement: number;
  monthlyGrowth: number;
}

export interface Territory {
  id: number;
  name: string;
  description: string;
  states: string[];
  cities: string[];
  salespeople: string[];
  leadsCount: number;
  salesCount: number;
  salesValue: number;
  isActive: boolean;
}

export interface CoachingRecord {
  id: number;
  salespersonId: number;
  salespersonName: string;
  date: string;
  type: 'feedback' | 'goal' | 'training';
  title: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdBy: string;
}

export interface SalespersonProfile {
  id: number;
  name: string;
  responseTime: number;
  conversionRate: number;
  salesVolume: number;
  strengths: string[];
  improvements: string[];
  lastCoaching: string;
} 