import {
  Hash,
  Users,
  Info,
  Phone,
  Video,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { useInternalChatStore } from "../store/internalChatStore";
import { ChatSettings } from "./ChatSettings";


interface ChatHeaderProps {
  onToggleInfo: () => void;
  showInfoPanel: boolean;
}

export function ChatHeader({ onToggleInfo, showInfoPanel }: ChatHeaderProps) {
  const { channels, activeChannel } = useInternalChatStore();

  const channel = channels.find((c) => c.id === activeChannel);

  if (!channel) {
    return (
      <div className="h-16 border-b bg-card flex items-center justify-center">
        <p className="text-muted-foreground">Selecione um canal para começar</p>
      </div>
    );
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "general":
        return <Hash className="h-5 w-5" />;
      case "team":
        return <Users className="h-5 w-5" />;
      case "direct":
        return (
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">DM</AvatarFallback>
          </Avatar>
        );
      default:
        return <Hash className="h-5 w-5" />;
    }
  };

  const getOnlineCount = () => {
    // Simular contagem de usuários online
    return Math.floor(Math.random() * 10) + 1;
  };

  return (
    <div className="h-16 border-b bg-card flex items-center justify-between px-4">
      {/* Channel Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {getChannelIcon(channel.type)}
          <div>
            <h3 className="font-semibold text-foreground">{channel.name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {channel.description && <span>{channel.description}</span>}
              {channel.type === "team" && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    <span>{getOnlineCount()} online</span>
                  </div>
                </>
              )}
              {channel.participants.length > 0 && (
                <>
                  <span>•</span>
                  <span>{channel.participants.length} membros</span>
                </>
              )}
            </div>
          </div>
        </div>

        {channel.type === "team" && (
          <Badge variant="secondary" className="text-xs">
            {channel.teamId === 5
              ? "Comercial"
              : channel.teamId === 6
                ? "Suporte"
                : "Equipe"}
          </Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Call Actions for Direct Messages */}
        {channel.type === "direct" && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Phone className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ligar</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Video className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Videochamada</TooltipContent>
            </Tooltip>
          </>
        )}

        {/* Info Panel Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={showInfoPanel ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={onToggleInfo}
            >
              <Info className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {showInfoPanel ? "Ocultar informações" : "Mostrar informações"}
          </TooltipContent>
        </Tooltip>

        {/* Chat Settings */}
        <Tooltip>
          <TooltipTrigger asChild>
            <ChatSettings />
          </TooltipTrigger>
          <TooltipContent>Configurações do Chat</TooltipContent>
        </Tooltip>


      </div>
    </div>
  );
}
