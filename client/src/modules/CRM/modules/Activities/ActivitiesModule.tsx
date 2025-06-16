import { useLocation } from 'wouter';
import { useActivityNotifications } from '@/shared/lib/hooks/useActivityNotifications';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Calendar, Plus, ArrowLeft, Bell } from "lucide-react";
import { ActivityList } from './components/ActivityList';
import { ActivityFilters } from './components/ActivityFilters';
import { ActivityStats } from './components/ActivityStats';
import { ActivityDialog } from './components/ActivityDialog';
import { NotificationSettingsDialog } from './components/NotificationSettingsDialog';
import { useActivityForm } from './hooks/useActivityForm';
import { useActivityData } from './hooks/useActivityData';
import React from 'react';

export function ActivitiesModule() {
  const [, setLocation] = useLocation();
  const {
    activityForm,
    setActivityForm,
    editingActivity,
    isEditDialogOpen,
    isNewDialogOpen,
    startEdit,
    startCreate,
    resetForm,
  } = useActivityForm();
  const {
    activities,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
  } = useActivityData();
  const [activeTab, setActiveTab] = React.useState("list");
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = React.useState(false);
  // Notificações (mock)
  const { settings: notificationSettings, setSettings: setNotificationSettings, playNotificationSound } = useActivityNotifications(activities);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/')} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Atividades</h2>
            <p className="text-muted-foreground">Gerencie tarefas, reuniões e acompanhamentos</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setIsNotificationSettingsOpen(true)} title="Configurações de Notificação">
            <Bell className="h-4 w-4" />
          </Button>
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4 mr-2" /> Nova Atividade
          </Button>
        </div>
      </div>
      {/* Filtros */}
      <ActivityFilters
        search={search}
        setSearch={setSearch}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
      {/* Estatísticas rápidas */}
      <ActivityStats activities={activities} />
      {/* Tabs para visualização */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          <ActivityList
            activities={activities}
            onEdit={startEdit}
            onComplete={() => {}}
          />
          {activities.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-muted-foreground">
                {search || typeFilter || statusFilter
                  ? "Nenhuma atividade encontrada com os filtros aplicados"
                  : "Nenhuma atividade cadastrada no sistema"
                }
              </div>
              <Button className="mt-4" onClick={startCreate}>
                <Plus className="h-4 w-4 mr-2" /> Criar Primeira Atividade
              </Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visualização em Calendário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Visualização de calendário será implementada
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Diálogos */}
      <ActivityDialog
        open={isNewDialogOpen || isEditDialogOpen}
        onOpenChange={resetForm}
        activityForm={activityForm}
        setActivityForm={setActivityForm}
        onSubmit={resetForm}
        isEdit={!!editingActivity}
      />
      <NotificationSettingsDialog
        open={isNotificationSettingsOpen}
        onOpenChange={setIsNotificationSettingsOpen}
        notificationSettings={notificationSettings}
        setNotificationSettings={setNotificationSettings}
        playNotificationSound={playNotificationSound}
      />
    </div>
  );
}