import { useState } from 'react';
import { Users, Shield, UserCheck, Settings } from 'lucide-react';
import { BackButton } from '@/shared/components/BackButton';
import { PortalModal } from '@/components/PortalModal';
import { UsersTab } from './components/UsersTab';
import { RolesTab } from './components/RolesTab';
import { TeamsTab } from './components/TeamsTab';
import { PermissionsTab } from './components/PermissionsTab';

export const UsersSettingsPageFixed = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [testModalOpen, setTestModalOpen] = useState(false);

  const tabs = [
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'roles', label: 'Funções', icon: Shield },
    { id: 'teams', label: 'Equipes', icon: UserCheck },
    { id: 'permissions', label: 'Permissões', icon: Settings },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UsersTab />;
      case 'roles':
        return <RolesTab />;
      case 'teams':
        return <TeamsTab />;
      case 'permissions':
        return <PermissionsTab />;
      default:
        return <UsersTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        <BackButton to="/settings" label="Voltar às Configurações" />
      
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h2>
            <p className="text-gray-600">
              Configure usuários, funções, equipes e permissões do sistema
            </p>
          </div>
          <button
            onClick={() => setTestModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Teste Modal Isolado
          </button>
        </div>

        {/* Custom Tab Implementation - Completely isolated */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>

        <PortalModal
          isOpen={testModalOpen}
          onClose={() => setTestModalOpen(false)}
          title="Modal Portal - Solução Definitiva"
        >
          <div style={{ marginBottom: '16px' }}>
            <p style={{ marginBottom: '8px' }}>Este modal usa React Portal completamente isolado do contexto da aplicação.</p>
            <p style={{ marginBottom: '16px' }}>Se permanecer aberto, confirmamos que resolvemos definitivamente o problema.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setTestModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#1d4ed8';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }}
              >
                Fechar Modal
              </button>
            </div>
          </div>
        </PortalModal>
      </div>
    </div>
  );
};