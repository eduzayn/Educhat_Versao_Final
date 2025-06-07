import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const [location] = useLocation();

  // Gerar breadcrumbs automaticamente baseado na URL se não fornecido
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = location.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/' }
    ];

    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      
      // Mapear nomes amigáveis
      const friendlyNames: Record<string, string> = {
        'inbox': 'Caixa de Entrada',
        'contacts': 'Contatos',
        'crm': 'CRM',
        'bi': 'Business Intelligence',
        'reports': 'Relatórios',
        'integrations': 'Integrações',
        'settings': 'Configurações',
        'channels': 'Canais',
        'users': 'Usuários',
        'quick-replies': 'Respostas Rápidas',
        'webhooks': 'Webhooks',
        'ai-detection': 'Detecção IA',
        'chat-interno': 'Chat Interno',
        'profile': 'Perfil',
        'admin': 'Administração',
        'permissions': 'Permissões'
      };

      const label = friendlyNames[path] || path.charAt(0).toUpperCase() + path.slice(1);
      
      // Se é o último item, não adiciona href (página atual)
      if (index === paths.length - 1) {
        breadcrumbs.push({ label });
      } else {
        breadcrumbs.push({ label, href: currentPath });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}>
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center">
          {index === 0 && <Home className="w-4 h-4 mr-1" />}
          
          {item.href ? (
            <Link 
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
          
          {index < breadcrumbItems.length - 1 && (
            <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground/50" />
          )}
        </div>
      ))}
    </nav>
  );
}