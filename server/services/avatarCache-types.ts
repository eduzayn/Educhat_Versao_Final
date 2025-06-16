export interface AvatarCacheResult {
  avatarUrl: string | null;
  source: 'cache' | 'zapi' | 'fallback';
  cached: boolean;
} 