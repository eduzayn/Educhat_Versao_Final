import { SettingsModule } from '@/modules/Settings';
import { Card } from '@/shared/ui/ui/card';
import { BackButton } from '@/shared/components/BackButton';
import { useAuth } from '@/shared/lib/hooks/useAuth';

const getAllSettingsCards = () => [
  {
    title: "Canais de Comunicação",
    description: "WhatsApp, Telegram, SMS e outras integrações",
    href: "/settings/channels",
    icon: "📱",
    requiredRoles: ["admin", "gerente"]
  },
  {
    title: "Usuários e Equipes",
    description: "Gerenciamento de usuários, funções e equipes",
    href: "/settings/users",
    icon: "👥",
    requiredRoles: ["admin", "gerente"]
  },
  {
    title: "Respostas Rápidas",
    description: "Configurar mensagens pré-definidas e templates",
    href: "/settings/quick-replies",
    icon: "⚡",
    requiredRoles: ["admin", "gerente", "agent", "atendente"]
  },
  {
    title: "Webhook",
    description: "Configurações de webhook para Z-API",
    href: "/settings/webhook",
    icon: "🔗",
    requiredRoles: ["admin"]
  },
  {
    title: "Detecção por IA",
    description: "Configurações de detecção inteligente",
    href: "/settings/ai-detection",
    icon: "🤖",
    requiredRoles: ["admin"]
  },
  {
    title: "Perfil da Empresa",
    description: "Informações básicas, logo, contato",
    href: "/settings/company",
    icon: "👤",
    requiredRoles: ["admin", "gerente", "agent", "atendente"]
  },
  {
    title: "Integrações",
    description: "APIs externas, CRM, automações",
    href: "/settings/integrations",
    icon: "🔌",
    requiredRoles: ["admin", "gerente"]
  },
  {
    title: "Notificações",
    description: "Configurações de alertas e notificações",
    href: "/settings/notifications",
    icon: "🔔",
    requiredRoles: ["admin", "gerente", "agent", "atendente"]
  },
  {
    title: "Segurança",
    description: "Permissões, autenticação e logs",
    href: "/settings/security",
    icon: "🔒",
    requiredRoles: ["admin"]
  }
];

function SettingsPage() {
  const { user } = useAuth();
  const userRole = (user as any)?.role || '';
  
  // Filtrar cards baseado no role do usuário
  const availableCards = getAllSettingsCards().filter(card => 
    card.requiredRoles.includes(userRole)
  );

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
          {availableCards.map((card, index) => (
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

        {availableCards.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhuma configuração disponível para seu perfil de usuário.
            </p>
          </div>
        )}
      </div>
    </SettingsModule>
  );
}

export default SettingsPage;