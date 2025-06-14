import { useState } from "react";
import { Settings, Volume2, Bell, MessageSquare, Play } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { Label } from "@/shared/ui/label";
import { Slider } from "@/shared/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { useUnifiedChatStore } from "@/shared/store/unifiedChatStore";

interface AudioSettings {
  soundEnabled: boolean;
  volume: number;
  sendSound: string;
  receiveSound: string;
  typingSound: boolean;
  inactiveSound: boolean;
}

export function AdvancedChatSettings() {
  const store = useUnifiedChatStore();
  const [isOpen, setIsOpen] = useState(false);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    soundEnabled: store.soundEnabled,
    volume: 70,
    sendSound: "Pop",
    receiveSound: "Ding",
    typingSound: true,
    inactiveSound: true,
  });

  const handleSave = () => {
    // Atualizar configurações no store
    if (audioSettings.soundEnabled !== store.soundEnabled) {
      store.toggleSound();
    }
    
    // Salvar outras configurações localmente
    localStorage.setItem('chatAudioSettings', JSON.stringify(audioSettings));
    setIsOpen(false);
  };

  const handleVolumeChange = (value: number[]) => {
    setAudioSettings(prev => ({ ...prev, volume: value[0] }));
  };

  const playTestSound = (soundType: 'send' | 'receive') => {
    const audio = new Audio();
    audio.volume = audioSettings.volume / 100;
    
    // Sons de teste base64 simplificados
    const sounds = {
      send: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiNze3HnTELJHfJ8N2QPAkTXrPo66hWEwlEneDyvWMcBzmDwvW+nTELJXLH7N2QQAoUXrPo66hWEwlEneDyvWMcBzeGwfS+nTELJXPH7d2SPAoTYfPo66hWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTAL",
      receive: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiNze3HnTELJHfJ8N2QPAkTXrPo66hWEwlEneDyvWMcBzmDwvW+nTELJXLH7N2QQAoUXrPo66hWEwlEneDyvWMcBzeGwfS+nTELJXPH7d2SPAoTYfPo66hWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTAL"
    };
    
    audio.src = sounds[soundType];
    audio.play().catch(() => {
      // Silently handle error
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações do Chat</DialogTitle>
          <DialogDescription>
            Configure as preferências de notificação e áudio para o chat interno
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Notificações Sonoras */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notificações Sonoras
              </CardTitle>
              <CardDescription>
                Configure os sons de notificação do chat interno
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Ativar sons</Label>
                  <p className="text-xs text-muted-foreground">
                    Habilitar notificações sonoras
                  </p>
                </div>
                <Switch
                  checked={audioSettings.soundEnabled}
                  onCheckedChange={(checked) =>
                    setAudioSettings(prev => ({ ...prev, soundEnabled: checked }))
                  }
                />
              </div>

              {audioSettings.soundEnabled && (
                <>
                  {/* Volume */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Volume</Label>
                      <span className="text-sm text-muted-foreground">
                        {audioSettings.volume}%
                      </span>
                    </div>
                    <Slider
                      value={[audioSettings.volume]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Som ao enviar mensagem */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Som ao enviar mensagem</Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={audioSettings.sendSound}
                        onValueChange={(value) =>
                          setAudioSettings(prev => ({ ...prev, sendSound: value }))
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pop">Pop</SelectItem>
                          <SelectItem value="Click">Click</SelectItem>
                          <SelectItem value="Beep">Beep</SelectItem>
                          <SelectItem value="None">Nenhum</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-3"
                        onClick={() => playTestSound('send')}
                        disabled={audioSettings.sendSound === 'None'}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Som ao receber mensagem */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Som ao receber mensagem</Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={audioSettings.receiveSound}
                        onValueChange={(value) =>
                          setAudioSettings(prev => ({ ...prev, receiveSound: value }))
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ding">Ding</SelectItem>
                          <SelectItem value="Chime">Chime</SelectItem>
                          <SelectItem value="Bell">Bell</SelectItem>
                          <SelectItem value="None">Nenhum</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-3"
                        onClick={() => playTestSound('receive')}
                        disabled={audioSettings.receiveSound === 'None'}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Tocar ao digitar */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Tocar ao digitar</Label>
                      <p className="text-xs text-muted-foreground">
                        Som quando alguém está digitando
                      </p>
                    </div>
                    <Switch
                      checked={audioSettings.typingSound}
                      onCheckedChange={(checked) =>
                        setAudioSettings(prev => ({ ...prev, typingSound: checked }))
                      }
                    />
                  </div>

                  {/* Tocar quando inativo */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Tocar quando inativo</Label>
                      <p className="text-xs text-muted-foreground">
                        Sons apenas quando a aba não está ativa
                      </p>
                    </div>
                    <Switch
                      checked={audioSettings.inactiveSound}
                      onCheckedChange={(checked) =>
                        setAudioSettings(prev => ({ ...prev, inactiveSound: checked }))
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Fechar
          </Button>
          <Button onClick={handleSave}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}