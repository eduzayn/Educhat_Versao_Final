import { BaseFilterSelect, FilterOption } from './BaseFilterSelect';
import { MessageSquare, Instagram, Facebook, Mail } from 'lucide-react';

interface ChannelFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  channels?: any[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  includeAll?: boolean;
}

export function ChannelFilter({
  value,
  onValueChange,
  channels = [],
  className = "",
  size = 'md',
  includeAll = true
}: ChannelFilterProps) {
  const baseOptions: FilterOption[] = includeAll ? [
    { value: "all", label: "Todos os canais" }
  ] : [];

  const standardOptions: FilterOption[] = [
    { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
    { value: "instagram", label: "Instagram", icon: Instagram },
    { value: "facebook", label: "Facebook", icon: Facebook },
    { value: "email", label: "Email", icon: Mail }
  ];

  // Adicionar canais WhatsApp específicos se fornecidos
  const whatsappChannels = channels
    .filter(c => c.type === 'whatsapp' && c.isActive)
    .map(channel => ({
      value: `whatsapp-${channel.id}`,
      label: `WhatsApp ${channel.name}`,
      icon: MessageSquare
    }));

  const allOptions = [
    ...baseOptions,
    ...standardOptions,
    ...whatsappChannels
  ];

  return (
    <BaseFilterSelect
      value={value}
      onValueChange={onValueChange}
      options={allOptions}
      placeholder="Canal"
      icon={MessageSquare}
      className={className}
      size={size}
    />
  );
}