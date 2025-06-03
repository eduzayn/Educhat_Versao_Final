import { UsersSettingsPage } from '@/pages/Settings/Users/UsersSettingsPage';
import { BackButton } from '@/shared/components/BackButton';

export default function SettingsUsersPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton to="/settings" label="Voltar às Configurações" />
      <UsersSettingsPage />
    </div>
  );
}