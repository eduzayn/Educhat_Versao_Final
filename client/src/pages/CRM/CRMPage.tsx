import { useState } from "react";
import {
  BarChart3,
  Target,
  Users,
  Calendar,
  FileText,
  Settings,
  Plus,
  ArrowLeft,
  TrendingUp,
  UserPlus,
  Phone,
  Mail,
  MessageSquare
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../tabs';
import { Button } from '../../button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../../dropdown-menu';
import { Link } from "wouter";
import { useAuth } from '@/shared/lib/hooks/useAuth';

import {
  CRMDashboard,
  DealsModule,
  ActivitiesModule,
  ReportsModule,
  SalesModule
} from "./modules";
import { CRMSettings } from "./components/CRMSettings";

export function CRMPage() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      <CRMHeader onOpenSettings={() => setShowSettings(true)} />
      <div className="flex-1 flex flex-col">
        <Tabs defaultValue="dashboard" className="h-full">
          <TabsList className="w-full justify-start border-b rounded-none h-12 px-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="deals" className="flex items-center gap-2">
              <Target className="h-4 w-4" /> Negócios
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Vendas
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Atividades
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Relatórios
            </TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="flex-1">
            <div className="p-6">
              <CRMDashboard />
            </div>
          </TabsContent>
          <TabsContent value="deals" className="flex-1">
            <div className="p-6">
              <DealsModule />
            </div>
          </TabsContent>
          <TabsContent value="sales" className="flex-1">
            <div className="p-6">
              <SalesModule />
            </div>
          </TabsContent>
          <TabsContent value="activities" className="flex-1">
            <div className="p-6">
              <ActivitiesModule />
            </div>
          </TabsContent>
          <TabsContent value="reports" className="flex-1">
            <div className="p-6">
              <ReportsModule />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <CRMSettings 
        open={showSettings} 
        onOpenChange={setShowSettings} 
      />
    </div>
  );
}

function CRMHeader({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { user } = useAuth();
  
  // Verificar se o usuário pode acessar configurações (gerentes e administradores)
  const canAccessSettings = (user as any)?.role === 'admin' || (user as any)?.role === 'gerente';

  return (
    <div className="border-b bg-background p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">CRM</h1>
            <p className="text-muted-foreground">
              Gerencie relacionamentos com clientes e oportunidades de negócio
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select defaultValue="month">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
            </SelectContent>
          </Select>
          {canAccessSettings && (
            <Button variant="outline" onClick={onOpenSettings}>
              <Settings className="h-4 w-4 mr-2" /> Configurações
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Ação Rápida
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => window.open('/inbox', '_blank')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Novo Atendimento
              </DropdownMenuItem>
              <DropdownMenuItem>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Contato
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Target className="h-4 w-4 mr-2" />
                Criar Negócio
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Phone className="h-4 w-4 mr-2" />
                Ligar para Contato
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="h-4 w-4 mr-2" />
                Enviar Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Calendar className="h-4 w-4 mr-2" />
                Agendar Atividade
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="h-4 w-4 mr-2" />
                Gerar Relatório
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}