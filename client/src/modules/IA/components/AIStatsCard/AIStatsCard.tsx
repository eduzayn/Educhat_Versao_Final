import { Card } from '@/shared/ui/card';
import { AIStats, AIStatsCardProps } from './types';
import { TotalInteractionsCard } from './TotalInteractionsCard';
import { AvgResponseTimeCard } from './AvgResponseTimeCard';
import { SuccessRateCard } from './SuccessRateCard';
import { PerplexityCard } from './PerplexityCard';
import { LeadsGeneratedCard } from './LeadsGeneratedCard';
import { StudentsHelpedCard } from './StudentsHelpedCard';
import { TopIntentsCard } from './TopIntentsCard';

export function AIStatsCard({ stats, isLoading }: AIStatsCardProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <div className="p-6 animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <TotalInteractionsCard value={stats?.totalInteractions || 0} />
      <AvgResponseTimeCard value={stats?.avgResponseTime || 0} />
      <SuccessRateCard value={stats?.successRate || 0} />
      <PerplexityCard />
      <LeadsGeneratedCard value={stats?.leadsGenerated || 0} />
      <StudentsHelpedCard value={stats?.studentsHelped || 0} />
      <TopIntentsCard intents={stats?.topIntents || []} />
    </div>
  );
} 