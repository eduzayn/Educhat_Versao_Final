import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

interface MemoryFiltersProps {
  memoryFilter: string;
  setMemoryFilter: (filter: string) => void;
  selectedConversation: string;
  setSelectedConversation: (conversation: string) => void;
}

export function MemoryFilters({ memoryFilter, setMemoryFilter, selectedConversation, setSelectedConversation }: MemoryFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros de Memória</CardTitle>
        <CardDescription>
          Filtre as memórias contextuais por tipo ou conversa específica
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium">Tipo de Memória</label>
            <select
              value={memoryFilter}
              onChange={(e) => setMemoryFilter(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todos os tipos</option>
              <option value="user_info">Informações do Usuário</option>
              <option value="preferences">Preferências</option>
              <option value="context">Contexto</option>
              <option value="history">Histórico</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">ID da Conversa</label>
            <Input
              placeholder="Ex: 2017"
              value={selectedConversation}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedConversation(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setMemoryFilter('');
                setSelectedConversation('');
              }}
              className="w-full"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 