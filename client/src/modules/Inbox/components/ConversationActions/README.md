# ConversationActions - Componente Modular

Sistema modular de ações para conversas no EduChat, refatorado para melhor manutenção e escalabilidade.

## Estrutura

```
ConversationActions/
├── index.tsx                 # Componente principal
├── types.ts                  # Definições de tipos TypeScript
├── config.ts                 # Configuração das ações (array-based)
├── useConversationActions.ts # Hook customizado para lógica
├── ConversationActionItem.tsx # Componente individual de ação
├── exports.ts                # Exportações centralizadas
└── README.md                 # Esta documentação
```

## Principais Melhorias

### ✅ Configuração Baseada em Array
- Ações definidas como objetos em array configurável
- Fácil adição/remoção de funcionalidades
- Separação clara entre lógica e apresentação

### ✅ Conexão com Endpoints Reais
- Integração direta com APIs existentes do sistema
- Suporte a todos os métodos HTTP (GET, POST, PATCH, DELETE)
- Substituição automática de placeholders nas URLs

### ✅ Estados de Loading e Feedback
- Loading states individuais por ação
- Tooltips informativos
- Mensagens de sucesso/erro personalizadas
- Diálogos de confirmação para ações perigosas

### ✅ Validação e Visibilidade Condicional
- Ações podem ser habilitadas/desabilitadas condicionalmente
- Visibilidade baseada em status da conversa
- Validação de permissões e estados

## Endpoints Conectados

### Status da Conversa
- `POST /api/conversations/{conversationId}/mark-unread`
- `PATCH /api/conversations/{conversationId}/status`

### Atribuições
- `POST /api/conversations/{conversationId}/assign`
- `POST /api/conversations/{conversationId}/follow`

### Funcionalidades Avançadas
- `POST /api/conversations/{conversationId}/sync-history`
- `GET /api/conversations/{conversationId}/export`
- `GET /api/conversations/{conversationId}/details`

### Ações de Segurança
- `POST /api/contacts/{contactId}/block`

## Como Usar

```tsx
import { ConversationActionsDropdown } from '@/modules/Inbox/components/ConversationActions';

<ConversationActionsDropdown
  conversationId={conversation.id}
  contactId={conversation.contactId}
  currentStatus={conversation.status}
  onActionComplete={(actionId, result) => {
    console.log(`Ação ${actionId} completada:`, result);
  }}
/>
```

## Adicionando Novas Ações

1. **Adicione a ação no config.ts:**
```tsx
{
  id: 'nova-acao',
  label: 'Nova Ação',
  icon: IconName,
  color: 'text-blue-600',
  group: 'actions',
  endpoint: '/api/conversations/{conversationId}/nova-acao',
  method: 'POST',
  tooltip: 'Descrição da nova ação',
  loadingMessage: 'Executando nova ação...',
  successMessage: 'Nova ação executada com sucesso',
  errorMessage: 'Erro ao executar nova ação'
}
```

2. **Implemente o endpoint no backend**
3. **Teste a funcionalidade**

## Grupos de Ações

- **status**: Mudanças de status da conversa
- **actions**: Ações regulares do usuário  
- **advanced**: Funcionalidades avançadas
- **danger**: Ações perigosas (requerem confirmação)

## Benefícios da Modularização

- **Manutenção**: Código organizado em módulos especializados
- **Reutilização**: Componentes podem ser reutilizados em outros contextos
- **Testabilidade**: Cada módulo pode ser testado independentemente
- **Escalabilidade**: Fácil adição de novas funcionalidades
- **TypeScript**: Tipagem forte em toda a aplicação