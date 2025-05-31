import { useState } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Card } from '@/shared/ui/ui/card';
import { RefreshCw, PlusCircle, MessageSquare, Instagram, Facebook, Mail, MessageSquareText, Phone } from 'lucide-react';
import { UnifiedChannelWizard } from './components/UnifiedChannelWizard';

interface Channel {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  description: string;
  configuration: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

const channelTypes = [
  {
    type: "whatsapp",
    icon: <MessageSquare className="h-5 w-5 text-green-500" />,
    name: "WhatsApp",
    description: "Canal de comunicação via WhatsApp"
  },
  {
    type: "instagram", 
    icon: <Instagram className="h-5 w-5 text-pink-500" />,
    name: "Instagram",
    description: "Mensagens diretas no Instagram"
  },
  {
    type: "facebook",
    icon: <Facebook className="h-5 w-5 text-blue-600" />,
    name: "Facebook", 
    description: "Mensagens via Facebook Messenger"
  },
  {
    type: "email",
    icon: <Mail className="h-5 w-5 text-blue-500" />,
    name: "Email",
    description: "Canais de email para atendimento"
  },
  {
    type: "sms",
    icon: <MessageSquareText className="h-5 w-5 text-purple-500" />,
    name: "SMS",
    description: "Envio e recebimento de SMS"
  },
  {
    type: "voice",
    icon: <Phone className="h-5 w-5 text-amber-500" />,
    name: "Telefonia",
    description: "Atendimento telefônico integrado"
  }
];

export const ChannelsSettingsModule = () => {
  const [openAddChannelWizard, setOpenAddChannelWizard] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    // Aqui seria feita a chamada para a API
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleChannelAdded = (newChannel: Channel) => {
    setChannels(prev => [...prev, newChannel]);
    setOpenAddChannelWizard(false);
  };

  const renderChannelCard = (channelType: typeof channelTypes[0]) => {
    const existingChannel = channels.find(ch => ch.type === channelType.type);
    
    return (
      <Card key={channelType.type} className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {channelType.icon}
            <div>
              <h3 className="font-medium">{channelType.name}</h3>
              <p className="text-sm text-muted-foreground">{channelType.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {existingChannel ? (
              <>
                <div className={`w-2 h-2 rounded-full ${existingChannel.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-xs text-muted-foreground">
                  {existingChannel.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setOpenAddChannelWizard(true)}
              >
                Configurar
              </Button>
            )}
          </div>
        </div>
        
        {existingChannel && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              Configurado em: {new Date(existingChannel.createdAt).toLocaleDateString()}
            </p>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline">Editar</Button>
              <Button size="sm" variant="outline">
                {existingChannel.isActive ? 'Desativar' : 'Ativar'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header com botões de ação */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Canais de Comunicação</h2>
          <p className="text-muted-foreground">
            Configure os canais de comunicação com seus clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={() => setOpenAddChannelWizard(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Adicionar Novo Canal
          </Button>
        </div>
      </div>

      {/* Grid de cards de canais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {channelTypes.map(type => renderChannelCard(type))}
      </div>

      {/* Wizard de adição de canais */}
      <UnifiedChannelWizard 
        open={openAddChannelWizard}
        onOpenChange={setOpenAddChannelWizard}
        onChannelAdded={handleChannelAdded}
      />
    </div>
  );
};