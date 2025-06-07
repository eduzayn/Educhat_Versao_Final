# Auditoria de Rotas e Navegação - EduChat

## Rotas Implementadas no App.tsx

### Rotas Públicas
- `/login` → Login (redirecionamento automático para não autenticados)

### Rotas Protegidas
- `/` → Dashboard (página inicial)
- `/inbox` → InboxPageRefactored (caixa de entrada)
- `/contacts` → ContactsPageRefactored (gestão de contatos)
- `/crm` → CRMPage (gestão de vendas)
- `/bi` → BIPage (requer admin/gerente)
- `/reports` → ReportsPage (relatórios)
- `/integrations` → IntegrationsPage (requer admin/gerente)
- `/chat-interno` → InternalChatPage (chat interno)
- `/profile` → ProfilePage (perfil do usuário)
- `/admin` → PermissionsPanel (administração)
- `/admin/permissions` → PermissionsPanel (permissões)

### Subpáginas de Settings
- `/settings` → SettingsPage (página de configurações principal)
- `/settings/channels` → ChannelsPage (canais de comunicação)
- `/settings/users` → UsersSettingsPage (gestão de usuários)
- `/settings/quick-replies` → QuickRepliesSettingsPage (respostas rápidas)
- `/settings/webhooks` → WebhookConfigPage (configuração webhook)
- `/settings/ai-detection` → AIDetectionSettingsPage (detecção IA)

## Problemas Identificados

### 1. Inconsistências de Links em SettingsPage.tsx
- Link para `/settings/webhook` mas rota é `/settings/webhooks`
- Links para páginas não implementadas:
  - `/settings/company`
  - `/settings/integrations`
  - `/settings/notifications`
  - `/settings/security`

### 2. Estrutura de Pastas vs Rotas
- Existem pastas para: General, Integrations, Security, System
- Mas não há rotas correspondentes implementadas

### 3. Navegação com href vs useLocation
- SettingsPage usa href em vez do sistema de roteamento do Wouter

## Páginas Faltantes (Identificadas mas não implementadas)
1. Company Settings (`/settings/company`)
2. Integration Settings (`/settings/integrations`)
3. Notification Settings (`/settings/notifications`)
4. Security Settings (`/settings/security`)
5. System Settings (`/settings/system`)
6. General Settings (`/settings/general`)

## Correções Necessárias
1. Corrigir links em SettingsPage.tsx
2. Implementar páginas faltantes ou remover links órfãos
3. Padronizar navegação usando useLocation do Wouter
4. Adicionar breadcrumbs para melhor UX
5. Validar hierarquia de permissões