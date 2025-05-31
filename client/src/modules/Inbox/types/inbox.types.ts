export interface ChannelInfo {
  type: 'whatsapp' | 'instagram' | 'facebook' | 'email';
  icon: string;
  color: string;
  name: string;
}

export const CHANNELS: Record<string, ChannelInfo> = {
  whatsapp: {
    type: 'whatsapp',
    icon: 'fab fa-whatsapp',
    color: 'text-green-500',
    name: 'WhatsApp'
  },
  instagram: {
    type: 'instagram',
    icon: 'fab fa-instagram',
    color: 'text-pink-500',
    name: 'Instagram'
  },
  facebook: {
    type: 'facebook',
    icon: 'fab fa-facebook-messenger',
    color: 'text-blue-600',
    name: 'Facebook'
  },
  email: {
    type: 'email',
    icon: 'fas fa-envelope',
    color: 'text-gray-500',
    name: 'Email'
  }
};

export type ConversationStatus = 'open' | 'pending' | 'resolved';

export const STATUS_CONFIG: Record<ConversationStatus, { color: string; bgColor: string; label: string }> = {
  open: {
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Open'
  },
  pending: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    label: 'Pending'
  },
  resolved: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    label: 'Resolved'
  }
};