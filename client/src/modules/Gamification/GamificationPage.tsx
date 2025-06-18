import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Progress } from '@/shared/ui/progress';
import { useLocation } from 'wouter';
import { 
  Trophy, 
  Award, 
  Star, 
  Target, 
  TrendingUp, 
  Users, 
  Calendar,
  ArrowLeft,
  Crown,
  Zap,
  CheckCircle,
  MessageCircle,
  Heart
} from 'lucide-react';

interface BadgeProgress {
  badgeId: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  progress: number;
  maxProgress: number;
  isEarned: boolean;
  earnedAt?: Date;
  points: number;
  rarity: string;
}

interface Achievement {
  id: number;
  type: string;
  title: string;
  description: string;
  points: number;
  earnedAt: Date;
}

interface LeaderboardEntry {
  userId: number;
  userName: string;
  teamName?: string;
  value: number;
  position: number;
  points: number;
}

interface UserStats {
  userId: number;
  period: string;
  conversationsAssigned: number;
  conversationsClosed: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  satisfactionScore: number;
  messagesExchanged: number;
  workingHours: number;
  totalPoints: number;
}

interface GamificationData {
  badges: {
    earned: BadgeProgress[];
    available: BadgeProgress[];
    total: number;
    earnedCount: number;
  };
  achievements: Achievement[];
  stats: {
    daily: UserStats | null;
    weekly: UserStats | null;
    monthly: UserStats | null;
  };
  leaderboards: {
    daily: LeaderboardEntry[];
    weekly: LeaderboardEntry[];
    monthly: LeaderboardEntry[];
  };
  userPositions: {
    daily: number | null;
    weekly: number | null;
    monthly: number | null;
  };
}

const iconMap: Record<string, any> = {
  Trophy,
  Award,
  Star,
  Target,
  TrendingUp,
  Users,
  Calendar,
  Crown,
  Zap,
  CheckCircle,
  MessageCircle,
  Heart
};

const rarityColors = {
  common: 'bg-gray-100 text-gray-800 border-gray-300',
  rare: 'bg-blue-100 text-blue-800 border-blue-300',
  epic: 'bg-purple-100 text-purple-800 border-purple-300',
  legendary: 'bg-yellow-100 text-yellow-800 border-yellow-300'
};

export function GamificationPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');

  const { data: gamificationData, isLoading, refetch } = useQuery<GamificationData>({
    queryKey: ['/api/gamification/dashboard'],
    refetchInterval: 30000
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gamificação</h1>
            <p className="text-gray-600">Sistema de motivação e reconhecimento</p>
          </div>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Atualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="achievements">Conquistas</TabsTrigger>
          <TabsTrigger value="leaderboard">Ranking</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <DashboardTab data={gamificationData} />
        </TabsContent>

        <TabsContent value="badges" className="space-y-6">
          <BadgesTab data={gamificationData} />
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <AchievementsTab data={gamificationData} />
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <LeaderboardTab data={gamificationData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DashboardTab({ data }: { data?: GamificationData }) {
  if (!data) return null;

  const stats = data.stats?.weekly || data.stats?.daily || data.stats?.monthly;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos Totais</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPoints || 0}</div>
            <p className="text-xs text-muted-foreground">Pontos acumulados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posição Semanal</CardTitle>
            <Trophy className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.userPositions?.weekly ? `#${data.userPositions.weekly}` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">No ranking da semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Conquistados</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.badges?.earnedCount || 0}/{data.badges?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">Badges coletados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversas Esta Semana</CardTitle>
            <MessageCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.conversationsAssigned || 0}</div>
            <p className="text-xs text-muted-foreground">Atendimentos realizados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Badges Recentes</CardTitle>
          <CardDescription>Suas últimas conquistas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.badges.earned.slice(0, 4).map((badge) => (
              <BadgeCard key={badge.badgeId} badge={badge} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top 5 da Semana</CardTitle>
          <CardDescription>Ranking semanal de pontos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(data.leaderboards?.weekly || []).slice(0, 5).map((entry, index) => (
              <div key={entry.userId} className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {entry.position}
                  </div>
                  <div>
                    <p className="font-medium">{entry.userName}</p>
                    {entry.teamName && (
                      <p className="text-xs text-gray-500">{entry.teamName}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{entry.points} pts</p>
                  <p className="text-xs text-gray-500">{entry.value} conversas</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BadgesTab({ data }: { data?: GamificationData }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              Badges Conquistados ({data.badges?.earnedCount || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {data.badges?.earned?.map((badge) => (
                <BadgeCard key={badge.badgeId} badge={badge} />
              )) || <p className="text-gray-500 text-sm">Nenhum badge conquistado ainda</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-gray-600" />
              Próximos Badges ({data.badges?.available?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {data.badges?.available?.slice(0, 6).map((badge) => (
                <BadgeCard key={badge.badgeId} badge={badge} />
              )) || <p className="text-gray-500 text-sm">Nenhum badge disponível</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BadgeCard({ badge }: { badge: BadgeProgress }) {
  const IconComponent = iconMap[badge.icon] || Award;
  
  return (
    <div className={`p-3 rounded-lg border-2 ${
      badge.isEarned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: badge.color + '20', color: badge.color }}
        >
          <IconComponent className="h-4 w-4" />
        </div>
        <Badge 
          variant="outline" 
          className={rarityColors[badge.rarity as keyof typeof rarityColors]}
        >
          {badge.rarity}
        </Badge>
      </div>
      <h4 className="font-medium text-sm mb-1">{badge.name}</h4>
      <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
      
      {!badge.isEarned && (
        <div className="space-y-1">
          <Progress value={(badge.progress / badge.maxProgress) * 100} className="h-1" />
          <p className="text-xs text-gray-500">
            {badge.progress}/{badge.maxProgress}
          </p>
        </div>
      )}
      
      {badge.isEarned && badge.earnedAt && (
        <p className="text-xs text-green-600">
          Conquistado em {new Date(badge.earnedAt).toLocaleDateString()}
        </p>
      )}
      
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs font-medium text-blue-600">+{badge.points} pts</span>
      </div>
    </div>
  );
}

function AchievementsTab({ data }: { data?: GamificationData }) {
  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Conquistas</CardTitle>
        <CardDescription>Suas últimas realizações no sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {(data.achievements || []).map((achievement) => (
            <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Trophy className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{achievement.title}</h4>
                <p className="text-sm text-gray-600">{achievement.description}</p>
                <p className="text-xs text-gray-500">
                  {new Date(achievement.earnedAt).toLocaleDateString()} • +{achievement.points} pontos
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LeaderboardTab({ data }: { data?: GamificationData }) {
  if (!data) return null;

  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking de Pontos</CardTitle>
        <div className="flex gap-2">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p === 'daily' ? 'Diário' : p === 'weekly' ? 'Semanal' : 'Mensal'}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.leaderboards[period].map((entry, index) => (
            <div 
              key={entry.userId} 
              className={`flex items-center justify-between p-3 rounded ${
                index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-yellow-400 text-yellow-900' :
                  index === 1 ? 'bg-gray-400 text-gray-900' :
                  index === 2 ? 'bg-orange-400 text-orange-900' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {entry.position}
                </div>
                <div>
                  <p className="font-medium">{entry.userName}</p>
                  {entry.teamName && (
                    <p className="text-sm text-gray-500">{entry.teamName}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{entry.points}</p>
                <p className="text-sm text-gray-500">pontos</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}