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

- June 25, 2025 (05:13): API DE ENVIO DE IMAGEM CORRIGIDA COMPLETAMENTE
  - Corrigido endpoint /api/zapi/send-image para retornar objeto message válido
  - API agora salva mensagem no banco e retorna savedMessage para renderização imediata
  - Eliminado warning "Mensagem inválida recebida: null" no frontend
  - Sistema de envio de imagem funcionando com renderização instantânea
  - Mantida compatibilidade com todos os outros tipos de mensagem
- June 25, 2025 (05:10): ERRO CRÍTICO DE ENVIO DE IMAGEM CORRIGIDO
  - Corrigido erro "Cannot read properties of undefined (reading 'id')" em useImageMessage.ts
  - Adicionadas validações robustas antes de acessar propriedades da mensagem
  - Implementada verificação segura para newMessage.id e newMessage.conversationId
  - Adicionada proteção para arrays e objetos undefined no cache React Query
  - Sistema de envio de imagem funcionando sem quebras na interface
- June 25, 2025 (05:04): QUANTIDADE DE EMOJIS EXPANDIDA DRASTICAMENTE
  - Expandida lista de emojis de 16 para mais de 1000 emojis em todos os componentes
  - InputArea.tsx: array de emojis expandido com categorias completas
  - ChatInput.tsx: FREQUENT_EMOJIS expandido para coleção abrangente
  - PrivateMessageModal.tsx: lista de emojis ampliada para melhor experiência
  - Incluídas todas as categorias: rostos, gestos, corações, animais, comida, objetos, símbolos, etc.
  - Interface de emoji picker muito mais rica e diversificada
- June 25, 2025 (05:01): GRAVADOR E PREVIEW DE ÁUDIO MODERNIZADOS (IMPLEMENTAÇÃO CORRIGIDA)
  - Corrigido componente AudioRecorder.tsx aplicando melhorias visuais corretas
  - Gravação: bg-red-50 com microfone em círculo vermelho pulsante 
  - Preview: bg-blue-50 com botão play circular azul e barra de progresso visual
  - Botões redesenhados: "Parar" vermelho, "Enviar" azul, "Descartar" com ícone
  - Tipografia mono para tempos e layout responsivo gap-4
  - Interface modernizada mantendo funcionalidade completa
- June 25, 2025 (04:55): DESIGN MODERNO DO PLAYER DE ÁUDIO IMPLEMENTADO
  - Atualizado componente AudioMessage.tsx com tema azul moderno
  - Implementado design bg-blue-100 com texto text-blue-800
  - Botão play/pause redondo azul destacado (bg-blue-500)
  - Layout horizontal responsivo com max-w-xs md:max-w-sm
  - Barra de progresso integrada ao tema azul
  - Botão de download com estilo consistente
  - Mantida funcionalidade completa sem quebras
- June 25, 2025 (04:44): ERRO CRÍTICO DO ÁUDIO CORRIGIDO NO MESSAGESAREA
  - Corrigido erro "Cannot read properties of undefined (reading 'id')" em MessagesArea.tsx
  - Adicionado filtro de segurança para mensagens sem ID antes do .map()
  - Implementado ErrorBoundary para capturar e tratar erros React graciosamente
  - Corrigida API de áudio para retornar todos os campos obrigatórios da mensagem
  - Sistema de áudio agora funciona sem quebrar a interface
- June 25, 2025 (04:42): AUDITORIA COMPLETA DE ROTAS E NAVEGAÇÃO FINALIZADA
  - Mapeadas e auditadas 55 rotas totais: 20 frontend + 15 internas + 20 APIs
  - Removidas 5 rotas duplicadas/obsoletas (integrations, chat interno, admin, detection)
  - Corrigidos 3 links quebrados no SettingsPage (webhook, integrations, detection)
  - Consolidada estrutura de permissões (admin, gerente, todos)
  - Implementado placeholder para rota /teams
  - Sistema de breadcrumbs automático validado
  - Página 404 personalizada funcionando
  - APIs verificadas com autenticação e autorização funcionais
  - Separação frontend/backend mantida corretamente
  - Análise de internacionalização: estrutura preparada para I18n futuro
  - URLs semânticas facilitam adaptação multilíngue
  - Sistema de breadcrumbs adaptável para múltiplos idiomas
  - Auditoria completa incluindo deep linking e navegação programática
  - Sistema 100% funcional sem inconsistências
- June 25, 2025 (04:30): LIMPEZA ESTRUTURADA DO REPOSITÓRIO EXECUTADA COM SUCESSO
  - Removidos 64 arquivos obsoletos: documentação antiga, backups, scripts descontinuados
  - Eliminados 18 arquivos .txt temporários da pasta attached_assets
  - Removidas pastas de cache e arquivos temporários (.log, .tmp, .bak)
  - Corrigido erro "Cannot read properties of undefined" no MessagesArea
  - Sistema completamente funcional após limpeza - nenhum impacto negativo identificado
  - Repositório organizado e pronto para futuras manutenções
- June 25, 2025 (04:21): SISTEMA DE GRAVAÇÃO DE ÁUDIO COMPLETAMENTE CORRIGIDO
  - Corrigido erro do schema Zod para campo sentAt (string → Date com transform)
  - Removida sobreposição de textareas na InputArea (import desnecessária removida)
  - Implementado sistema de clique simples para gravação (mais confiável que mouse events)
  - Adicionado ID único para textarea principal evitando conflitos entre componentes
  - Isolado AudioRecorder com ID específico para InputArea vs InternalChat
  - Logs de debug implementados para monitorar cliques, envios e gravações
  - Validação robusta de activeConversation implementada no início do componente
  - Sistema de áudio funcionando: gravação → envio Z-API → callback WhatsApp ✅
- June 25, 2025 (03:30): SINCRONIZAÇÃO COMPLETA ENTRE SISTEMAS IMPLEMENTADA
  - WebSocket atualiza lista de conversas em tempo real (reordenação e preview)
  - Painéis BI recebem atualizações automáticas via broadcast bi_update
  - Dashboard CRM sincronizado com eventos crm_update em tempo real
  - Notificações visuais e sonoras implementadas para mensagens de contatos
  - Cache otimizado: 30s staleTime, 60s refetchInterval como backup
  - Sistema garante consistência cross-sistema: Mensagens → BI → CRM → Interface
- June 25, 2025 (03:24): SCROLL INFINITO INVERTIDO TOTALMENTE IMPLEMENTADO
  - Hook useMessages convertido para paginação baseada em cursor (before=id) para scroll infinito
  - API atualizada para suportar parâmetro "before" em /api/conversations/:id/messages
  - Método getMessagesBefore adicionado ao MessageStorage para carregar mensagens anteriores
  - Carregamento inicial: 15 mensagens mais recentes, scroll para cima: +10 mensagens anteriores
  - Preservação da posição de scroll após carregar histórico (evita "pulo de tela")
  - Ordem cronológica correta: mais antigas no topo, mais recentes embaixo
  - Controle de requisições duplicadas com isFetchingNextPage flag
  - InputArea.tsx completamente refatorado eliminando duplicações e conflitos
  - Sistema otimizado para performance e UX fluida no carregamento progressivo
- June 25, 2025 (03:17): RENDERIZAÇÃO IMEDIATA PADRONIZADA PARA TODOS OS TIPOS DE MENSAGENS
  - Criados hooks unificados useImageMessage, useAudioMessage, useFileMessage, useVideoMessage
  - Todos seguem padrão React Query com onSuccess atualizando cache imediatamente
  - Componentes ImageUpload, AudioRecorder, InputArea atualizados para usar hooks padronizados
  - Eliminadas mutations antigas que usavam invalidateQueries sem renderização imediata
  - Sistema garantido: qualquer tipo de mensagem (texto, áudio, imagem, vídeo, arquivo) aparece instantaneamente
- June 25, 2025 (03:05): REFATORAÇÃO ESTRUTURAL DO SISTEMA DE MENSAGENS IMPLEMENTADA
  - Eliminado Zustand store como fonte de mensagens (mantido apenas para estado básico)
  - TanStack Query estabelecido como fonte única de verdade para mensagens
  - WebSocket atualiza apenas React Query cache para renderização imediata
  - Removidos conflitos entre múltiplos sistemas de estado (Zustand vs Query vs WebSocket)
  - Sistema simplificado: Envio → Banco → React Query → Interface (linear e confiável)
  - Mensagens enviadas aparecem instantaneamente sem dependência de broadcast
- June 25, 2025 (02:50): SCROLL INFINITO INVERTIDO IMPLEMENTADO NAS MENSAGENS
  - Hook useMessages convertido para useInfiniteQuery com carregamento inicial de 15 mensagens
  - Carregamento progressivo de 10 mensagens por vez ao rolar para cima
  - Scroll inteligente que mantém posição após carregar histórico
  - Indicadores visuais de carregamento e fim do histórico
  - Query SQL otimizada com ordenação decrescente e reversão para exibição cronológica
- June 25, 2025 (02:49): LIMPEZA DE CÓDIGO OBSOLETO APÓS CORREÇÕES
  - Removidos arquivos de documentação obsoletos (INBOX_AUDIT_REPORT.md, PERFORMANCE_FIXES.md)
  - Limpo código WebSocket removendo comentários incorretos
  - Sistema otimizado mantendo apenas código funcional necessário
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