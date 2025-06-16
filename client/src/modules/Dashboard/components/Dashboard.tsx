import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { DashboardMetrics } from './DashboardMetrics';
import { DashboardChannels } from './DashboardChannels';
import { DashboardConversations } from './DashboardConversations';
import { Spinner } from '@/shared/ui/spinner';
import { useAuth } from '@/shared/lib/hooks/useAuth';

export function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const { user } = useAuth();

  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/metrics');
      if (!response.ok) {
        // Retorna dados padrão se a API não estiver disponível
        return {
          activeConversations: 0,
          newContacts: { week: 0, today: 0 },
          responseRate: 0,
          averageResponseTime: 0
        };
      }
      return response.json();
    },
  });

  const { data: channels, isLoading: isLoadingChannels } = useQuery({
    queryKey: ['dashboard-channels'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/channels');
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
  });

  const { data: conversations, isLoading: isLoadingConversations } = useQuery({
    queryKey: ['dashboard-conversations'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/conversations');
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
  });

  const isLoading = isLoadingMetrics || isLoadingChannels || isLoadingConversations;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        user={user}
        onLogout={() => {
          // Implementar logout
        }}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <DashboardMetrics metrics={metrics} isLoading={isLoadingMetrics} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <DashboardChannels channels={channels} />
              <DashboardConversations
                conversations={conversations}
                onViewAll={() => {
                  // Implementar navegação para a página de conversas
                }}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 