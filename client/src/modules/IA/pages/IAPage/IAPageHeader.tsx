import { Button } from '../../../../shared/ui/button';
import { Brain, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export function IAPageHeader() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Brain className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold">Prof. Ana - IA Educacional</h1>
          <p className="text-muted-foreground">
            Sistema inteligente de atendimento educacional com personalidades adaptáveis
          </p>
        </div>
      </div>
      <Button 
        variant="outline" 
        onClick={() => setLocation('/')}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao Painel
      </Button>
    </div>
  );
} 