import { useQuery } from '@tanstack/react-query';

export interface Channel {
  id: number;
  name: string;
  type: string;
  identifier?: string;
  description?: string;
  instanceId?: string;
  token?: string;
  clientToken?: string;
  configuration?: any;
  isActive: boolean;
  isConnected: boolean;
  lastConnectionCheck?: string;
  connectionStatus: string;
  webhookUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export function useChannels() {
  return useQuery<Channel[]>({
    queryKey: ['/api/channels'],
    select: (data) => data || []
  });
}

export function useActiveWhatsAppChannels() {
  return useQuery<Channel[]>({
    queryKey: ['/api/channels'],
    select: (data) => {
      return (data || []).filter(channel => 
        channel.type === 'whatsapp' && 
        channel.isActive &&
        channel.instanceId &&
        channel.token
      );
    }
  });
}