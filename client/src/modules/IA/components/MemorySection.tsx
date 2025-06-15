import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/ui/card';
import { Badge } from '../../../shared/ui/badge';
import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { Brain, MessageSquare, Target, Users } from 'lucide-react';

interface AIMemory {
  id: number;
  conversationId: number;
  contactId: number;
  memoryType: string;
  key: string;
  value: string;
  confidence: number;
  source: string;
  createdAt: string;
  updatedAt: string;
  contactName?: string;
}

interface MemoryStats {
  byType: Record<string, number>;
  total: number;
}

interface MemorySectionProps {
  memoryStats: MemoryStats | undefined;
  memoriesData: any;
  memoriesLoading: boolean;
  memoryStatsLoading: boolean;
  memoryFilter: string;
  selectedConversation: string;
  setMemoryFilter: (filter: string) => void;
  setSelectedConversation: (conversation: string) => void;
}

export function MemorySection({
  memoryStats,
  memoriesData,
  memoriesLoading,
  memoryStatsLoading,
  memoryFilter,
  selectedConversation,
  setMemoryFilter,
  setSelectedConversation
}: MemorySectionProps) {
  return (
    <div className="space-y-4">
      {/* Estatísticas de Memória */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Memórias</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memoryStats?.total || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Info Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memoryStats?.byType?.user_info || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contextos</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memoryStats?.byType?.context || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preferências</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memoryStats?.byType?.preferences || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
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
                onChange={(e) => setSelectedConversation(e.target.value)}
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

      {/* Lista de Memórias */}
      <Card>
        <CardHeader>
          <CardTitle>Memórias Contextuais da Prof. Ana</CardTitle>
          <CardDescription>
            Visualize todas as informações que a IA está salvando sobre usuários e contextos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {memoriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : memoriesData?.memories?.length > 0 ? (
            <div className="space-y-4">
              {memoriesData.memories.map((memory: AIMemory) => (
                <div key={memory.id} className="border rounded-lg p-4 space-y-2">
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
              ))}
              
              {memoriesData.pagination && (
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    Página {memoriesData.pagination.page} de {memoriesData.pagination.pages} 
                    ({memoriesData.pagination.total} total)
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhuma memória encontrada</h3>
              <p className="text-muted-foreground">
                A Prof. Ana ainda não salvou memórias com os filtros selecionados
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}