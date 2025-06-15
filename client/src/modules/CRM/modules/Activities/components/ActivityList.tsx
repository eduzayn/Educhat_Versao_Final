import { Card, CardContent, Badge, Button } from '@/shared/ui';
import { User, Calendar, Clock } from 'lucide-react';
import { activityTypes, statusMap } from '../types/activity';
import React from 'react';

interface ActivityListProps {
  activities: any[];
  onEdit: (activity: any) => void;
  onComplete: (activityId: string) => void;
}

export const ActivityList: React.FC<ActivityListProps> = ({ activities, onEdit, onComplete }) => {
  const getActivityIcon = (type: string) => {
    const ActivityIcon = activityTypes[type as keyof typeof activityTypes]?.icon || Clock;
    return ActivityIcon;
  };

  return (
    <div className="space-y-4">
      {activities.map((activity: any) => {
        const ActivityIcon = getActivityIcon(activity.type);
        const typeConfig = activityTypes[activity.type as keyof typeof activityTypes];
        const statusConfig = statusMap[activity.status as keyof typeof statusMap];

        return (
          <Card key={activity.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full ${typeConfig?.color} text-white`}>
                  <ActivityIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{activity.title}</h4>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{activity.contact}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(activity.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{activity.time}</span>
                    </div>
                    {activity.duration && <span>({activity.duration})</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Responsável: </span>
                      <span>{activity.owner}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => onEdit(activity)}>
                        Editar
                      </Button>
                      {activity.status === 'pending' && (
                        <Button size="sm" onClick={() => onComplete(activity.id)}>
                          Marcar como Concluída
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}; 