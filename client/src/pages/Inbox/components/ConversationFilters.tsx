import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Filter } from 'lucide-react';

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
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="h-8 text-xs">
            <Filter className="w-3 h-3 mr-1" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="open">Aberta</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="resolved">Resolvida</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={channelFilter} onValueChange={onChannelFilterChange}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os canais</SelectItem>
            <SelectItem value="whatsapp">WhatsApp (Todos)</SelectItem>
            {channels.filter(c => c.type === 'whatsapp' && c.isActive).map(channel => (
              <SelectItem key={channel.id} value={`whatsapp-${channel.id}`}>
                WhatsApp {channel.name}
              </SelectItem>
            ))}
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}