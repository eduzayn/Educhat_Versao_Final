import { useState } from 'react';
import { Input } from '@/shared/ui/ui/input';
import { useLocation } from 'wouter';

interface MenuItem {
  href: string;
  icon: string;
  label: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "Configurações Gerais",
    items: [
      { href: "/settings/company", icon: "👤", label: "Perfil da Empresa" },
      { href: "/settings/branding", icon: "🎨", label: "Aparência e Branding" },
      { href: "/settings/localization", icon: "🌍", label: "Localização e Idioma" },
      { href: "/settings/users", icon: "👥", label: "Usuários e Equipes" },
      { href: "/settings/channels", icon: "📱", label: "Canais de Comunicação" },
      { href: "/settings/notifications", icon: "🔔", label: "Notificações" }
    ]
  },
  {
    title: "Módulos & Ferramentas",
    items: [
      { href: "/settings/crm", icon: "💼", label: "CRM" },
      { href: "/settings/marketing", icon: "📣", label: "Marketing" },
      { href: "/settings/goals", icon: "🎯", label: "Metas e Gamificação" },
      { href: "/settings/ai", icon: "🤖", label: "IA - Prof. Ana" },
      { href: "/settings/integrations", icon: "🔌", label: "Integrações" },
      { href: "/settings/security", icon: "🔒", label: "Segurança" },
      { href: "/settings/subscription", icon: "💳", label: "Assinatura" }
    ]
  }
];

export function SettingsSidebar() {
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSections = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  return (
    <div className="space-y-4">
      {/* Barra de busca */}
      <Input 
        placeholder="Buscar configurações..." 
        className="text-sm"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Menu de navegação */}
      <div className="space-y-6">
        {filteredSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  onClick={() => setLocation(item.href)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md text-left transition-colors ${
                    location === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}