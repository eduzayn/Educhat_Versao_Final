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
- June 19, 2025: Correções para erro 502 no Render - Otimizações de timeout, configurações de produção e health checks
- June 17, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.