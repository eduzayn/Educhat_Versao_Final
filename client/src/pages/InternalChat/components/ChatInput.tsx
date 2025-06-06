import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, AtSign, Calendar, AlertTriangle, Mic, Image } from 'lucide-react';
import { Button } from '@/shared/ui/ui/button';
import { Textarea } from '@/shared/ui/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/ui/popover';
import { Badge } from '@/shared/ui/ui/badge';
import { useInternalChatStore } from '../store/internalChatStore';
import { useAuth } from '@/shared/lib/hooks/useAuth';

const QUICK_EMOJIS = ['👍', '❤️', '😊', '😂', '👏', '🎉', '💯', '🔥'];

const COMMANDS = [
  { command: '/remind', description: 'Criar lembrete', example: '/remind 15:30 Reunião equipe' },
  { command: '/important', description: 'Marcar como importante', example: '/important Urgente!' },
  { command: '/all', description: 'Mencionar todos', example: '/all Pessoal, atenção!' },
];

export function ChatInput() {
  const [message, setMessage] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { activeChannel, addMessage, setTyping, removeTyping } = useInternalChatStore();
  const { user } = useAuth();

  const filteredCommands = COMMANDS.filter(cmd => 
    message.startsWith('/') && cmd.command.toLowerCase().includes(message.toLowerCase())
  );

  useEffect(() => {
    if (message.startsWith('/') && message.length > 1) {
      setShowCommands(true);
      setSelectedCommandIndex(0);
    } else {
      setShowCommands(false);
    }
  }, [message]);

  // Indicador de digitação
  useEffect(() => {
    if (!activeChannel || !user?.id) return;

    let typingTimer: NodeJS.Timeout;

    if (message.trim()) {
      setTyping({
        userId: user.id,
        userName: user.displayName || user.username || 'Usuário',
        channelId: activeChannel,
        timestamp: new Date()
      });

      typingTimer = setTimeout(() => {
        removeTyping(user.id, activeChannel);
      }, 3000);
    } else {
      removeTyping(user.id, activeChannel);
    }

    return () => {
      if (typingTimer) clearTimeout(typingTimer);
      if (activeChannel && user?.id) {
        removeTyping(user.id, activeChannel);
      }
    };
  }, [message, activeChannel, user?.id]);

  const handleSendMessage = () => {
    if (!message.trim() || !activeChannel || !user?.id) return;

    const messageContent = message.trim();
    let messageType: 'text' | 'reminder' = 'text';
    let isImportant = false;
    let reminderDate: Date | undefined;
    let finalContent = messageContent;

    // Processar comandos
    if (messageContent.startsWith('/remind ')) {
      messageType = 'reminder';
      const parts = messageContent.slice(8).split(' ');
      const timeStr = parts[0];
      const content = parts.slice(1).join(' ');
      
      // Parse simples de hora (HH:MM)
      if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const now = new Date();
        reminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        
        if (reminderDate < now) {
          reminderDate.setDate(reminderDate.getDate() + 1);
        }
      }
      
      finalContent = content || `Lembrete para ${timeStr}`;
    } else if (messageContent.startsWith('/important ')) {
      isImportant = true;
      finalContent = messageContent.slice(11);
    } else if (messageContent.startsWith('/all ')) {
      finalContent = `@todos ${messageContent.slice(5)}`;
    }

    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      channelId: activeChannel,
      userId: user.id,
      userName: user.displayName || user.username || 'Usuário',
      userAvatar: user.avatar,
      content: finalContent,
      messageType,
      timestamp: new Date(),
      reactions: {},
      isImportant,
      reminderDate
    };

    addMessage(newMessage);
    setMessage('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showCommands && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        const selectedCommand = filteredCommands[selectedCommandIndex];
        if (selectedCommand) {
          setMessage(selectedCommand.command + ' ');
          setShowCommands(false);
          textareaRef.current?.focus();
        }
      } else if (e.key === 'Escape') {
        setShowCommands(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.slice(0, start) + emoji + message.slice(end);
    
    setMessage(newMessage);
    
    // Restaurar posição do cursor
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  };

  if (!activeChannel) {
    return null;
  }

  return (
    <div className="border-t bg-card p-4">
      {/* Commands Popup */}
      {showCommands && filteredCommands.length > 0 && (
        <div className="mb-3 p-2 bg-accent rounded-md border">
          <p className="text-xs text-muted-foreground mb-2">Comandos disponíveis:</p>
          {filteredCommands.map((cmd, index) => (
            <div
              key={cmd.command}
              className={`p-2 rounded cursor-pointer ${
                index === selectedCommandIndex ? 'bg-primary text-primary-foreground' : 'hover:bg-background'
              }`}
              onClick={() => {
                setMessage(cmd.command + ' ');
                setShowCommands(false);
                textareaRef.current?.focus();
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{cmd.command}</span>
                <span className="text-xs opacity-75">{cmd.description}</span>
              </div>
              <p className="text-xs opacity-75 mt-1">{cmd.example}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attachment Button */}
        <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0">
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem... (use / para comandos)"
            className="min-h-10 max-h-32 resize-none pr-20"
            rows={1}
          />
          
          {/* Input Actions */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            {/* Emoji Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Smile className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="end">
                <div className="grid grid-cols-4 gap-1">
                  {QUICK_EMOJIS.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => insertEmoji(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Mention Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => insertEmoji('@')}
            >
              <AtSign className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Voice Recording */}
        <Button
          variant={isRecording ? "destructive" : "ghost"}
          size="icon"
          className="h-10 w-10 flex-shrink-0"
          onMouseDown={() => setIsRecording(true)}
          onMouseUp={() => setIsRecording(false)}
          onMouseLeave={() => setIsRecording(false)}
        >
          <Mic className="h-4 w-4" />
        </Button>

        {/* Send Button */}
        <Button
          onClick={handleSendMessage}
          disabled={!message.trim()}
          size="icon"
          className="h-10 w-10 flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Status Indicators */}
      {message.startsWith('/remind') && (
        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>Lembrete será criado</span>
        </div>
      )}
      
      {message.startsWith('/important') && (
        <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          <span>Mensagem será marcada como importante</span>
        </div>
      )}

      {isRecording && (
        <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
          <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          <span>Gravando áudio...</span>
        </div>
      )}
    </div>
  );
}