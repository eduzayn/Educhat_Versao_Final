import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, AtSign, Calendar, AlertTriangle, Mic, Image, Video, FileText, Upload } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { useInternalChatStore } from '@/shared/store/internalChatStore';
import { useAuth } from '@/shared/lib/hooks/useAuth';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { AudioRecorder, AudioRecorderRef } from '@/modules/Messages/components/AudioRecorder';
import { cn } from '@/lib/utils';

// Interface para o usuário no contexto de chat interno
interface ChatUser {
  id: number;
  username: string;
  displayName: string;
  avatar?: string;
}

const FREQUENT_EMOJIS = ['👍', '❤️', '😊', '😂', '👏', '🎉', '💯', '🔥'];

const COMMANDS = [
  { command: '/remind', description: 'Criar lembrete', example: '/remind 15:30 Reunião equipe' },
  { command: '/important', description: 'Marcar como importante', example: '/important Urgente!' },
  { command: '/all', description: 'Mencionar todos', example: '/all Pessoal, atenção!' },
];

export function ChatInput() {
  const [message, setMessage] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRecorderRef = useRef<AudioRecorderRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { activeChannel, addMessage, setTyping, removeTyping, playNotificationSound } = useInternalChatStore();
  const { user } = useAuth();
  const { toast } = useToast();

  // Garantir que temos user tipado corretamente
  const currentUser = user as ChatUser | undefined;

  // Buscar usuários reais do sistema
  const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/system-users');
        if (response.ok) {
          const users = await response.json();
          const formattedUsers = users.map((user: any) => ({
            id: user.id,
            username: user.username || user.email.split('@')[0],
            displayName: user.displayName || user.username || user.email,
            avatar: user.avatar || ''
          }));
          setAvailableUsers(formattedUsers);
        }
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      }
    };

    fetchUsers();
  }, []);

  const filteredCommands = COMMANDS.filter(cmd => 
    message.startsWith('/') && cmd.command.toLowerCase().includes(message.toLowerCase())
  );

  const filteredUsers = availableUsers.filter(user => 
    user.displayName.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  useEffect(() => {
    if (message.startsWith('/') && message.length > 1) {
      setShowCommands(true);
      setSelectedCommandIndex(0);
      setShowMentions(false);
    } else {
      setShowCommands(false);
    }

    // Detectar menções (@usuario)
    const lastAtIndex = message.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = message.slice(lastAtIndex + 1);
      const spaceIndex = textAfterAt.indexOf(' ');
      
      if (spaceIndex === -1 || textAfterAt.length <= 20) {
        const query = spaceIndex === -1 ? textAfterAt : textAfterAt.slice(0, spaceIndex);
        setMentionQuery(query);
        setShowMentions(true);
        setSelectedMentionIndex(0);
        setShowCommands(false);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  }, [message]);

  // Indicador de digitação
  useEffect(() => {
    if (!activeChannel || !currentUser) return;

    let typingTimer: NodeJS.Timeout;

    if (message.trim()) {
      setTyping({
        userId: currentUser.id,
        userName: currentUser.displayName || currentUser.username || 'Usuário',
        channelId: activeChannel,
        timestamp: new Date()
      });

      typingTimer = setTimeout(() => {
        removeTyping(currentUser.id, activeChannel);
      }, 3000);
    } else {
      removeTyping(currentUser.id, activeChannel);
    }

    return () => {
      if (typingTimer) clearTimeout(typingTimer);
      if (activeChannel && currentUser) {
        removeTyping(currentUser.id, activeChannel);
      }
    };
  }, [message, activeChannel, currentUser]);

  const handleSendAudio = async (audioBlob: Blob, duration: number) => {
    if (!activeChannel || !currentUser) return;

    // Esconder o componente de gravação imediatamente
    setShowAudioRecorder(false);

    try {
      const audioUrl = URL.createObjectURL(audioBlob);

      const newMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        channelId: activeChannel,
        userId: currentUser.id,
        userName: currentUser.displayName || currentUser.username || 'Usuário',
        userAvatar: currentUser.avatar,
        content: `Áudio (${Math.floor(duration)}s)`,
        messageType: 'file' as const,
        timestamp: new Date(),
        reactions: {},
        metadata: {
          fileType: 'audio',
          audioUrl,
          duration
        }
      };

      addMessage(newMessage);
      playNotificationSound('send');
      
      toast({
        title: "Áudio enviado",
        description: "Sua mensagem de áudio foi enviada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar áudio",
        description: "Falha ao enviar mensagem de áudio. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCancelAudio = () => {
    setShowAudioRecorder(false);
    setIsRecording(false);
  };

  const handleMicrophoneClick = () => {
    if (showAudioRecorder) {
      // Se já está exibindo o gravador, cancelar
      setShowAudioRecorder(false);
      setIsRecording(false);
    } else {
      // Iniciar gravação diretamente - um único clique
      setShowAudioRecorder(true);
      setIsRecording(true);
    }
  };

  const handleFileSelect = (type: 'image' | 'video' | 'document') => {
    if (!fileInputRef.current) return;
    
    let acceptTypes = '';
    switch (type) {
      case 'image':
        acceptTypes = 'image/*';
        break;
      case 'video':
        acceptTypes = 'video/*';
        break;
      case 'document':
        acceptTypes = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx';
        break;
    }
    
    fileInputRef.current.accept = acceptTypes;
    fileInputRef.current.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeChannel || !currentUser) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB.",
        variant: "destructive",
      });
      return;
    }

    // Criar URL para preview/download
    const fileUrl = URL.createObjectURL(file);
    
    // Determinar tipo de arquivo
    let fileType = 'document';
    if (file.type.startsWith('image/')) fileType = 'image';
    else if (file.type.startsWith('video/')) fileType = 'video';

    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      channelId: activeChannel,
      userId: currentUser.id,
      userName: currentUser.displayName || currentUser.username || 'Usuário',
      userAvatar: currentUser.avatar,
      content: file.name,
      messageType: 'file' as const,
      timestamp: new Date(),
      reactions: {},
      metadata: {
        fileType,
        fileUrl,
        fileName: file.name,
        fileSize: file.size
      }
    };

    addMessage(newMessage);
    playNotificationSound('send');
    setIsAttachmentOpen(false);
    
    toast({
      title: "Arquivo enviado",
      description: `${file.name} foi compartilhado no chat.`,
    });

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };



  const handleSendMessage = () => {
    if (!message.trim() || !activeChannel || !currentUser) return;

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
      userId: currentUser.id,
      userName: currentUser.displayName || currentUser.username || 'Usuário',
      userAvatar: currentUser.avatar,
      content: finalContent,
      messageType,
      timestamp: new Date(),
      reactions: {},
      isImportant,
      reminderDate
    };

    addMessage(newMessage);
    playNotificationSound('send');
    setMessage('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const insertMention = (user: ChatUser) => {
    const lastAtIndex = message.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const beforeAt = message.slice(0, lastAtIndex);
      const afterAt = message.slice(lastAtIndex + 1);
      const spaceIndex = afterAt.indexOf(' ');
      const afterMention = spaceIndex !== -1 ? afterAt.slice(spaceIndex) : '';
      
      const newMessage = `${beforeAt}@${user.username} ${afterMention}`;
      setMessage(newMessage);
      setShowMentions(false);
      textareaRef.current?.focus();
    }
  };

  const insertMentionButton = () => {
    const newMessage = message + '@';
    setMessage(newMessage);
    textareaRef.current?.focus();
  };



  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        );
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        const selectedUser = filteredUsers[selectedMentionIndex];
        if (selectedUser) {
          insertMention(selectedUser);
        }
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    } else if (showCommands && filteredCommands.length > 0) {
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
    const newMessage = message + emoji;
    setMessage(newMessage);
    textareaRef.current?.focus();
  };

  if (!activeChannel) {
    return null;
  }

  return (
    <div className="border-t bg-card p-4">
      {/* Componente de gravação de áudio */}
      {showAudioRecorder && (
        <div className="mb-4 border rounded-lg p-3 bg-gray-50">
          <AudioRecorder
            ref={audioRecorderRef}
            onSendAudio={handleSendAudio}
            onCancel={handleCancelAudio}
            onRecordingStateChange={setIsRecording}
            autoStart={isRecording}
          />
        </div>
      )}

      {/* Mentions Popup */}
      {showMentions && filteredUsers.length > 0 && (
        <div className="mb-3 p-2 bg-accent rounded-md border">
          <p className="text-xs text-muted-foreground mb-2">Mencionar usuário:</p>
          {filteredUsers.map((user, index) => (
            <div
              key={user.id}
              className={`p-2 rounded cursor-pointer flex items-center gap-3 ${
                index === selectedMentionIndex ? 'bg-primary text-primary-foreground' : 'hover:bg-background'
              }`}
              onClick={() => insertMention(user)}
            >
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                {user.displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{user.displayName}</div>
                <div className="text-xs opacity-75">@{user.username}</div>
              </div>
            </div>
          ))}
        </div>
      )}

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

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-end gap-2">
        {/* Attachment Button */}
        <Dialog open={isAttachmentOpen} onOpenChange={setIsAttachmentOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 flex-shrink-0"
              disabled={!currentUser || !activeChannel}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </DialogTrigger>

          <DialogContent className="w-96">
            <DialogHeader>
              <DialogTitle>Enviar Arquivo</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 mt-4">
              {/* Botão para Imagem */}
              <Button
                onClick={() => handleFileSelect("image")}
                className="h-20 flex-col bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Image className="w-8 h-8 mb-2" />
                <span className="text-sm">Imagem</span>
              </Button>

              {/* Botão para Vídeo */}
              <Button
                onClick={() => handleFileSelect("video")}
                className="h-20 flex-col bg-red-500 hover:bg-red-600 text-white"
              >
                <Video className="w-8 h-8 mb-2" />
                <span className="text-sm">Vídeo</span>
              </Button>

              {/* Botão para Documento */}
              <Button
                onClick={() => handleFileSelect("document")}
                className="h-20 flex-col bg-green-500 hover:bg-green-600 text-white"
              >
                <FileText className="w-8 h-8 mb-2" />
                <span className="text-sm">Documento</span>
              </Button>

              {/* Botão genérico */}
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="h-20 flex-col bg-purple-500 hover:bg-purple-600 text-white"
              >
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-sm">Qualquer arquivo</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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
                  {FREQUENT_EMOJIS.map((emoji) => (
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
              onClick={insertMentionButton}
            >
              <AtSign className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Voice Recording Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleMicrophoneClick}
          className={cn(
            "h-10 w-10 flex-shrink-0",
            (showAudioRecorder || isRecording) && "bg-red-500 text-white hover:bg-red-600"
          )}
          disabled={!currentUser || !activeChannel}
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


    </div>
  );
}