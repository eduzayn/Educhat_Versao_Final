import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { BackButton } from '@/shared/components/BackButton';
import { 
  Search, 
  Plus,
  AlertCircle,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { ZApiStatusIndicator } from '@/modules/Settings/ChannelsSettings/components/ZApiStatusIndicator';
import { formatDateForInput, parseInputDate } from '@/shared/lib/utils/formatters';

interface ConversationListHeaderProps {
  activeTab: string;
  searchTerm: string;
  isWhatsAppAvailable: boolean;
  periodFilter: string;
  customDateFrom?: Date;
  customDateTo?: Date;
  onTabChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onNewContactClick: () => void;
  onRefresh?: () => void;
  onPeriodFilterChange: (value: string) => void;
  onCustomDateChange: (from?: Date, to?: Date) => void;
}

export function ConversationListHeader({
  activeTab,
  searchTerm,
  isWhatsAppAvailable,
  periodFilter,
  customDateFrom,
  customDateTo,
  onTabChange,
  onSearchChange,
  onNewContactClick,
  onRefresh,
  onPeriodFilterChange,
  onCustomDateChange
}: ConversationListHeaderProps) {
  return (
    <div className="p-4 border-b border-gray-200">
      <BackButton to="/" label="Dashboard" className="mb-3" />
      
      {/* Header simplificado */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-semibold text-educhat-dark">Conversas</h1>
        <div className="flex items-center gap-2">
          <ZApiStatusIndicator />
          {onRefresh && (
            <Button 
              size="sm" 
              variant="outline"
              title="Atualizar conversas"
              onClick={onRefresh}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
          <Button 
            size="sm" 
            variant="outline"
            title="Novo contato"
            onClick={onNewContactClick}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Aviso quando Z-API não está conectada */}
      {!isWhatsAppAvailable && (
        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span className="text-xs text-amber-700">
              WhatsApp desconectado
            </span>
          </div>
        </div>
      )}
      
      {/* Busca */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Buscar conversas..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-9"
        />
      </div>
      
      {/* Filtro de Período */}
      <Select value={periodFilter} onValueChange={onPeriodFilterChange}>
        <SelectTrigger className="h-8 text-xs">
          <Calendar className="w-3 h-3 mr-1" />
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Qualquer período</SelectItem>
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="yesterday">Ontem</SelectItem>
          <SelectItem value="last7days">Últimos 7 dias</SelectItem>
          <SelectItem value="last30days">Últimos 30 dias</SelectItem>
          <SelectItem value="custom">Período personalizado</SelectItem>
        </SelectContent>
      </Select>

      {/* Seletor de data personalizado */}
      {periodFilter === 'custom' && (
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">De:</label>
              <input
                type="date"
                value={customDateFrom ? formatDateForInput(customDateFrom) : ''}
                onChange={(e) => onCustomDateChange(parseInputDate(e.target.value), customDateTo)}
                className="h-7 text-xs border border-gray-200 rounded px-2"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">Até:</label>
              <input
                type="date"
                value={customDateTo ? formatDateForInput(customDateTo) : ''}
                onChange={(e) => onCustomDateChange(customDateFrom, parseInputDate(e.target.value))}
                className="h-7 text-xs border border-gray-200 rounded px-2"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}