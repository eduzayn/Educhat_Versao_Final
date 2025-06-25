import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Switch } from "@/shared/ui/switch";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";
import { Bell, Volume2, MessageSquare, UserPlus, AtSign } from "lucide-react";
import { 
  useNotificationPreferences, 
  useToggleNotificationSetting, 
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
    title: "Comunicação",
    description: "Notificações de mensagens e conversas",
    icon: MessageSquare,
    settings: [
      {
        key: "newMessage",
        label: "Nova mensagem",
        description: "Receber notificação quando uma nova mensagem chegar"
      },
      {
        key: "messageRead",
        label: "Mensagem lida",
        description: "Notificar quando mensagens forem lidas"
      }
    ]
  },
  {
    title: "Contatos",
    description: "Notificações relacionadas a contatos",
    icon: UserPlus,
    settings: [
      {
        key: "newContact",
        label: "Novo contato",
        description: "Notificar quando um novo contato for criado"
      },
      {
        key: "contactUpdate",
        label: "Atualização de contato",
        description: "Receber notificação quando dados de contato forem alterados"
      }
    ]
  },
  {
    title: "Menções",
    description: "Notificações de menções e marcações",
    icon: AtSign,
    settings: [
      {
        key: "mention",
        label: "Menções",
        description: "Notificar quando você for mencionado em conversas"
      }
    ]
  },
  {
    title: "Sistema",
    description: "Configurações gerais de notificação",
    icon: Bell,
    settings: [
      {
        key: "sound",
        label: "Som das notificações",
        description: "Reproduzir som quando receber notificações"
      },
      {
        key: "popup",
        label: "Popup visual",
        description: "Mostrar popup na tela para notificações importantes"
      }
    ]
  }
];

export function NotificationPreferencesSimple() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const toggleSetting = useToggleNotificationSetting();
  const resetPreferences = useResetNotificationPreferences();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Erro ao carregar preferências de notificação.</p>
        </CardContent>
      </Card>
    );
  }

  const handleToggle = (key: string) => {
    toggleSetting.mutate({ key, enabled: !preferences[key] });
  };

  const handleReset = () => {
    resetPreferences.mutate();
  };

  return (
    <div className="space-y-6">
      {notificationSections.map((section) => {
        const IconComponent = section.icon;
        
        return (
          <Card key={section.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <IconComponent className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {section.settings.map((setting) => (
                  <div 
                    key={setting.key}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex-1">
                      <Label 
                        htmlFor={setting.key}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {setting.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {setting.description}
                      </p>
                    </div>
                    <Switch
                      id={setting.key}
                      checked={preferences[setting.key] || false}
                      onCheckedChange={() => handleToggle(setting.key)}
                      disabled={toggleSetting.isPending}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Ações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Ações
          </CardTitle>
          <CardDescription>
            Gerenciar suas preferências de notificação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={resetPreferences.isPending}
            >
              {resetPreferences.isPending ? "Restaurando..." : "Restaurar padrões"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}