# Sistema de Notas Internas - EduChat

## ⚠️ COMPONENTES CRÍTICOS - NÃO MODIFIQUE

### Arquivos Protegidos das Notas Internas

#### Frontend
1. **client/src/modules/Messages/components/InputArea.tsx**
   - Linhas 195-210: Lógica de envio de notas internas
   - Linha 225: Reset do estado isInternalNote
   - Botão de nota interna com ícone StickyNote

2. **client/src/pages/Inbox/InboxPageRefactored.tsx**
   - Seção "Notas internas" no painel lateral
   - Dialog para criação de novas notas
   - Exibição das notas existentes

3. **client/src/shared/lib/hooks/useMessages.ts**
   - Hook de gerenciamento de mensagens
   - Integração com notas internas

#### Backend
4. **server/routes.ts**
   - Endpoint POST `/api/conversations/:id/messages`
   - Linhas 587-602: Lógica de permissões para notas internas
   - Linhas 620-654: Processamento diferenciado (não envia via Z-API)

5. **shared/schema.ts**
   - Tabela messages com campos:
     - `isInternalNote: boolean`
     - `authorId: integer`
     - `authorName: varchar(100)`

### Funcionalidades Críticas
- ✅ Criação de notas sem verificação de atribuição de conversa
- ✅ Identificação do autor (displayName/username)
- ✅ Reset automático do estado após envio
- ✅ Não envio via Z-API (apenas salvamento local)
- ✅ Broadcast em tempo real via Socket.IO

### Status Atual: FUNCIONANDO CORRETAMENTE
- Última verificação: 06/06/2025 02:37
- Teste confirmado com usuário ID 57 (Administrador EduChat)
- Mensagem ID 7304 criada com sucesso

### Backup das Configurações Críticas
```typescript
// InputArea.tsx - Envio de nota interna
if (isInternalNote) {
  const authorName = currentUser?.displayName || currentUser?.username || 'Usuário';
  
  await sendMessageMutation.mutateAsync({
    conversationId: activeConversation.id,
    message: {
      content: message.trim(),
      isFromContact: false,
      messageType: 'text',
      isInternalNote: true,
      authorName: authorName,
      authorId: currentUser?.id,
    },
    contact: activeConversation.contact,
  });
}

// routes.ts - Lógica de permissões
if (!parsedData.isInternalNote && userId) {
  const canRespond = await storage.canUserRespondToConversation(userId, conversationId);
  if (!canRespond) {
    return res.status(403).json({ 
      error: 'Você não tem permissão para responder a esta conversa' 
    });
  }
}
```

### Alterações Recentes Realizadas
1. Corrigido problema de permissões (notas internas não precisam de conversa atribuída)
2. Uso de dados reais do usuário autenticado em vez de hardcoded
3. Reset automático do estado isInternalNote após envio
4. Correção das referências validatedData para parsedData no backend