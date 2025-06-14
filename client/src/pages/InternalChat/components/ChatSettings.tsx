import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { Slider } from "@/shared/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Volume2, Bell, MessageSquare } from "lucide-react";
import { useState } from "react";

interface AudioSettings {
  notificationSound: boolean;
  messageSound: boolean;
  volume: number;
  soundType: 'notification' | 'message' | 'all';
}

export function ChatSettings() {
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    notificationSound: true,
    messageSound: true,
    volume: 50,
    soundType: 'all'
  });

  const updateAudioSettings = (updates: Partial<AudioSettings>) => {
    setAudioSettings(prev => ({ ...prev, ...updates }));
  };

  const handleVolumeChange = (value: number[]) => {
    updateAudioSettings({ volume: value[0] });
  };

  const handleSoundChange = (type: keyof Pick<AudioSettings, 'notificationSound' | 'messageSound'>) => {
    updateAudioSettings({ [type]: !audioSettings[type] });
  };

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Configurações de Áudio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Volume Control */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Volume das Notificações</Label>
            <div className="flex items-center gap-4">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[audioSettings.volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12">
                {audioSettings.volume}%
              </span>
            </div>
          </div>

          {/* Sound Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de Som</Label>
            <Select
              value={audioSettings.soundType}
              onValueChange={(value: AudioSettings['soundType']) =>
                updateAudioSettings({ soundType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Sons</SelectItem>
                <SelectItem value="notification">Apenas Notificações</SelectItem>
                <SelectItem value="message">Apenas Mensagens</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notification Sounds */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <Label className="text-sm font-medium">Sons de Notificação</Label>
              </div>
              <Switch
                checked={audioSettings.notificationSound}
                onCheckedChange={() => handleSoundChange('notificationSound')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <Label className="text-sm font-medium">Sons de Mensagem</Label>
              </div>
              <Switch
                checked={audioSettings.messageSound}
                onCheckedChange={() => handleSoundChange('messageSound')}
              />
            </div>
          </div>

          {/* Test Sound Button */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Testar Som</Label>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // Test notification sound
                const audio = new Audio();
                audio.volume = audioSettings.volume / 100;
                audio.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBziNze3HnTELJHfJ8N2QPAkTXrPo66hWEwlEneDyvWMcBzmDwvW+nTELJXLH7N2QQAoUXrPo66hWEwlEneDyvWMcBzeGwfS+nTELJXPH7d2SPAoTYfPo66hWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTAL";
                audio.play().catch(() => {
                  // Silently handle error
                });
              }}
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Testar Som de Notificação
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}