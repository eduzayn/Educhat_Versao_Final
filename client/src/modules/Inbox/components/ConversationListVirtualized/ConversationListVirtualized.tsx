import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import ConversationListHeader from '@/modules/Inbox/components/ConversationListHeader';
import ConversationItem from '@/modules/Inbox/components/ConversationItem';
import type { ConversationWithContact } from '@shared/schema';

interface ConversationListVirtualizedProps {
  conversations: ConversationWithContact[];
  isLoading: boolean;
  hasNextPage: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  channelFilter: string;
  setChannelFilter: (channel: string) => void;
  activeConversation: ConversationWithContact | null;
  onSelectConversation: (conversation: ConversationWithContact) => void;
  onLoadMore: () => void;
  channels: any[];
  onNewContact?: () => void;
}

export function ConversationListVirtualized({
  conversations,
  isLoading,
  hasNextPage,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  channelFilter,
  setChannelFilter,
  activeConversation,
  onSelectConversation,
  onLoadMore,
  channels = [],
  onNewContact
}: ConversationListVirtualizedProps) {
  const [showFilters, setShowFilters] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<FixedSizeList>(null);
  const scrollThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingMoreRef = useRef<boolean>(false);

  // Filtrar conversas (sem limitação de visibilidade)
  const filteredConversations = useMemo(() => {
    return conversations.filter(conversation => {
      const matchesSearch = !searchTerm || 
        conversation.contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conversation.contact.phone?.includes(searchTerm) ||
        conversation.messages?.[0]?.content?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || conversation.status === statusFilter;
      const matchesChannel = channelFilter === 'all' || conversation.channelInfo?.type === channelFilter;
      
      return matchesSearch && matchesStatus && matchesChannel;
    });
  }, [conversations, searchTerm, statusFilter, channelFilter]);

  // Usar todas as conversas filtradas sem limitação
  const visibleConversations = filteredConversations;

  // Detectar scroll para carregar mais conversas do servidor
  const handleScroll = useCallback(({ scrollTop, scrollHeight, clientHeight }: any) => {
    // Limpar throttle anterior se existir
    if (scrollThrottleRef.current) {
      clearTimeout(scrollThrottleRef.current);
    }
    
    scrollThrottleRef.current = setTimeout(() => {
      const scrollOffset = scrollTop;
      const scrollLimit = scrollHeight - clientHeight;
      
      // Melhorar detecção de fim da lista - verificar se está nos últimos 200px
      const threshold = 200;
      const isNearBottom = scrollLimit > 0 && (scrollLimit - scrollOffset) <= threshold;
      
      console.log('🔄 Scroll detectado:', { 
        scrollTop, 
        scrollHeight, 
        clientHeight,
        scrollOffset, 
        scrollLimit, 
        distanceFromBottom: scrollLimit - scrollOffset,
        isNearBottom, 
        hasNextPage, 
        isLoading, 
        conversationsCount: visibleConversations.length,
        threshold
      });
      
      // Verificar se deve carregar mais conversas do servidor
      if (isNearBottom && !isLoading && hasNextPage && !isLoadingMoreRef.current) {
        isLoadingMoreRef.current = true;
        
        console.log('🌐 Carregando próxima página do servidor...');
        
        // Carregar próxima página do servidor
        onLoadMore();
        
        // Reset do flag após delay
        setTimeout(() => {
          isLoadingMoreRef.current = false;
        }, 2000); // Aumentar delay para evitar múltiplas chamadas
      }
    }, 100); // Reduzir throttle para responsividade
  }, [isLoading, hasNextPage, onLoadMore, visibleConversations.length]);

  // Cleanup dos timers quando componente for desmontado
  useEffect(() => {
    return () => {
      if (scrollThrottleRef.current) {
        clearTimeout(scrollThrottleRef.current);
      }
    };
  }, []);

  // Item renderer para virtualização
  const ItemRenderer = useCallback(({ index, style }: { index: number; style: any }) => {
    const conversation = visibleConversations[index];
    
    if (!conversation) {
      return <div style={style} />;
    }

    return (
      <div style={style}>
        <ConversationItem
          conversation={conversation}
          isActive={activeConversation?.id === conversation.id}
          onClick={onSelectConversation}
        />
      </div>
    );
  }, [visibleConversations, activeConversation, onSelectConversation]);

  // Calcular altura total da lista
  const itemHeight = 88; // Altura aproximada de cada item de conversa

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header com filtros */}
      <ConversationListHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        channelFilter={channelFilter}
        setChannelFilter={setChannelFilter}
        channels={channels}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        onNewContact={onNewContact}
      />

      {/* Lista virtualizada de conversas */}
      <div className="flex-1 overflow-hidden">
        {visibleConversations.length > 0 ? (
          <AutoSizer>
            {({ height, width }: { height: number; width: number }) => (
              <FixedSizeList
                ref={listRef}
                height={height}
                width={width}
                itemCount={visibleConversations.length}
                itemSize={itemHeight}
                onScroll={handleScroll}
                overscanCount={5} // Renderizar 5 itens extras para melhor performance
              >
                {ItemRenderer}
              </FixedSizeList>
            )}
          </AutoSizer>
        ) : (
          // Estado vazio
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isLoading ? 'Carregando conversas...' : 'Nenhuma conversa encontrada'}
            </h3>
            <p className="text-gray-500 max-w-sm">
              {isLoading 
                ? 'Aguarde enquanto carregamos suas conversas.' 
                : searchTerm 
                  ? 'Tente ajustar os filtros ou termo de busca.'
                  : 'Quando você receber mensagens, elas aparecerão aqui.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Indicador de carregamento */}
      {isLoading && visibleConversations.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-educhat-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600">Carregando mais conversas...</span>
          </div>
        </div>
      )}

      {/* Indicador de fim da lista */}
      {!hasNextPage && visibleConversations.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
          <span className="text-sm text-gray-500">
            {filteredConversations.length === 1 
              ? '1 conversa carregada' 
              : `${filteredConversations.length} conversas carregadas`
            }
          </span>
        </div>
      )}
    </div>
  );
}

export default ConversationListVirtualized;