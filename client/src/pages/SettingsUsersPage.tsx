import { SettingsModule } from '@/modules/Settings';
import { UsersSettingsPage } from '@/pages/Settings/Users/UsersSettingsPage';
import { BackButton } from '@/shared/components/BackButton';

export default function SettingsUsersPage() {
  return (
    <SettingsModule>
      <div className="space-y-6">
        <BackButton to="/settings" label="Voltar às Configurações" />
        <UsersSettingsPage />
      </div>
    </SettingsModule>
  );
}