import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Users, Clock, Target, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';

export function AssignmentRulesPanel() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Regras de Atribuição Automática
          </CardTitle>
          <CardDescription>
            Como funciona a distribuição equitativa de conversas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Fluxo Principal */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Fluxo de Atribuição</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">IA Classifica a Conversa</p>
                  <p className="text-sm text-gray-600">Prof. Ana identifica o tipo: comercial, suporte, cobrança, etc.</p>
                </div>
              </div>
              
              <div className="flex items-center justify-center">
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold text-sm">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">Rodízio Equitativo Ativado</p>
                  <p className="text-sm text-gray-600">Sistema seleciona o próximo atendente da equipe correspondente</p>
                </div>
              </div>
            </div>
          </div>

          {/* Critérios de Seleção */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Critérios de Seleção (em ordem)</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                <Badge variant="outline" className="text-xs">1º</Badge>
                <span className="text-sm">Menor score de distribuição (mais equitativo)</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                <Badge variant="outline" className="text-xs">2º</Badge>
                <span className="text-sm">Menor número de conversas ativas</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                <Badge variant="outline" className="text-xs">3º</Badge>
                <span className="text-sm">Atendente que recebeu conversa há mais tempo</span>
              </div>
            </div>
          </div>

          {/* Status dos Atendentes */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Status dos Atendentes</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Online - Próximo</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">Online - Na fila</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium">Offline - Aguardando</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-sm font-medium">Inativo - Fora da fila</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cenários Especiais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Cenários Especiais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="border-l-4 border-amber-400 pl-4">
            <h4 className="font-medium text-gray-900 mb-2">Nenhum Atendente Online</h4>
            <p className="text-sm text-gray-600 mb-2">
              Quando não há atendentes online na equipe:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Conversa é atribuída ao atendente com menor carga total</li>
              <li>• Atendente receberá a conversa quando ficar online</li>
              <li>• Sistema mantém fila de conversas pendentes</li>
            </ul>
          </div>

          <div className="border-l-4 border-blue-400 pl-4">
            <h4 className="font-medium text-gray-900 mb-2">Capacidade Máxima Atingida</h4>
            <p className="text-sm text-gray-600 mb-2">
              Quando todos atingem 15 conversas ativas:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Sistema seleciona quem tem menor sobrecarga</li>
              <li>• Prioriza distribuição equilibrada mesmo no limite</li>
              <li>• Mantém histórico para próximas atribuições</li>
            </ul>
          </div>

          <div className="border-l-4 border-green-400 pl-4">
            <h4 className="font-medium text-gray-900 mb-2">Transferências Manuais</h4>
            <p className="text-sm text-gray-600 mb-2">
              Após o primeiro atendimento automático:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Atendentes podem transferir manualmente</li>
              <li>• Rodízio continua funcionando para novos contatos</li>
              <li>• Histórico é preservado para equidade</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Métricas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Score de Distribuição
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Fórmula:</strong> (Total de atribuições × 10) + Conversas ativas + Penalidade temporal
            </p>
            <p className="text-xs text-gray-600">
              Menor score = maior prioridade na fila. Sistema garante que todos recebam cargas similares ao longo do tempo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}