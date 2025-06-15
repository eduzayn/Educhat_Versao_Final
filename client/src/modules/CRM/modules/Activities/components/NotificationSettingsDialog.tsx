import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Bell, Volume2 } from 'lucide-react';
import React from 'react';

interface NotificationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notificationSettings: any;
  setNotificationSettings: (settings: any) => void;
  playNotificationSound: () => void;
}

export const NotificationSettingsDialog: React.FC<NotificationSettingsDialogProps> = ({ open, onOpenChange, notificationSettings, setNotificationSettings, playNotificationSound }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Configurações de Notificação
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Notificações Ativadas</Label>
            <p className="text-sm text-muted-foreground">
              Receber lembretes de atividades agendadas
            </p>
          </div>
          <Switch
            checked={notificationSettings.enabled}
            onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, enabled: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Sons de Notificação</Label>
            <p className="text-sm text-muted-foreground">
              Reproduzir som quando receber lembrete
            </p>
          </div>
          <Switch
            checked={notificationSettings.soundEnabled}
            disabled={!notificationSettings.enabled}
            onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, soundEnabled: checked })}
          />
        </div>
        <div className="space-y-2">
          <Label>Tempo de Antecedência</Label>
          <Select
            value={notificationSettings.reminderMinutes.toString()}
            onValueChange={(value) => setNotificationSettings({ ...notificationSettings, reminderMinutes: parseInt(value) })}
            disabled={!notificationSettings.enabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 minuto antes</SelectItem>
              <SelectItem value="2">2 minutos antes</SelectItem>
              <SelectItem value="5">5 minutos antes</SelectItem>
              <SelectItem value="10">10 minutos antes</SelectItem>
              <SelectItem value="15">15 minutos antes</SelectItem>
              <SelectItem value="30">30 minutos antes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Som da Notificação</Label>
          <Select
            value={notificationSettings.soundFile}
            onValueChange={(value) => setNotificationSettings({ ...notificationSettings, soundFile: value })}
            disabled={!notificationSettings.enabled || !notificationSettings.soundEnabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="/sounds/notification-bell.wav">Sino</SelectItem>
              <SelectItem value="/sounds/notification-chime.wav">Carrilhão</SelectItem>
              <SelectItem value="/sounds/notification-ding.wav">Ding</SelectItem>
              <SelectItem value="/sounds/notification-pop.wav">Pop</SelectItem>
              <SelectItem value="/sounds/notification-swoosh.wav">Swoosh</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={playNotificationSound}
            disabled={!notificationSettings.enabled || !notificationSettings.soundEnabled}
            className="flex-1"
          >
            <Volume2 className="h-4 w-4 mr-2" />
            Testar Som
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Salvar
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
); 