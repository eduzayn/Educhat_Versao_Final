import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';

interface TestExamplesProps {
  setTestMessage: (message: string) => void;
}

const examples = [
  "Olá, gostaria de informações sobre o curso de marketing digital",
  "Qual é o valor da mensalidade?",
  "Tenho dúvidas sobre a grade curricular",
  "Como faço para me matricular?",
  "Vocês têm desconto para estudantes?",
  "O curso é presencial ou online?"
];

export function TestExamples({ setTestMessage }: TestExamplesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exemplos de Teste</CardTitle>
        <CardDescription>
          Clique em um exemplo para testar diferentes cenários
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 md:grid-cols-2">
          {examples.map((example, index) => (
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
  );
} 