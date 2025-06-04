import { useQuery } from '@tanstack/react-query';
import type { Channel } from '@shared/schema';

export function useChannels() {
  return useQuery<Channel[]>({
    queryKey: ['/api/channels'],
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useChannel(id: number) {
  return useQuery<Channel>({
    queryKey: [`/api/channels/${id}`],
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}