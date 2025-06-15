import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import ConversationListHeader from '../ConversationListHeader';
import ConversationItem from '../ConversationItem';
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
  onRefresh?: () => void;
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
  onRefresh,
  onNewContact
}: ConversationListVirtualizedProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);
  const scrollRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<FixedSizeList>(null);
  const previousScrollTop = useRef<number>(0);
  const scrollThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingMoreRef = useRef<boolean>(false);

  // Filtrar conversas
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

  // Conversas visíveis (para paginação virtual)
  const visibleConversations = useMemo(() => {
    return filteredConversations.slice(0, visibleCount);
  }, [filteredConversations, visibleCount]);

  // Manter posição do scroll ao carregar mais conversas
  const handleLoadMore = useCallback(() => {
    if (listRef.current) {
      previousScrollTop.current = (listRef.current as any).state?.scrollOffset || 0;
    }
    
    const newCount = Math.min(visibleCount + 50, filteredConversations.length);
    setVisibleCount(newCount);
    
    // Restaurar posição do scroll após carregamento
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTo(previousScrollTop.current);
      }
    }, 0);

    if (newCount >= filteredConversations.length && hasNextPage) {
      onLoadMore();
    }
  }, [visibleCount, filteredConversations.length, hasNextPage, onLoadMore]);

  // Detectar scroll para carregar mais
  const handleScroll = useCallback(({ scrollTop, scrollHeight, clientHeight }: any) => {
    // Limpar throttle anterior se existir
    if (scrollThrottleRef.current) {
      clearTimeout(scrollThrottleRef.current);
    }
    
    scrollThrottleRef.current = setTimeout(() => {
      const scrollOffset = scrollTop;
      const scrollLimit = scrollHeight - clientHeight;
      const isNearBottom = scrollOffset >= scrollLimit - 50;
      
      // Verificar se deve carregar mais conteúdo
      if (isNearBottom && !isLoading && !isLoadingMoreRef.current && scrollOffset > 0) {
        isLoadingMoreRef.current = true;
        
        if (visibleCount < filteredConversations.length) {
          handleLoadMore();
        } else if (hasNextPage) {
          onLoadMore();
        }
        
        // Reset do flag após um breve delay
        setTimeout(() => {
          isLoadingMoreRef.current = false;
        }, 1000);
      }
    }, 200);
  }, [isLoading, visibleCount, filteredConversations.length, hasNextPage, handleLoadMore, onLoadMore]);

  // Reset da contagem visível quando filtros mudam
  useEffect(() => {
    setVisibleCount(50);
  }, [searchTerm, statusFilter, channelFilter]);

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
  const totalHeight = Math.min(visibleConversations.length * itemHeight, 600); // Máximo 600px

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
        onRefresh={onRefresh}
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
      {!hasNextPage && visibleConversations.length > 0 && visibleCount >= filteredConversations.length && (
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