import { useState, useEffect } from "react";
import {
  Users,
  Hash,
  Search,
  Crown,
  Shield,
  MessageCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Separator } from "@/shared/ui/separator";
import { Button } from "@/shared/ui/button";
import { useInternalChatStore } from "../store/internalChatStore";
import { PrivateMessageModal } from "./PrivateMessageModal";
import { useAuth } from "@/shared/lib/hooks/useAuth";

export function InfoPanel() {
  const { channels, activeChannel, channelUsers, loadChannelUsers } =
    useInternalChatStore();
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedUserForPrivateChat, setSelectedUserForPrivateChat] =
    useState<any>(null);
  const { user } = useAuth();

  const channel = channels.find((c) => c.id === activeChannel);
  const members = activeChannel ? channelUsers[activeChannel] || [] : [];

  useEffect(() => {
    if (activeChannel) {
      loadChannelUsers(activeChannel);
    }
  }, [activeChannel, loadChannelUsers]);

  if (!channel) {
    return (
      <div className="flex-1 p-6 text-center">
        <div className="text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Nenhum canal selecionado</h3>
          <p className="text-sm">
            Selecione um canal para ver informações e membros
          </p>
        </div>
      </div>
    );
  }

  const filteredMembers = members.filter(
    (member) =>
      member.displayName.toLowerCase().includes(memberSearch.toLowerCase()) ||
      member.username.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (member.roleName &&
        member.roleName.toLowerCase().includes(memberSearch.toLowerCase())),
  );

  const getRoleIcon = (roleName?: string) => {
    if (roleName === "Administrador" || roleName === "Admin") {
      return <Crown className="h-3 w-3 text-yellow-500" />;
    }
    if (roleName === "Gerente" || roleName === "Gestor") {
      return <Shield className="h-3 w-3 text-blue-500" />;
    }
    return null;
  };

  const getRoleBadgeVariant = (roleName?: string) => {
    if (roleName === "Administrador" || roleName === "Admin") return "default";
    if (roleName === "Gerente" || roleName === "Gestor") return "secondary";
    return "outline";
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header do Canal */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2 mb-3">
          {channel.type === "team" ? (
            <Users className="h-5 w-5 text-blue-600" />
          ) : (
            <Hash className="h-5 w-5 text-green-600" />
          )}
          <h3 className="font-semibold text-lg">{channel.name}</h3>
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          {channel.description || "Canal interno"}
        </p>

        {/* Estatísticas do Canal */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-background rounded-lg p-2">
            <div className="text-lg font-bold text-blue-600">
              {members.length}
            </div>
            <div className="text-xs text-muted-foreground">Membros</div>
          </div>
          <div className="bg-background rounded-lg p-2">
            <div className="text-lg font-bold text-green-600">
              {members.length}
            </div>
            <div className="text-xs text-muted-foreground">Ativos</div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Busca de Membros */}
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar membros..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="h-9 pl-9"
              />
            </div>
          </div>

          <Separator />

          {/* Lista de Membros */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm">Membros do canal</h4>
              <Badge variant="secondary" className="text-xs">
                {filteredMembers.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member, index) => (
                  <div
                    key={`member-${member.id}-${member.username}-${index}`}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar || ""} />
                        <AvatarFallback className="text-xs">
                          {member.displayName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {/* Indicador de status online */}
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                    </div>

                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium truncate">
                          {member.displayName}
                        </p>
                        {getRoleIcon(member.roleName)}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground truncate">
                          @{member.username}
                        </p>
                        {member.roleName && (
                          <Badge
                            variant={getRoleBadgeVariant(member.roleName)}
                            className="text-xs px-1 py-0 flex-shrink-0"
                          >
                            {member.roleName}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Botão de mensagem privada - sempre visível */}
                    {member.id !== (user as any)?.id && (
                      <div className="flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary transition-colors"
                          onClick={() => setSelectedUserForPrivateChat(member)}
                          title={`Enviar mensagem privada para ${member.displayName}`}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  {memberSearch ? (
                    <div className="text-muted-foreground">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum membro encontrado</p>
                      <p className="text-xs">Tente outro termo de busca</p>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Carregando membros...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {channel.type === "team" && (
            <>
              <Separator />

              {/* Informações da Equipe */}
              <div>
                <h4 className="font-medium text-sm mb-3">
                  Informações da equipe
                </h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Tipo:</span>
                    <span className="capitalize">{channel.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ID da equipe:</span>
                    <span>{channel.teamId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Privacidade:</span>
                    <span>{channel.isPrivate ? "Privado" : "Público"}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Modal de Mensagem Privada */}
      {selectedUserForPrivateChat && (
        <PrivateMessageModal
          isOpen={!!selectedUserForPrivateChat}
          onClose={() => setSelectedUserForPrivateChat(null)}
          targetUser={selectedUserForPrivateChat}
        />
      )}
    </div>
  );
}
