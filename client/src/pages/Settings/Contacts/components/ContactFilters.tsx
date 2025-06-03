import { useState } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Input } from '@/shared/ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Search, Filter, Download, RefreshCw, Camera } from 'lucide-react';
import { ZApiStatusIndicator } from '@/modules/Settings/ChannelsSettings/components/ZApiStatusIndicator';

interface ContactFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedContacts: number[];
  isWhatsAppAvailable: boolean;
  onSyncContacts: () => void;
  onUpdateAllPhotos: () => void;
  onExportContacts: () => void;
  updatingAllPhotos: boolean;
  syncingContacts: boolean;
}

export function ContactFilters({
  searchQuery,
  onSearchChange,
  selectedContacts,
  isWhatsAppAvailable,
  onSyncContacts,
  onUpdateAllPhotos,
  onExportContacts,
  updatingAllPhotos,
  syncingContacts
}: ContactFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Busca e filtros */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar contatos..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select defaultValue="todos">
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="cliente">Cliente</SelectItem>
              <SelectItem value="parceiro">Parceiro</SelectItem>
              <SelectItem value="fornecedor">Fornecedor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ações e status */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <ZApiStatusIndicator />
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSyncContacts}
              disabled={!isWhatsAppAvailable || syncingContacts}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncingContacts ? 'animate-spin' : ''}`} />
              {syncingContacts ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onUpdateAllPhotos}
              disabled={!isWhatsAppAvailable || updatingAllPhotos}
              className="flex items-center gap-2"
            >
              <Camera className={`w-4 h-4 ${updatingAllPhotos ? 'animate-spin' : ''}`} />
              {updatingAllPhotos ? 'Atualizando...' : 'Atualizar Fotos'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onExportContacts}
              disabled={selectedContacts.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar ({selectedContacts.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}