import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Search } from 'lucide-react';

export function PerplexityCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Perplexity AI</CardTitle>
        <Search className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full bg-green-500`}></div>
          <span className="text-sm font-medium">Ativo</span>
        </div>
      </CardContent>
    </Card>
  );
} 