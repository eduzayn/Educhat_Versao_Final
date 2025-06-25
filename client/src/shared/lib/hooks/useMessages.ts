import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Message, InsertMessage } from '@shared/schema';

export function useMessages(conversationId: number | null, initialLimit = 15) {
  return useInfiniteQuery<Message[]>({
    queryKey: [`/api/conversations/${conversationId}/messages`],
    queryFn: async ({ pageParam = 0 }) => {
      const limit = pageParam === 0 ? initialLimit : 10; // Primeira página: 15, demais: 10
      const response = await fetch(`/api/conversations/${conversationId}/messages?limit=${limit}&offset=${pageParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const messages = await response.json();
      return messages;
    },
    getNextPageParam: (lastPage, allPages) => {
      // Verificação de segurança para evitar erros
      if (!lastPage || !Array.isArray(lastPage) || !Array.isArray(allPages)) {
        return undefined;
      }
      
      // Se a última página retornou menos que o limite, não há mais páginas
      const pageLimit = allPages.length === 1 ? initialLimit : 10;
      if (lastPage.length < pageLimit) return undefined;
      
      // Calcular offset para próxima página
      const totalMessages = allPages.reduce((acc, page) => {
        return acc + (Array.isArray(page) ? page.length : 0);
      }, 0);
      return totalMessages;
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
      // Se for nota interna, NUNCA enviar via Z-API - apenas salvar localmente
      if (message.isInternalNote) {
        console.log('📝 Nota interna - salvando apenas localmente, NÃO enviando via Z-API');
        const response = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, message);
        return response.json();
      }

      // PRIMEIRO: Sempre salvar mensagem no banco local para aparecer imediatamente no chat
      console.log('💾 Salvando mensagem no banco local primeiro');
      const localResponse = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, message);
      const savedMessage = await localResponse.json();

      // SEGUNDO: Se tiver telefone, enviar via Z-API (mensagem já está salva e visível)
      if (contact?.phone) {
        console.log('📤 Enviando mensagem via Z-API:', {
          phone: contact.phone,
          message: message.content,
          conversationId
        });
        
        try {
          const zapiResponse = await apiRequest("POST", "/api/zapi/send-message", {
            phone: contact.phone,
            message: message.content,
            conversationId: conversationId
          });
          console.log('✅ Mensagem enviada via Z-API:', zapiResponse);
        } catch (error) {
          console.error('❌ Erro ao enviar via Z-API:', error);
          // Mensagem já está salva localmente, então usuário vê a mensagem mesmo se Z-API falhar
        }
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
