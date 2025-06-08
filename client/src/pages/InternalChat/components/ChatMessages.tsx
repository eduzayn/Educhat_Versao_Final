import { useEffect, useRef, useState } from 'react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '../../scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../../avatar';
import { Badge } from '../../badge';
import { Button } from '../../button';
import { Reply, Edit2, Trash2, MoreHorizontal, AlertTriangle, Play, Pause, Volume2, Download, FileText, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import { useInternalChatStore, type InternalChatMessage } from '../../store/internalChatStore';
import { useAuth } from '@/shared/lib/hooks/useAuth';

// Componente para exibir arquivos no chat interno
function InternalFileDisplay({ message }: { message: any }) {
  const metadata = message.metadata;
  if (!metadata) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = metadata.fileUrl;
    link.download = metadata.fileName || 'arquivo';
    link.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Renderizar imagem
  if (metadata.fileType === 'image') {
    return (
      <div className="max-w-xs">
        <img 
          src={metadata.fileUrl} 
          alt={metadata.fileName} 
          className="rounded-lg max-w-full h-auto cursor-pointer"
          onClick={handleDownload}
        />
        <div className="text-xs opacity-75 mt-1">{metadata.fileName}</div>
      </div>
    );
  }

  // Renderizar vídeo
  if (metadata.fileType === 'video') {
    return (
      <div className="max-w-xs">
        <video 
          src={metadata.fileUrl} 
          controls 
          className="rounded-lg max-w-full h-auto"
        />
        <div className="text-xs opacity-75 mt-1">{metadata.fileName}</div>
      </div>
    );
  }

  // Renderizar documento ou arquivo genérico
  return (
    <div className="flex items-center gap-3 p-3 bg-black bg-opacity-10 rounded-lg max-w-xs cursor-pointer" onClick={handleDownload}>
      <div className="flex-shrink-0">
        <FileText className="h-8 w-8 opacity-75" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{metadata.fileName}</div>
        <div className="text-xs opacity-75">{formatFileSize(metadata.fileSize)}</div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 flex-shrink-0 hover:bg-white hover:bg-opacity-20"
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Componente para reproduzir áudio no chat interno
function InternalAudioPlayer({ audioUrl, duration }: { audioUrl: string; duration: number }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg max-w-xs bg-black bg-opacity-10">
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlayPause}
        className="h-8 w-8 flex-shrink-0 hover:bg-white hover:bg-opacity-20"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      
      <div className="flex items-center gap-2 flex-1">
        <Volume2 className="h-4 w-4 opacity-75" />
        <span className="text-sm opacity-90">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
      />
    </div>
  );
}

export function ChatMessages() {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { activeChannel, getChannelMessages, addReaction, removeReaction } = useInternalChatStore();
  const { user } = useAuth();
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  
  const messages = activeChannel ? getChannelMessages(activeChannel) : [];

  // Auto scroll para última mensagem
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages.length, activeChannel]);

  const formatMessageTime = (date: Date) => {
    return format(date, 'HH:mm', { locale: ptBR });
  };

  const formatDateSeparator = (date: Date) => {
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    return format(date, 'dd \'de\' MMMM', { locale: ptBR });
  };

  const groupMessagesByDate = (messages: InternalChatMessage[]) => {
    const groups: { date: Date; messages: InternalChatMessage[] }[] = [];
    
    messages.forEach((message) => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && isSameDay(lastGroup.date, message.timestamp)) {
        lastGroup.messages.push(message);
      } else {
        groups.push({
          date: message.timestamp,
          messages: [message]
        });
      }
    });
    
    return groups;
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (!activeChannel || !user) return;
    
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    
    const userId = (user as any).id || (user as any).userId;
    if (!userId) return;
    
    const userReacted = message.reactions[emoji]?.includes(userId);
    
    if (userReacted) {
      removeReaction(messageId, activeChannel, emoji, userId);
    } else {
      addReaction(messageId, activeChannel, emoji, userId);
    }
  };

  const renderMessage = (message: InternalChatMessage, isConsecutive: boolean) => {
    const userId = (user as any)?.id || (user as any)?.userId;
    const isOwnMessage = message.userId === userId;
    
    return (
      <div
        key={message.id}
        className={`group relative px-4 py-1 hover:bg-accent/50 ${isConsecutive ? 'mt-0.5' : 'mt-4'}`}
        onMouseEnter={() => setHoveredMessage(message.id)}
        onMouseLeave={() => setHoveredMessage(null)}
      >
        <div className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
          {!isConsecutive && (
            <Avatar className="h-10 w-10 mt-0.5">
              <AvatarImage src={message.userAvatar} />
              <AvatarFallback className="text-sm">
                {message.userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          {isConsecutive && <div className="w-10" />}
          
          <div className={`flex-1 min-w-0 ${isOwnMessage ? 'flex flex-col items-end' : ''}`}>
            {!isConsecutive && (
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-foreground">
                  {message.userName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatMessageTime(message.timestamp)}
                </span>
                {message.edited && (
                  <Badge variant="secondary" className="text-xs h-4 px-1">
                    editado
                  </Badge>
                )}
                {message.isImportant && (
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                )}
              </div>
            )}
            
            <div className={`inline-block max-w-lg p-3 rounded-lg text-sm leading-relaxed ${
              isOwnMessage 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-900'
            }`}>
              {message.messageType === 'reminder' && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md mb-2">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-800">Lembrete para {message.reminderDate ? format(message.reminderDate, 'dd/MM/yyyy HH:mm') : 'data não definida'}</span>
                </div>
              )}
              
              {message.replyTo && (
                <div className="border-l-2 border-muted pl-2 mb-2 text-xs opacity-75">
                  <div>Respondendo a mensagem anterior</div>
                </div>
              )}
              
              {/* Renderizar arquivos */}
              {message.messageType === 'file' ? (
                <div className="mb-2">
                  {(message as any).metadata?.fileType === 'audio' ? (
                    <InternalAudioPlayer 
                      audioUrl={(message as any).metadata.audioUrl} 
                      duration={(message as any).metadata.duration || 0} 
                    />
                  ) : (
                    <InternalFileDisplay message={message} />
                  )}
                  <div className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                    {message.content}
                  </div>
                </div>
              ) : (
                <div className="break-words">{message.content}</div>
              )}
              
              {/* Reactions */}
              {Object.keys(message.reactions).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {Object.entries(message.reactions).map(([emoji, userIds]) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs hover:bg-accent"
                      onClick={() => handleReaction(message.id, emoji)}
                    >
                      <span className="mr-1">{emoji}</span>
                      <span>{userIds.length}</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Message Actions */}
          {hoveredMessage === message.id && (
            <div className="absolute right-4 top-1 bg-background border rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Reply className="h-3 w-3" />
                </Button>
                {/* Quick Reactions */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleReaction(message.id, '👍')}
                >
                  👍
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleReaction(message.id, '❤️')}
                >
                  ❤️
                </Button>
                {isOwnMessage && (
                  <>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const messageGroups = groupMessagesByDate(messages);

  if (!activeChannel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">
            Bem-vindo ao Chat Interno
          </h3>
          <p className="text-muted-foreground">
            Selecione um canal para começar a conversar
          </p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhuma mensagem ainda
          </h3>
          <p className="text-muted-foreground">
            Seja o primeiro a enviar uma mensagem neste canal
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 bg-background" ref={scrollAreaRef}>
      <div className="py-4">
        {messageGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-4">
              <div className="px-3 py-1 bg-muted rounded-full">
                <span className="text-xs font-medium text-muted-foreground">
                  {formatDateSeparator(group.date)}
                </span>
              </div>
            </div>
            
            {/* Messages */}
            {group.messages.map((message, messageIndex) => {
              const previousMessage = messageIndex > 0 ? group.messages[messageIndex - 1] : null;
              const isConsecutive = Boolean(
                previousMessage && 
                previousMessage.userId === message.userId &&
                message.timestamp.getTime() - previousMessage.timestamp.getTime() < 300000 // 5 minutos
              );
              
              return renderMessage(message, isConsecutive);
            })}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}