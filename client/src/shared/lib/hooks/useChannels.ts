import { useQuery } from '@tanstack/react-query';

export interface Channel {
  id: number;
  name: string;
  type: string;
  identifier: string | null;
  description: string | null;
  instanceId: string | null;
  token: string | null;
  clientToken: string | null;
  configuration: unknown;
  isActive: boolean;
  isConnected: boolean;
  lastConnectionCheck: Date | null;
  connectionStatus: string;
  webhookUrl: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export function useChannels() {
  return useQuery<Channel[]>({
    queryKey: ['/api/channels'],
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useChannelById(channelId: number | null | undefined) {
  const { data: channels } = useChannels();
  
  if (!channelId || !channels) return null;
  
  return channels.find(channel => channel.id === channelId) || null;
}