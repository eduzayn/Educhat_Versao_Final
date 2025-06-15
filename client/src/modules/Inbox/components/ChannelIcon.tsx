import { MessageSquare, Phone, Mail, Bot, Globe, Zap } from 'lucide-react';

interface ChannelIconProps {
  channel: string;
  className?: string;
}

export function ChannelIcon({ channel, className = "w-4 h-4" }: ChannelIconProps) {
  const getChannelIcon = (channel: string) => {
    switch (channel?.toLowerCase()) {
      case 'whatsapp':
        return <MessageSquare className={`${className} text-green-600`} />;
      case 'telegram':
        return <MessageSquare className={`${className} text-blue-500`} />;
      case 'phone':
      case 'call':
        return <Phone className={`${className} text-blue-600`} />;
      case 'email':
        return <Mail className={`${className} text-red-500`} />;
      case 'bot':
        return <Bot className={`${className} text-purple-600`} />;
      case 'web':
      case 'website':
        return <Globe className={`${className} text-gray-600`} />;
      case 'api':
        return <Zap className={`${className} text-yellow-600`} />;
      default:
        return <MessageSquare className={`${className} text-gray-500`} />;
    }
  };

  return getChannelIcon(channel);
}