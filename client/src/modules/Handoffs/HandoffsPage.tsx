import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useLocation } from 'wouter';
import type { Handoff } from '@shared/schema';
import { HandoffsStats } from './HandoffsStats';
import { HandoffsList } from './HandoffsList';
import { RoundRobinDashboard } from './RoundRobinDashboard';

interface HandoffWithDetails extends Handoff {
  conversation?: {
    id: number;
    contactName: string;
    phone: string;
  };
  fromUser?: {
    id: number;
    displayName: string;
  };
  toUser?: {
    id: number;
    displayName: string;
  };
  fromTeam?: {
    id: number;
    name: string;
    color: string;
  };
  toTeam?: {
    id: number;
    name: string;
    color: string;
  };
}

interface HandoffStats {
  total: number;
  pending: number;
  completed: number;
  rejected: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export function HandoffsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [handoffs, setHandoffs] = useState<HandoffWithDetails[]>([]);
  const [stats, setStats] = useState<HandoffStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [handoffsResponse, statsResponse] = await Promise.all([
        fetch('/api/handoffs'),
        fetch('/api/handoffs/stats')
      ]);

      if (handoffsResponse.ok) {
        const handoffsData = await handoffsResponse.json();
        setHandoffs(handoffsData.handoffs || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de handoffs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptHandoff = async (handoffId: number) => {
    try {
      const response = await fetch(`/api/handoffs/${handoffId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 57 }) // TODO: Get current user ID
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Handoff aceito com sucesso"
        });
        await loadData();
      } else {
        throw new Error('Erro ao aceitar handoff');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível aceitar o handoff",
        variant: "destructive"
      });
    }
  };

  const handleRejectHandoff = async (handoffId: number, reason?: string) => {
    try {
      const response = await fetch(`/api/handoffs/${handoffId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Handoff rejeitado com sucesso"
        });
        await loadData();
      } else {
        throw new Error('Erro ao rejeitar handoff');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar o handoff",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
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
            <span className="icon-arrow-left h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sistema de Transferências</h1>
            <p className="text-gray-600">Gerencie transferências inteligentes e rodízio equitativo</p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && <HandoffsStats stats={stats} />}

      {/* Abas principais */}
      <Tabs defaultValue="round-robin" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="round-robin">Rodízio Equitativo</TabsTrigger>
          <TabsTrigger value="handoffs">Transferências</TabsTrigger>
        </TabsList>

        <TabsContent value="round-robin" className="space-y-6">
          <RoundRobinDashboard onRefresh={loadData} />
        </TabsContent>

        <TabsContent value="handoffs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transferências Recentes</CardTitle>
              <CardDescription>
                Visualize e gerencie todas as transferências de conversas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HandoffsList
                handoffs={handoffs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleAcceptHandoff={handleAcceptHandoff}
                handleRejectHandoff={handleRejectHandoff}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 