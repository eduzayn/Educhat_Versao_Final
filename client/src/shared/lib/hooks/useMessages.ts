import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CACHE_CONFIG } from '@/lib/cacheConfig';
import type { Message, InsertMessage } from '@shared/schema';

export function useMessages(conversationId: number | null, initialLimit = 15) {
  return useInfiniteQuery<Message[]>({
    queryKey: [`/api/conversations/${conversationId}/messages`],
    initialPageParam: undefined, // Parâmetro obrigatório para TanStack Query v5
    queryFn: async ({ pageParam }) => {
      // Primeira página: carregar as mais recentes (limit=15, order=desc)
      // Páginas seguintes: carregar mais antigas usando before=id (limit=10)
      
      let url = `/api/conversations/${conversationId}/messages`;
      const params = new URLSearchParams();
      
      if (pageParam === undefined) {
        // Primeira página: 15 mensagens mais recentes
        params.append('limit', initialLimit.toString());
        params.append('order', 'desc');
      } else {
        // Páginas seguintes: 10 mensagens anteriores à última carregada
        params.append('limit', '10');
        if (pageParam && typeof pageParam === 'number') {
          params.append('before', pageParam.toString());
        }
        params.append('order', 'desc');
      }
      
      url += '?' + params.toString();
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const messages = await response.json();
      return Array.isArray(messages) ? messages : [];
    },
    getNextPageParam: (lastPage, allPages) => {
      // Se não há mensagens na última página, não há mais páginas
      if (!lastPage || !Array.isArray(lastPage) || lastPage.length === 0) {
        return undefined;
      }
      
      // Se a última página retornou menos mensagens que o limite, chegamos ao fim
      const expectedLimit = allPages.length === 1 ? initialLimit : 10;
      if (lastPage.length < expectedLimit) {
        return undefined;
      }
      
      // Retornar o ID da mensagem mais antiga da última página para carregar anteriores
      const oldestMessage = lastPage[lastPage.length - 1];
      return oldestMessage?.id;
    },
    enabled: !!conversationId,
    ...CACHE_CONFIG.MESSAGES, // Usar configuração padronizada
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ conversationId, message, contact }: { 
      conversationId: number; 
      message: Omit<InsertMessage, 'conversationId'>;
      contact?: any;
    }) => {
      // Se for nota interna, NUNCA enviar via Z-API - apenas salvar localmente
      if (message.isInternalNote) {
        return await apiRequest('POST', `/api/conversations/${conversationId}/messages`, message);
      }

      const phoneNumber = contact?.phone;
      const shouldAttemptZapi = phoneNumber && phoneNumber.trim() && !message.isInternalNote;
      
      console.log('🔍 VERIFICAÇÃO COMPLETA DE ENVIO:', {
        hasContact: !!contact,
        hasPhone: !!phoneNumber,
        phone: phoneNumber,
        conversationId: conversationId,
        messageType: message.messageType,
        isInternalNote: message.isInternalNote,
        shouldAttemptZapi,
        content: message.content.substring(0, 30)
      });

      if (shouldAttemptZapi) {
        try {
          console.log('📤 ENVIANDO DIRETO VIA Z-API:', {
            phone: phoneNumber,
            content: message.content.substring(0, 50),
            conversationId: conversationId,
            endpoint: '/api/zapi/send-message'
          });
          
          const zapiResponse = await apiRequest("POST", "/api/zapi/send-message", {
            phone: phoneNumber,
            message: message.content,
            conversationId: conversationId
          });
          
          console.log('✅ SUCESSO Z-API:', {
            messageId: zapiResponse?.data?.messageId || zapiResponse?.data?.id,
            phone: phoneNumber,
            response: zapiResponse
          });
          
          // Z-API já salva mensagem com metadados completos - usar essa
          if (zapiResponse?.savedMessage) {
            console.log('🔄 USANDO MENSAGEM SALVA PELA Z-API COM METADADOS:', zapiResponse.savedMessage.id);
            return zapiResponse.savedMessage;
          }
          
          // Fallback: se Z-API não retornou savedMessage, salvar localmente
          return await apiRequest('POST', `/api/conversations/${conversationId}/messages`, message);
          
        } catch (error) {
          console.error('❌ FALHA Z-API - SALVANDO LOCALMENTE:', {
            phone: phoneNumber,
            error: error instanceof Error ? error.message : String(error),
            content: message.content.substring(0, 50)
          });
          
          // Fallback: salvar mensagem localmente se Z-API falhar
          return await apiRequest('POST', `/api/conversations/${conversationId}/messages`, message);
        }
      } else {
        const reason = !phoneNumber ? 'telefone não disponível' : 
                      !phoneNumber.trim() ? 'telefone vazio' : 
                      message.isInternalNote ? 'é nota interna' : 'motivo desconhecido';
        
        console.warn('⚠️ ENVIO APENAS LOCAL:', { 
          conversationId, 
          contactId: contact?.id,
          providedPhone: phoneNumber,
          reason
        });
        
        // Salvar apenas localmente
        return await apiRequest('POST', `/api/conversations/${conversationId}/messages`, message);
      }
    },
    onSuccess: (data, { conversationId }) => {
      // ATUALIZAÇÃO IMEDIATA: Inserir mensagem no cache para renderização instantânea
      queryClient.setQueryData([`/api/conversations/${conversationId}/messages`], (oldData: any) => {
        if (!oldData || !oldData.pages) {
          // Se não há dados, criar estrutura de páginas
          return {
            pages: [[data]],
            pageParams: [0]
          };
        }
        
        // Verificar se a mensagem já existe em qualquer página
        const messageExists = oldData.pages.some((page: any[]) => 
          page.some((msg: any) => msg.id === data.id)
        );
        
        if (messageExists) {
          return oldData;
        }
        
        // Adicionar à primeira página (mais recente) - ordenação cronológica
        const updatedPages = [...oldData.pages];
        updatedPages[0] = [...(updatedPages[0] || []), data].sort((a, b) => 
          new Date(a.sentAt || 0).getTime() - new Date(b.sentAt || 0).getTime()
        );
        
        return {
          ...oldData,
          pages: updatedPages
        };
      });
      
      // Invalidar cache em background para sincronização
      queryClient.invalidateQueries({ 
        queryKey: [`/api/conversations/${conversationId}/messages`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations'] 
      });
    },
  });
}
