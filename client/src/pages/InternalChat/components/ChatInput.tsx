import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, Upload, X, FileText, Image as ImageIcon, Video as VideoIcon, Mic } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { Input } from "@/shared/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { AudioRecorder } from "@/modules/Messages/components/AudioRecorder";
import { useUnifiedChatStore } from "@/shared/store/unifiedChatStore";
import { useAuth } from "@/shared/lib/hooks/useAuth";
import { useToast } from "@/shared/lib/hooks/use-toast";

interface ChatUser {
  id: number;
  username: string;
  displayName?: string;
  avatar?: string;
}

export function ChatInput() {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showFileDialog, setShowFileDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const store = useUnifiedChatStore();
  const activeChannel = store.internal.activeChannel;
  const { user } = useAuth();
  const { toast } = useToast();

  const currentUser = user as ChatUser | undefined;

  const handleSubmit = async () => {
    if (!message.trim() || !activeChannel || !currentUser) return;

    try {
      // Create internal message with required structure
      const messageId = Math.floor(Date.now() + Math.random() * 1000);
      const now = new Date();
      
      const newMessage = {
        id: messageId,
        conversationId: 0,
        content: message.trim(),
        messageType: 'text' as const,
        isFromContact: false,
        metadata: {},
        isDeleted: false,
        sentAt: now,
        deliveredAt: null,
        readAt: null,
        whatsappMessageId: null,
        zapiStatus: null,
        isGroup: false,
        referenceMessageId: null,
        isInternalNote: false,
        authorId: currentUser.id,
        authorName: currentUser.displayName || currentUser.username,
        isHiddenForUser: false,
        isDeletedByUser: false,
        deletedAt: null,
        deletedBy: null,
        chatType: 'internal' as const,
        channelId: activeChannel,
      };

      store.addInternalMessage(newMessage);
      setMessage("");
      
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar mensagem.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowFileDialog(true);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !activeChannel || !currentUser) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('channelId', activeChannel);
      formData.append('userId', currentUser.id.toString());

      // Simular progresso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch('/api/internal-chat/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error('Falha no upload do arquivo');
      }

      const result = await response.json();

      // Criar mensagem com o arquivo
      const messageId = Math.floor(Date.now() + Math.random() * 1000);
      const now = new Date();
      
      const fileMessage = {
        id: messageId,
        conversationId: 0,
        content: `${selectedFile.name}`,
        messageType: getFileType(selectedFile.type),
        isFromContact: false,
        metadata: {
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: getFileType(selectedFile.type),
          fileUrl: result.fileUrl,
          mimeType: selectedFile.type,
        },
        isDeleted: false,
        sentAt: now,
        deliveredAt: null,
        readAt: null,
        whatsappMessageId: null,
        zapiStatus: null,
        isGroup: false,
        referenceMessageId: null,
        isInternalNote: false,
        authorId: currentUser.id,
        authorName: currentUser.displayName || currentUser.username,
        isHiddenForUser: false,
        isDeletedByUser: false,
        deletedAt: null,
        deletedBy: null,
        chatType: 'internal' as const,
        channelId: activeChannel,
      };

      store.addInternalMessage(fileMessage);

      toast({
        title: "Arquivo enviado",
        description: `${selectedFile.name} foi enviado com sucesso.`,
      });

      setSelectedFile(null);
      setShowFileDialog(false);
      setUploadProgress(0);

    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Falha ao enviar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <ImageIcon className="w-8 h-8 text-blue-500" />;
      case 'video':
        return <VideoIcon className="w-8 h-8 text-purple-500" />;
      default:
        return <FileText className="w-8 h-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleAudioRecorded = async (audioBlob: Blob, duration: number) => {
    if (!activeChannel || !currentUser) return;

    try {
      // Criar FormData para envio do áudio
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('channelId', activeChannel);
      formData.append('userId', currentUser.id.toString());

      const response = await fetch('/api/internal-chat/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha no upload do áudio');
      }

      const result = await response.json();

      // Criar mensagem com o áudio
      const messageId = Math.floor(Date.now() + Math.random() * 1000);
      const now = new Date();
      
      const audioMessage = {
        id: messageId,
        conversationId: 0,
        content: `Áudio (${Math.floor(duration)}s)`,
        messageType: 'audio' as const,
        isFromContact: false,
        metadata: {
          fileName: 'audio.webm',
          fileSize: audioBlob.size,
          fileType: 'audio',
          audioUrl: result.fileUrl,
          duration: duration,
          mimeType: 'audio/webm',
        },
        isDeleted: false,
        sentAt: now,
        deliveredAt: null,
        readAt: null,
        whatsappMessageId: null,
        zapiStatus: null,
        isGroup: false,
        referenceMessageId: null,
        isInternalNote: false,
        authorId: currentUser.id,
        authorName: currentUser.displayName || currentUser.username,
        isHiddenForUser: false,
        isDeletedByUser: false,
        deletedAt: null,
        deletedBy: null,
        chatType: 'internal' as const,
        channelId: activeChannel,
      };

      store.addInternalMessage(audioMessage);

      toast({
        title: "Áudio enviado",
        description: `Áudio de ${Math.floor(duration)}s foi enviado com sucesso.`,
      });

      setShowAudioRecorder(false);

    } catch (error) {
      console.error('Erro no envio de áudio:', error);
      toast({
        title: "Erro no envio de áudio",
        description: "Falha ao enviar mensagem de áudio.",
        variant: "destructive",
      });
    }
  };

  const handleCancelAudio = () => {
    setShowAudioRecorder(false);
  };

  if (!activeChannel) {
    return (
      <div className="p-4 border-t bg-muted/10">
        <p className="text-sm text-muted-foreground text-center">
          Selecione um canal para começar a conversar
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 p-4 border-t bg-background">
      <div className="flex-1 space-y-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua mensagem..."
          className="min-h-[60px] max-h-32 resize-none"
          disabled={!currentUser}
        />
      </div>

      <div className="flex gap-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-10 w-10 p-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={!currentUser}
        >
          <Paperclip className="w-4 h-4" />
        </Button>
        
        {!showAudioRecorder ? (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-10 w-10 p-0"
            onClick={() => setShowAudioRecorder(true)}
            disabled={!currentUser}
          >
            <Mic className="w-4 h-4" />
          </Button>
        ) : null}
        
        <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
          <Smile className="w-4 h-4" />
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!message.trim() || !currentUser}
          className="h-10"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      <Input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
      />

      {/* Componente de Gravação de Áudio */}
      {showAudioRecorder && (
        <div className="mb-2">
          <AudioRecorder
            onAudioRecorded={handleAudioRecorded}
            onCancel={handleCancelAudio}
            className="w-full"
          />
        </div>
      )}

      {/* Modal de Upload de Arquivo */}
      <Dialog open={showFileDialog} onOpenChange={setShowFileDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Anexar Arquivo</DialogTitle>
          </DialogHeader>

          {selectedFile && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                {getFileIcon(getFileType(selectedFile.type))}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setShowFileDialog(false);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Enviando...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null);
                    setShowFileDialog(false);
                  }}
                  disabled={isUploading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleFileUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}