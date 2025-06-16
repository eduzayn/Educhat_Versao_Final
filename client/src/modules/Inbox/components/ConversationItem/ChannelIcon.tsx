import { memo } from 'react';
import { MessageCircle, Phone, Mail, Hash } from 'lucide-react';

interface ChannelIconProps {
  channel: string;
  className?: string;
}

const CHANNEL_ICONS = {
  whatsapp: MessageCircle,
  telefone: Phone,
  email: Mail,
  web: Hash,
  facebook: MessageCircle,
  instagram: MessageCircle,
  telegram: MessageCircle,
  default: MessageCircle,
} as const;

const CHANNEL_COLORS = {
  whatsapp: 'text-green-600',
  telefone: 'text-blue-600',
  email: 'text-gray-600',
  web: 'text-purple-600',
  facebook: 'text-blue-700',
  instagram: 'text-pink-600',
  telegram: 'text-sky-600',
  default: 'text-gray-500',
} as const;

function ChannelIconComponent({ channel, className = '' }: ChannelIconProps) {
  const channelKey = (channel?.toLowerCase() || 'default') as keyof typeof CHANNEL_ICONS;
  const Icon = CHANNEL_ICONS[channelKey] || CHANNEL_ICONS.default;
  const colorClass = CHANNEL_COLORS[channelKey] || CHANNEL_COLORS.default;
  
  return (
    <Icon 
      className={`h-4 w-4 ${colorClass} ${className}`}
      aria-label={`Canal: ${channel}`}
    />
  );
}

export const ChannelIcon = memo(ChannelIconComponent);