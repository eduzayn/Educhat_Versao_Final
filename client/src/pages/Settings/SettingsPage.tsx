import { SettingsModule } from '@/modules/Settings';
import { Card } from '@/shared/ui/ui/card';
import { BackButton } from '@/shared/components/BackButton';

const settingsCards = [
  {
    title: "Canais de Comunicação",
    description: "WhatsApp, Telegram, SMS e outras integrações",
    href: "/settings/channels",
    icon: "📱"
  },
  {
    title: "Usuários e Equipes",
    description: "Gerenciamento de usuários, funções e equipes",
    href: "/settings/users",
    icon: "👥"
  },
  {
    title: "Respostas Rápidas",
    description: "Configurar mensagens pré-definidas e templates",
    href: "/settings/quick-replies",
    icon: "⚡"
  },
  {
    title: "Webhook",
    description: "Configurações de webhook para Z-API",
    href: "/settings/webhook",
    icon: "🔗"
  },
  {
    title: "Perfil da Empresa",
    description: "Informações básicas, logo, contato",
    href: "/settings/company",
    icon: "👤"
  },
  {
    title: "Integrações",
    description: "APIs externas, CRM, automações",
    href: "/settings/integrations",
    icon: "🔌"
  },
  {
    title: "Notificações",
    description: "Configurações de alertas e notificações",
    href: "/settings/notifications",
    icon: "🔔"
  },
  {
    title: "Segurança",
    description: "Permissões, autenticação e logs",
    href: "/settings/security",
    icon: "🔒"
  }
];

function SettingsPage() {
  return (
    <SettingsModule>
      <div className="space-y-6">
        <BackButton to="/" label="Voltar ao Dashboard" />
        <div>
          <h2 className="text-2xl font-bold">Configurações</h2>
          <p className="text-muted-foreground">
            Acesse as diferentes seções de configuração do sistema
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {settingsCards.map((card, index) => (
            <Card key={index} className="bg-muted/50 p-6 rounded-lg border hover:bg-muted/70 transition-colors">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{card.icon}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-lg mb-2">{card.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{card.description}</p>
                  <a 
                    href={card.href} 
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    Acessar configurações →
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </SettingsModule>
  );
}

export default SettingsPage;