import { Users, Hash, Calendar, Settings, Pin, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/ui/avatar';
import { Button } from '@/shared/ui/ui/button';
import { Input } from '@/shared/ui/ui/input';
import { Badge } from '@/shared/ui/ui/badge';
import { Separator } from '@/shared/ui/ui/separator';
import { ScrollArea } from '@/shared/ui/ui/scroll-area';
import { useInternalChatStore } from '../store/internalChatStore';
import { useState, useEffect } from 'react';

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
      <div className="flex-1 p-4">
        <p className="text-muted-foreground text-sm">
          Selecione um canal para ver informações
        </p>
      </div>
    );
  }

  const filteredMembers = members.filter(member =>
    member.displayName.toLowerCase().includes(memberSearch.toLowerCase()) ||
    (member.roleName && member.roleName.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-2">
          {channel.type === 'team' ? <Users className="h-5 w-5" /> : <Hash className="h-5 w-5" />}
          <h3 className="font-semibold">{channel.name}</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {channel.description || 'Canal de comunicação interna'}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Channel Stats */}
          <div>
            <h4 className="font-medium mb-3">Estatísticas</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Membros total</span>
                <span>{members.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tipo do canal</span>
                <span className="capitalize">{channel.type}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Members */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Membros ({channelMembers.length})</h4>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Settings className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Buscar membros..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>

            <div className="space-y-2">
              {filteredMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="text-xs">
                        {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {member.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Pinned Messages */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Mensagens Fixadas</h4>
              <Badge variant="secondary" className="text-xs">
                {pinnedMessages.length}
              </Badge>
            </div>
            
            <div className="space-y-2">
              {pinnedMessages.map((message) => (
                <div key={message.id} className="p-2 bg-accent rounded-md">
                  <div className="flex items-start gap-2">
                    <Pin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-relaxed">{message.content}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-muted-foreground">{message.author}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {message.date.toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Recent Files */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Arquivos Recentes</h4>
              <Button variant="ghost" size="sm" className="text-xs h-6">
                Ver todos
              </Button>
            </div>
            
            <div className="space-y-2">
              {recentFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer">
                  <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">
                      {file.name.split('.').pop()?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">{file.author}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {file.date.toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Quick Actions */}
          <div>
            <h4 className="font-medium mb-3">Ações Rápidas</h4>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Calendar className="h-3 w-3" />
                Agendar Reunião
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Pin className="h-3 w-3" />
                Fixar Mensagem
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Settings className="h-3 w-3" />
                Configurações do Canal
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}