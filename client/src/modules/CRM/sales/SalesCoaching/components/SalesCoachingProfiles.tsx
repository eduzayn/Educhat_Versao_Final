import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Star, TrendingUp, TrendingDown } from 'lucide-react';

interface SalespersonProfile {
  id: number;
  name: string;
  responseTime: number;
  conversionRate: number;
  salesVolume: number;
  strengths: string[];
  improvements: string[];
  lastCoaching: string;
}

interface SalesCoachingProfilesProps {
  profiles: SalespersonProfile[];
}

export function SalesCoachingProfiles({ profiles }: SalesCoachingProfilesProps) {
  const getPerformanceBadge = (conversionRate: number) => {
    if (conversionRate >= 80) {
      return <Badge className="bg-green-100 text-green-800">Excelente</Badge>;
    } else if (conversionRate >= 60) {
      return <Badge className="bg-blue-100 text-blue-800">Bom</Badge>;
    } else if (conversionRate >= 40) {
      return <Badge className="bg-yellow-100 text-yellow-800">Regular</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Precisa Melhorar</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {profiles.map((profile) => (
        <Card key={profile.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">{profile.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Último coaching: {new Date(profile.lastCoaching).toLocaleDateString()}
                </p>
              </div>
            </div>
            {getPerformanceBadge(profile.conversionRate)}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Métricas */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tempo de Resposta</p>
                  <p className="text-lg font-semibold">{profile.responseTime}h</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                  <p className="text-lg font-semibold">{profile.conversionRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Volume de Vendas</p>
                  <p className="text-lg font-semibold">R$ {profile.salesVolume.toLocaleString()}</p>
                </div>
              </div>

              {/* Pontos Fortes */}
              <div>
                <p className="text-sm font-medium mb-2">Pontos Fortes</p>
                <div className="flex flex-wrap gap-2">
                  {profile.strengths.map((strength, index) => (
                    <Badge key={index} variant="outline" className="bg-green-50">
                      <Star className="h-3 w-3 mr-1 text-green-600" />
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Pontos de Melhoria */}
              <div>
                <p className="text-sm font-medium mb-2">Pontos de Melhoria</p>
                <div className="flex flex-wrap gap-2">
                  {profile.improvements.map((improvement, index) => (
                    <Badge key={index} variant="outline" className="bg-yellow-50">
                      <TrendingUp className="h-3 w-3 mr-1 text-yellow-600" />
                      {improvement}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Progresso Geral */}
              <div>
                <p className="text-sm font-medium mb-2">Progresso Geral</p>
                <Progress 
                  value={(profile.conversionRate / 100) * 100} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 