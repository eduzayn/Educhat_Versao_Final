import { useState } from "react";
import {
  BarChart3,
  Target,
  Users,
  Calendar,
  FileText,
  Settings,
  Plus,
  ArrowLeft
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/ui/tabs';
import { Button } from '@/shared/ui/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Link } from "wouter";

import {
  CRMDashboard,
  DealsModule,
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

            <TabsTrigger value="activities" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Atividades
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Relatórios
            </TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="flex-1">
            <div className="container mx-auto max-w-7xl px-4 py-6">
              <CRMDashboard />
            </div>
          </TabsContent>
          <TabsContent value="deals" className="flex-1">
            <div className="container mx-auto max-w-7xl px-4 py-6">
              <DealsModule />
            </div>
          </TabsContent>
          <TabsContent value="activities" className="flex-1">
            <div className="container mx-auto max-w-7xl px-4 py-6">
              <ActivitiesModule />
            </div>
          </TabsContent>
          <TabsContent value="reports" className="flex-1">
            <div className="container mx-auto max-w-7xl px-4 py-6">
              <ReportsModule />
            </div>
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