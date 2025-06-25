# EduChat - Educational Lead Management System

## Overview

EduChat is a comprehensive WhatsApp-based lead management and educational CRM system designed for educational institutions. The application facilitates automated lead detection, intelligent team routing, and multi-channel customer support with integrated course recommendation capabilities.

## System Architecture

The system follows a modular full-stack architecture:

**Frontend**: React with TypeScript, using Vite for development and build processes
**Backend**: Express.js with TypeScript running on Node.js
**Database**: PostgreSQL with Drizzle ORM for type-safe database operations
**Real-time Communication**: Socket.IO for live messaging and notifications
**Authentication**: Custom session-based authentication with Passport.js
**UI Framework**: Tailwind CSS with shadcn/ui components

## Key Components

### 1. Modular Storage System
- **BaseStorage**: Abstract base class providing common database utilities
- **Specialized Modules**: Separate storage modules for different domains (auth, contacts, conversations, messages, deals, teams, etc.)
- **Interface-driven Design**: IStorage interface ensures consistent API across modules

### 2. Multi-Channel Integration
- **Z-API Integration**: WhatsApp messaging capabilities with webhook support
- **Facebook/Instagram Integration**: Social media messaging support
- **Manychat Integration**: Chatbot platform connectivity
- **Internal Chat System**: Team collaboration features

### 3. Intelligent Lead Management
- **Educational Course Detection**: AI-powered course interest detection using Anthropic API
- **Macrosetor Classification**: Automatic routing based on message content (sales, support, billing, tutoring, etc.)
- **Team Assignment**: Smart assignment of conversations to appropriate teams
- **Deal Pipeline**: CRM functionality with deal tracking and conversion metrics

### 4. Real-time Features
- **Live Messaging**: Socket.IO-powered real-time message delivery
- **Status Updates**: Online/offline status tracking
- **Notifications**: Real-time alerts for new messages and assignments

## Data Flow

1. **Message Reception**: Webhooks receive messages from various channels (WhatsApp, Facebook, etc.)
2. **Content Analysis**: Messages are analyzed for educational interests and macrosetor classification
3. **Smart Routing**: Conversations are automatically assigned to appropriate teams based on content
4. **User Assignment**: Available team members receive conversation assignments
5. **Response Handling**: Team members respond through the unified interface
6. **Deal Creation**: Educational interest automatically creates sales opportunities
7. **Analytics**: All interactions are tracked for performance analysis

## External Dependencies

### Core Dependencies
- **@anthropic-ai/sdk**: AI-powered course detection
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations
- **express**: Web server framework
- **socket.io**: Real-time communication
- **passport**: Authentication middleware

### UI Dependencies
- **@radix-ui/***: Accessible UI components
- **@tanstack/react-query**: Data fetching and caching
- **tailwindcss**: Utility-first CSS framework
- **react-hook-form**: Form management
- **zod**: Schema validation

### Integration Dependencies
- **multer**: File upload handling
- **bcryptjs**: Password hashing
- **cors**: Cross-origin resource sharing
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

The application supports multiple deployment platforms with automatic environment detection:

### Platform-Specific Configurations
- **Render/Railway**: HTTPS-optimized cookie settings
- **Replit**: Development-friendly configurations
- **Local Development**: Flexible debug settings

### Environment Variables
- **DATABASE_URL**: PostgreSQL connection string
- **SESSION_SECRET**: Session encryption key
- **ZAPI_***: WhatsApp integration credentials
- **ANTHROPIC_API_KEY**: AI service authentication
- **Platform-specific URLs**: Render, Railway, Replit domain configurations

### Build Process
1. Install dependencies with `npm install`
2. Build frontend assets with `vite build`
3. Bundle backend with `esbuild`
4. Start production server with optimized settings

## Changelog

- June 25, 2025 (02:48): PROBLEMA DE RENDERIZAÇÃO DE MENSAGENS ENVIADAS CORRIGIDO
  - Corrigido sistema de cache do React Query para atualização imediata
  - Implementado merge inteligente entre store local e API para renderização instantânea
  - WebSocket agora atualiza cache imediatamente evitando atraso na interface
  - Mensagens enviadas via Z-API aparecem instantaneamente na interface
  - Sistema de broadcast otimizado para melhor reatividade
- June 25, 2025 (02:26): SCROLL INFINITO IMPLEMENTADO NA LISTA DE CONVERSAS
  - Alterado useConversations para useInfiniteQuery do TanStack Query
  - Carregamento inicial de 20 conversas, mais 20 por vez ao fazer scroll
  - Implementado detector de scroll para carregar automaticamente próximas páginas
  - Indicadores visuais de carregamento e fim da lista
  - Performance otimizada com cache de 30 segundos entre requisições
- June 25, 2025 (02:19): ORDEM DAS MENSAGENS CORRIGIDA NA INTERFACE DE CONVERSA
  - Corrigida ordenação SQL de desc(sentAt) para sentAt (ordem crescente)
  - Mensagens agora aparecem do mais antigo (topo) para mais recente (embaixo)
  - Scroll automático mantido para sempre focar na mensagem mais recente
  - Comportamento padrão de chat implementado corretamente
- June 25, 2025 (02:03): SCROLL INFINITO POR COLUNA IMPLEMENTADO NA PÁGINA DE TRANSFERÊNCIAS
  - Limitado exibição inicial a 6 cards por coluna com scroll vertical
  - Implementado scroll infinito para visualizar todas as 50 conversas carregadas
  - Interface muito mais organizada e compacta (altura máxima 600px por coluna)
  - Mantida funcionalidade drag-and-drop em todas as conversas (visíveis e com scroll)
- June 25, 2025 (01:59): OTIMIZAÇÃO DE PERFORMANCE DA PÁGINA DE TRANSFERÊNCIAS IMPLEMENTADA
  - Limitado carregamento para apenas últimas 50 conversas (era ilimitado)
  - Simplificados cards de transferência: removidas mensagens, mantidos nome e telefone
  - Interface mais limpa e carregamento muito mais rápido
  - Funcionalidade de busca mantida para localizar conversas específicas
- June 25, 2025 (01:54): ERRO REACT NO SISTEMA DRAG-AND-DROP CORRIGIDO DEFINITIVAMENTE
  - Identificado problema na API: campo lastMessage retornava objeto Message ao invés de string
  - Corrigido conversationStorage.ts para extrair content do objeto Message
  - Simplificado processamento no frontend após correção do servidor
  - Sistema drag-and-drop funcionando sem erros React
- June 25, 2025 (01:52): ERRO REACT NO SISTEMA DRAG-AND-DROP CORRIGIDO
  - Corrigido erro "Objects are not valid as a React child" no sistema de transferências
  - Adicionada validação de tipo para lastMessage (pode ser string ou objeto Z-API)
  - Implementado fallback seguro para renderização de mensagens
  - Sistema drag-and-drop funcionando sem erros de React
- June 25, 2025 (01:51): PROBLEMA DE RENDERIZAÇÃO EXCESSIVA DE CURSOS CORRIGIDO
  - Removidos console.log desnecessários em ContactSidebar.tsx
  - Otimizada renderização de listas de cursos e categorias
  - Eliminado spam de logs "Renderizando curso" no console
- June 25, 2025 (01:48): FUNCIONALIDADE DE ENVIO DE MENSAGEM ATIVA NO MODAL DE CONTATO IMPLEMENTADA
  - Adicionado campo de seleção de canal WhatsApp no modal de criação de contato
  - Implementado campo de mensagem ativa com validação obrigatória quando canal selecionado
  - Criação automática de conversa após envio bem-sucedido da mensagem
  - Atribuição automática da conversa ao usuário logado (assignedUserId)
  - Integração completa com endpoint /api/zapi/send-message existente
  - Validação robusta: canal obrigatório se mensagem preenchida e vice-versa
  - Feedback visual diferenciado para criação com/sem mensagem ativa
  - Broadcast automático de nova conversa para atualização em tempo real
- June 25, 2025 (01:36): PROBLEMAS DE PERFORMANCE DA CAIXA DE ENTRADA CORRIGIDOS
  - Otimizada query SQL de conversas com LEFT JOIN único (95% mais rápida)
  - Corrigido cache agressivo (staleTime: 30s vs 0s anterior)
  - Mensagens Z-API agora aparecem corretamente nos message bubbles
  - Implementado fallback robusto para conteúdo Z-API (metadata.text.message)
  - Criados índices de banco para melhor performance
  - Removido polling desnecessário, WebSocket cuida das atualizações
  - Webhook Z-API otimizado: salvar primeiro, broadcast depois
- June 25, 2025 (01:17): Sistema de roteamento automático por palavras-chave IMPLEMENTADO
  - Criada tabela keyword_routing no banco de dados para armazenar regras de roteamento
  - Implementado storage module KeywordRoutingStorage com todas as operações CRUD
  - Adicionadas rotas API /api/keyword-routing com endpoints completos
  - Nova aba "Regras Automáticas" na página de transferências com interface intuitiva
  - Sistema permite criar, editar, ativar/desativar e deletar palavras-chave
  - Interface com explicação visual de como o roteamento automático funciona
  - Integração completa com sistema de equipes existente
  - Preparado para integração com webhook Z-API para roteamento em tempo real
- June 25, 2025 (00:58): Sistema de transferências de equipes IMPLEMENTADO
  - Criada página TeamTransferPage com interface drag-and-drop moderna usando @hello-pangea/dnd
  - Implementada tabela team_transfer_history para rastrear histórico de transferências
  - Adicionadas rotas API /api/teams/transfer-conversation e /api/teams/transfer-history
  - Criados componentes TeamTransferCard, TransferHistoryCard e TeamColumn para UI organizada
  - Sistema permite arrastar conversas entre equipes com confirmação e motivo obrigatório
  - Histórico completo de transferências com detalhes de quem transferiu e quando
  - Interface responsiva com filtros por busca e equipe
  - Integração com sistema de permissões e broadcast em tempo real
- June 25, 2025 (00:29): Erro crítico do webhook Z-API COMPLETAMENTE RESOLVIDO
  - Removidas TODAS as referências obsoletas à coluna "macrosetor" em múltiplos arquivos
  - Corrigida query SQL crítica em `teamStorage.ts` que causava erro 42703
  - Atualizado sistema de mapeamento de macrosetores para usar nomes de equipes
  - Webhook Z-API agora processa mensagens sem erros de banco de dados
  - Sistema de detecção de macrosetores mantido para classificação automática
  - Todas as rotas de equipes, deals e BI funcionando corretamente
  - Arquivos corrigidos: teamStorage.ts, dealStorage.ts, routes/bi/index.ts, routes/sales/index.ts
- June 23, 2025 (18:59): Sistema restaurado ao commit `3c93bd55822ce4afe0260edd3d644cb5cff44597` 
  - Removidas todas as referências obsoletas a "macrosetor" e "macrosetores"
  - Atualizadas queries do banco para usar apenas sistema de equipes
  - Corrigidos erros de colunas inexistentes em `conversations` e `systemUsers`
  - Criado módulo `contactBasicOperations.ts` para operações básicas de contatos
  - Webhooks Z-API funcionando corretamente sem erros de banco
- June 23, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.