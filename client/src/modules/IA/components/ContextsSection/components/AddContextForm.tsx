import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../shared/ui/card';
import { Button } from '../../../../../shared/ui/button';
import { Input } from '../../../../../shared/ui/input';
import { Textarea } from '../../../../../shared/ui/textarea';
import { Plus, BookOpen, MessageSquare, Globe } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { WebContextCapture } from '../../WebContextCapture';
import { ContextMode, NewContext, NewQA } from '../types';

export function AddContextForm() {
  const [contextMode, setContextMode] = useState<ContextMode>('content');
  const [newContext, setNewContext] = useState<NewContext>({
    title: '',
    content: '',
    category: ''
  });
  const [newQA, setNewQA] = useState<NewQA>({
    question: '',
    answer: '',
    category: ''
  });

  const addContextMutation = useMutation({
    mutationFn: async (context: NewContext) => {
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
            <Button
              type="button"
              variant={contextMode === 'web' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setContextMode('web')}
              className="flex-1"
            >
              <Globe className="h-4 w-4 mr-2" />
              Captura Web
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
            ) : contextMode === 'qa' ? (
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
            ) : contextMode === 'web' ? (
              <WebContextCapture 
                onContextAdded={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/ia/contexts'] });
                }}
              />
            ) : null}

            {contextMode !== 'web' && (
              <Button 
                type="submit" 
                disabled={addContextMutation.isPending}
                className="w-full"
              >
                {addContextMutation.isPending ? 'Adicionando...' : 'Adicionar Contexto'}
              </Button>
            )}
          </form>
        </div>
      </CardContent>
    </Card>
  );
} 