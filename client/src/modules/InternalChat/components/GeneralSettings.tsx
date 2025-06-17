import { useState } from "react";
import { Settings, User, Bell, Palette, Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import { useAuth } from "@/shared/lib/hooks/useAuth";

export function GeneralSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  
  // Estados locais para configurações
  const [settings, setSettings] = useState({
    theme: "system", // light, dark, system
    showOnlineStatus: true,
    desktopNotifications: true,
    soundNotifications: true,
    showAvatars: true,
    compactMode: false,
    autoStatus: true, // Atualizar status automaticamente
    statusMessage: "Disponível",
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // Aqui poderia salvar no localStorage ou API
    localStorage.setItem('internal-chat-general-settings', JSON.stringify({
      ...settings,
      [key]: value
    }));
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case "light": return <Sun className="h-4 w-4" />;
      case "dark": return <Moon className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          title="Configurações Gerais do Chat Interno"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações Gerais
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Perfil do Usuário */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Perfil no Chat
              </CardTitle>
              <CardDescription>
                Suas informações no chat interno
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mostrar status online</Label>
                  <div className="text-xs text-muted-foreground">
                    Exibir seu status de disponibilidade
                  </div>
                </div>
                <Switch
                  checked={settings.showOnlineStatus}
                  onCheckedChange={(checked) => updateSetting('showOnlineStatus', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Atualizar status automaticamente</Label>
                  <div className="text-xs text-muted-foreground">
                    Mudar para "Ausente" quando inativo
                  </div>
                </div>
                <Switch
                  checked={settings.autoStatus}
                  onCheckedChange={(checked) => updateSetting('autoStatus', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem de status</Label>
                <Select 
                  value={settings.statusMessage} 
                  onValueChange={(value) => updateSetting('statusMessage', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponível">Disponível</SelectItem>
                    <SelectItem value="Ocupado">Ocupado</SelectItem>
                    <SelectItem value="Em reunião">Em reunião</SelectItem>
                    <SelectItem value="Ausente">Ausente</SelectItem>
                    <SelectItem value="Não perturbar">Não perturbar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notificações
              </CardTitle>
              <CardDescription>
                Configure como receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações desktop</Label>
                  <div className="text-xs text-muted-foreground">
                    Receber notificações do sistema
                  </div>
                </div>
                <Switch
                  checked={settings.desktopNotifications}
                  onCheckedChange={(checked) => updateSetting('desktopNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sons de notificação</Label>
                  <div className="text-xs text-muted-foreground">
                    Reproduzir sons para novas mensagens
                  </div>
                </div>
                <Switch
                  checked={settings.soundNotifications}
                  onCheckedChange={(checked) => updateSetting('soundNotifications', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Aparência */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Aparência
              </CardTitle>
              <CardDescription>
                Personalize a interface do chat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tema</Label>
                <Select 
                  value={settings.theme} 
                  onValueChange={(value) => updateSetting('theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {getThemeIcon(settings.theme)}
                        <span className="capitalize">{
                          settings.theme === "system" ? "Sistema" : 
                          settings.theme === "light" ? "Claro" : "Escuro"
                        }</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Claro
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Escuro
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Sistema
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mostrar avatars</Label>
                  <div className="text-xs text-muted-foreground">
                    Exibir fotos de perfil nas mensagens
                  </div>
                </div>
                <Switch
                  checked={settings.showAvatars}
                  onCheckedChange={(checked) => updateSetting('showAvatars', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo compacto</Label>
                  <div className="text-xs text-muted-foreground">
                    Interface mais densa com menos espaçamento
                  </div>
                </div>
                <Switch
                  checked={settings.compactMode}
                  onCheckedChange={(checked) => updateSetting('compactMode', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informações do Usuário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Nome:</span> {(user as any)?.displayName || "Usuário"}
              </div>
              <div className="text-sm">
                <span className="font-medium">Email:</span> {(user as any)?.email || "N/A"}
              </div>
              <div className="text-sm">
                <span className="font-medium">Função:</span> {(user as any)?.role || "N/A"}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}