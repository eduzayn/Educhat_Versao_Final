import { ConversationList } from './ConversationList';

interface SidebarConversationsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeConversationId?: number;
  onConversationSelect: (conversationId: number) => void;
}

export function SidebarConversations({ 
  searchTerm, 
  onSearchChange, 
  activeConversationId, 
  onConversationSelect 
}: SidebarConversationsProps) {
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header da sidebar */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Conversas</h2>
        
        {/* Campo de busca */}
        <div className="mt-3">
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Buscar conversas"
          />
        </div>
      </div>

      {/* Lista de conversas */}
      <div className="flex-1 overflow-hidden">
        <ConversationList
          searchTerm={searchTerm}
          activeConversationId={activeConversationId}
          onConversationSelect={onConversationSelect}
        />
      </div>
    </div>
  );
}