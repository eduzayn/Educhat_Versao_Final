import { ReactNode } from 'react';
import { SettingsSidebar } from './components/SettingsSidebar';

interface SettingsModuleProps {
  children: ReactNode;
}

export const SettingsModule = ({ children }: SettingsModuleProps) => {
  return (
    <div className="h-full px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configurações do Tenant</h1>
        <p className="text-muted-foreground">
          Configure as informações e preferências da sua organização
        </p>
      </div>
      
      {/* Layout Principal */}
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100%-120px)]">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <SettingsSidebar />
        </div>
        
        {/* Conteúdo Principal */}
        <div className="flex-1 min-w-0">
          <div className="bg-card border rounded-md p-6 h-full overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};