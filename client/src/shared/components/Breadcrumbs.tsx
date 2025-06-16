import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const [location] = useLocation();

  // Auto-generate breadcrumbs from URL if items not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/' }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      // Mapeamento de segmentos para labels mais amigáveis
      const segmentLabels: Record<string, string> = {
        'inbox': 'Caixa de Entrada',
        'contacts': 'Contatos',
        'crm': 'CRM',
        'ia': 'Prof. Ana',
        'bi': 'Business Intelligence',
        'settings': 'Configurações',
        'integrations': 'Integrações',
        'channels': 'Canais',
        'users': 'Usuários',
        'quick-replies': 'Respostas Rápidas',
        'webhooks': 'Webhooks',
        'admin': 'Administração',
        'permissions': 'Permissões',
        'chat-interno': 'Chat Interno',
        'handoffs': 'Transferências',
        'profile': 'Perfil'
      };
      
      // Usar label mapeado ou gerar um label amigável
      const label = segmentLabels[segment] || segment
        .replace(/-/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
        isCurrentPage: isLast
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav className={cn("flex items-center space-x-2 text-sm text-gray-600", className)}>
      <Home className="w-4 h-4" />
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
          {item.href && !item.isCurrentPage ? (
            <Link href={item.href}>
              <span className="hover:text-educhat-primary cursor-pointer transition-colors">
                {item.label}
              </span>
            </Link>
          ) : (
            <span className={cn(
              item.isCurrentPage ? "text-educhat-primary font-medium" : "text-gray-900"
            )}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}