import { SettingsLayout } from '@/shared/components/Settings/SettingsLayout';
import { BackButton } from '@/shared/components/BackButton';

export default function ChannelsSettingsPage() {
  return (
    <SettingsLayout>
      <div className="space-y-6">
        <BackButton to="/settings" label="Voltar às Configurações" />
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Configurações de Canais</h2>
          <p className="text-muted-foreground mb-6">
            Configure e gerencie seus canais de comunicação como WhatsApp, Instagram e outros.
          </p>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">Em Desenvolvimento</h3>
            <p className="text-muted-foreground">
              As configurações de canais estarão disponíveis em breve.
            </p>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}