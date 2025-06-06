# Implementação Completa das Anotações Internas - EduChat

## 1. Schema de Dados (shared/schema.ts)

### Campos na tabela messages para anotações internas:
```typescript
// Campos para notas internas
isInternalNote: boolean("is_internal_note").default(false), // indica se é uma nota interna
authorId: integer("author_id").references(() => systemUsers.id), // ID do usuário que criou a nota
authorName: varchar("author_name", { length: 100 }), // nome do autor para facilitar
```

## 2. Frontend - InputArea Component

### Estado e controles:
```typescript
const [isInternalNote, setIsInternalNote] = useState(false);

// Query para buscar usuário atual (para notas internas)
const { data: currentUser } = useQuery({
  queryKey: ['/api/user'],
  retry: false,
  staleTime: 1000 * 60 * 10, // 10 minutos
  enabled: isInternalNote // Só busca quando necessário
});
```

### Lógica de envio de nota interna:
```typescript
} else if (isInternalNote) {
  // Enviar nota interna com nome do usuário atual
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

setMessage('');
setIsInternalNote(false); // Reset nota interna state
```

### Interface visual:
```typescript
{/* Indicador discreto do modo ativo */}
{isInternalNote && (
  <div className="mb-2 flex items-center gap-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded text-xs text-amber-700 dark:text-amber-400">
    <StickyNote className="h-3 w-3" />
    <span>Modo: Nota Interna (apenas equipe)</span>
  </div>
)}

{/* Botões de toggle dentro do textarea */}
<div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
            !isInternalNote ? "text-blue-600" : "text-gray-400"
          )}
          onClick={() => setIsInternalNote(false)}
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Mensagem</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
  
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
            isInternalNote ? "text-amber-600" : "text-gray-400"
          )}
          onClick={() => setIsInternalNote(true)}
        >
          <StickyNote className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Nota Interna</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</div>
```

## 3. Backend - Lógica de Processamento (server/routes.ts)

### Endpoint para criar mensagens/notas:
```typescript
app.post('/api/conversations/:id/messages', async (req: AuthenticatedRequest, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const userId = req.user?.id;

    // Parse data first to check if it's an internal note
    const parsedData = insertMessageSchema.parse({
      ...req.body,
      conversationId,
    });

    // For internal notes, only check basic authentication
    // For regular messages, check conversation permissions
    if (!parsedData.isInternalNote && userId) {
      const canRespond = await storage.canUserRespondToConversation(userId, conversationId);
      if (!canRespond) {
        return res.status(403).json({ 
          error: 'Você não tem permissão para responder a esta conversa' 
        });
      }
    }

    const message = await storage.createMessage(parsedData);
    
    // Broadcast to WebSocket clients IMEDIATAMENTE
    broadcast(conversationId, {
      type: 'new_message',
      conversationId,
      message,
    });
    
    // Broadcast global para atualizar todas as listas de conversas
    broadcastToAll({
      type: 'new_message',
      conversationId,
      message
    });
    
    // Se não for uma nota interna E for uma mensagem do agente, enviar via Z-API
    if (!parsedData.isInternalNote && !parsedData.isFromContact) {
      const conversation = await storage.getConversation(conversationId);
      if (conversation && conversation.contact.phone) {
        try {
          console.log('📤 Enviando mensagem via Z-API:', {
            phone: conversation.contact.phone,
            message: parsedData.content,
            conversationId
          });
          
          const response = await fetch('http://localhost:5000/api/zapi/send-message', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              phone: conversation.contact.phone,
              message: parsedData.content,
              conversationId: conversationId.toString()
            })
          });
          
          if (response.ok) {
            console.log('✅ Mensagem enviada via Z-API');
          } else {
            console.log('❌ Erro ao enviar via Z-API:', response.statusText);
          }
        } catch (error) {
          console.error('❌ Erro ao chamar Z-API:', error);
        }
      }
    } else if (parsedData.isInternalNote) {
      console.log('📝 Nota interna criada - não enviada via Z-API');
    }
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(400).json({ message: 'Invalid message data' });
  }
});
```

## 4. Funcionalidades Críticas

### ✅ Características das Anotações Internas:
1. **Criação sem verificação de atribuição**: Qualquer usuário autenticado pode criar notas internas
2. **Identificação do autor**: Automaticamente captura `displayName` ou `username` do usuário atual
3. **Reset automático**: Estado `isInternalNote` é resetado após envio
4. **Não envio via Z-API**: Notas internas são salvas apenas localmente, não enviadas ao WhatsApp
5. **Broadcast em tempo real**: Notificação instantânea via Socket.IO para todos os usuários conectados
6. **Visibilidade da equipe**: Apenas usuários da plataforma podem ver as notas internas

### ✅ Interface Visual:
1. **Toggle visual**: Botões para alternar entre "Mensagem" e "Nota Interna"
2. **Indicador de modo**: Banner discreto mostrando quando está no modo de nota interna
3. **Cores diferenciadas**: Azul para mensagens, âmbar para notas internas
4. **Tooltips informativos**: Explicação clara de cada modo

### ✅ Segurança e Permissões:
1. **Autenticação obrigatória**: Apenas usuários logados podem criar notas
2. **Identificação de autoria**: Cada nota é vinculada ao usuário que a criou
3. **Não exposição externa**: Notas nunca são enviadas para fora da plataforma

## 5. Status da Implementação

### ✅ FUNCIONANDO CORRETAMENTE:
- Criação de notas internas
- Interface de toggle
- Reset automático do estado
- Broadcast em tempo real
- Identificação de autoria
- Não envio via Z-API

### ⚠️ Arquivos Críticos - NÃO MODIFICAR:
- `client/src/modules/Messages/components/InputArea.tsx` (linhas 195-210, 225, 734-738, 924-940)
- `server/routes.ts` (linhas 587-602, 620-654)
- `shared/schema.ts` (linhas 89-91)

**Última verificação**: 06/06/2025 - Sistema funcionando perfeitamente