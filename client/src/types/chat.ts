import type { Contact, Conversation, Message, ContactTag, ConversationWithContact, ContactWithTags } from "@shared/schema";

export type { Contact, Conversation, Message, ContactTag, ConversationWithContact, ContactWithTags };

export interface TypingIndicator {
  conversationId: number;
  isTyping: boolean;
  timestamp: Date;
}

export interface WebSocketMessage {
  type: 'new_message' | 'typing' | 'join_conversation' | 'send_message' | 'online_status' | 'status_update';
  conversationId?: number;
  message?: Message;
  isTyping?: boolean;
  contactId?: number;
  isOnline?: boolean;
  status?: ConversationStatus;
}

export interface ChatState {
  conversations: ConversationWithContact[];
  activeConversation: ConversationWithContact | null;
  messages: Record<number, Message[]>;
  typingIndicators: Record<number, TypingIndicator>;
  isConnected: boolean;
  selectedContactId: number | null;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ChannelInfo {
  type: 'whatsapp' | 'instagram' | 'facebook' | 'email';
  icon: string;
  color: string;
  name: string;
  label: string;
}

export const CHANNELS: Record<string, ChannelInfo> = {
  whatsapp: {
    type: 'whatsapp',
    icon: 'fab fa-whatsapp',
    color: 'text-green-500',
    name: 'WhatsApp',
    label: 'WhatsApp'
  },
  instagram: {
    type: 'instagram',
    icon: 'fab fa-instagram',
    color: 'text-pink-500',
    name: 'Instagram',
    label: 'Instagram'
  },
  facebook: {
    type: 'facebook',
    icon: 'fab fa-facebook-messenger',
    color: 'text-blue-600',
    name: 'Facebook',
    label: 'Facebook'
  },
  email: {
    type: 'email',
    icon: 'fas fa-envelope',
    color: 'text-gray-500',
    name: 'Email',
    label: 'Email'
  }
};

export type ConversationStatus = 'open' | 'pending' | 'resolved' | 'closed' | 'new' | 'in_progress';

export const STATUS_CONFIG: Record<ConversationStatus, { color: string; bgColor: string; label: string }> = {
  open: {
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    label: 'Ativa'
  },
  pending: {
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    label: 'Aguardando'
  },
  resolved: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    label: 'Resolvida'
  },
  closed: {
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    label: 'Encerrada'
  },
  new: {
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    label: 'Nova'
  },
  in_progress: {
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    label: 'Em Andamento'
  }
};
