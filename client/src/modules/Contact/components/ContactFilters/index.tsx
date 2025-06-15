import { useMemo } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Search, Filter, Download, RefreshCw, Camera } from "lucide-react";

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
  syncingContacts,
}: ContactFiltersProps) {
  const isExportDisabled = useMemo(
    () => selectedContacts.length === 0,
    [selectedContacts],
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* 🔍 Busca e Filtro */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
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
            </SelectContent>
          </Select>
        </div>

        {/* ⚙️ Ações e Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="text-sm text-gray-600">
            WhatsApp:{" "}
            <span
              className={
                isWhatsAppAvailable ? "text-green-600" : "text-red-500"
              }
            >
              {isWhatsAppAvailable ? "Conectado" : "Desconectado"}
            </span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {isWhatsAppAvailable && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSyncContacts}
                  disabled={syncingContacts}
                  className="text-xs"
                >
                  <RefreshCw
                    className={`w-3 h-3 mr-1 ${syncingContacts ? "animate-spin" : ""}`}
                  />
                  {syncingContacts
                    ? "Sincronizando..."
                    : "Sincronizar WhatsApp"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onUpdateAllPhotos}
                  disabled={updatingAllPhotos}
                  className="text-xs"
                >
                  <Camera
                    className={`w-3 h-3 mr-1 ${updatingAllPhotos ? "animate-spin" : ""}`}
                  />
                  {updatingAllPhotos ? "Atualizando..." : "Atualizar Fotos"}
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onExportContacts}
              disabled={isExportDisabled}
              className="text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Exportar ({selectedContacts.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}