import { MessageCircle, Phone, Mail, Globe } from 'lucide-react';

interface ChannelIconProps {
  channel: string;
  className?: string;
}

export function ChannelIcon({ channel, className = "w-4 h-4" }: ChannelIconProps) {
  switch (channel?.toLowerCase()) {
    case 'whatsapp':
      return <MessageCircle className={`text-green-600 ${className}`} />;
    case 'telegram':
      return <MessageCircle className={`text-blue-500 ${className}`} />;
    case 'phone':
      return <Phone className={`text-gray-600 ${className}`} />;
    case 'email':
      return <Mail className={`text-red-500 ${className}`} />;
    case 'web':
      return <Globe className={`text-purple-500 ${className}`} />;
    default:
      return <MessageCircle className={`text-gray-400 ${className}`} />;
  }
}