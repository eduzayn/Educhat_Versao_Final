import React from 'react';
import { ChannelsSettingsModule } from '@/modules/Settings/ChannelsSettings';

/**
 * Página de Configurações de Canais - Implementação Consolidada
 * 
 * Esta página agora utiliza o módulo unificado ChannelsSettingsModule
 * que oferece uma implementação mais robusta e extensível para gestão
 * de múltiplos tipos de canais de comunicação.
 */
export default function ChannelsPage() {
  return <ChannelsSettingsModule />;
}