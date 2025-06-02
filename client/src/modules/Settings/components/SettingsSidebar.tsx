import { useState } from 'react';
import { Input } from '@/shared/ui/ui/input';
import { Button } from '@/shared/ui/ui/button';
import { useLocation } from 'wouter';

interface MenuItem {
  href: string;
  icon: string;
  label: string;
  variant?: 'ghost' | 'default';
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const iconMapping = {
  company: "👤",
  branding: "🎨", 
  localization: "🌍",
  users: "👥",
  channels: "📱",
  notifications: "🔔",
  crm: "💼",
  marketing: "📣",
  goals: "🎯",
  ai: "🤖",
  integrations: "🔌",
  security: "🔒",
  subscription: "💳"
};

const menuSections: MenuSection[] = [
  {
    title: "Configurações Implementadas",
    items: [
      { href: "/settings", icon: iconMapping.company, label: "Configurações Gerais" },
      { href: "/settings/channels", icon: iconMapping.channels, label: "Canais de Comunicação" },
      { href: "/settings/webhook", icon: iconMapping.integrations, label: "Configuração de Webhook" }
    ]
  }
];

export function SettingsSidebar() {
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar todas as seções baseado no termo de busca
  const filteredSections = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  return (
    <div className="bg-card border rounded-md p-4 sticky top-6">
      {/* Barra de busca */}
      <Input 
        placeholder="Buscar configurações..." 
        className="text-sm mb-4"
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
              {section.items.map((item, itemIndex) => {
                const isActive = location === item.href;
                const variant = isActive || item.variant === 'default' ? 'default' : 'ghost';
                
                return (
                  <Button
                    key={itemIndex}
                    variant={variant}
                    className={`w-full justify-start text-sm ${
                      isActive 
                        ? 'bg-educhat-primary text-white hover:bg-educhat-primary/90' 
                        : ''
                    }`}
                    onClick={() => setLocation(item.href)}
                  >
                    <span className="mr-2 text-base">{item.icon}</span>
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}