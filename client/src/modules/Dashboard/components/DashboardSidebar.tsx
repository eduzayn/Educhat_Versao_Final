import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { 
  Menu, 
  X, 
  LogOut, 
  User,
  BarChart3,
  Inbox,
  UserCheck,
  MessageCircle,
  Users,
  Bot,
  GraduationCap,
  Zap,
  ArrowRightLeft,
  Settings,
  Award
} from 'lucide-react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  description: string;
  route: string;
  badge?: string;
  adminOnly?: boolean;
  managerOrAdminOnly?: boolean;
}

interface DashboardSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  user: any;
  unreadCount?: number;
  onLogout: () => void;
}

export function DashboardSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  activeSection,
  setActiveSection,
  user,
  unreadCount,
  onLogout
}: DashboardSidebarProps) {
  const [, setLocation] = useLocation();

  const allMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Visão geral do sistema',
      route: '/'
    },
    {
      id: 'inbox',
      label: 'Caixa de Entrada',
      icon: Inbox,
      description: 'Conversas unificadas',
      badge: unreadCount?.toString(),
      route: '/inbox'
    },
    {
      id: 'contacts',
      label: 'Contatos',
      icon: UserCheck,
      description: 'Gerenciar contatos e WhatsApp',
      route: '/contacts'
    },
    {
      id: 'chat-interno',
      label: 'Chat Interno',
      icon: MessageCircle,
      description: 'Comunicação entre agentes',
      route: '/chat-interno'
    },
    {
      id: 'crm',
      label: 'CRM',
      icon: Users,
      description: 'Gestão de leads e contatos',
      route: '/crm'
    },
    {
      id: 'prof-ana',
      label: 'Prof. Ana',
      icon: GraduationCap,
      description: 'Copilot - Assistente Inteligente',
      route: '/copilot'
    },
    {
      id: 'ia-config',
      label: 'IA',
      icon: Bot,
      description: 'Configuração da IA',
      route: '/ia',
      adminOnly: true
    },
    {
      id: 'bi',
      label: 'Business Intelligence',
      icon: BarChart3,
      description: 'Análises e produtividade',
      route: '/bi',
      managerOrAdminOnly: true
    },
    {
      id: 'handoffs',
      label: 'Transferências',
      icon: ArrowRightLeft,
      description: 'Sistema de handoff inteligente',
      route: '/handoffs',
      managerOrAdminOnly: true
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: Settings,
      description: 'Configurar sistema',
      route: '/settings',
      adminOnly: true
    }
  ];

  const menuItems = allMenuItems.filter(item => {
    if (item.adminOnly) {
      const userRole = user?.role;
      return userRole === 'admin' || userRole === 'Administrador' || userRole === 'administrador';
    }
    if (item.managerOrAdminOnly) {
      const userRole = user?.role;
      return userRole === 'admin' || userRole === 'Administrador' || userRole === 'administrador' || 
             userRole === 'gerente' || userRole === 'Gerente';
    }
    return true;
  });

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/logout');
      onLogout();
      setLocation('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, tenta redirecionar para login
      setLocation('/login');
    }
  };

  return (
    <div className={`${isSidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {isSidebarOpen && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-educhat-primary rounded text-white flex items-center justify-center text-sm font-bold">
                E
              </div>
              <span className="font-bold text-educhat-dark">EduChat</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2"
          >
            {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <div className="space-y-1 px-3">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "default" : "ghost"}
              className={`w-full justify-start h-auto p-3 ${
                activeSection === item.id 
                  ? 'bg-educhat-primary text-white' 
                  : 'text-educhat-medium hover:text-educhat-dark hover:bg-educhat-purple-50'
              }`}
              onClick={() => {
                if (item.route && item.route !== '/') {
                  setLocation(item.route);
                } else {
                  setActiveSection(item.id);
                }
              }}
            >
              <item.icon className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : ''}`} />
              {isSidebarOpen && (
                <div className="flex items-center justify-between w-full">
                  <span>{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="bg-educhat-secondary text-white">
                      {item.badge}
                    </Badge>
                  )}
                </div>
              )}
            </Button>
          ))}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-gray-200">
        {isSidebarOpen ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-2">
              <div className="w-8 h-8 bg-educhat-primary rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-educhat-dark truncate">
                  {user?.displayName || user?.username || 'Usuário'}
                </p>
                <p className="text-xs text-educhat-medium truncate">
                  {user?.email || 'email@exemplo.com'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sair
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
} 