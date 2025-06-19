import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { FixedSizeList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import ConversationListHeader from "@/modules/Inbox/components/ConversationListHeader";
import ConversationItem from "@/modules/Inbox/components/ConversationItem";
import type { ConversationWithContact } from "@shared/schema";

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
  teamFilter?: string;
  setTeamFilter?: (team: string) => void;
  periodFilter?: string;
  setPeriodFilter?: (period: string) => void;
  agentFilter?: string;
  setAgentFilter?: (agent: string) => void;
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
  teamFilter = 'all',
  setTeamFilter = () => {},
  periodFilter = 'all',
  setPeriodFilter = () => {},
  agentFilter = 'all',
  setAgentFilter = () => {},
  activeConversation,
  onSelectConversation,
  onLoadMore,
  channels = [],
  onNewContact,
}: ConversationListVirtualizedProps) {
  const [showFilters, setShowFilters] = useState(false);
  const listRef = useRef<FixedSizeList>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef<boolean>(false);

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      // Filtro de busca
      const matchesSearch =
        !searchTerm ||
        conversation.contact.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        conversation.contact.phone?.includes(searchTerm) ||
        conversation.messages?.[0]?.content
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Filtro de status
      const matchesStatus =
        statusFilter === "all" || conversation.status === statusFilter;
      
      // Filtro de canal
      const matchesChannel =
        channelFilter === "all" ||
        conversation.channelInfo?.type === channelFilter;

      // Filtro de equipe
      const matchesTeam = teamFilter === "all" || 
        (conversation.assignedTeamId && conversation.assignedTeamId.toString() === teamFilter);

      // Filtro de período
      const matchesPeriod = (() => {
        if (periodFilter === "all") return true;
        
        const now = new Date();
        const dateValue = conversation.updatedAt || conversation.createdAt;
        if (!dateValue) return true;
        const conversationDate = new Date(dateValue);
        
        switch (periodFilter) {
          case "today":
            return conversationDate.toDateString() === now.toDateString();
          case "yesterday":
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            return conversationDate.toDateString() === yesterday.toDateString();
          case "this_week":
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            return conversationDate >= weekStart;
          case "last_week":
            const lastWeekStart = new Date(now);
            lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
            const lastWeekEnd = new Date(lastWeekStart);
            lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
            return conversationDate >= lastWeekStart && conversationDate <= lastWeekEnd;
          case "this_month":
            return conversationDate.getMonth() === now.getMonth() && 
                   conversationDate.getFullYear() === now.getFullYear();
          case "last_month":
            const lastMonth = new Date(now);
            lastMonth.setMonth(now.getMonth() - 1);
            return conversationDate.getMonth() === lastMonth.getMonth() && 
                   conversationDate.getFullYear() === lastMonth.getFullYear();
          default:
            return true;
        }
      })();

      // Filtro de agente
      const matchesAgent = agentFilter === "all" || 
        (conversation.assignedUserId && conversation.assignedUserId.toString() === agentFilter);

      return matchesSearch && matchesStatus && matchesChannel && 
             matchesTeam && matchesPeriod && matchesAgent;
    });
  }, [conversations, searchTerm, statusFilter, channelFilter, teamFilter, periodFilter, agentFilter]);

  const visibleConversations = filteredConversations;

  useEffect(() => {
    const container = outerRef.current;
    if (!container) return;

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const threshold = 200;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < threshold;

      if (
        isNearBottom &&
        !isLoading &&
        hasNextPage &&
        !isLoadingMoreRef.current
      ) {
        isLoadingMoreRef.current = true;
        onLoadMore();
        setTimeout(() => {
          isLoadingMoreRef.current = false;
        }, 2000);
      }
    };

    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, [hasNextPage, isLoading, onLoadMore]);

  const ItemRenderer = useCallback(
    ({ index, style }: { index: number; style: any }) => {
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
    },
    [visibleConversations, activeConversation, onSelectConversation],
  );

  const itemHeight = 88;

  return (
    <div className="flex flex-col h-full bg-white">
      <ConversationListHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        channelFilter={channelFilter}
        setChannelFilter={setChannelFilter}
        teamFilter={teamFilter}
        setTeamFilter={setTeamFilter}
        periodFilter={periodFilter}
        setPeriodFilter={setPeriodFilter}
        agentFilter={agentFilter}
        setAgentFilter={setAgentFilter}
        channels={channels}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        onNewContact={onNewContact}
      />

      <div className="flex-1 overflow-hidden">
        {visibleConversations.length > 0 ? (
          <AutoSizer>
            {({ height, width }: { height: number; width: number }) => (
              <FixedSizeList
                ref={listRef}
                outerRef={outerRef}
                height={height}
                width={width}
                itemCount={visibleConversations.length}
                itemSize={itemHeight}
                overscanCount={5}
              >
                {ItemRenderer}
              </FixedSizeList>
            )}
          </AutoSizer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isLoading
                ? "Carregando conversas..."
                : "Nenhuma conversa encontrada"}
            </h3>
            <p className="text-gray-500 max-w-sm">
              {isLoading
                ? "Aguarde enquanto carregamos suas conversas."
                : searchTerm
                  ? "Tente ajustar os filtros ou termo de busca."
                  : "Quando você receber mensagens, elas aparecerão aqui."}
            </p>
          </div>
        )}
      </div>

      {isLoading && visibleConversations.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-educhat-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600">
              Carregando mais conversas...
            </span>
          </div>
        </div>
      )}

      {!hasNextPage && visibleConversations.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
          <span className="text-sm text-gray-500">
            {filteredConversations.length === 1
              ? "1 conversa carregada"
              : `${filteredConversations.length} conversas carregadas`}
          </span>
        </div>
      )}
    </div>
  );
}

export default ConversationListVirtualized;
