import { useState, useRef } from 'react';
import { Volume2, VolumeX, Play, Settings, Check } from 'lucide-react';
import { Button } from '@/shared/ui/ui/button';
import { Switch } from '@/shared/ui/ui/switch';
import { Label } from '@/shared/ui/ui/label';
import { Slider } from '@/shared/ui/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Separator } from '@/shared/ui/ui/separator';
import { useInternalChatStore } from '../store/internalChatStore';

// Sons disponíveis para notificações
const NOTIFICATION_SOUNDS = [
  { id: 'default', name: 'Padrão', file: 'notification-default.wav' },
  { id: 'pop', name: 'Pop', file: 'notification-pop.wav' },
  { id: 'ding', name: 'Ding', file: 'notification-ding.wav' },
  { id: 'chime', name: 'Chime', file: 'notification-chime.wav' },
  { id: 'swoosh', name: 'Swoosh', file: 'notification-swoosh.wav' },
  { id: 'bell', name: 'Sino', file: 'notification-bell.wav' },
  { id: 'bubble', name: 'Bolha', file: 'notification-bubble.wav' },
  { id: 'none', name: 'Sem som', file: '' }
];

export function ChatSettings() {
  const { 
    soundEnabled, 
    toggleSound,
    audioSettings,
    updateAudioSettings 
  } = useInternalChatStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const playTestSound = (soundFile: string) => {
    if (!soundFile || !audioSettings.enabled) return;
    
    try {
      const audio = new Audio(`/sounds/${soundFile}`);
      audio.volume = audioSettings.volume / 100;
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Erro ao reproduzir som:', error);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    updateAudioSettings({ volume: value[0] });
  };

  const handleSoundChange = (type: 'send' | 'receive', soundId: string) => {
    const sound = NOTIFICATION_SOUNDS.find(s => s.id === soundId);
    if (sound) {
      updateAudioSettings({
        [type === 'send' ? 'sendSound' : 'receiveSound']: sound.file
      });
      
      // Testar o som selecionado
      if (sound.file) {
        playTestSound(sound.file);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações do Chat</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Configurações Gerais de Áudio */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Notificações Sonoras</CardTitle>
              <CardDescription>
                Configure os sons de notificação do chat interno
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ativar/Desativar Sons */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ativar sons</Label>
                  <div className="text-xs text-muted-foreground">
                    Habilitar notificações sonoras
                  </div>
                </div>
                <Switch
                  checked={audioSettings.enabled}
                  onCheckedChange={(enabled) => updateAudioSettings({ enabled })}
                />
              </div>

              {audioSettings.enabled && (
                <>
                  <Separator />
                  
                  {/* Volume */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Volume</Label>
                      <span className="text-xs text-muted-foreground">
                        {audioSettings.volume}%
                      </span>
                    </div>
                    <div className="px-2">
                      <Slider
                        value={[audioSettings.volume]}
                        onValueChange={handleVolumeChange}
                        max={100}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Som ao Enviar */}
                  <div className="space-y-2">
                    <Label>Som ao enviar mensagem</Label>
                    <div className="flex gap-2">
                      <Select
                        value={NOTIFICATION_SOUNDS.find(s => s.file === audioSettings.sendSound)?.id || 'none'}
                        onValueChange={(soundId) => handleSoundChange('send', soundId)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NOTIFICATION_SOUNDS.map((sound) => (
                            <SelectItem key={sound.id} value={sound.id}>
                              {sound.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {audioSettings.sendSound && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => playTestSound(audioSettings.sendSound)}
                          className="px-2"
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Som ao Receber */}
                  <div className="space-y-2">
                    <Label>Som ao receber mensagem</Label>
                    <div className="flex gap-2">
                      <Select
                        value={NOTIFICATION_SOUNDS.find(s => s.file === audioSettings.receiveSound)?.id || 'none'}
                        onValueChange={(soundId) => handleSoundChange('receive', soundId)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NOTIFICATION_SOUNDS.map((sound) => (
                            <SelectItem key={sound.id} value={sound.id}>
                              {sound.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {audioSettings.receiveSound && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => playTestSound(audioSettings.receiveSound)}
                          className="px-2"
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Configurações Adicionais */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Tocar ao digitar</Label>
                        <div className="text-xs text-muted-foreground">
                          Som quando alguém está digitando
                        </div>
                      </div>
                      <Switch
                        checked={audioSettings.playOnTyping}
                        onCheckedChange={(playOnTyping) => updateAudioSettings({ playOnTyping })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Tocar quando inativo</Label>
                        <div className="text-xs text-muted-foreground">
                          Sons apenas quando a aba não está ativa
                        </div>
                      </div>
                      <Switch
                        checked={audioSettings.onlyWhenInactive}
                        onCheckedChange={(onlyWhenInactive) => updateAudioSettings({ onlyWhenInactive })}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}