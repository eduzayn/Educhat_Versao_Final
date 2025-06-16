import { CardContent } from '../../../shared/ui/card';
import { Badge } from '../../../shared/ui/badge';
import { MessageCircle, Brain } from 'lucide-react';

interface TestResultProps {
  testResult: any;
}

export function TestResult({ testResult }: TestResultProps) {
  if (!testResult) return null;
  return (
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
  );
} 