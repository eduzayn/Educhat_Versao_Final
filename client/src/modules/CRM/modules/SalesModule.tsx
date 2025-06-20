import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { 
  BarChart3, 
  Target, 
  DollarSign, 
  MapPin, 
  Trophy, 
  Users 
} from "lucide-react";
import { useAuth } from '@/shared/lib/hooks/useAuth';

// Importar subcomponentes de vendas
import { SalesDashboard } from "@/modules/CRM/sales/SalesDashboard/SalesDashboard";
import { SalesTargets } from "@/modules/CRM/sales/SalesTargets/SalesTargets";
import { SalesCommissions } from "@/modules/CRM/sales/SalesCommissions/SalesCommissions";
import { SalesTerritories } from "@/modules/CRM/sales/SalesTerritories/SalesTerritories";
import { SalesLeaderboard } from "@/modules/CRM/sales/SalesLeaderboard/SalesLeaderboard";
import { SalesCoaching } from "@/modules/CRM/sales/SalesCoaching/SalesCoaching";

export function SalesModule() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [location] = useLocation();
  const { user } = useAuth();
  
  const isAdmin = (user as any)?.role === 'admin';

  // Processar parâmetros de URL para navegação automática
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    
    if (tab && ['dashboard', 'targets', 'commissions', 'territories', 'leaderboard', 'coaching'].includes(tab)) {
      setActiveTab(tab);
      // Limpar o parâmetro da URL após processar
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Módulo de Vendas</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie metas, comissões, territórios e performance da equipe de vendas
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="targets" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Metas
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="commissions" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Comissões
            </TabsTrigger>
          )}
          <TabsTrigger value="territories" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Territórios
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Ranking
          </TabsTrigger>
          <TabsTrigger value="coaching" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Coaching
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <SalesDashboard />
        </TabsContent>

        <TabsContent value="targets" className="space-y-6 mt-6">
          <SalesTargets />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="commissions" className="space-y-6 mt-6">
            <SalesCommissions />
          </TabsContent>
        )}

        <TabsContent value="territories" className="space-y-6 mt-6">
          <SalesTerritories />
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6 mt-6">
          <SalesLeaderboard />
        </TabsContent>

        <TabsContent value="coaching" className="space-y-6 mt-6">
          <SalesCoaching />
        </TabsContent>
      </Tabs>
    </div>
  );
}