import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Phone, Instagram, Facebook, Mail, MessageCircle } from 'lucide-react';

interface Channel {
  name: string;
  conversations: number;
  uniqueContacts: number;
  status: string;
}

interface DashboardChannelsProps {
  channels: Channel[];
}

export function DashboardChannels({ channels }: DashboardChannelsProps) {
  const getChannelIcon = (name: string) => {
    switch (name?.toLowerCase()) {
      case 'whatsapp':
      case 'whatsapp-1':
        return Phone;
      case 'instagram':
        return Instagram;
      case 'facebook':
        return Facebook;
      case 'email':
        return Mail;
      default:
        return MessageCircle;
    }
  };

  const getChannelColor = (name: string) => {
    switch (name?.toLowerCase()) {
      case 'whatsapp':
      case 'whatsapp-1':
        return 'bg-green-100 text-green-800';
      case 'instagram':
        return 'bg-pink-100 text-pink-800';
      case 'facebook':
        return 'bg-blue-100 text-blue-800';
      case 'email':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  };

  const channelStats = (Array.isArray(channels) ? channels : [])?.map(channel => ({
    name: channel.name === 'whatsapp-1' ? 'WhatsApp (Alt)' : 
          channel.name.charAt(0).toUpperCase() + channel.name.slice(1),
    icon: getChannelIcon(channel.name),
    count: channel.conversations,
    uniqueContacts: channel.uniqueContacts,
    color: getChannelColor(channel.name)
  })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-educhat-dark">Canais de Comunicação</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channelStats.map((channel) => (
            <div key={channel.name} className="flex items-center space-x-3 p-4 rounded-lg bg-gray-50 border">
              <div className={`p-3 rounded-lg ${channel.color}`}>
                <channel.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-educhat-dark">{channel.count}</p>
                <p className="text-sm font-medium text-educhat-dark">{channel.name}</p>
                <p className="text-xs text-educhat-medium">{channel.uniqueContacts} contatos únicos</p>
              </div>
            </div>
          ))}
          {channelStats.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum canal configurado</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 