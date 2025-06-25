import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Switch } from "@/shared/ui/switch";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
// import { useToast } from "@/shared/lib/hooks/useToast";
import { Bell, Volume2, Clock, RotateCcw, MessageSquare, UserPlus, AtSign, ArrowRightLeft, Headphones, Image, Video, FileText } from "lucide-react";
import { 
  useNotificationPreferences, 
  useToggleNotificationSetting, 
  useUpdateNotificationPreferences,
  useResetNotificationPreferences 
} from "@/shared/lib/hooks/useNotificationPreferences";

interface NotificationSection {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  settings: {
    key: string;
    label: string;
    description: string;
  }[];
}

const notificationSections: NotificationSection[] = [
  {
    title: "Notificações Gerais",
    description: "Configure quando você deseja ser notificado",
    icon: Bell,
    settings: [
      {
        key: "notifyOnNewMessage",
        label: "Nova mensagem",
        description: "Receber notificação para mensagens de contatos"
      },
      {
        key: "notifyOnNewContact",
        label: "Novo contato",
        description: "Notificar quando um novo contato for criado"
      },
      {
        key: "notifyOnMention",
        label: "Menções",
        description: "Notificar quando você for mencionado"
      },
      {
        key: "notifyOnAssignment",
        label: "Atribuições",
        description: "Notificar quando conversas forem atribuídas a você"
      },
      {
        key: "notifyOnTransfer",
        label: "Transferências",
        description: "Notificar quando conversas forem transferidas"
      }
    ]
  },
  {
    title: "Tipos de Mensagem",
    description: "Escolha quais tipos de mensagem geram notificações",
    icon: MessageSquare,
    settings: [
      {
        key: "notifyOnTextMessage",
        label: "Mensagens de texto",
        description: "Notificações para mensagens de texto"
      },
      {
        key: "notifyOnAudioMessage",
        label: "Mensagens de áudio",
        description: "Notificações para áudios recebidos"
      },
      {
        key: "notifyOnImageMessage",
        label: "Imagens",
        description: "Notificações para imagens recebidas"
      },
      {
        key: "notifyOnVideoMessage",
        label: "Vídeos",
        description: "Notificações para vídeos recebidos"
      },
      {
        key: "notifyOnDocumentMessage",
        label: "Documentos",
        description: "Notificações para arquivos e documentos"
      }
    ]
  },
  {
    title: "Configurações de Som",
    description: "Controle as notificações sonoras",
    icon: Volume2,
    settings: [
      {
        key: "notifyWithSound",
        label: "Som habilitado",
        description: "Tocar som nas notificações"
      }
    ]
  }
];

const getIconForSetting = (key: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    notifyOnNewMessage: MessageSquare,
    notifyOnNewContact: UserPlus,
    notifyOnMention: AtSign,
    notifyOnAssignment: ArrowRightLeft,
    notifyOnTransfer: ArrowRightLeft,
    notifyOnTextMessage: MessageSquare,
    notifyOnAudioMessage: Headphones,
    notifyOnImageMessage: Image,
    notifyOnVideoMessage: Video,
    notifyOnDocumentMessage: FileText,
    notifyWithSound: Volume2,
  };
  
  return iconMap[key] || Bell;
};

export function NotificationPreferences() {
  // const { toast } = useToast();
  const { data: preferences, isLoading } = useNotificationPreferences();
  const toggleSetting = useToggleNotificationSetting();
  const updatePreferences = useUpdateNotificationPreferences();
  const resetPreferences = useResetNotificationPreferences();

  const [quietHoursStart, setQuietHoursStart] = React.useState("22:00");
  const [quietHoursEnd, setQuietHoursEnd] = React.useState("08:00");
  const [quietHoursEnabled, setQuietHoursEnabled] = React.useState(false);
  const [maxNotificationsPerHour, setMaxNotificationsPerHour] = React.useState(20);

  // Sincronizar estados locais com dados do servidor
  React.useEffect(() => {
    if (preferences) {
      if (preferences.quietHours && typeof preferences.quietHours === 'object') {
        const quietHours = preferences.quietHours as { enabled: boolean; start: string; end: string };
        setQuietHoursEnabled(quietHours.enabled || false);
        setQuietHoursStart(quietHours.start || "22:00");
        setQuietHoursEnd(quietHours.end || "08:00");
      }
      setMaxNotificationsPerHour(preferences.maxNotificationsPerHour || 20);
    }
  }, [preferences]);

  const handleToggle = async (setting: string) => {
    try {
      await toggleSetting.mutateAsync(setting);
      toast({
        title: "Configuração atualizada",
        description: "Sua preferência foi salva com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a configuração.",
      });
    }
  };

  const handleQuietHoursUpdate = async () => {
    try {
      await updatePreferences.mutateAsync({
        quietHours: {
          enabled: quietHoursEnabled,
          start: quietHoursStart,
          end: quietHoursEnd
        }
      });
      toast({
        title: "Horário silencioso atualizado",
        description: "Suas configurações foram salvas.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o horário silencioso.",
      });
    }
  };

  const handleMaxNotificationsUpdate = async () => {
    try {
      await updatePreferences.mutateAsync({
        maxNotificationsPerHour
      });
      toast({
        title: "Limite de notificações atualizado",
        description: "Sua configuração foi salva.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o limite.",
      });
    }
  };

  const handleReset = async () => {
    try {
      await resetPreferences.mutateAsync();
      toast({
        title: "Preferências restauradas",
        description: "Todas as configurações foram restauradas aos valores padrão.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível restaurar as configurações.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Preferências de Notificação</h1>
          <p className="text-muted-foreground">
            Configure como e quando você deseja receber notificações
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={resetPreferences.isPending}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Restaurar padrão
        </Button>
      </div>

      {/* Seções de notificação */}
      {notificationSections.map((section) => {
        const SectionIcon = section.icon;
        return (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SectionIcon className="h-5 w-5" />
                {section.title}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.settings.map((setting) => {
                const SettingIcon = getIconForSetting(setting.key);
                const isEnabled = preferences?.[setting.key as keyof typeof preferences] ?? true;
                
                return (
                  <div key={setting.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <SettingIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label htmlFor={setting.key} className="text-sm font-medium">
                          {setting.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {setting.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={setting.key}
                      checked={Boolean(isEnabled)}
                      onCheckedChange={() => handleToggle(setting.key)}
                      disabled={toggleSetting.isPending}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Configurações avançadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configurações Avançadas
          </CardTitle>
          <CardDescription>
            Controles específicos para personalizar sua experiência
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Horário silencioso */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Horário silencioso</Label>
                <p className="text-xs text-muted-foreground">
                  Pausar notificações durante determinado período
                </p>
              </div>
              <Switch
                checked={quietHoursEnabled}
                onCheckedChange={setQuietHoursEnabled}
              />
            </div>
            
            {quietHoursEnabled && (
              <div className="ml-6 space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quiet-start" className="text-xs">Início</Label>
                    <Input
                      id="quiet-start"
                      type="time"
                      value={quietHoursStart}
                      onChange={(e) => setQuietHoursStart(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quiet-end" className="text-xs">Fim</Label>
                    <Input
                      id="quiet-end"
                      type="time"
                      value={quietHoursEnd}
                      onChange={(e) => setQuietHoursEnd(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleQuietHoursUpdate}
                  disabled={updatePreferences.isPending}
                  className="w-full"
                >
                  Salvar horário
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Limite de notificações */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="max-notifications" className="text-sm font-medium">
                Limite de notificações por hora
              </Label>
              <p className="text-xs text-muted-foreground">
                Máximo de notificações permitidas em uma hora
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                id="max-notifications"
                type="number"
                min="1"
                max="100"
                value={maxNotificationsPerHour}
                onChange={(e) => setMaxNotificationsPerHour(Number(e.target.value))}
                className="w-24"
              />
              <Badge variant="secondary">{maxNotificationsPerHour}/hora</Badge>
              <Button
                size="sm"
                onClick={handleMaxNotificationsUpdate}
                disabled={updatePreferences.isPending}
              >
                Salvar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}