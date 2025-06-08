import { useState, useEffect } from 'react';
import { Users, Hash, Search, Crown, Shield } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/ui/avatar';
import { Input } from '@/shared/ui/ui/input';
import { Badge } from '@/shared/ui/ui/badge';
import { ScrollArea } from '@/shared/ui/ui/scroll-area';
import { Separator } from '@/shared/ui/ui/separator';
import { useInternalChatStore } from '../store/internalChatStore';

interface ChannelUser {
  id: number;
  username: string;
  displayName: string;
  roleName?: string;
  avatar?: string;
  isOnline?: boolean;
}

export function InfoPanel() {
  const { channels, activeChannel, channelUsers, loadChannelUsers } = useInternalChatStore();
  const [memberSearch, setMemberSearch] = useState('');
  
  const channel = channels.find(c => c.id === activeChannel);
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
          <p className="text-sm">Selecione um canal para ver informações e membros</p>
        </div>
      </div>
    );
  }

  const filteredMembers = members.filter(member =>
    member.displayName.toLowerCase().includes(memberSearch.toLowerCase()) ||
    member.username.toLowerCase().includes(memberSearch.toLowerCase()) ||
    (member.roleName && member.roleName.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  const getRoleIcon = (roleName?: string) => {
    if (roleName === 'Administrador' || roleName === 'Admin') {
      return <Crown className="h-3 w-3 text-yellow-500" />;
    }
    if (roleName === 'Gerente' || roleName === 'Gestor') {
      return <Shield className="h-3 w-3 text-blue-500" />;
    }
    return null;
  };

  const getRoleBadgeVariant = (roleName?: string) => {
    if (roleName === 'Administrador' || roleName === 'Admin') return 'default';
    if (roleName === 'Gerente' || roleName === 'Gestor') return 'secondary';
    return 'outline';
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header do Canal */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2 mb-3">
          {channel.type === 'team' ? (
            <Users className="h-5 w-5 text-blue-600" />
          ) : (
            <Hash className="h-5 w-5 text-green-600" />
          )}
          <h3 className="font-semibold text-lg">{channel.name}</h3>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3">
          {channel.description || 'Canal de comunicação interna'}
        </p>

        {/* Estatísticas do Canal */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-background rounded-lg p-2">
            <div className="text-lg font-bold text-blue-600">{members.length}</div>
            <div className="text-xs text-muted-foreground">Membros</div>
          </div>
          <div className="bg-background rounded-lg p-2">
            <div className="text-lg font-bold text-green-600">
              {members.filter(m => m.isOnline !== false).length}
            </div>
            <div className="text-xs text-muted-foreground">Online</div>
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
                filteredMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar || ''} />
                        <AvatarFallback className="text-xs">
                          {member.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {/* Indicador de status online */}
                      <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                        member.isOnline !== false ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
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
                            className="text-xs px-1 py-0"
                          >
                            {member.roleName}
                          </Badge>
                        )}
                      </div>
                    </div>
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

          {channel.type === 'team' && (
            <>
              <Separator />
              
              {/* Informações da Equipe */}
              <div>
                <h4 className="font-medium text-sm mb-3">Informações da equipe</h4>
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
                    <span>{channel.isPrivate ? 'Privado' : 'Público'}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}