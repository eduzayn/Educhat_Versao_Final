import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';

export function TopIntentsCard({ intents }: { intents: Array<{ intent: string; count: number }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Principais Intenções</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {intents?.slice(0, 3).map((intent, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm">{intent.intent}</span>
              <Badge variant="secondary">{intent.count}</Badge>
            </div>
          )) || <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>}
        </div>
      </CardContent>
    </Card>
  );
} 