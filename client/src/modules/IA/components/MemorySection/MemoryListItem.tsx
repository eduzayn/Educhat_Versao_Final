import { Badge } from '@/shared/ui/badge';
import { AIMemory } from './types';

export function MemoryListItem({ memory }: { memory: AIMemory }) {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={
            memory.memoryType === 'user_info' ? 'default' :
            memory.memoryType === 'preferences' ? 'secondary' :
            memory.memoryType === 'context' ? 'outline' : 'destructive'
          }>
            {memory.memoryType}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Conversa {memory.conversationId}
          </span>
          {memory.contactName && (
            <span className="text-sm font-medium">
              - {memory.contactName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {memory.confidence}% confiança
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(memory.updatedAt).toLocaleString('pt-BR')}
          </span>
        </div>
      </div>
      <div className="grid gap-2">
        <div>
          <span className="text-sm font-medium">Chave:</span>
          <span className="text-sm ml-2">{memory.key}</span>
        </div>
        <div>
          <span className="text-sm font-medium">Valor:</span>
          <span className="text-sm ml-2">{memory.value}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Origem: {memory.source} | Criado: {new Date(memory.createdAt).toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  );
} 