import { Card, CardContent } from '@/shared/ui/card';
import React from 'react';

interface ActivityStatsProps {
  activities: any[];
}

export const ActivityStats: React.FC<ActivityStatsProps> = ({ activities }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Card>
      <CardContent className="p-4">
        <div className="text-2xl font-bold">{activities.length}</div>
        <p className="text-sm text-muted-foreground">Total de Atividades</p>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4">
        <div className="text-2xl font-bold text-green-600">
          {activities.filter((a: any) => a.status === 'completed').length}
        </div>
        <p className="text-sm text-muted-foreground">Concluídas</p>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4">
        <div className="text-2xl font-bold text-blue-600">
          {activities.filter((a: any) => a.status === 'scheduled').length}
        </div>
        <p className="text-sm text-muted-foreground">Agendadas</p>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4">
        <div className="text-2xl font-bold text-orange-600">
          {activities.filter((a: any) => a.status === 'pending').length}
        </div>
        <p className="text-sm text-muted-foreground">Pendentes</p>
      </CardContent>
    </Card>
  </div>
); 