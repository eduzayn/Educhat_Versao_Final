import { useState } from "react";
import { Hash, Users, Search, Bell, BellOff, Settings, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { useInternalChatStore } from "../store/internalChatStore";
import { useAuth } from "@/shared/lib/hooks/useAuth";
import { GeneralSettings } from "./GeneralSettings";

export function ChannelSidebar() {
  const [searchQuery, setSearchQuery] = useState("");
  const { channels, activeChannel, setActiveChannel } = useInternalChatStore();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleBackToDashboard = () => {
    setLocation("/");
  };

  const filteredChannels = channels.filter(
    (channel) =>
      channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      channel.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleChannelSelect = (channelId: string) => {
    setActiveChannel(channelId);
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "general":
        return <Hash className="h-4 w-4" />;
      case "team":
        return <Users className="h-4 w-4" />;
      case "direct":
        return <div className="h-2 w-2 bg-green-500 rounded-full" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  const formatLastActivity = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "agora";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const totalUnread = channels.reduce(
    (total, channel) => total + (channel.unreadCount || 0),
    0,
  );

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToDashboard}
              className="h-8 w-8 hover:bg-muted flex-shrink-0"
              title="Voltar ao Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold truncate">Chat Interno</h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {totalUnread > 0 && (
              <Badge variant="destructive" className="text-xs">
                {totalUnread}
              </Badge>
            )}
            <GeneralSettings />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar canais..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* User Info */}
      <div className="p-3 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src="" />
            <AvatarFallback>
              {(user as any)?.displayName?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {(user as any)?.displayName || "Usuário"}
            </p>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
          <div className="h-2 w-2 bg-green-500 rounded-full flex-shrink-0" />
        </div>
      </div>

      {/* Channels List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <Separator className="my-2" />

          {/* Channels */}
          <div className="space-y-1">
            <h3 className="text-xs font-medium text-muted-foreground px-2 py-1">
              CANAIS
            </h3>
            {filteredChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleChannelSelect(channel.id)}
                className={`
                  w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors
                  ${
                    activeChannel === channel.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent text-foreground"
                  }
                `}
              >
                <div className="flex-shrink-0">
                  {getChannelIcon(channel.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">
                      {channel.name}
                    </span>
                    <div className="flex items-center gap-1">
                      {channel.unreadCount > 0 && (
                        <Badge
                          variant="secondary"
                          className="text-xs h-5 min-w-5 px-1"
                        >
                          {channel.unreadCount > 99
                            ? "99+"
                            : channel.unreadCount}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatLastActivity(channel.lastActivity)}
                      </span>
                    </div>
                  </div>
                  {channel.lastMessage && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      <span className="font-medium">
                        {channel.lastMessage.userName}:
                      </span>{" "}
                      {channel.lastMessage.content}
                    </p>
                  )}
                  {channel.description && !channel.lastMessage && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {channel.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {filteredChannels.length === 0 && searchQuery && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Nenhum canal encontrado
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{channels.length} canais</span>
          <span>{totalUnread} não lidas</span>
        </div>
      </div>
    </div>
  );
}
