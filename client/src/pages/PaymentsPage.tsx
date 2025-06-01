import { CreditCard, Plus, Search, Filter } from 'lucide-react';
import { BackButton } from '@/shared/components/BackButton';
import { Button } from '@/shared/ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Input } from '@/shared/ui/ui/input';

export function PaymentsPage() {
  return (
    <div className="h-screen bg-gray-50">
      <div className="p-6">
        <BackButton to="/" label="Voltar ao Dashboard" />
        
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-educhat-dark flex items-center">
                  <CreditCard className="w-8 h-8 mr-3 text-educhat-primary" />
                  Pagamentos e Cobranças
                </h1>
                <p className="text-educhat-medium mt-2">
                  Gerencie cobranças, faturas e integração com Asaas
                </p>
              </div>
              <Button className="bg-educhat-primary hover:bg-educhat-secondary">
                <Plus className="w-4 h-4 mr-2" />
                Nova Cobrança
              </Button>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-educhat-medium">
                  Total Recebido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">R$ 0,00</div>
                <p className="text-xs text-green-600 mt-1">Este mês</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-educhat-medium">
                  Pendente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">R$ 0,00</div>
                <p className="text-xs text-orange-600 mt-1">Aguardando</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-educhat-medium">
                  Vencidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">R$ 0,00</div>
                <p className="text-xs text-red-600 mt-1">Em atraso</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-educhat-medium">
                  Total Cobranças
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-educhat-dark">0</div>
                <p className="text-xs text-educhat-medium mt-1">Este mês</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros e Busca */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar cobranças..."
                  className="pl-10 w-80"
                />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>

          {/* Lista de Cobranças */}
          <Card>
            <CardHeader>
              <CardTitle>Cobranças Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Nenhuma cobrança encontrada
                </h3>
                <p className="text-gray-500 mb-6">
                  Configure a integração com Asaas para começar a gerenciar cobranças
                </p>
                <Button className="bg-educhat-primary hover:bg-educhat-secondary">
                  Configurar Integração
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default PaymentsPage;