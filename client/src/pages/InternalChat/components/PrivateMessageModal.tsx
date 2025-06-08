import { useState, useEffect, useRef } from 'react';
import { Send, X, Phone, Video, Minimize2 } from 'lucide-react';
import { Button } from '@/shared/ui/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/ui/avatar';
import { Textarea } from '@/shared/ui/ui/textarea';
import { ScrollArea } from '@/shared/ui/ui/scroll-area';
import { Badge } from '@/shared/ui/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/ui/dialog';
import { useInternalChatStore } from '../store/internalChatStore';
import { useAuth } from '@/shared/lib/hooks/useAuth';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PrivateMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: {
    id: number;
    username: string;
    displayName: string;
    roleName?: string;
    avatar?: string;
  };
}

export function PrivateMessageModal({ isOpen, onClose, targetUser }: PrivateMessageModalProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { playNotificationSound } = useInternalChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentUser = user as any;
  const privateChannelId = `direct-${Math.min(currentUser?.id || 0, targetUser.id)}-${Math.max(currentUser?.id || 0, targetUser.id)}`;

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = () => {
    if (!message.trim() || !currentUser) return;

    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      channelId: privateChannelId,
      userId: currentUser.id,
      userName: currentUser.displayName || currentUser.username || 'Usuário',
      userAvatar: currentUser.avatar,
      content: message.trim(),
      messageType: 'text' as const,
      timestamp: new Date(),
      reactions: {}
    };

    setMessages(prev => [...prev, newMessage]);
    playNotificationSound('send');
    setMessage('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    toast({
      title: "Mensagem enviada",
      description: `Mensagem privada enviada para ${targetUser.displayName}`,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: Date) => {
    return format(new Date(timestamp), 'HH:mm', { locale: ptBR });
  };

  const getRoleColor = (roleName?: string) => {
    if (roleName === 'Administrador' || roleName === 'Admin') return 'text-yellow-600';
    if (roleName === 'Gerente' || roleName === 'Gestor') return 'text-blue-600';
    return 'text-muted-foreground';
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl h-[600px] p-0 ${isMinimized ? 'h-16' : ''}`}>
        {/* Header */}
        <DialogHeader className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={targetUser.avatar || ''} />
                <AvatarFallback className="text-xs">
                  {targetUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-base">{targetUser.displayName}</DialogTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">@{targetUser.username}</span>
                  {targetUser.roleName && (
                    <Badge variant="outline" className={`text-xs ${getRoleColor(targetUser.roleName)}`}>
                      {targetUser.roleName}
                    </Badge>
                  )}
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Video className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <Avatar className="h-16 w-16 mx-auto mb-3">
                      <AvatarImage src={targetUser.avatar || ''} />
                      <AvatarFallback>
                        {targetUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-medium mb-2">Conversa com {targetUser.displayName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Esta é uma conversa privada. Apenas vocês dois podem ver essas mensagens.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwnMessage = msg.userId === currentUser?.id;
                    return (
                      <div key={msg.id} className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={msg.userAvatar || ''} />
                          <AvatarFallback className="text-xs">
                            {msg.userName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'text-right' : ''}`}>
                          <div className={`inline-block p-3 rounded-lg ${
                            isOwnMessage 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatMessageTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  placeholder={`Mensagem para ${targetUser.displayName}...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="min-h-[40px] max-h-32 resize-none"
                  rows={1}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  size="sm"
                  className="h-10 px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}