import { StatusFilter, ChannelFilter } from '@/shared/components/filters';

interface ConversationFiltersProps {
  statusFilter: string;
  channelFilter: string;
  onStatusFilterChange: (value: string) => void;
  onChannelFilterChange: (value: string) => void;
  channels: any[];
}

export function ConversationFilters({
  statusFilter,
  channelFilter,
  onStatusFilterChange,
  onChannelFilterChange,
  channels
}: ConversationFiltersProps) {
  return (
    <div className="px-4 py-2 border-b border-gray-100">
      <div className="flex gap-2">
        <StatusFilter
          value={statusFilter}
          onValueChange={onStatusFilterChange}
          type="conversation"
          size="sm"
          statusOptions={[
            { value: "all", label: "Todos" },
            { value: "open", label: "Aberta" },
            { value: "pending", label: "Pendente" },
            { value: "resolved", label: "Resolvida" }
          ]}
          includeAll={false}
        />
        
        <ChannelFilter
          value={channelFilter}
          onValueChange={onChannelFilterChange}
          channels={channels}
          size="sm"
        />
      </div>
    </div>
  );
}