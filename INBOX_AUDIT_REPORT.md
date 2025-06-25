# Auditoria da Caixa de Entrada - Problemas Identificados

## 🔴 Problemas Críticos Encontrados

### 1. Performance de Carregamento de Mensagens
- **Problema**: Queries sequenciais individuais para cada conversa (loop O(n))
- **Impacto**: 26 segundos para carregar mensagens de uma única conversa
- **Localização**: `server/storage/modules/conversationStorage.ts:62-80`

### 2. Duplicação de Polling/WebSocket
- **Problema**: Múltiplos sistemas de atualização conflitantes
- **Componentes duplicados**:
  - `useConversations` com polling a cada 10 segundos
  - `useWebSocket` com invalidações automáticas
  - Polling manual a cada 5 segundos no InboxPage
- **Impacto**: Requisições excessivas (3x mais que necessário)

### 3. Cache Invalidation Agressivo
- **Problema**: Cache configurado com `staleTime: 0` forçando recarregamentos
- **Impacto**: Requisições desnecessárias a cada render

### 4. WebSocket Events Duplicados
- **Problema**: `broadcast_message` e eventos específicos processados em paralelo
- **Impacto**: Mensagens processadas múltiplas vezes

### 5. Message Bubble Display Issues
- **Problema**: Mensagens Z-API não aparecem devido a problemas de serialização
- **Localização**: `client/src/pages/Inbox/components/ConversationList.tsx:90-130`

## 🟡 Problemas Secundários

### 6. Stores Duplicados
- **Chat Store**: `client/src/shared/store/chatStore.ts`
- **Internal Chat Store**: `client/src/pages/InternalChat/store/internalChatStore.ts`
- **Backup Stores**: `backups/internal-chat-production/store/internalChatStore.ts`

### 7. Hook Redundancy
- Múltiplos hooks fazendo chamadas similares
- `useMessages`, `useConversations`, `useUnreadCount` com overlap

## 📋 Plano de Correção
1. Otimizar queries do banco (JOIN único)
2. Consolidar sistema de atualização em tempo real
3. Configurar cache inteligente
4. Limpar eventos WebSocket duplicados
5. Corrigir serialização de mensagens
6. Remover componentes duplicados