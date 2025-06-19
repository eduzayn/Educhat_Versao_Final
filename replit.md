# EduChat Platform

## Overview

EduChat is a comprehensive customer communication and CRM platform designed for educational institutions. The system integrates WhatsApp messaging, lead management, team collaboration, and intelligent conversation routing to streamline student acquisition and support processes.

## System Architecture

The application follows a full-stack architecture with separate client and server components:

- **Frontend**: React-based SPA with TypeScript, using Vite for build tooling
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based auth with encrypted cookies
- **Real-time**: WebSocket integration for live messaging
- **External APIs**: Z-API for WhatsApp, Anthropic for AI course detection

## Key Components

### Backend Architecture
- **Modular Storage System**: Centralized storage layer with separate modules for different entities (contacts, conversations, deals, teams)
- **Assignment Services**: Intelligent conversation and deal assignment with round-robin distribution
- **Webhook Processing**: Z-API webhook handling for incoming WhatsApp messages
- **Session Management**: PostgreSQL-backed session storage for scalable authentication

### Frontend Architecture
- **Module-based Structure**: Organized by feature domains (Dashboard, Conversations, Deals, Teams)
- **Shared Components**: Reusable UI components with shadcn/ui design system
- **State Management**: React Query for server state management
- **Responsive Design**: Tailwind CSS with custom EduChat theme

### Database Schema
- **Users & Teams**: Multi-level user management with role-based permissions
- **Contacts & Conversations**: Customer interaction tracking with channel support
- **Deals & Funnels**: Sales pipeline management with stage tracking
- **Messages & Media**: Rich message storage with file attachment support

## Data Flow

1. **Incoming Messages**: Z-API webhook → Message processing → Conversation routing → Team assignment
2. **User Interactions**: Frontend → API routes → Storage modules → Database operations
3. **Real-time Updates**: Database changes → WebSocket broadcasts → Frontend updates
4. **Assignment Logic**: Conversation created → Team detection → User assignment → Notification

## External Dependencies

### Required Integrations
- **Z-API**: WhatsApp Business API integration for message sending/receiving
- **Anthropic Claude**: AI-powered course detection from conversation content
- **Neon Database**: PostgreSQL hosting service

### Optional Services
- **Render/Railway**: Production deployment platforms
- **Replit**: Development environment support

## Deployment Strategy

The application supports multiple deployment platforms with automatic configuration:

- **Production**: Render/Railway with HTTPS-enabled secure cookies
- **Development**: Replit with development-optimized settings
- **Local**: Docker-based development with PostgreSQL

### Environment Configuration
- Platform detection for optimal cookie/CORS settings
- Automatic SSL certificate handling for production
- Database connection pooling for scalability

## Changelog
- June 19, 2025: Implementado sistema de proxy para URLs de mídia do WhatsApp - Solução automática para erros 403 (Forbidden) em imagens/mídia com URLs expiradas, proxy transparente com fallback e componente MediaViewer com detecção automática de falhas
- June 19, 2025: CORREÇÃO CRÍTICA - Regularizada sincronização de mensagens via webhook - Corrigido WebSocket broadcast robusto com fallbacks, atualização automática de conversas (unreadCount, lastMessageAt), sistema de recuperação de mensagens não exibidas e listener de sincronização em tempo real para resolver problema de mensagens salvas no banco mas não renderizadas na interface
- June 19, 2025: Implementado sistema completo de detecção de contatos duplicados - Sistema identifica automaticamente números de telefone duplicados em múltiplos canais (WhatsApp Comercial e Suporte), exibe alertas discretos na lista de conversas e detalhes na sidebar, mantendo históricos separados mas sinalizando duplicidade aos atendentes
- June 19, 2025: Corrigido sistema de avatares dos agentes responsáveis - Implementado cálculo correto de iniciais para nomes compostos (ex: "Amanda Joice" = "AJ", "Elaine Cristina" = "EC") com fallback para nomes únicos
- June 19, 2025: Revertido commit 7c165067a7bda031209dbea5712f7e30cb50c642 - Desfez alterações indesejadas na exibição de nomes e horários dos itens de conversa
- June 19, 2025: Otimizado delay de envio de mensagens - Reduzido de 2s para 300ms proteção duplicação, bloqueio para 200ms, cache para 500ms
- June 19, 2025: DESCOBERTA CRÍTICA - Problema dos filtros avançados é cache/sincronização entre dispositivos, não posicionamento. Teste de troca de posições confirmou que alguns dispositivos veem atualizações e outros não
- June 19, 2025: Implementado sistema de invalidação forçada de cache - Botão de sincronização (ícone refresh azul) força limpeza completa do cache React Query e localStorage, com invalidação automática por versão
- June 19, 2025: Adicionado sistema de detecção de dispositivos diferentes - Invalidação automática quando detecta novo dispositivo/navegador para garantir sincronização
- June 19, 2025: SOLUÇÃO DEFINITIVA para filtros avançados inconsistentes - Implementado hook de monitoramento robusto (useAdvancedFiltersMonitor) com auto-correção, fallbacks múltiplos, modo debug ativável (Ctrl+Shift+D) e recuperação automática de falhas de sincronização de estado
- June 19, 2025: Criado sistema de debug em tempo real para filtros avançados - Console logs detalhados, indicadores visuais de estado e controles manuais de recuperação
- June 19, 2025: Implementado mecanismo de força de exibição para filtros - Sistema detecta quando dados estão disponíveis mas UI não atualiza e força renderização automaticamente
- June 19, 2025: Adicionado monitoramento contínuo de inconsistências - Hook verifica estado a cada 5 segundos e aplica correções automáticas quando necessário
- June 19, 2025: Corrigido problema crítico de inconsistência na exibição de filtros avançados - Implementado sistema robusto com loading states e fallback para garantir que filtros apareçam consistentemente em todos os dispositivos
- June 19, 2025: Adicionada verificação de autenticação nas rotas /api/teams e /api/system-users para evitar falhas silenciosas
- June 19, 2025: Implementado sistema de retry automático e tratamento de erro para queries de filtros avançados
- June 19, 2025: Corrigido sistema de permissões para transferências - Atendentes agora podem transferir conversas entre equipes e usuários
- June 19, 2025: Implementada proteção robusta contra duplicação de mensagens - Sistema de debounce, cache temporal e bloqueio de botão
- June 19, 2025: Removido número de telefone da lista de conversas para reduzir poluição visual
- June 19, 2025: Removida restrição de digitação durante envio de mensagens no textarea
- June 19, 2025: Implementado efeito hover discreto para lixeira de exclusão de mensagens
- June 19, 2025: Correções para erro 502 no Render - Otimizações de timeout, configurações de produção e health checks
- June 17, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.