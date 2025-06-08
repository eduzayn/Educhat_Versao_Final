import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Card } from '@/shared/ui/card';
import { MessageSquare, Instagram, Facebook, Mail, MessageSquareText, Phone, ChevronRight, ChevronLeft } from 'lucide-react';
import { ZApiQRCode } from './ZApiQRCode';

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

interface UnifiedChannelWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChannelAdded: (channel: Channel) => void;
}

const channelTypes = [
  {
    type: "whatsapp",
    icon: <MessageSquare className="h-8 w-8 text-green-500" />,
    name: "WhatsApp",
    description: "Canal de comunicação via WhatsApp"
  },
  {
    type: "instagram", 
    icon: <Instagram className="h-8 w-8 text-pink-500" />,
    name: "Instagram",
    description: "Mensagens diretas no Instagram"
  },
  {
    type: "facebook",
    icon: <Facebook className="h-8 w-8 text-blue-600" />,
    name: "Facebook", 
    description: "Mensagens via Facebook Messenger"
  },
  {
    type: "email",
    icon: <Mail className="h-8 w-8 text-blue-500" />,
    name: "Email",
    description: "Canais de email para atendimento"
  },
  {
    type: "sms",
    icon: <MessageSquareText className="h-8 w-8 text-purple-500" />,
    name: "SMS",
    description: "Envio e recebimento de SMS"
  },
  {
    type: "voice",
    icon: <Phone className="h-8 w-8 text-amber-500" />,
    name: "Telefonia",
    description: "Atendimento telefônico integrado"
  }
];

export function UnifiedChannelWizard({ open, onOpenChange, onChannelAdded }: UnifiedChannelWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedChannelType, setSelectedChannelType] = useState<string | null>(null);
  const [channelConfigData, setChannelConfigData] = useState({
    name: '',
    type: '',
    identifier: '',
    configuration: {
      instanceId: '',
      token: '',
      clientToken: '',
      baseUrl: 'https://api.z-api.io',
      host: '',
      port: '',
      username: '',
      password: '',
      appId: '',
      appSecret: '',
      pageId: '',
      accessToken: ''
    }
  });

  const getSteps = () => {
    const baseSteps = [
      { id: 1, title: "Tipo de Canal", description: "Escolha o tipo de canal" },
      { id: 2, title: "Configurações", description: "Configure as credenciais" }
    ];

    if (selectedChannelType === 'whatsapp') {
      baseSteps.push({ id: 3, title: "Conectar WhatsApp", description: "Escaneie o QR Code" });
      baseSteps.push({ id: 4, title: "Finalização", description: "Revisar e confirmar" });
    } else {
      baseSteps.push({ id: 3, title: "Finalização", description: "Revisar e confirmar" });
    }

    return baseSteps;
  };

  const steps = getSteps();

  const handleChannelTypeSelect = (type: string) => {
    setSelectedChannelType(type);
    setChannelConfigData(prev => ({ ...prev, type }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    const newChannel: Channel = {
      id: Date.now().toString(),
      name: channelConfigData.name,
      type: channelConfigData.type,
      isActive: true,
      description: `Canal ${channelConfigData.name}`,
      configuration: channelConfigData.configuration,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onChannelAdded(newChannel);
    
    // Reset wizard
    setCurrentStep(1);
    setSelectedChannelType(null);
    setChannelConfigData({
      name: '',
      type: '',
      identifier: '',
      configuration: {
        instanceId: '',
        token: '',
        clientToken: '',
      }
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {channelTypes.map((type) => (
                <Card 
                  key={type.type}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedChannelType === type.type
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleChannelTypeSelect(type.type)}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    {type.icon}
                    <h3 className="font-medium">{type.name}</h3>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 2:
        const selectedType = channelTypes.find(t => t.type === selectedChannelType);
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              {selectedType?.icon}
              <div>
                <h3 className="font-medium">{selectedType?.name}</h3>
                <p className="text-sm text-muted-foreground">Configure as credenciais do canal</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="channel-name">Nome do Canal</Label>
                <Input
                  id="channel-name"
                  placeholder="Ex: WhatsApp Principal"
                  value={channelConfigData.name}
                  onChange={(e) => setChannelConfigData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              {selectedChannelType === 'whatsapp' && (
                <>
                  <div>
                    <Label htmlFor="base-url">URL Base da Z-API</Label>
                    <Input
                      id="base-url"
                      value="https://api.z-api.io"
                      readOnly
                      className="bg-muted cursor-not-allowed"
                      onChange={() => {}} // Campo somente leitura
                    />
                  </div>
                  <div>
                    <Label htmlFor="instance-id">Instance ID</Label>
                    <Input
                      id="instance-id"
                      placeholder="ID da instância Z-API"
                      value={channelConfigData.configuration.instanceId}
                      onChange={(e) => setChannelConfigData(prev => ({
                        ...prev,
                        configuration: { ...prev.configuration, instanceId: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="token">Token</Label>
                    <Input
                      id="token"
                      placeholder="Token da Z-API"
                      value={channelConfigData.configuration.token}
                      onChange={(e) => setChannelConfigData(prev => ({
                        ...prev,
                        configuration: { ...prev.configuration, token: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-token">Client Token</Label>
                    <Input
                      id="client-token"
                      placeholder="Client Token da Z-API"
                      value={channelConfigData.configuration.clientToken}
                      onChange={(e) => setChannelConfigData(prev => ({
                        ...prev,
                        configuration: { ...prev.configuration, clientToken: e.target.value }
                      }))}
                    />
                  </div>
                </>
              )}

              {selectedChannelType === 'email' && (
                <>
                  <div>
                    <Label htmlFor="email-host">Servidor SMTP</Label>
                    <Input
                      id="email-host"
                      placeholder="smtp.gmail.com"
                      value={channelConfigData.configuration.host}
                      onChange={(e) => setChannelConfigData(prev => ({
                        ...prev,
                        configuration: { ...prev.configuration, host: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email-port">Porta</Label>
                    <Input
                      id="email-port"
                      placeholder="587"
                      value={channelConfigData.configuration.port}
                      onChange={(e) => setChannelConfigData(prev => ({
                        ...prev,
                        configuration: { ...prev.configuration, port: e.target.value }
                      }))}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 3:
        if (selectedChannelType === 'whatsapp') {
          return (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Conectar WhatsApp</h3>
                <p className="text-muted-foreground">Escaneie o QR Code para conectar sua conta WhatsApp</p>
              </div>

              <ZApiQRCode
                baseUrl="https://api.z-api.io"
                instanceId={channelConfigData.configuration.instanceId}
                token={channelConfigData.configuration.token}
                clientToken={channelConfigData.configuration.clientToken}
                onConnectionSuccess={() => {
                  // Quando conectar com sucesso, avança para o próximo passo
                  setCurrentStep(4);
                }}
              />
            </div>
          );
        }
        
        // Para outros tipos de canal, vai direto para finalização
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Revisar Configuração</h3>
              <p className="text-muted-foreground">Verifique as informações antes de finalizar</p>
            </div>

            <Card className="p-4">
              <div className="space-y-2">
                <div><strong>Tipo:</strong> {channelTypes.find(t => t.type === selectedChannelType)?.name}</div>
                <div><strong>Nome:</strong> {channelConfigData.name}</div>
                <div><strong>Status:</strong> Ativo</div>
              </div>
            </Card>
          </div>
        );

      case 4:
        // Passo de finalização para WhatsApp (após QR code)
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Revisar Configuração</h3>
              <p className="text-muted-foreground">Verifique as informações antes de finalizar</p>
            </div>

            <Card className="p-4">
              <div className="space-y-2">
                <div><strong>Tipo:</strong> {channelTypes.find(t => t.type === selectedChannelType)?.name}</div>
                <div><strong>Nome:</strong> {channelConfigData.name}</div>
                <div><strong>Status:</strong> Conectado</div>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Canal</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= step.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step.id}
                </div>
                <div className="ml-2">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 mx-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[300px]">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            {currentStep < steps.length ? (
              <Button 
                onClick={handleNext}
                disabled={currentStep === 1 && !selectedChannelType}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleFinish}>
                Finalizar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}