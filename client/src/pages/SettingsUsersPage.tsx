import { SettingsModule } from '@/modules/Settings';
import { UsersSettings } from '@/modules/Settings/UsersSettings';
import { BackButton } from '@/shared/components/BackButton';

export default function SettingsUsersPage() {
  return (
    <SettingsModule>
      <div className="space-y-6">
        <BackButton to="/settings" label="Voltar às Configurações" />
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Usuários e Equipes</h2>
            <p className="text-muted-foreground">
              Gerencie usuários, permissões e organize equipes de trabalho
            </p>
          </div>
        </div>
        
        <UsersSettings />
      </div>
    </SettingsModule>
  );
}