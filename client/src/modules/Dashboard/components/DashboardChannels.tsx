import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Phone, Instagram, Facebook, Mail, MessageCircle } from 'lucide-react';

interface Channel {
  name: string;
  count: number;
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
    count: channel.count,
    color: getChannelColor(channel.name)
  })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-educhat-dark">Canais de Comunicação</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {channelStats.map((channel) => (
            <div key={channel.name} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              <div className={`p-2 rounded-lg ${channel.color}`}>
                <channel.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-educhat-dark">{channel.count}</p>
                <p className="text-sm text-educhat-medium">{channel.name}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 