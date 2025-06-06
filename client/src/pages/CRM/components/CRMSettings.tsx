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
  Save
} from "lucide-react";

interface CRMSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CRMSettings({ open, onOpenChange }: CRMSettingsProps) {
  const [activeTab, setActiveTab] = useState("general");

  // Estados para configurações gerais
  const [generalSettings, setGeneralSettings] = useState({
    autoAssignDeals: true,
    enableNotifications: true,
    dealReminder: 24,
    companyName: "EduChat CRM"
  });

  // Estados para configurações de banco
  const [databaseSettings, setDatabaseSettings] = useState({
    autoBackup: true,
    backupFrequency: 24,
    retentionDays: 30
  });

  // Estados para configurações de equipes
  const [teamSettings, setTeamSettings] = useState({
    autoAssignment: true,
    maxDealsPerUser: 10,
    enableTeamLeaderboard: true
  });

  // Estados para configurações de notificações
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    slackIntegration: false
  });

  // Estados para configurações de negócios
  const [dealSettings, setDealSettings] = useState({
    defaultProbability: 50,
    autoMoveStages: false,
    requireApproval: true
  });

  const handleSaveSettings = () => {
    // Simular salvamento das configurações
    console.log('Salvando configurações:', {
      general: generalSettings,
      database: databaseSettings,
      team: teamSettings,
      notifications: notificationSettings,
      deals: dealSettings
    });
    
    // Fechar modal
    onOpenChange(false);
  };

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
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Gerais</CardTitle>
                  <CardDescription>
                    Configurações básicas do sistema CRM
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nome da Empresa</Label>
                    <Input
                      id="companyName"
                      value={generalSettings.companyName}
                      onChange={(e) => setGeneralSettings({...generalSettings, companyName: e.target.value})}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Atribuição Automática de Negócios</Label>
                      <div className="text-sm text-muted-foreground">
                        Distribui novos negócios automaticamente para a equipe
                      </div>
                    </div>
                    <Switch
                      checked={generalSettings.autoAssignDeals}
                      onCheckedChange={(checked) => setGeneralSettings({...generalSettings, autoAssignDeals: checked})}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Notificações Ativas</Label>
                      <div className="text-sm text-muted-foreground">
                        Habilita sistema de notificações do CRM
                      </div>
                    </div>
                    <Switch
                      checked={generalSettings.enableNotifications}
                      onCheckedChange={(checked) => setGeneralSettings({...generalSettings, enableNotifications: checked})}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="dealReminder">Lembrete de Negócios (horas)</Label>
                    <Input
                      id="dealReminder"
                      type="number"
                      value={generalSettings.dealReminder}
                      onChange={(e) => setGeneralSettings({...generalSettings, dealReminder: Number(e.target.value)})}
                    />
                  </div>
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
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Backup Automático</Label>
                      <div className="text-sm text-muted-foreground">
                        Executa backups automáticos dos dados
                      </div>
                    </div>
                    <Switch
                      checked={databaseSettings.autoBackup}
                      onCheckedChange={(checked) => setDatabaseSettings({...databaseSettings, autoBackup: checked})}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="backupFrequency">Frequência de Backup (horas)</Label>
                    <Input
                      id="backupFrequency"
                      type="number"
                      value={databaseSettings.backupFrequency}
                      onChange={(e) => setDatabaseSettings({...databaseSettings, backupFrequency: Number(e.target.value)})}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="retentionDays">Retenção de Dados (dias)</Label>
                    <Input
                      id="retentionDays"
                      type="number"
                      value={databaseSettings.retentionDays}
                      onChange={(e) => setDatabaseSettings({...databaseSettings, retentionDays: Number(e.target.value)})}
                    />
                  </div>
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
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Atribuição Automática</Label>
                      <div className="text-sm text-muted-foreground">
                        Distribui leads automaticamente entre membros da equipe
                      </div>
                    </div>
                    <Switch
                      checked={teamSettings.autoAssignment}
                      onCheckedChange={(checked) => setTeamSettings({...teamSettings, autoAssignment: checked})}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="maxDeals">Máximo de Negócios por Usuário</Label>
                    <Input
                      id="maxDeals"
                      type="number"
                      value={teamSettings.maxDealsPerUser}
                      onChange={(e) => setTeamSettings({...teamSettings, maxDealsPerUser: Number(e.target.value)})}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Ranking da Equipe</Label>
                      <div className="text-sm text-muted-foreground">
                        Exibe ranking de performance da equipe
                      </div>
                    </div>
                    <Switch
                      checked={teamSettings.enableTeamLeaderboard}
                      onCheckedChange={(checked) => setTeamSettings({...teamSettings, enableTeamLeaderboard: checked})}
                    />
                  </div>
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
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Notificações por Email</Label>
                      <div className="text-sm text-muted-foreground">
                        Envia alertas importantes por email
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Notificações por SMS</Label>
                      <div className="text-sm text-muted-foreground">
                        Envia alertas urgentes por SMS
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, smsNotifications: checked})}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Integração com Slack</Label>
                      <div className="text-sm text-muted-foreground">
                        Conecta notificações ao Slack da equipe
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.slackIntegration}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, slackIntegration: checked})}
                    />
                  </div>
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
                  <div className="space-y-2">
                    <Label htmlFor="defaultProbability">Probabilidade Padrão (%)</Label>
                    <Input
                      id="defaultProbability"
                      type="number"
                      min="0"
                      max="100"
                      value={dealSettings.defaultProbability}
                      onChange={(e) => setDealSettings({...dealSettings, defaultProbability: Number(e.target.value)})}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Movimentação Automática de Estágios</Label>
                      <div className="text-sm text-muted-foreground">
                        Move negócios automaticamente entre estágios
                      </div>
                    </div>
                    <Switch
                      checked={dealSettings.autoMoveStages}
                      onCheckedChange={(checked) => setDealSettings({...dealSettings, autoMoveStages: checked})}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Aprovação Obrigatória</Label>
                      <div className="text-sm text-muted-foreground">
                        Requer aprovação para finalizar negócios de alto valor
                      </div>
                    </div>
                    <Switch
                      checked={dealSettings.requireApproval}
                      onCheckedChange={(checked) => setDealSettings({...dealSettings, requireApproval: checked})}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveSettings}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Configurações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}