import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { queryClient } from '@/lib/queryClient';
import {
  Settings,
  Database,
  Users,
  MessageSquare,
  Target,
  Save,
  RefreshCw
} from "lucide-react";

interface SystemSetting {
  id: number;
  key: string;
  value: string;
  type: string;
  description: string | null;
  category: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CRMSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CRMSettings({ open, onOpenChange }: CRMSettingsProps) {
  const [activeTab, setActiveTab] = useState("general");

  // Buscar configurações do sistema
  const { data: settings, isLoading } = useQuery<SystemSetting[]>({
    queryKey: ['/api/system-settings'],
    queryFn: async () => {
      const response = await fetch('/api/system-settings');
      if (!response.ok) throw new Error('Erro ao buscar configurações');
      return response.json();
    },
    enabled: open,
  });

  // Mutation para criar/atualizar configurações
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value, type, description, category }: {
      key: string;
      value: string;
      type: string;
      description: string;
      category: string;
    }) => {
      const response = await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, type, description, category })
      });
      if (!response.ok) throw new Error('Erro ao salvar configuração');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-settings'] });
    },
  });

  // Helper para buscar configuração por chave
  const getSettingValue = (key: string, defaultValue: any = '') => {
    if (!settings) return defaultValue;
    const setting = settings.find(s => s.key === key);
    if (!setting) return defaultValue;
    
    if (setting.type === 'boolean') {
      return setting.value === 'true';
    } else if (setting.type === 'number') {
      return parseInt(setting.value) || defaultValue;
    }
    return setting.value || defaultValue;
  };

  // Helper para salvar configuração
  const saveSetting = (key: string, value: any, type: string, description: string, category: string) => {
    const stringValue = typeof value === 'boolean' ? value.toString() : value.toString();
    updateSettingMutation.mutate({ key, value: stringValue, type, description, category });
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
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Nome da Empresa</Label>
                        <Input
                          id="companyName"
                          value={getSettingValue('crm.company_name', 'EduChat CRM')}
                          onChange={(e) => saveSetting('crm.company_name', e.target.value, 'string', 'Nome da empresa', 'crm_general')}
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
                          checked={getSettingValue('crm.auto_assign_deals', true)}
                          onCheckedChange={(checked) => saveSetting('crm.auto_assign_deals', checked, 'boolean', 'Atribuição automática de negócios', 'crm_general')}
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
                          checked={getSettingValue('crm.enable_notifications', true)}
                          onCheckedChange={(checked) => saveSetting('crm.enable_notifications', checked, 'boolean', 'Notificações ativas', 'crm_general')}
                        />
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Label htmlFor="dealReminder">Lembrete de Negócios (horas)</Label>
                        <Input
                          id="dealReminder"
                          type="number"
                          value={getSettingValue('crm.deal_reminder_hours', 24)}
                          onChange={(e) => saveSetting('crm.deal_reminder_hours', Number(e.target.value), 'number', 'Lembrete de negócios (horas)', 'crm_general')}
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
                          checked={getSettingValue('crm.auto_backup', true)}
                          onCheckedChange={(checked) => saveSetting('crm.auto_backup', checked, 'boolean', 'Backup automático', 'crm_database')}
                        />
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Label htmlFor="backupFrequency">Frequência de Backup (horas)</Label>
                        <Input
                          id="backupFrequency"
                          type="number"
                          value={getSettingValue('crm.backup_frequency_hours', 24)}
                          onChange={(e) => saveSetting('crm.backup_frequency_hours', Number(e.target.value), 'number', 'Frequência de backup (horas)', 'crm_database')}
                        />
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Label htmlFor="retentionDays">Retenção de Dados (dias)</Label>
                        <Input
                          id="retentionDays"
                          type="number"
                          value={getSettingValue('crm.retention_days', 30)}
                          onChange={(e) => saveSetting('crm.retention_days', Number(e.target.value), 'number', 'Retenção de dados (dias)', 'crm_database')}
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
                          checked={getSettingValue('crm.team_auto_assignment', true)}
                          onCheckedChange={(checked) => saveSetting('crm.team_auto_assignment', checked, 'boolean', 'Atribuição automática de equipe', 'crm_teams')}
                        />
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Label htmlFor="maxDeals">Máximo de Negócios por Usuário</Label>
                        <Input
                          id="maxDeals"
                          type="number"
                          value={getSettingValue('crm.max_deals_per_user', 10)}
                          onChange={(e) => saveSetting('crm.max_deals_per_user', Number(e.target.value), 'number', 'Máximo de negócios por usuário', 'crm_teams')}
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
                          checked={getSettingValue('crm.enable_team_leaderboard', true)}
                          onCheckedChange={(checked) => saveSetting('crm.enable_team_leaderboard', checked, 'boolean', 'Ranking da equipe', 'crm_teams')}
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
                          checked={getSettingValue('crm.email_notifications', true)}
                          onCheckedChange={(checked) => saveSetting('crm.email_notifications', checked, 'boolean', 'Notificações por email', 'crm_notifications')}
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
                          checked={getSettingValue('crm.sms_notifications', false)}
                          onCheckedChange={(checked) => saveSetting('crm.sms_notifications', checked, 'boolean', 'Notificações por SMS', 'crm_notifications')}
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
                          checked={getSettingValue('crm.slack_integration', false)}
                          onCheckedChange={(checked) => saveSetting('crm.slack_integration', checked, 'boolean', 'Integração com Slack', 'crm_notifications')}
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
                          value={getSettingValue('crm.default_probability', 50)}
                          onChange={(e) => saveSetting('crm.default_probability', Number(e.target.value), 'number', 'Probabilidade padrão (%)', 'crm_deals')}
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
                          checked={getSettingValue('crm.auto_move_stages', false)}
                          onCheckedChange={(checked) => saveSetting('crm.auto_move_stages', checked, 'boolean', 'Movimentação automática de estágios', 'crm_deals')}
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
                          checked={getSettingValue('crm.require_approval', true)}
                          onCheckedChange={(checked) => saveSetting('crm.require_approval', checked, 'boolean', 'Aprovação obrigatória', 'crm_deals')}
                        />
                      </div>
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
              onOpenChange(false);
            }}
            disabled={updateSettingMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateSettingMutation.isPending ? 'Salvando...' : 'Fechar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}