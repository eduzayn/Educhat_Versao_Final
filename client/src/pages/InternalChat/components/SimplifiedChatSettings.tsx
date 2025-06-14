import { useState } from "react";
import { Volume2, VolumeX, Settings } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { Label } from "@/shared/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/shared/ui/dialog";
import { useUnifiedChatStore } from "@/shared/store/unifiedChatStore";

export function SimplifiedChatSettings() {
  const store = useUnifiedChatStore();
  const soundEnabled = store.soundEnabled;
  const [isOpen, setIsOpen] = useState(false);

  const handleSoundToggle = () => {
    store.toggleSound();
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
          <DialogDescription>
            Configure as preferências de notificação para o chat interno
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound-notifications">Notificações Sonoras</Label>
              <div className="text-sm text-muted-foreground">
                Ativar sons de notificação para novas mensagens
              </div>
            </div>
            <div className="flex items-center gap-2">
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-green-500" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
              <Switch
                id="sound-notifications"
                checked={soundEnabled}
                onCheckedChange={handleSoundToggle}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}