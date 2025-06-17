import { useState, useRef } from "react";
import { Volume2, VolumeX, Play, Settings, Check } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { Label } from "@/shared/ui/label";
import { Slider } from "@/shared/ui/slider";
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
import { useInternalChatStore } from "../store/internalChatStore";

// Sons disponíveis para notificações
const NOTIFICATION_SOUNDS = [
  { id: "default", name: "Padrão", file: "notification-default.wav" },
  { id: "pop", name: "Pop", file: "notification-pop.wav" },
  { id: "ding", name: "Ding", file: "notification-ding.wav" },
  { id: "chime", name: "Chime", file: "notification-chime.wav" },
  { id: "swoosh", name: "Swoosh", file: "notification-swoosh.wav" },
  { id: "bell", name: "Sino", file: "notification-bell.wav" },
  { id: "bubble", name: "Bolha", file: "notification-bubble.wav" },
  { id: "none", name: "Sem som", file: "" },
];

export function ChatSettings() {
  const { soundEnabled, toggleSound, audioSettings, updateAudioSettings } =
    useInternalChatStore();

  const [isOpen, setIsOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const playTestSound = (soundFile: string) => {
    if (!soundFile || !audioSettings.enabled) return;

    try {
      const audio = new Audio(`/sounds/${soundFile}`);
      audio.volume = audioSettings.volume / 100;
      audio.play().catch(console.error);
    } catch (error) {
      console.error("Erro ao reproduzir som:", error);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    updateAudioSettings({ volume: value[0] });
  };

  const handleSoundChange = (type: "send" | "receive", soundId: string) => {
    const sound = NOTIFICATION_SOUNDS.find((s) => s.id === soundId);
    if (sound) {
      updateAudioSettings({
        [type === "send" ? "sendSound" : "receiveSound"]: sound.file,
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
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          title="Configurações do Chat"
        >
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
                  onCheckedChange={(enabled) =>
                    updateAudioSettings({ enabled })
                  }
                />
              </div>

              {audioSettings.enabled && (
                <>
                  <Separator />

                  {/* Volume */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Volume</Label>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <VolumeX className="h-4 w-4" />
                        <span className="w-8 text-center">
                          {audioSettings.volume}%
                        </span>
                        <Volume2 className="h-4 w-4" />
                      </div>
                    </div>
                    <Slider
                      value={[audioSettings.volume]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <Separator />

                  {/* Som de Mensagem Enviada */}
                  <div className="space-y-3">
                    <Label>Som ao enviar mensagem</Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={
                          NOTIFICATION_SOUNDS.find(
                            (s) => s.file === audioSettings.sendSound,
                          )?.id || "default"
                        }
                        onValueChange={(value) =>
                          handleSoundChange("send", value)
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione um som" />
                        </SelectTrigger>
                        <SelectContent>
                          {NOTIFICATION_SOUNDS.map((sound) => (
                            <SelectItem key={sound.id} value={sound.id}>
                              {sound.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => playTestSound(audioSettings.sendSound)}
                        disabled={!audioSettings.sendSound}
                        className="px-3"
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Som de Mensagem Recebida */}
                  <div className="space-y-3">
                    <Label>Som ao receber mensagem</Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={
                          NOTIFICATION_SOUNDS.find(
                            (s) => s.file === audioSettings.receiveSound,
                          )?.id || "default"
                        }
                        onValueChange={(value) =>
                          handleSoundChange("receive", value)
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione um som" />
                        </SelectTrigger>
                        <SelectContent>
                          {NOTIFICATION_SOUNDS.map((sound) => (
                            <SelectItem key={sound.id} value={sound.id}>
                              {sound.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => playTestSound(audioSettings.receiveSound)}
                        disabled={!audioSettings.receiveSound}
                        className="px-3"
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Configurações de Interface */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Preferências de Interface</CardTitle>
              <CardDescription>
                Personalize a aparência do chat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mostrar avatars</Label>
                  <div className="text-xs text-muted-foreground">
                    Exibir fotos de perfil nas mensagens
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações desktop</Label>
                  <div className="text-xs text-muted-foreground">
                    Receber notificações do sistema
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Confirmar antes de enviar</Label>
                  <div className="text-xs text-muted-foreground">
                    Solicitar confirmação ao enviar mensagens
                  </div>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}