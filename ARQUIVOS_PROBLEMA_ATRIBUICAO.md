# ARQUIVOS ENVOLVIDOS NO PROBLEMA DE ATRIBUIÇÃO EM MASSA

## PROBLEMA CRÍTICO
Quando transfere uma conversa (ex: Ruben para Jade), outra conversa (ex: Ricardo) também é transferida automaticamente.

## ARQUIVOS PRINCIPAIS PARA CORREÇÃO MANUAL:

### 1. HOOKS DE MUTAÇÃO (FRONTEND)
```
client/src/modules/Inbox/components/ConversationAssignment/hooks/useAssignmentMutations.ts
```
- Contém as mutações useTeamAssignment e useUserAssignment
- Problema: invalidação de cache muito ampla
- Linha crítica: queryClient.invalidateQueries()

### 2. COMPONENTES DE SELEÇÃO (FRONTEND)
```
client/src/modules/Inbox/components/ConversationAssignment/components/TeamSelector.tsx
client/src/modules/Inbox/components/ConversationAssignment/components/UserSelector.tsx
```
- Fazem as chamadas para as mutações
- Problema: múltiplas instâncias executando simultaneamente

### 3. ROTAS DE ATRIBUIÇÃO (BACKEND)
```
server/routes/conversations/assignTeam.ts
server/routes/conversations/assignUser.ts
```
- Endpoints que processam as atribuições
- Problema: podem estar processando múltiplas conversas

### 4. OPERAÇÕES DE STORAGE (BACKEND)
```
server/storage/modules/conversationAssignmentOperations.ts
server/storage/modules/conversationBasicOperations.ts
```
- Lógica de atribuição no banco de dados
- Problema: WHERE clause pode estar afetando múltiplas conversas

### 5. BROADCAST WEBSOCKET (BACKEND)
```
server/routes/conversations/assignTeam.ts (linhas do socket.broadcast)
server/routes/conversations/assignUser.ts (linhas do socket.broadcast)
```
- Envia notificações de atribuição
- Problema: pode estar enviando para conversas erradas

### 6. STORE DE CONVERSAS (FRONTEND)
```
client/src/stores/useConversationStore.ts
```
- Gerencia estado das conversas
- Problema: método updateActiveConversationAssignment pode estar afetando múltiplas conversas

## CAUSA RAIZ PROVÁVEL:
1. **Cache invalidation muito ampla**: queryClient.invalidateQueries sem especificidade
2. **Múltiplas instâncias**: Vários componentes executando simultaneamente
3. **WHERE clause incorreta**: Consultas SQL afetando múltiplas conversas
4. **WebSocket broadcast**: Enviando para todas as conversas ao invés de uma específica

## VERIFICAÇÕES IMEDIATAS:
1. Verificar se as queries SQL usam WHERE conversation_id = $1 específico
2. Verificar se os WebSocket broadcasts incluem conversationId específico
3. Verificar se a invalidação de cache é específica por conversa
4. Verificar se não há loops de re-renderização causando múltiplas chamadas

## CAUSA RAIZ IDENTIFICADA:
**MÚLTIPLAS CONEXÕES WEBSOCKET SIMULTÂNEAS**

Nos logs do console, vemos:
```
🔌 Socket.IO conectado (múltiplas vezes)
🔌 Desconectado: io client disconnect (múltiplas vezes)
```

Isso indica que:
1. Múltiplas instâncias dos componentes estão sendo criadas
2. Cada instância se conecta ao WebSocket
3. Quando uma atribuição é feita, TODAS as instâncias recebem o broadcast
4. Cada instância executa a mutação, causando atribuições em massa

## ARQUIVOS CRÍTICOS PARA CORREÇÃO IMEDIATA:

### 1. COMPONENTE PRINCIPAL DA CONVERSA (MAIS CRÍTICO)
```
client/src/modules/Inbox/components/ConversationView/ConversationView.tsx
```
- Múltiplas instâncias sendo renderizadas
- Cada uma criando conexões WebSocket separadas

### 2. HOOK DE WEBSOCKET (CRÍTICO)
```
client/src/hooks/useWebSocket.ts
client/src/modules/Inbox/hooks/useConversationWebSocket.ts
```
- Múltiplas conexões sendo criadas
- Falta de cleanup adequado

### 3. STORE DE CONVERSAS (CRÍTICO)
```
client/src/stores/useConversationStore.ts
```
- Estado sendo duplicado entre instâncias
- Método updateActiveConversationAssignment executando múltiplas vezes

## SOLUÇÃO IMEDIATA:
1. **Adicionar key única** nos componentes para evitar duplicação
2. **Singleton pattern** para conexões WebSocket
3. **Debounce** nas mutações de atribuição
4. **Cleanup** de listeners WebSocket ao desmontar componentes

## PRIORIDADE DE CORREÇÃO:
1. **URGENTE**: Corrigir múltiplas conexões WebSocket
2. **CRÍTICO**: Implementar debounce nas mutações ✅ FEITO
3. **IMPORTANTE**: Revisar renderização de componentes

## STATUS DAS CORREÇÕES:
✅ Sistema de debounce global implementado
✅ Proteção contra múltiplas chamadas simultâneas 
✅ Invalidação específica de cache
❌ **PROBLEMA PERSISTE** - Necessário investigar mais profundamente

## 🔍 DESCOBERTA CRÍTICA CONFIRMADA:
**CAUSA RAIZ IDENTIFICADA** - Estado do cabeçalho persistindo globalmente

### Arquivo: `client/src/modules/Inbox/components/ConversationAssignment/index.tsx`
**Linhas 14-15:**
```typescript
const [localTeamId, setLocalTeamId] = useState(currentTeamId);
const [localUserId, setLocalUserId] = useState(currentUserId);
```

### 🚨 O PROBLEMA:
1. Estados locais (`localTeamId`, `localUserId`) são inicializados apenas UMA VEZ
2. Quando muda de conversa, os states NÃO são atualizados com os novos props
3. Estado "contamina" entre conversas diferentes
4. Resultado: atribuição afeta múltiplas conversas simultaneamente

### 🔧 SOLUÇÃO IMPLEMENTADA: ✅
Adicionado `useEffect` para sincronizar states locais com props quando conversa muda:

```typescript
useEffect(() => {
  console.log(`🔄 ConversationAssignment: Sincronizando estados para conversa ${conversationId}`, {
    currentTeamId,
    currentUserId,
    previousLocalTeamId: localTeamId,
    previousLocalUserId: localUserId
  });
  
  setLocalTeamId(currentTeamId);
  setLocalUserId(currentUserId);
}, [conversationId, currentTeamId, currentUserId]);
```

### 📍 STATUS:
- ✅ **CORREÇÃO APLICADA**: useEffect implementado
- 🔄 **EM TESTE**: Aguardando validação do usuário
- 🎯 **RESULTADO ESPERADO**: Estados agora sincronizam ao trocar conversas
- 📊 **LOGS ATIVADOS**: Console mostra sincronização em tempo real