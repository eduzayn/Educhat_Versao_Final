import { useState } from "react";
import {
  BarChart3,
  Target,
  Users,
  Building2,
  Calendar,
  FileText,
  Settings,
  Plus
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/ui/tabs';
import { Button } from '@/shared/ui/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';

import {
  CRMDashboard,
  DealsModule,
  ContactsModule,
  CompaniesModule,
  ActivitiesModule,
  ReportsModule
} from "./modules";

export function CRMPage() {
  return (
    <div className="flex flex-col h-screen">
      <CRMHeader />
      <div className="flex-1 flex flex-col">
        <Tabs defaultValue="dashboard" className="h-full">
          <TabsList className="w-full justify-start border-b rounded-none h-12 px-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="deals" className="flex items-center gap-2">
              <Target className="h-4 w-4" /> Negócios
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Contatos
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Empresas
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Atividades
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Relatórios
            </TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="flex-1 p-6">
            <CRMDashboard />
          </TabsContent>
          <TabsContent value="deals" className="flex-1 p-0">
            <DealsModule />
          </TabsContent>
          <TabsContent value="contacts" className="flex-1 p-6">
            <ContactsModule />
          </TabsContent>
          <TabsContent value="companies" className="flex-1 p-6">
            <CompaniesModule />
          </TabsContent>
          <TabsContent value="activities" className="flex-1 p-6">
            <ActivitiesModule />
          </TabsContent>
          <TabsContent value="reports" className="flex-1 p-6">
            <ReportsModule />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CRMHeader() {
  return (
    <div className="border-b bg-background p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CRM</h1>
          <p className="text-muted-foreground">
            Gerencie relacionamentos com clientes e oportunidades de negócio
          </p>
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
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" /> Configurações
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Ação Rápida
          </Button>
        </div>
      </div>
    </div>
  );
}