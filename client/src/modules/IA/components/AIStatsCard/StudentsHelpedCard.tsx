import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Users } from 'lucide-react';

export function StudentsHelpedCard({ value }: { value: number }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Alunos Atendidos</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
} 