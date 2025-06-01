import { MessageCircle, Plus, Search, Users, Settings } from 'lucide-react';
import { BackButton } from '@/shared/components/BackButton';
import { Button } from '@/shared/ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Input } from '@/shared/ui/ui/input';
import { Badge } from '@/shared/ui/ui/badge';

export function ChatInternoPage() {
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
                  <MessageCircle className="w-8 h-8 mr-3 text-educhat-primary" />
                  Chat Interno
                </h1>
                <p className="text-educhat-medium mt-2">
                  Comunicação entre agentes e equipe de suporte
                </p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </Button>
                <Button className="bg-educhat-primary hover:bg-educhat-secondary">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Chat
                </Button>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-educhat-medium">
                  Agentes Online
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">0</div>
                <p className="text-xs text-green-600 mt-1">Ativos agora</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-educhat-medium">
                  Chats Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">0</div>
                <p className="text-xs text-blue-600 mt-1">Em andamento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-educhat-medium">
                  Mensagens Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-educhat-dark">0</div>
                <p className="text-xs text-educhat-medium mt-1">Enviadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-educhat-medium">
                  Tempo Resposta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">0min</div>
                <p className="text-xs text-orange-600 mt-1">Média</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de Agentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Agentes Online
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    Nenhum agente online
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Chat Principal */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Conversas Internas</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Buscar conversas..."
                        className="pl-9 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    Nenhuma conversa interna
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Inicie uma conversa com sua equipe para colaborar em tempo real
                  </p>
                  <Button className="bg-educhat-primary hover:bg-educhat-secondary">
                    <Plus className="w-4 h-4 mr-2" />
                    Iniciar Conversa
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recursos do Chat Interno */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Recursos Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-blue-50">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <MessageCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-educhat-dark">Chat em Tempo Real</h4>
                      <p className="text-sm text-educhat-medium">Comunicação instantânea</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-green-50">
                    <div className="p-2 rounded-lg bg-green-100">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-educhat-dark">Grupos de Equipe</h4>
                      <p className="text-sm text-educhat-medium">Organize por departamentos</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-purple-50">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Settings className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-educhat-dark">Notificações</h4>
                      <p className="text-sm text-educhat-medium">Alertas personalizados</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatInternoPage;