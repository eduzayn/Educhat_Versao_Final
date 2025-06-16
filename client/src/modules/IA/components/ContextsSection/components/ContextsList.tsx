import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../shared/ui/card';
import { Badge } from '../../../../../shared/ui/badge';
import { BookOpen } from 'lucide-react';
import { TrainingContext } from '../types';

interface ContextsListProps {
  contexts: TrainingContext[] | undefined;
  contextsLoading: boolean;
}

export function ContextsList({ contexts, contextsLoading }: ContextsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contextos de Treinamento</CardTitle>
        <CardDescription>
          Visualize todos os contextos configurados para a Prof. Ana
        </CardDescription>
      </CardHeader>
      <CardContent>
        {contextsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : contexts && contexts.length > 0 ? (
          <div className="space-y-4">
            {contexts.map((context) => (
              <div key={context.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{context.title}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{context.category}</Badge>
                    <Badge variant={context.isActive ? "default" : "secondary"}>
                      {context.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {context.content.substring(0, 150)}...
                </p>
                <div className="text-xs text-muted-foreground">
                  Criado em: {new Date(context.createdAt).toLocaleString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Nenhum contexto encontrado</h3>
            <p className="text-muted-foreground">
              Adicione contextos para treinar a Prof. Ana
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 