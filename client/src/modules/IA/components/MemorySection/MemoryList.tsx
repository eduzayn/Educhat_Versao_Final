import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import { Brain } from 'lucide-react';
import { AIMemory } from './types';
import { MemoryListItem } from './MemoryListItem';

interface MemoryListProps {
  memoriesData: any;
  memoriesLoading: boolean;
}

export function MemoryList({ memoriesData, memoriesLoading }: MemoryListProps) {
  return (
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
              <MemoryListItem key={memory.id} memory={memory} />
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
  );
} 