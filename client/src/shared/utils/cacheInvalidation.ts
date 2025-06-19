/**
 * Sistema de invalidação de cache para resolver problemas de sincronização
 * entre diferentes dispositivos e sessões
 */

export const CACHE_KEYS = {
  FILTERS_VERSION: 'educhat_filters_version',
  TEAMS_DATA: 'educhat_teams_cache',
  AGENTS_DATA: 'educhat_agents_cache',
  LAST_SYNC: 'educhat_last_sync'
} as const;

export const CURRENT_VERSION = '2.0.0-filters-fix';

/**
 * Verifica se o cache está desatualizado
 */
export function isCacheOutdated(): boolean {
  const storedVersion = localStorage.getItem(CACHE_KEYS.FILTERS_VERSION);
  return storedVersion !== CURRENT_VERSION;
}

/**
 * Força a invalidação completa do cache
 */
export function forceInvalidateCache(): void {
  console.log('🔄 [CACHE] Forçando invalidação completa do cache');
  
  // Remove todos os dados de cache relacionados aos filtros
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Marca nova versão
  localStorage.setItem(CACHE_KEYS.FILTERS_VERSION, CURRENT_VERSION);
  localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
  
  console.log('✅ [CACHE] Cache invalidado com sucesso, versão:', CURRENT_VERSION);
}

/**
 * Adiciona timestamp para forçar refresh de queries
 */
export function getCacheBuster(): string {
  return `?v=${CURRENT_VERSION}&t=${Date.now()}`;
}

/**
 * Detecta se é um dispositivo diferente e força limpeza
 */
export function checkDeviceAndInvalidate(): boolean {
  const currentDevice = `${navigator.userAgent.slice(0, 50)}-${screen.width}x${screen.height}`;
  const storedDevice = localStorage.getItem('educhat_device_id');
  
  if (!storedDevice || storedDevice !== currentDevice) {
    console.log('🔍 [CACHE] Dispositivo diferente detectado, invalidando cache');
    forceInvalidateCache();
    localStorage.setItem('educhat_device_id', currentDevice);
    return true;
  }
  
  return false;
}