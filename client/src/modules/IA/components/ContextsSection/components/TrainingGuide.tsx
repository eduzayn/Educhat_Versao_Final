import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../shared/ui/card';
import { BookOpen } from 'lucide-react';

export function TrainingGuide() {
  return (
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
  );
} 