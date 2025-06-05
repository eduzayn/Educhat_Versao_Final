# Backup Completo dos Módulos de Configurações

## Data do Backup: 2025-01-05 23:52

### Estrutura das Páginas de Configurações:

#### 1. UsersSettingsPage.tsx
- Gerenciamento de usuários, funções, equipes e permissões
- Sistema de tabs com navegação por URL
- Integração com componentes: UsersTab, RolesTab, TeamsTab, PermissionsTab

#### 2. ChannelsPage (Configurações de Canais)
- Integração crítica com Z-API
- Configurações de WhatsApp
- Webhooks e tokens de autenticação

#### 3. AIDetectionSettingsPage
- Configurações de detecção de IA
- Parâmetros de análise de mensagens

#### 4. QuickRepliesSettingsPage
- Respostas rápidas
- Templates de mensagens

#### 5. WebhookConfigPage
- Configurações de webhooks
- Integração com sistemas externos

### Componentes Críticos Identificados:
- TeamsTab: Criação e gerenciamento de equipes
- PermissionsTab: Sistema de permissões granulares
- RolesTab: Funções do sistema
- UsersTab: CRUD de usuários

### Funcionalidades que NÃO podem ser perdidas:
- Sistema de permissões hierárquicas
- Integração Z-API (tokens, webhooks)
- Configurações de canais de comunicação
- Sistema de equipes e macrosetores
- Detecção automática de cursos via IA