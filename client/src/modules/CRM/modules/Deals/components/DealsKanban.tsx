import React from "react";
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';
import { MoreHorizontal, Building2 } from "lucide-react";
import type { Deal } from '@shared/schema';

interface Stage {
  id: string;
  name: string;
  color: string;
}

interface DealsKanbanProps {
  stages: { id: string; name: string; color: string }[];
  getDealsForStage: (stageId: string) => Deal[];
  dragOverStage: string | null;
  handleDragOver: (e: React.DragEvent, stageId: string) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, stageId: string) => void;
  handleDragStart: (e: React.DragEvent, deal: Deal) => void;
  handleEditDeal: (deal: Deal) => void;
  calculateStageValue: (stageDeals: Deal[]) => number;
  loadMoreDeals: () => void;
  hasNextPage: boolean;
  isLoadingMore: boolean;
}

export const DealsKanban: React.FC<DealsKanbanProps> = ({
  stages,
  getDealsForStage,
  dragOverStage,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragStart,
  handleEditDeal,
  calculateStageValue,
  loadMoreDeals,
  hasNextPage,
  isLoadingMore
}) => {
  // Hook para detectar scroll e carregar mais dados
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const { scrollHeight, scrollTop, clientHeight } = element;
    
    // Carregar mais quando estiver próximo do final (dentro de 100px)
    if (scrollHeight - scrollTop <= clientHeight + 100 && hasNextPage && !isLoadingMore) {
      loadMoreDeals();
    }
  };

  return (
    <div className="h-full p-6">
      <div className="flex gap-4 h-full overflow-x-auto pb-4" onScroll={handleScroll}>
        {(stages || []).map((stage) => {
          const stageDeals = getDealsForStage(stage.id);
          return (
            <div 
              key={stage.id} 
              className={`min-w-72 max-w-80 flex-1 rounded-lg p-4 flex flex-col transition-colors ${
                dragOverStage === stage.id ? 'bg-blue-50 dark:bg-blue-950' : 'bg-muted/30'
              }`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <h3 className="font-medium">{stage.name}</h3>
                  <Badge variant="secondary">{stageDeals.length}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  R$ {calculateStageValue(stageDeals).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              
              <div className="space-y-3 flex-1 overflow-y-auto min-h-[400px] max-h-[calc(100vh-300px)] pr-2">
                {stageDeals.map((deal) => (
                  <Card
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal)}
                    className="bg-white shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing hover:scale-[1.02] active:scale-95"
                  >
                    <CardContent className="p-2.5 space-y-1.5">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-medium leading-tight pr-2 truncate">
                          {deal.name}
                        </h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-60 hover:opacity-100">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditDeal(deal)}>
                              Editar negócio
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{deal.canalOrigem || "Sistema"}</span>
                      </div>
                      <p className="text-sm text-green-600 font-semibold">
                        R$ {(deal.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs py-0 px-1.5">
                          {deal.probability || 0}%
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate max-w-[60px]">{deal.owner || "N/A"}</span>
                      </div>
                      {deal.tags && Array.isArray(deal.tags) && deal.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 max-h-6 overflow-hidden">
                          {deal.tags.slice(0, 2).map((tag: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs py-0 px-1">
                              {tag}
                            </Badge>
                          ))}
                          {deal.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs py-0 px-1">
                              +{deal.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
        
        {/* Indicador de carregamento no final do Kanban */}
        {isLoadingMore && (
          <div className="flex-shrink-0 w-72 p-4 flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Carregando mais negócios...</div>
          </div>
        )}
        
        {/* Botão para carregar mais (fallback para dispositivos que não suportam scroll infinito) */}
        {hasNextPage && !isLoadingMore && (
          <div className="flex-shrink-0 w-72 p-4 flex items-center justify-center">
            <Button onClick={loadMoreDeals} variant="outline" size="sm">
              Carregar mais
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};