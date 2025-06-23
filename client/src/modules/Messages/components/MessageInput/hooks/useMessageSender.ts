import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface UseMessageSenderProps {
  conversationId: number;
  onSendMessage?: () => void;
}

export function useMessageSender({ conversationId, onSendMessage }: UseMessageSenderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const notifySuccess = (title: string, description: string) => {
    toast({ title, description });
    onSendMessage?.();
  };

  const notifyError = (title: string, description: string) => {
    toast({ title, description, variant: 'destructive' });
  };

  const sendTextMessage = async (content: string, isInternalNote = false) => {
    if (!content.trim()) return false;

    try {
      // Sistema simplificado: WebSocket primeiro, REST como fallback
      
      // PRIMEIRO: Tentar WebSocket para máxima velocidade
      if ((window as any).socketInstance?.connected) {
        console.log('📡 SOCKET-FIRST: Enviando mensagem via WebSocket');
        
        const socketResult = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.warn('⚠️ Timeout no envio via WebSocket, usando fallback REST');
            resolve(false); // Trigger fallback
          }, 3000);

          // Listener para sucesso via broadcast
          const handleBroadcast = (data: any) => {
            if (data.message?.content === content.trim() && data.conversationId === conversationId) {
              clearTimeout(timeout);
              (window as any).socketInstance?.off('broadcast_message', handleBroadcast);
              (window as any).socketInstance?.off('message_error', handleError);
              
              // GARANTIR que a mensagem está no cache
              queryClient.setQueryData(
                ['/api/conversations', conversationId, 'messages'],
                (oldMessages: any[] | undefined) => {
                  if (!oldMessages) return [data.message];
                  
                  const exists = oldMessages.some(msg => msg.id === data.message.id);
                  if (exists) return oldMessages;
                  
                  return [...oldMessages, data.message];
                }
              );
              
              console.log('✅ SOCKET-FIRST: Mensagem confirmada via WebSocket');
              resolve(true);
            }
          };

          // Listener para erro
          const handleError = (errorData: any) => {
            clearTimeout(timeout);
            (window as any).socketInstance?.off('broadcast_message', handleBroadcast);
            (window as any).socketInstance?.off('message_error', handleError);
            console.error('❌ Erro confirmado via WebSocket:', errorData);
            reject(new Error(errorData.message || 'Erro ao enviar mensagem'));
          };

          // Registrar listeners
          (window as any).socketInstance.on('broadcast_message', handleBroadcast);
          (window as any).socketInstance.on('message_error', handleError);
          
          console.log(`📤 [PROD-AUDIT] SOCKET-SEND: Enviando mensagem via WebSocket`);
          
          // Emitir mensagem via WebSocket
          (window as any).socketInstance.emit('send_message', {
            conversationId,
            content: content.trim(),
            messageType: 'text',
            isFromContact: false,
            isInternalNote
          });
        }).catch(error => {
          console.error('❌ Erro no WebSocket, usando fallback:', error);
          return false; // Trigger fallback
        });

        // Se WebSocket funcionou, retornar sucesso
        if (socketResult) {
          return true;
        }
      }

      // FALLBACK: Se WebSocket não disponível ou falhou, usar REST API
      console.log('📡 FALLBACK: WebSocket não disponível, usando REST API');
      try {
        const response = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, {
          content: content.trim(),
          messageType: 'text',
          isFromContact: false,
          isInternalNote,
        });
        
        // Verificar se response é um Response válido
        if (!response || !response.ok) {
          throw new Error(`Erro HTTP: ${response?.status || 'Resposta inválida'}`);
        }
        
        const realMessage = await response.json();
        console.log('📥 Resposta do servidor:', realMessage);
        
        // CORREÇÃO CRÍTICA: Adicionar mensagem diretamente no cache ao invés de invalidar
        queryClient.setQueryData(
          ['/api/conversations', conversationId, 'messages'],
          (oldMessages: any[] | undefined) => {
            if (!oldMessages) return [realMessage];
            
            // Verificar se mensagem já existe
            const exists = oldMessages.some(msg => msg.id === realMessage.id);
            if (exists) return oldMessages;
            
            // Adicionar nova mensagem ao final mantendo ordem cronológica
            return [...oldMessages, realMessage];
          }
        );
        
        // Também atualizar cache de mensagens infinitas se existir
        queryClient.setQueryData(
          ['/api/conversations', conversationId, 'messages', 'infinite'],
          (oldData: any) => {
            if (!oldData?.pages) return oldData;
            
            const updatedPages = [...oldData.pages];
            if (updatedPages[0]) {
              const firstPage = updatedPages[0];
              const exists = firstPage.messages.some((msg: any) => msg.id === realMessage.id);
              
              if (!exists) {
                const updatedMessages = [...firstPage.messages, realMessage];
                updatedPages[0] = { ...firstPage, messages: updatedMessages };
              }
            }
            
            return { ...oldData, pages: updatedPages };
          }
        );
        
        return true;
      } catch (error) {
        console.error('❌ Erro no fallback REST:', error);
        throw new Error(`Falha ao enviar mensagem: ${error.message}`);
      }

      // Z-API será processado pelo servidor automaticamente

      console.log('✅ Mensagem sincronizada via REST fallback');
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      notifyError('Erro ao enviar mensagem', error.message || 'Tente novamente.');
      return false;
    }
  };

  const sendFile = async (file: File, messageType: 'image' | 'document' | 'audio' = 'document') => {
    if (!file) return false;

    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversationId.toString());
      formData.append('messageType', messageType);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro no upload do arquivo');
      }

      const result = await response.json();
      
      // Invalidar queries para recarregar mensagens
      queryClient.invalidateQueries({
        queryKey: ['/api/conversations', conversationId, 'messages']
      });

      notifySuccess('Arquivo enviado', 'Seu arquivo foi enviado com sucesso.');
      return true;
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      notifyError('Erro ao enviar arquivo', 'Não foi possível enviar o arquivo. Tente novamente.');
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const sendLink = async (url: string, description?: string) => {
    try {
      const content = description ? `${description}\n${url}` : url;
      return await sendTextMessage(content);
    } catch (error) {
      console.error('Erro ao enviar link:', error);
      notifyError('Erro ao enviar link', 'Não foi possível enviar o link. Tente novamente.');
      return false;
    }
  };

  const sendAudio = async (audioBlob: Blob, duration: number) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.ogg');
      formData.append('conversationId', conversationId.toString());
      formData.append('duration', duration.toString());

      const response = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro no upload do áudio');
      }

      queryClient.invalidateQueries({
        queryKey: ['/api/conversations', conversationId, 'messages']
      });

      return true;
    } catch (error) {
      console.error('Erro ao enviar áudio:', error);
      notifyError('Erro ao enviar áudio', 'Não foi possível enviar o áudio. Tente novamente.');
      return false;
    }
  };

  return {
    isLoading: false,
    isUploading,
    sendTextMessage,
    sendFile,
    sendLink,
    sendAudio,
    uploadFile: sendFile, // Alias para compatibilidade
    shareLink: sendLink,  // Alias para compatibilidade
  };
}