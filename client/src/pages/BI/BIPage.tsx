import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { useLocation } from 'wouter';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Target, 
  Activity, 
  Download,
  Calendar,
  UserCheck,
  MessageSquare,
  Phone,
  Star,
  ArrowLeft
} from 'lucide-react';
import { BIDashboard } from './modules/BIDashboard';
import { ProductivityModule } from './modules/ProductivityModule';
import { TeamPerformanceModule } from './modules/TeamPerformanceModule';
import { AdvancedReportsModule } from './modules/AdvancedReportsModule';
import { SatisfactionModule } from './modules/SatisfactionModule';

export function BIPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Dashboard</span>
            </Button>
            <div className="border-l border-gray-300 h-6"></div>
            <div>
              <h1 className="text-2xl font-bold text-educhat-dark">
                Business Intelligence
              </h1>
              <p className="text-educhat-medium mt-1">
                Análises estratégicas e controle de produtividade
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatório
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Agendar Relatório
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="w-full justify-start border-b rounded-none h-12 px-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Dashboard Estratégico
            </TabsTrigger>
            <TabsTrigger value="productivity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" /> Produtividade Individual
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Performance de Equipes
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Relatórios Avançados
            </TabsTrigger>
            <TabsTrigger value="satisfaction" className="flex items-center gap-2">
              <Star className="h-4 w-4" /> Satisfação do Cliente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="flex-1 p-6">
            <BIDashboard />
          </TabsContent>
          
          <TabsContent value="productivity" className="flex-1 p-6">
            <ProductivityModule />
          </TabsContent>
          
          <TabsContent value="teams" className="flex-1 p-6">
            <TeamPerformanceModule />
          </TabsContent>
          
          <TabsContent value="reports" className="flex-1 p-6">
            <AdvancedReportsModule />
          </TabsContent>
          
          <TabsContent value="satisfaction" className="flex-1 p-6">
            <SatisfactionModule />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}