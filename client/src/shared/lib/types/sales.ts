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

export interface Material {
  id: number;
  title: string;
  description: string;
  type: 'document' | 'image' | 'video';
  url: string;
  category: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface CoachingStats {
  totalCoaching: number;
  completedCoaching: number;
  pendingCoaching: number;
  inProgressCoaching: number;
  averageResponseTime: number;
  conversionRate: number;
  salesVolume: number;
  byType: {
    feedback: number;
    goal: number;
    training: number;
  };
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

export interface CommissionSummary {
  salespersonId: number;
  salespersonName: string;
  totalDeals: number;
  totalSales: number;
  totalCommissions: number;
  averageRate: number;
}

export interface CommissionsData {
  totalCommissions: number;
  totalPending: number;
  totalPaid: number;
  totalSales: number;
  commissions: Commission[];
  commissionsBySalesperson?: CommissionSummary[];
}

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