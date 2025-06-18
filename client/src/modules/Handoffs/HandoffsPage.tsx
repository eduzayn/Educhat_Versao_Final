import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useLocation } from 'wouter';
import type { Handoff } from '@shared/schema';
import { HandoffsStats } from './HandoffsStats';
import { HandoffsList } from './HandoffsList';
import { HandoffsDashboard } from './components/HandoffsDashboard';
import { HandoffAnalytics } from './components/HandoffAnalytics';
import { HandoffActions } from './components/HandoffActions';
import { ArrowLeft, BarChart3, List, Activity } from 'lucide-react';

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
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedHandoff, setSelectedHandoff] = useState<HandoffWithDetails | null>(null);

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

  const handleHandoffAction = async (action: string, handoffId: number, data?: any) => {
    try {
      const response = await fetch(`/api/handoffs/${handoffId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || { userId: 57 }) // TODO: Get current user ID
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Handoff ${action === 'accept' ? 'aceito' : action === 'reject' ? 'rejeitado' : 'processado'} com sucesso`
        });
        await loadData();
        if (selectedHandoff?.id === handoffId) {
          setSelectedHandoff(null);
          setCurrentView('dashboard');
        }
      } else {
        throw new Error(`Erro ao ${action} handoff`);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: `Não foi possível ${action} o handoff`,
        variant: "destructive"
      });
    }
  };

  const handleAcceptHandoff = (handoffId: number) => handleHandoffAction('accept', handoffId);
  const handleRejectHandoff = (handoffId: number, reason?: string) => handleHandoffAction('reject', handoffId, { reason });

  const handleSelectHandoff = (handoff: HandoffWithDetails) => {
    setSelectedHandoff(handoff);
    setCurrentView('details');
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              if (currentView === 'details') {
                setCurrentView('dashboard');
                setSelectedHandoff(null);
              } else {
                setLocation('/');
              }
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {currentView === 'details' ? 'Voltar ao Dashboard' : 'Voltar'}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentView === 'details' ? `Handoff #${selectedHandoff?.id}` : 'Sistema de Transferências'}
            </h1>
            <p className="text-gray-600">
              {currentView === 'details' 
                ? 'Detalhes e ações da transferência'
                : 'Gerencie transferências de conversas inteligentes'
              }
            </p>
          </div>
        </div>
      </div>

      {currentView === 'details' && selectedHandoff ? (
        <HandoffActions 
          handoff={selectedHandoff} 
          onAction={handleHandoffAction}
        />
      ) : (
        <Tabs value={currentView} onValueChange={setCurrentView} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Lista Completa
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Análises
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <HandoffsDashboard 
              stats={stats} 
              handoffs={handoffs} 
              onRefresh={loadData}
            />
            {stats && <HandoffsStats stats={stats} />}
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Todas as Transferências</CardTitle>
                <CardDescription>
                  Lista completa com filtros avançados e ações em lote
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HandoffsList
                  handoffs={handoffs}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  handleAcceptHandoff={handleAcceptHandoff}
                  handleRejectHandoff={handleRejectHandoff}
                  onSelectHandoff={handleSelectHandoff}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <HandoffAnalytics 
              stats={stats} 
              handoffs={handoffs}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 