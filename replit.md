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