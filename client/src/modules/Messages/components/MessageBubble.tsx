import { Check, CheckCheck, Play, Pause, Volume2, FileText, Download, Trash2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/ui/avatar';
import { Button } from '@/shared/ui/ui/button';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/shared/ui/ui/alert-dialog';
import { format } from 'date-fns';
import { useState, useRef } from 'react';
import { MessageReactions } from './MessageReactions';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Message, Contact } from '@shared/schema';

interface MessageBubbleProps {
  message: Message;
  contact: Contact;
  channelIcon?: string;
  channelColor?: string;
  conversationId?: number;
}

// Componente para reproduzir mensagem de áudio
function AudioMessage({ message, isFromContact }: { message: Message; isFromContact: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Extrair informações do áudio dos metadados
  const metadata = message.metadata && typeof message.metadata === 'object' ? message.metadata : {};
  const audioSize = 'audioSize' in metadata ? metadata.audioSize as number : null;
  const audioDuration = 'duration' in metadata ? metadata.duration as number : null;

  const sizeText = audioSize ? ` (${Math.round(audioSize / 1024)}KB)` : '';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayback = () => {
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

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Usar duração dos metadados se disponível
  const effectiveDuration = audioDuration || duration;

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Verificar se é um áudio válido - pode vir direto como data URL ou como string base64
  let audioUrl = null;
  if (message.content?.startsWith('data:audio/')) {
    audioUrl = message.content;
  } else if (message.messageType === 'audio' && message.content) {
    // Caso o conteúdo seja apenas base64 sem o prefixo, tentar construir a URL
    try {
      // Verificar se parece com base64
      if (message.content.match(/^[A-Za-z0-9+/]+=*$/)) {
        const mimeType = (metadata as any).mimeType || 'audio/mp4';
        audioUrl = `data:${mimeType};base64,${message.content}`;
      }
    } catch (e) {
      console.log('Não foi possível processar áudio:', e);
    }
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
      isFromContact ? 'bg-gray-100' : 'bg-blue-600'
    }`}>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}
      
      <button
        onClick={togglePlayback}
        disabled={!audioUrl}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          isFromContact 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : 'bg-white text-blue-600 hover:bg-gray-100'
        } ${!audioUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5" />
        )}
      </button>
      
      <div className="flex-1">
        <div className={`flex items-center gap-2 ${isFromContact ? 'text-gray-700' : 'text-white'}`}>
          <span className="text-sm font-medium">
            {audioUrl ? 'Mensagem de áudio' : 'Mensagem de áudio (não disponível)'}
            {sizeText}
          </span>
          {effectiveDuration > 0 && (
            <span className="text-xs opacity-75">
              {formatTime(currentTime)} / {formatTime(effectiveDuration)}
            </span>
          )}
        </div>
        <div className={`text-xs ${isFromContact ? 'text-gray-500' : 'text-blue-100'}`}>
          Enviado via WhatsApp
        </div>
        {effectiveDuration > 0 && (
          <div className={`w-full h-1 mt-2 rounded overflow-hidden ${
            isFromContact ? 'bg-gray-300' : 'bg-blue-400'
          }`}>
            <div 
              className={`h-full transition-all duration-100 ${
                isFromContact ? 'bg-blue-600' : 'bg-white'
              }`}
              style={{ width: `${(currentTime / effectiveDuration) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para exibir mensagem de imagem
function ImageMessage({ message, isFromContact }: { message: Message; isFromContact: boolean }) {
  const metadata = message.metadata && typeof message.metadata === 'object' ? message.metadata : {};
  const fileName = (metadata as any).fileName || 'Imagem';
  const fileSize = (metadata as any).fileSize;
  const sizeText = fileSize ? ` (${Math.round(fileSize / 1024)}KB)` : '';

  // Verificar se é uma imagem válida
  const imageUrl = message.content?.startsWith('data:image/') ? message.content : null;

  return (
    <div className={`max-w-md ${
      isFromContact ? 'bg-gray-100' : 'bg-blue-600'
    } rounded-lg overflow-hidden`}>
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={fileName}
          className="w-full h-auto max-h-96 object-cover"
          loading="lazy"
        />
      ) : (
        <div className={`p-4 text-center ${
          isFromContact ? 'text-gray-600' : 'text-white'
        }`}>
          <div className="text-sm">📷 Imagem não disponível</div>
          <div className="text-xs opacity-75">{fileName}{sizeText}</div>
        </div>
      )}
      
      {imageUrl && (
        <div className={`px-3 py-2 text-xs ${
          isFromContact ? 'text-gray-600 bg-gray-50' : 'text-blue-100 bg-blue-700'
        }`}>
          {fileName}{sizeText}
        </div>
      )}
    </div>
  );
}

// Componente para exibir mensagem de vídeo
function VideoMessage({ message, isFromContact }: { message: Message; isFromContact: boolean }) {
  const metadata = message.metadata && typeof message.metadata === 'object' ? message.metadata : {};
  const fileName = (metadata as any).fileName || 'Vídeo';
  const fileSize = (metadata as any).fileSize;
  const sizeText = fileSize ? ` (${Math.round(fileSize / 1024)}KB)` : '';

  // Verificar se é um vídeo válido
  const videoUrl = message.content?.startsWith('data:video/') ? message.content : null;

  return (
    <div className={`max-w-md ${
      isFromContact ? 'bg-gray-100' : 'bg-blue-600'
    } rounded-lg overflow-hidden`}>
      {videoUrl ? (
        <video 
          src={videoUrl} 
          controls
          className="w-full h-auto max-h-96"
          preload="metadata"
        >
          Seu navegador não suporta a reprodução de vídeo.
        </video>
      ) : (
        <div className={`p-4 text-center ${
          isFromContact ? 'text-gray-600' : 'text-white'
        }`}>
          <div className="text-sm">🎥 Vídeo não disponível</div>
          <div className="text-xs opacity-75">{fileName}{sizeText}</div>
        </div>
      )}
      
      {videoUrl && (
        <div className={`px-3 py-2 text-xs ${
          isFromContact ? 'text-gray-600 bg-gray-50' : 'text-blue-100 bg-blue-700'
        }`}>
          {fileName}{sizeText}
        </div>
      )}
    </div>
  );
}

// Componente para exibir mensagens de documento
function DocumentMessage({ message, isFromContact }: { message: Message; isFromContact: boolean }) {
  // Extrair informações do documento dos metadados
  const metadata = message.metadata && typeof message.metadata === 'object' ? message.metadata : {};
  const fileName = 'fileName' in metadata ? metadata.fileName as string : 'Documento';
  const fileSize = 'fileSize' in metadata ? metadata.fileSize as number : null;
  const mimeType = 'mimeType' in metadata ? metadata.mimeType as string : '';

  const sizeText = fileSize ? ` (${Math.round(fileSize / 1024)}KB)` : '';
  
  // Função para determinar o ícone baseado no tipo de arquivo
  const getFileIcon = (mimeType: string, fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    if (mimeType.includes('pdf') || extension === 'pdf') {
      return '📄';
    } else if (mimeType.includes('word') || ['doc', 'docx'].includes(extension)) {
      return '📝';
    } else if (mimeType.includes('excel') || ['xls', 'xlsx'].includes(extension)) {
      return '📊';
    } else if (mimeType.includes('powerpoint') || ['ppt', 'pptx'].includes(extension)) {
      return '📑';
    } else if (mimeType.includes('zip') || ['zip', 'rar', '7z'].includes(extension)) {
      return '🗂️';
    } else {
      return '📄';
    }
  };

  const handleDownload = () => {
    if (message.content && message.content.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = message.content;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={`max-w-md ${
      isFromContact ? 'bg-gray-100' : 'bg-blue-600'
    } rounded-lg overflow-hidden`}>
      <div className={`p-4 ${
        isFromContact ? 'text-gray-900' : 'text-white'
      }`}>
        <div className="flex items-center gap-3">
          <div className="text-2xl">
            {getFileIcon(mimeType, fileName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {fileName}
            </div>
            <div className={`text-xs ${
              isFromContact ? 'text-gray-500' : 'text-blue-100'
            }`}>
              Documento{sizeText}
            </div>
          </div>
          {message.content && message.content.startsWith('data:') && (
            <button
              onClick={handleDownload}
              className={`p-2 rounded-full hover:bg-opacity-20 hover:bg-white transition-colors ${
                isFromContact ? 'text-gray-600 hover:bg-gray-200' : 'text-white'
              }`}
              title="Baixar documento"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function MessageBubble({ message, contact, channelIcon, channelColor, conversationId }: MessageBubbleProps) {
  const isFromContact = message.isFromContact;
  // Determinar qual timestamp usar (prioridade: deliveredAt, sentAt, createdAt)
  const messageTimestamp = message.deliveredAt || message.sentAt || new Date();
  
  // Formatação da data e hora completa
  const messageTime = format(new Date(messageTimestamp), 'dd/MM/yyyy HH:mm:ss');
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  // Verificar se a mensagem pode ser deletada (dentro de 7 minutos para WhatsApp)
  const canDelete = () => {
    if (isFromContact) return false; // Só permite deletar mensagens enviadas pelo agente
    
    const messageDate = new Date(message.sentAt || new Date());
    const now = new Date();
    const timeDifference = now.getTime() - messageDate.getTime();
    const sevenMinutesInMs = 7 * 60 * 1000; // 7 minutos em milissegundos
    
    return timeDifference <= sevenMinutesInMs;
  };

  const handleDeleteMessage = async () => {
    if (!contact.phone || !conversationId) return;

    // Extrair messageId dos metadados - tentar múltiplas possibilidades
    const metadata = message.metadata && typeof message.metadata === 'object' ? message.metadata : {};
    let messageId = null;
    
    // Buscar o ID da mensagem nos metadados em diferentes campos possíveis
    if ('messageId' in metadata && metadata.messageId) {
      messageId = metadata.messageId;
    } else if ('zaapId' in metadata && metadata.zaapId) {
      messageId = metadata.zaapId;
    } else if ('id' in metadata && metadata.id) {
      messageId = metadata.id;
    }

    // Log para debug
    console.log('🗑️ Tentando deletar mensagem:', {
      messageLocalId: message.id,
      messageId,
      metadata,
      phone: contact.phone,
      conversationId
    });

    if (!messageId) {
      toast({
        title: "Erro",
        description: "Esta mensagem não pode ser deletada (ID da Z-API não encontrado)",
        variant: "destructive"
      });
      return;
    }

    setIsDeleting(true);
    try {
      const response = await apiRequest('POST', '/api/zapi/delete-message', {
        phone: contact.phone,
        messageId: messageId.toString(),
        conversationId: conversationId
      });

      console.log('✅ Resposta da exclusão:', response);

      // Marcar mensagem como deletada localmente e invalidar cache
      setIsDeleted(true);
      
      // Invalidar cache para recarregar mensagens com status atualizado
      queryClient.invalidateQueries({ 
        queryKey: [`/api/conversations/${conversationId}/messages`] 
      });

      toast({
        title: "Sucesso",
        description: "Mensagem deletada com sucesso"
      });
    } catch (error) {
      console.error('❌ Erro ao deletar mensagem:', error);
      
      // Mostrar erro mais específico baseado na resposta
      let errorMessage = "Não foi possível deletar a mensagem";
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as Error).message;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Se a mensagem foi deletada (localmente ou no banco), mostrar interface simplificada
  if (isDeleted || message.isDeleted) {
    return (
      <div className={`flex items-start gap-3 mb-4 ${isFromContact ? '' : 'flex-row-reverse'}`}>
        <Avatar className="w-8 h-8 flex-shrink-0 opacity-50">
          <AvatarImage 
            src={isFromContact ? contact.profileImageUrl || '' : ''} 
            alt={isFromContact ? contact.name : 'Agente'} 
          />
          <AvatarFallback className="text-xs">
            {isFromContact 
              ? contact.name?.charAt(0)?.toUpperCase() || 'C'
              : 'A'
            }
          </AvatarFallback>
        </Avatar>
        
        <div className={`flex-1 max-w-md ${isFromContact ? '' : 'flex flex-col items-end'}`}>
          <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-500 opacity-75">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              <span className="text-sm italic">Esta mensagem foi deletada</span>
            </div>
          </div>
          <div className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${isFromContact ? '' : 'justify-end'}`}>
            <span>{messageTime}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 mb-4 ${isFromContact ? '' : 'flex-row-reverse'}`}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage 
          src={isFromContact ? contact.profileImageUrl || '' : ''} 
          alt={isFromContact ? contact.name : 'Agente'} 
        />
        <AvatarFallback className="text-xs">
          {isFromContact 
            ? contact.name?.charAt(0)?.toUpperCase() || 'C'
            : 'A'
          }
        </AvatarFallback>
      </Avatar>
      
      <div className={`flex-1 max-w-md ${isFromContact ? '' : 'flex flex-col items-end'}`}>
        <div className={`${
          message.messageType === 'audio' || message.messageType === 'image' || message.messageType === 'video' || message.messageType === 'document' ? '' : 'px-4 py-2'
        } rounded-lg ${
          message.messageType === 'image' || message.messageType === 'video' || message.messageType === 'document' ? '' : (
            isFromContact 
              ? 'bg-gray-100 text-gray-900' 
              : 'bg-blue-600 text-white'
          )
        }`}>
          {message.messageType === 'audio' ? (
            <AudioMessage message={message} isFromContact={isFromContact} />
          ) : message.messageType === 'image' ? (
            <ImageMessage message={message} isFromContact={isFromContact} />
          ) : message.messageType === 'video' ? (
            <VideoMessage message={message} isFromContact={isFromContact} />
          ) : message.messageType === 'document' ? (
            <DocumentMessage message={message} isFromContact={isFromContact} />
          ) : (
            <p className="text-sm">{message.content}</p>
          )}
        </div>
        
        <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${isFromContact ? '' : 'justify-end'}`}>
          {/* Reações disponíveis apenas para mensagens do contato (WhatsApp) */}
          {isFromContact && contact.phone && conversationId && (
            <MessageReactions 
              message={message}
              conversationId={conversationId}
              contactPhone={contact.phone}
            />
          )}
          
          <div className="flex items-center gap-1">
            {/* Botão de deletar mensagem (apenas para mensagens recentes enviadas pelo agente) */}
            {canDelete() && contact.phone && conversationId && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    disabled={isDeleting}
                    className="p-1 rounded-full hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                    title="Deletar mensagem (disponível por 7 minutos)"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Por favor, confirme</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir essa mensagem? Esta operação não poderá ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteMessage} disabled={isDeleting}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            {!isFromContact && (
              <div className="flex items-center">
                {message.readAt ? (
                  <CheckCheck className="w-3 h-3 text-blue-500" />
                ) : message.deliveredAt ? (
                  <CheckCheck className="w-3 h-3 text-gray-400" />
                ) : (
                  <Check className="w-3 h-3 text-gray-400" />
                )}
              </div>
            )}
            <span>{messageTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}