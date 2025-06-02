import { useState } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Badge } from '@/shared/ui/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { useAuth } from '@/shared/lib/hooks/useAuth';
import { 
  MessageSquare, 
  Users, 
  Settings, 
  BarChart3, 
  Inbox, 
  CreditCard, 
  Bell, 
  Search,
  Menu,
  X,
  LogOut,
  User,
  Zap,
  Phone,
  Instagram,
  Facebook,
  Mail,
  MessageCircle,
  UserCheck
} from 'lucide-react';
import logoPath from '@assets/ChatGPT Image 26 de mai. de 2025, 00_39_36.png';
import { useLocation } from 'wouter';

export function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      window.location.reload();
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const menuItems = [
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
      badge: '12',
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
      id: 'integrations',
      label: 'Integrações',
      icon: Zap,
      description: 'Canais e APIs',
      route: '/integrations'
    },
    {
      id: 'payments',
      label: 'Pagamentos',
      icon: CreditCard,
      description: 'Cobranças e Asaas',
      route: '/payments'
    },
    {
      id: 'reports',
      label: 'Relatórios',
      icon: BarChart3,
      description: 'Analytics e métricas',
      route: '/reports'
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: Settings,
      description: 'Configurar sistema',
      route: '/settings'
    }
  ];

  const channelStats = [
    { name: 'WhatsApp', icon: Phone, count: 45, color: 'bg-green-100 text-green-800' },
    { name: 'Instagram', icon: Instagram, count: 23, color: 'bg-pink-100 text-pink-800' },
    { name: 'Facebook', icon: Facebook, count: 18, color: 'bg-blue-100 text-blue-800' },
    { name: 'Email', icon: Mail, count: 7, color: 'bg-gray-100 text-gray-800' }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-educhat-dark">Dashboard</h1>
              <p className="text-educhat-medium mt-2">
                Bem-vindo ao EduChat! Visão geral da sua plataforma omnichannel.
              </p>
            </div>

            {/* Estatísticas principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-educhat-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-educhat-medium">
                    Conversas Ativas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-educhat-dark">93</div>
                  <p className="text-xs text-green-600 mt-1">+12% desde ontem</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-educhat-medium">
                    Novos Contatos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-educhat-dark">27</div>
                  <p className="text-xs text-green-600 mt-1">+8% esta semana</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-educhat-medium">
                    Taxa de Resposta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-educhat-dark">95%</div>
                  <p className="text-xs text-green-600 mt-1">Excelente!</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-educhat-medium">
                    Tempo Médio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-educhat-dark">2.3m</div>
                  <p className="text-xs text-orange-600 mt-1">Tempo de resposta</p>
                </CardContent>
              </Card>
            </div>

            {/* Canais de comunicação */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-educhat-dark">Canais de Comunicação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {channelStats.map((channel) => (
                    <div key={channel.name} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                      <div className={`p-2 rounded-lg ${channel.color}`}>
                        <channel.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-educhat-dark">{channel.count}</p>
                        <p className="text-sm text-educhat-medium">{channel.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ações rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-educhat-dark">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button 
                    onClick={() => setActiveSection('inbox')}
                    className="h-auto p-4 flex flex-col items-center space-y-2 bg-educhat-primary hover:bg-educhat-secondary"
                  >
                    <Inbox className="w-6 h-6" />
                    <span>Ir para Inbox</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveSection('contacts')}
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center space-y-2 border-educhat-primary text-educhat-primary hover:bg-educhat-purple-50"
                  >
                    <Users className="w-6 h-6" />
                    <span>Novo Contato</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveSection('integrations')}
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center space-y-2 border-educhat-primary text-educhat-primary hover:bg-educhat-purple-50"
                  >
                    <Zap className="w-6 h-6" />
                    <span>Integrações</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveSection('payments')}
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center space-y-2 border-educhat-primary text-educhat-primary hover:bg-educhat-purple-50"
                  >
                    <CreditCard className="w-6 h-6" />
                    <span>Pagamentos</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'inbox':
        setLocation('/inbox');
        return null;
      
      case 'contacts':
        setLocation('/contacts');
        return null;

      default:
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-educhat-dark">
                {menuItems.find(item => item.id === activeSection)?.label}
              </h1>
              <p className="text-educhat-medium mt-2">
                {menuItems.find(item => item.id === activeSection)?.description}
              </p>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-educhat-medium">
                  Esta seção será desenvolvida nas próximas etapas do projeto.
                  Funcionalidades específicas serão implementadas conforme a necessidade.
                </p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {isSidebarOpen && (
              <div className="flex items-center space-x-3">
                <img src={logoPath} alt="EduChat" className="w-8 h-8" />
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
                    Admin EduChat
                  </p>
                  <p className="text-xs text-educhat-medium truncate">
                    admin@educhat.com
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar conversas, contatos..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-educhat-primary focus:border-educhat-primary w-96"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}