import { SettingsModule } from '@/modules/Settings';
import { ChannelsSettingsModule } from '@/modules/Settings/ChannelsSettings';
import { BackButton } from '@/shared/components/BackButton';

export default function ChannelsSettingsPage() {
  return (
    <SettingsModule>
      <div className="space-y-6">
        <BackButton to="/settings" label="Voltar às Configurações" />
        <ChannelsSettingsModule />
      </div>
    </SettingsModule>
  );
}