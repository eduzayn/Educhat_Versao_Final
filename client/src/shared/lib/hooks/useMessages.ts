import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Message, InsertMessage } from '@shared/schema';

export function useMessages(conversationId: number | null, initialLimit = 15) {
  return useInfiniteQuery<Message[]>({
    queryKey: [`/api/conversations/${conversationId}/messages`],
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
        params.append('before', pageParam.toString());
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
    refetchInterval: false,
    refetchIntervalInBackground: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
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
      console.log('🔥 ENTRADA useSendMessage:', { conversationId, message, contact });
      // Se for nota interna, NUNCA enviar via Z-API - apenas salvar localmente
      if (message.isInternalNote) {
        console.log('📝 Nota interna - salvando apenas localmente, NÃO enviando via Z-API');
        const response = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, message);
        return response;
      }

      // PRIMEIRO: Sempre salvar mensagem no banco local para aparecer imediatamente no chat
      console.log('💾 Salvando mensagem no banco local primeiro');
      const savedMessage = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, message);

      // SEGUNDO: Se tiver telefone, enviar via Z-API (mensagem já está salva e visível)
      console.log('🔍 VERIFICANDO ENVIO Z-API:', {
        hasContact: !!contact,
        contactPhone: contact?.phone,
        shouldSendZapi: !!(contact?.phone),
        messageContent: message.content,
        conversationId
      });
      
      if (contact?.phone) {
        console.log('📤 Enviando mensagem via Z-API:', {
          phone: contact.phone,
          message: message.content,
          conversationId
        });
        
        try {
          console.log('📤 Iniciando envio via Z-API:', {
            endpoint: '/api/zapi/send-message',
            phone: contact.phone,
            message: message.content,
            conversationId: conversationId
          });
          
          const zapiResponse = await apiRequest("POST", "/api/zapi/send-message", {
            phone: contact.phone,
            message: message.content,
            conversationId: conversationId
          });
          
          console.log('✅ Mensagem enviada via Z-API com sucesso:', zapiResponse);
        } catch (error) {
          console.error('❌ FALHA CRÍTICA ao enviar via Z-API:', {
            error: error,
            message: error instanceof Error ? error.message : 'Erro desconhecido',
            stack: error instanceof Error ? error.stack : undefined,
            phone: contact.phone,
            messageContent: message.content
          });
          // Mensagem já está salva localmente, então usuário vê a mensagem mesmo se Z-API falhar
        }
      } else {
        console.log('❌ NÃO ENVIANDO via Z-API:', {
          reason: !contact ? 'Sem contato' : !contact.phone ? 'Sem telefone' : 'Condição desconhecida',
          contact: contact,
          phone: contact?.phone
        });
      }

      return savedMessage;
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
