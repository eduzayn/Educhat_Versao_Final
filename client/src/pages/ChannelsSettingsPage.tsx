import { SettingsModule } from '@/modules/Settings';
import { ChannelsSettingsModule } from '@/modules/Settings/ChannelsSettings';

export default function ChannelsSettingsPage() {
  return (
    <SettingsModule>
      <ChannelsSettingsModule />
    </SettingsModule>
  );
}