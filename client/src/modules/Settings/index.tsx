import { ReactNode } from 'react';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';

interface SettingsModuleProps {
  children: ReactNode;
}

export const SettingsModule = ({ children }: SettingsModuleProps) => {
  return (
    <div className="min-h-screen bg-educhat-light">
      <div className="p-6 space-y-6">
        <Breadcrumbs />
        {children}
      </div>
    </div>
  );
};