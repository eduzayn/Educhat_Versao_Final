import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Input } from '@/shared/ui/input';
import { BackButton } from '@/shared/components/BackButton';
import { 
  Search, 
  Plus,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { ZApiStatusIndicator } from '@/modules/Settings/ChannelsSettings/components/ZApiStatusIndicator';

interface ConversationListHeaderProps {
  activeTab: string;
  searchTerm: string;
  isWhatsAppAvailable: boolean;
  onTabChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onNewContactClick: () => void;
  onRefresh?: () => void;
}

export function ConversationListHeader({
  activeTab,
  searchTerm,
  isWhatsAppAvailable,
  onTabChange,
  onSearchChange,
  onNewContactClick,
  onRefresh
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
      
      {/* Abas simplificadas */}
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-3 h-8">
          <TabsTrigger value="inbox" className="text-xs">Entrada</TabsTrigger>
          <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
          <TabsTrigger value="resolved" className="text-xs">Resolvidas</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}