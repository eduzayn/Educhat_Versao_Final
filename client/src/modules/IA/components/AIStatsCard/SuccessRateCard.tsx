import { Card, CardHeader, CardTitle, CardContent } from '../../../shared/ui/card';
import { Target } from 'lucide-react';

export function SuccessRateCard({ value }: { value: number }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
        <Target className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}%</div>
      </CardContent>
    </Card>
  );
} 