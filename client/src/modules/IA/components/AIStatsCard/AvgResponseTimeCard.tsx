import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Activity } from 'lucide-react';

export function AvgResponseTimeCard({ value }: { value: number }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}ms</div>
      </CardContent>
    </Card>
  );
} 