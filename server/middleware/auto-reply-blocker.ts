/**
 * Middleware para bloquear mensagens automáticas indesejadas
 * Previne mensagens sobre não receber ligações
 */

import { storage } from '../storage';

interface MessageToBlock {
  patterns: string[];
  source: string;
  reason: string;
}

const BLOCKED_MESSAGE_PATTERNS: MessageToBlock[] = [
  {
    patterns: [
      'não recebe ligações',
      'não aceita ligações',
      'não aceita chamadas',
      'esta conversa não recebe ligações',
      'esta conversa não aceita chamadas',
      'somente mensagens de texto',
      'apenas mensagens de texto'
    ],
    source: 'auto_reply',
    reason: 'Mensagem automática sobre restrição de ligações'
  },
  {
    patterns: [
      'horário de atendimento',
      'fora do horário',
      'retornaremos em breve'
    ],
    source: 'offline_auto_reply',
    reason: 'Mensagem automática de horário'
  }
];

export class AutoReplyBlocker {
  
  /**
   * Verifica se uma mensagem deve ser bloqueada
   */
  async shouldBlockMessage(content: string, conversationId?: number): Promise<{ blocked: boolean; reason?: string }> {
    try {
      // Por enquanto, não bloquear mensagens até configurar o sistema adequadamente
      // TODO: Implementar verificação de configurações quando storage.system estiver disponível
      const autoReplyEnabled = false; // Desabilitado por padrão para segurança
      
      if (!autoReplyEnabled) {
        // Sistema de auto-reply desabilitado - não bloquear mensagens normais
        return { blocked: false };
      }
      
      const contentLower = content.toLowerCase();
      
      // Verificar padrões bloqueados apenas se auto-reply estiver ativo
      for (const blockedPattern of BLOCKED_MESSAGE_PATTERNS) {
        for (const pattern of blockedPattern.patterns) {
          if (contentLower.includes(pattern.toLowerCase())) {
            console.log(`🚫 [AUTO-REPLY-BLOCKER] Mensagem bloqueada: "${pattern}" - ${blockedPattern.reason}`);
            return { 
              blocked: true, 
              reason: `${blockedPattern.reason}: "${pattern}"` 
            };
          }
        }
      }
      
      return { blocked: false };
      
    } catch (error) {
      console.error('❌ Erro ao verificar bloqueio de mensagem:', error);
      // Em caso de erro, não bloquear para não interromper fluxo
      return { blocked: false };
    }
  }
  
  /**
   * Bloqueia tentativa de envio de resposta automática
   */
  async blockAutoReply(conversationId: number, originalContent: string, reason: string): Promise<void> {
    try {
      console.log(`🛡️ [AUTO-REPLY-BLOCKER] BLOQUEADO: Conversa ${conversationId} - ${reason}`);
      
      // Log simples por enquanto
      console.log(`📝 [AUTO-REPLY-BLOCKER] Bloqueio registrado para conversa ${conversationId}: ${reason}`);
      
    } catch (error) {
      console.error('❌ Erro ao registrar bloqueio:', error);
    }
  }
}

export const autoReplyBlocker = new AutoReplyBlocker();