export interface MessageClassification {
  intent: 'lead_generation' | 'student_support' | 'complaint' | 'general_info' | 'spam' | 'course_inquiry' | 'technical_support' | 'financial';
  sentiment: 'positive' | 'neutral' | 'negative' | 'frustrated' | 'excited';
  confidence: number; // 0-100
  isLead: boolean;
  isStudent: boolean;
  frustrationLevel: number; // 0-10
  urgency: 'low' | 'medium' | 'high' | 'critical';
  suggestedTeam: 'comercial' | 'suporte' | 'pedagogico' | 'financeiro' | 'supervisao';
  aiMode: 'mentor' | 'consultora';
  contextKeywords: string[];
  userProfile: {
    type: 'lead' | 'student' | 'visitor' | 'unknown';
    stage: string;
    interests: string[];
  };
}

export interface AIResponse {
  message: string;
  classification: MessageClassification;
  shouldHandoff: boolean;
  handoffReason?: string;
  suggestedActions: string[];
  processingTime: number;
  contextUsed: string[];
}

export interface MemoryData {
  sessionId?: number;
  conversationId: number;
  contactId: number;
  memoryType: 'user_info' | 'preferences' | 'context' | 'history';
  key: string;
  value: string;
  confidence?: number;
  source?: string;
  expiresAt?: Date;
}

export interface LogData {
  conversationId: number;
  contactId: number;
  userMessage: string;
  aiResponse?: string;
  classification: string;
  sentiment: string;
  confidenceScore: number;
  processingTime: number;
  handoffReason?: string;
} 