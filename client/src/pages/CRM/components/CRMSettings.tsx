import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Separator } from '@/shared/ui/separator';
import { queryClient } from '@/lib/queryClient';
import {
  Settings,
  Database,
  Users,
  MessageSquare,
  Target,
} from "lucide-react";
import { BaseConfigModal, ConfigCard, TabConfig } from '@/shared/components/modals/BaseConfigModal';

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

  const handleSave = async () => {
    queryClient.invalidateQueries({ queryKey: ['/api/system-settings'] });
  };

  // Configuração das abas
  const tabs: TabConfig[] = [
    {
      id: "general",
      label: "Geral",
      icon: Settings,
      content: (
        <ConfigCard
          title="Configurações Gerais"
          description="Configurações básicas do sistema CRM"
        >
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
        </ConfigCard>
      )
    },
    {
      id: "database",
      label: "Banco",
      icon: Database,
      content: (
        <ConfigCard
          title="Configurações de Banco de Dados"
          description="Configurações relacionadas ao armazenamento de dados"
        >
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
        </ConfigCard>
      )
    },
    {
      id: "teams",
      label: "Equipes",
      icon: Users,
      content: (
        <ConfigCard
          title="Configurações de Equipes"
          description="Configurações de atribuição automática e gestão de equipes"
        >
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
        </ConfigCard>
      )
    },
    {
      id: "notifications",
      label: "Notificações",
      icon: MessageSquare,
      content: (
        <ConfigCard
          title="Configurações de Notificações"
          description="Configurações de alertas e notificações do sistema"
        >
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
        </ConfigCard>
      )
    },
    {
      id: "deals",
      label: "Negócios",
      icon: Target,
      content: (
        <ConfigCard
          title="Configurações de Negócios"
          description="Configurações do funil de vendas e gestão de negócios"
        >
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
        </ConfigCard>
      )
    }
  ];

  return (
    <BaseConfigModal
      open={open}
      onOpenChange={onOpenChange}
      title="Configurações do CRM"
      description="Gerencie as configurações do sistema, equipes, notificações e integrações."
      icon={Settings}
      tabs={tabs}
      isLoading={isLoading}
      loadingText="Carregando configurações..."
      onSave={handleSave}
      saveText="Fechar"
      showActions={true}
    />
  );
}