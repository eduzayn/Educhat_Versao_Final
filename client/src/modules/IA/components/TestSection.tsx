import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/ui/card';
import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { Badge } from '../../../shared/ui/badge';
import { MessageCircle, Send, Brain } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

interface TestSectionProps {
  testMessage: string;
  setTestMessage: (message: string) => void;
}

export function TestSection({ testMessage, setTestMessage }: TestSectionProps) {
  const [testResult, setTestResult] = useState<any>(null);

  const testAIMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/ia/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      if (!response.ok) throw new Error('Falha no teste da IA');
      return response.json();
    },
    onSuccess: (data) => {
      setTestResult(data);
      queryClient.invalidateQueries({ queryKey: ['/api/ia/logs'] });
    }
  });

  const handleTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMessage.trim()) return;
    testAIMutation.mutate(testMessage);
    setTestMessage('');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Teste da Prof. Ana
          </CardTitle>
          <CardDescription>
            Teste o comportamento da IA com diferentes tipos de mensagens e cenários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTestSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Digite uma mensagem para testar a IA..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={testAIMutation.isPending || !testMessage.trim()}
              >
                {testAIMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>

          {testResult && (
            <div className="mt-6 space-y-4">
              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Mensagem Enviada</span>
                </div>
                <p className="text-sm">{testResult.originalMessage}</p>
              </div>

              <div className="border rounded-lg p-4 bg-purple-50">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Resposta da Prof. Ana</span>
                </div>
                <p className="text-sm">{testResult.response}</p>
              </div>

              {testResult.classification && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Classificação</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Intenção:</span>
                        <Badge variant="outline">{testResult.classification.intent}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Sentimento:</span>
                        <Badge variant={
                          testResult.classification.sentiment === 'positive' ? 'default' :
                          testResult.classification.sentiment === 'negative' ? 'destructive' : 'secondary'
                        }>
                          {testResult.classification.sentiment}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Confiança:</span>
                        <Badge variant="outline">{testResult.classification.confidence}%</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Performance</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Tempo de processamento:</span>
                        <span className="text-sm font-medium">{testResult.processingTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Modo da IA:</span>
                        <Badge variant="outline">{testResult.classification.aiMode}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exemplos de Teste</CardTitle>
          <CardDescription>
            Clique em um exemplo para testar diferentes cenários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            {[
              "Olá, gostaria de informações sobre o curso de marketing digital",
              "Qual é o valor da mensalidade?",
              "Tenho dúvidas sobre a grade curricular",
              "Como faço para me matricular?",
              "Vocês têm desconto para estudantes?",
              "O curso é presencial ou online?"
            ].map((example, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setTestMessage(example)}
                className="text-left justify-start h-auto py-2 px-3"
              >
                {example}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}