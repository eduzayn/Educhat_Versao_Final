import { SettingsModule } from '@/modules/Settings';
import { QuickRepliesSettingsModule } from '@/modules/Settings/QuickRepliesSettings';

export default function QuickRepliesSettingsPage() {
  return (
    <SettingsModule>
      <QuickRepliesSettingsModule />
    </SettingsModule>
  );
}