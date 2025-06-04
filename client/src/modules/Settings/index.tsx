import { ReactNode } from 'react';
import { SettingsSidebar } from './components/SettingsSidebar';

interface SettingsModuleProps {
  children: ReactNode;
}

export const SettingsModule = ({ children }: SettingsModuleProps) => {
  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configurações do Tenant</h1>
        <p className="text-muted-foreground">
          Configure as informações e preferências da sua organização
        </p>
      </div>
      
      {/* Layout Principal */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <SettingsSidebar />
        </div>
        
        {/* Conteúdo Principal */}
        <div className="flex-1 min-w-0">
          <div className="bg-card border rounded-md p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};