import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardSidebar } from './components/DashboardSidebar';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardMetrics } from './components/DashboardMetrics';
import { DashboardChannels } from './components/DashboardChannels';
import { DashboardConversations } from './components/DashboardConversations';
import { Spinner } from '@/shared/ui/spinner';
import { useAuth } from '@/shared/hooks/useAuth';
import { api } from '@/shared/services/api';

export function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user } = useAuth();

  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const response = await api.get('/dashboard/metrics');
      return response.data;
    },
  });

  const { data: channels, isLoading: isLoadingChannels } = useQuery({
    queryKey: ['dashboard-channels'],
    queryFn: async () => {
      const response = await api.get('/dashboard/channels');
      return response.data;
    },
  });

  const { data: conversations, isLoading: isLoadingConversations } = useQuery({
    queryKey: ['dashboard-conversations'],
    queryFn: async () => {
      const response = await api.get('/dashboard/conversations');
      return response.data;
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
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        user={user}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <DashboardMetrics metrics={metrics} isLoading={isLoadingMetrics} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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