import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/ui/card';
import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { Textarea } from '../../../shared/ui/textarea';
import { Badge } from '../../../shared/ui/badge';
import { Plus, BookOpen, MessageSquare } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

interface TrainingContext {
  id: number;
  title: string;
  content: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

interface ContextsSectionProps {
  contexts: TrainingContext[] | undefined;
  contextsLoading: boolean;
}

export function ContextsSection({ contexts, contextsLoading }: ContextsSectionProps) {
  const [contextMode, setContextMode] = useState<'content' | 'qa'>('content');
  const [newContext, setNewContext] = useState({
    title: '',
    content: '',
    category: ''
  });
  const [newQA, setNewQA] = useState({
    question: '',
    answer: '',
    category: ''
  });

  const addContextMutation = useMutation({
    mutationFn: async (context: { title: string; content: string; category: string }) => {
      const response = await fetch('/api/ia/contexts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context)
      });
      if (!response.ok) throw new Error('Falha ao adicionar contexto');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ia/contexts'] });
      setNewContext({ title: '', content: '', category: '' });
      setNewQA({ question: '', answer: '', category: '' });
    }
  });

  const handleContextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contextMode === 'content') {
      if (!newContext.title || !newContext.content || !newContext.category) return;
      addContextMutation.mutate(newContext);
    } else {
      if (!newQA.question || !newQA.answer || !newQA.category) return;
      // Convert Q&A to context format
      const qaContext = {
        title: `FAQ: ${newQA.question}`,
        content: `Pergunta: ${newQA.question}\n\nResposta: ${newQA.answer}`,
        category: newQA.category
      };
      addContextMutation.mutate(qaContext);
    }
  };

  return (
    <div className="space-y-4">
      {/* Seção Educativa */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <BookOpen className="h-5 w-5" />
            Como Treinar a Prof. Ana
          </CardTitle>
          <CardDescription className="text-blue-700">
            Entenda como fornecer o melhor conteúdo para treinar a IA educacional
          </CardDescription>
        </CardHeader>
        <CardContent className="text-blue-800">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">📚 Conteúdo Livre</h4>
              <p className="text-sm mb-2">
                Use este modo para adicionar informações gerais, políticas, procedimentos ou conhecimento amplo. 
                Ideal para contextos que a IA deve conhecer e usar como referência.
              </p>
              <div className="text-xs bg-blue-100 p-2 rounded">
                <strong>Exemplo:</strong> "Nossa instituição oferece cursos de graduação e pós-graduação em diversas áreas. 
                Temos campus em São Paulo, Rio de Janeiro e Belo Horizonte."
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">❓ Pergunta & Resposta</h4>
              <p className="text-sm mb-2">
                Use este modo para treinar respostas específicas a perguntas frequentes. 
                Ideal para criar um FAQ inteligente e respostas padronizadas.
              </p>
              <div className="text-xs bg-blue-100 p-2 rounded">
                <strong>Exemplo:</strong><br/>
                <strong>Pergunta:</strong> "Qual o valor da mensalidade?"<br/>
                <strong>Resposta:</strong> "Nossas mensalidades variam de R$ 800 a R$ 1.500, dependendo do curso. Entre em contato para valores específicos."
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adicionar Novo Contexto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Contexto de Treinamento
          </CardTitle>
          <CardDescription>
            Adicione novos conhecimentos para a Prof. Ana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Seletor de Modo */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <Button
                type="button"
                variant={contextMode === 'content' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setContextMode('content')}
                className="flex-1"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Conteúdo Livre
              </Button>
              <Button
                type="button"
                variant={contextMode === 'qa' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setContextMode('qa')}
                className="flex-1"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Pergunta & Resposta
              </Button>
            </div>

            <form onSubmit={handleContextSubmit} className="space-y-4">
              {contextMode === 'content' ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Título do Contexto</label>
                      <Input
                        placeholder="Ex: Informações sobre Cursos"
                        value={newContext.title}
                        onChange={(e) => setNewContext({ ...newContext, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Categoria</label>
                      <select
                        value={newContext.category}
                        onChange={(e) => setNewContext({ ...newContext, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Selecione a categoria</option>
                        <option value="cursos">Cursos</option>
                        <option value="suporte">Suporte</option>
                        <option value="vendas">Vendas</option>
                        <option value="geral">Geral</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Conteúdo</label>
                    <Textarea
                      placeholder="Digite o conteúdo que a IA deve aprender..."
                      value={newContext.content}
                      onChange={(e) => setNewContext({ ...newContext, content: e.target.value })}
                      rows={6}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium">Categoria</label>
                    <select
                      value={newQA.category}
                      onChange={(e) => setNewQA({ ...newQA, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Selecione a categoria</option>
                      <option value="cursos">Cursos</option>
                      <option value="suporte">Suporte</option>
                      <option value="vendas">Vendas</option>
                      <option value="geral">Geral</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Pergunta</label>
                    <Input
                      placeholder="Ex: Qual é o valor da mensalidade?"
                      value={newQA.question}
                      onChange={(e) => setNewQA({ ...newQA, question: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Resposta</label>
                    <Textarea
                      placeholder="Digite a resposta que a IA deve dar..."
                      value={newQA.answer}
                      onChange={(e) => setNewQA({ ...newQA, answer: e.target.value })}
                      rows={4}
                    />
                  </div>
                </>
              )}

              <Button 
                type="submit" 
                disabled={addContextMutation.isPending}
                className="w-full"
              >
                {addContextMutation.isPending ? 'Adicionando...' : 'Adicionar Contexto'}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Contextos */}
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
    </div>
  );
}