import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/ui/dialog';
import { Button } from '@/shared/ui/ui/button';
import { Input } from '@/shared/ui/ui/input';
import { Label } from '@/shared/ui/ui/label';
import { Switch } from '@/shared/ui/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Separator } from '@/shared/ui/ui/separator';
import {
  Settings,
  Database,
  Users,
  MessageSquare,
  Target,
  RefreshCw
} from "lucide-react";

interface CRMSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CRMSettings({ open, onOpenChange }: CRMSettingsProps) {
  const [activeTab, setActiveTab] = useState("general");

  // Mock data para demonstração das configurações
  const [generalSettings, setGeneralSettings] = useState({
    autoAssignDeals: true,
    enableNotifications: true,
    dealReminder: 24,
    companyName: "EduChat CRM"
  });

  const [databaseSettings, setDatabaseSettings] = useState({
    autoBackup: true,
    backupFrequency: 24,
    retentionDays: 30
  });

  const [teamSettings, setTeamSettings] = useState({
    autoAssignment: true,
    maxDealsPerUser: 10,
    enableTeamLeaderboard: true
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    slackIntegration: false
  });

  const [dealSettings, setDealSettings] = useState({
    defaultProbability: 50,
    autoMoveStages: false,
    requireApproval: true
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações do CRM
          </DialogTitle>
          <DialogDescription>
            Gerencie as configurações do sistema, equipes, notificações e integrações.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Banco
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Equipes
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="deals" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Negócios
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Carregando configurações...</span>
              </div>
            ) : (
              <>
                <TabsContent value="general" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurações Gerais</CardTitle>
                      <CardDescription>
                        Configurações básicas do sistema CRM
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {getSettingsByCategory('general').map((setting: SystemSetting) => (
                        <div key={setting.id}>
                          {renderSettingInput(setting)}
                          <Separator className="mt-4" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="database" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurações de Banco de Dados</CardTitle>
                      <CardDescription>
                        Configurações relacionadas ao armazenamento de dados
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {getSettingsByCategory('database').map((setting: SystemSetting) => (
                        <div key={setting.id}>
                          {renderSettingInput(setting)}
                          <Separator className="mt-4" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="teams" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurações de Equipes</CardTitle>
                      <CardDescription>
                        Configurações de atribuição automática e gestão de equipes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {getSettingsByCategory('teams').map((setting: SystemSetting) => (
                        <div key={setting.id}>
                          {renderSettingInput(setting)}
                          <Separator className="mt-4" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurações de Notificações</CardTitle>
                      <CardDescription>
                        Configurações de alertas e notificações do sistema
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {getSettingsByCategory('notifications').map((setting: SystemSetting) => (
                        <div key={setting.id}>
                          {renderSettingInput(setting)}
                          <Separator className="mt-4" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="deals" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurações de Negócios</CardTitle>
                      <CardDescription>
                        Configurações do funil de vendas e gestão de negócios
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {getSettingsByCategory('deals').map((setting: SystemSetting) => (
                        <div key={setting.id}>
                          {renderSettingInput(setting)}
                          <Separator className="mt-4" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/system-settings'] });
              toast({
                title: "Configurações recarregadas",
                description: "As configurações foram atualizadas.",
              });
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recarregar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}