import { SettingsModule } from '@/modules/Settings';
import { Card } from '@/shared/ui/ui/card';
import { BackButton } from '@/shared/components/BackButton';
import { Link } from 'wouter';

const settingsCards = [
  {
    title: "Canais de Comunicação",
    description: "WhatsApp, Telegram, SMS e outras integrações",
    href: "/settings/channels",
    icon: "📱",
    implemented: true
  },
  {
    title: "Usuários e Equipes",
    description: "Gerenciamento de usuários, funções e equipes",
    href: "/settings/users",
    icon: "👥",
    implemented: true
  },
  {
    title: "Respostas Rápidas",
    description: "Configurar mensagens pré-definidas e templates",
    href: "/settings/quick-replies",
    icon: "⚡",
    implemented: true
  },
  {
    title: "Webhook",
    description: "Configurações de webhook para Z-API",
    href: "/settings/webhooks",
    icon: "🔗",
    implemented: true
  },
  {
    title: "Detecção IA",
    description: "Configurações de detecção automática por IA",
    href: "/settings/ai-detection",
    icon: "🤖",
    implemented: true
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
          {settingsCards.map((card, index) => (
            <Card key={index} className="bg-muted/50 p-6 rounded-lg border hover:bg-muted/70 transition-colors">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{card.icon}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-lg mb-2">{card.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{card.description}</p>
                  <Link 
                    href={card.href}
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    Acessar configurações →
                  </Link>
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