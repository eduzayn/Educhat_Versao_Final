import { useState } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Badge } from '@/shared/ui/ui/badge';
import { MessageSquare, Phone, Video, Settings } from 'lucide-react';
import { BackButton } from '@/shared/components/BackButton';

export function InboxPage() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-educhat-light">
      <div className="bg-white border-b border-educhat-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-2xl font-bold text-educhat-dark">Inbox</h1>
          </div>
          <Badge variant="outline" className="text-educhat-medium">
            0 mensagens não lidas
          </Badge>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Lista de Conversas */}
        <div className="w-1/3 border-r border-educhat-border bg-white">
          <div className="p-4 border-b border-educhat-border">
            <h2 className="font-semibold text-educhat-dark">Conversas</h2>
          </div>
          <div className="p-4">
            <Card className="p-4 text-center">
              <MessageSquare className="h-12 w-12 text-educhat-medium mx-auto mb-2" />
              <p className="text-educhat-medium">Nenhuma conversa encontrada</p>
              <p className="text-sm text-educhat-light-text mt-2">
                As conversas aparecerão aqui quando você receber mensagens
              </p>
            </Card>
          </div>
        </div>

        {/* Área de Mensagens */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Cabeçalho da Conversa */}
              <div className="bg-white border-b border-educhat-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-educhat-primary rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">U</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-educhat-dark">Usuário</h3>
                      <p className="text-sm text-educhat-medium">Online</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Área de Mensagens */}
              <div className="flex-1 p-4 bg-gray-50">
                <div className="text-center text-educhat-medium">
                  Selecione uma conversa para ver as mensagens
                </div>
              </div>

              {/* Input de Mensagem */}
              <div className="bg-white border-t border-educhat-border p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Digite sua mensagem..."
                    className="flex-1 px-3 py-2 border border-educhat-border rounded-lg focus:outline-none focus:ring-2 focus:ring-educhat-primary"
                  />
                  <Button>Enviar</Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageSquare className="h-20 w-20 text-educhat-medium mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-educhat-dark mb-2">
                  Bem-vindo ao Inbox
                </h3>
                <p className="text-educhat-medium max-w-md">
                  Gerencie todas as suas conversas de diferentes canais em um só lugar.
                  Selecione uma conversa para começar.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}