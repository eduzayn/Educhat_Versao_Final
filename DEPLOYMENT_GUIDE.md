# EduChat - Guia Completo de Deploy

## Autenticação em Produção - RESOLVIDO ✅

O sistema foi corrigido para funcionar adequadamente em produção com configurações automáticas por plataforma:

- **Render/Railway**: Cookies seguros com HTTPS
- **Replit**: Configuração otimizada para ambiente
- **Configuração automática** baseada em variáveis de ambiente

## Configurações de Ambiente

### Variáveis Obrigatórias
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Autenticação
SESSION_SECRET=sua-chave-secreta-muito-forte

# Produção
NODE_ENV=production

# Z-API (opcional)
ZAPI_INSTANCE_ID=sua-instancia
ZAPI_TOKEN=seu-token
```

### Variáveis por Plataforma

#### Render
```bash
RENDER_EXTERNAL_URL=https://seu-app.onrender.com
```

#### Railway
```bash
RAILWAY_STATIC_URL=https://seu-app.up.railway.app
```

#### Replit
```bash
# REPLIT_DOMAINS detectado automaticamente
```

## Database (Neon)

Para obter a string de conexão:
1. Acesse https://console.neon.tech/
2. Selecione seu projeto
3. Copie a connection string do dashboard
4. Configure como `DATABASE_URL`

## Otimizações Z-API

Sistema otimizado com:
- Cache inteligente de 10 segundos
- Monitoramento reduzido para 60 segundos
- Logs limpos e organizados
- Reconexão automática

## Diagnóstico

Use o endpoint de saúde para verificar autenticação:
```bash
curl https://seu-dominio.com/api/auth/health
```

## Arquivos de Configuração

- `render.yaml` - Configuração para deploy no Render
- `AUTH_PRODUCTION_FIX.md` - Detalhes técnicos da correção de autenticação
- `DEPLOYMENT_GUIDE.md` - Este guia consolidado

## Status do Sistema

- ✅ Autenticação funcionando em produção
- ✅ Sistema de sessões otimizado  
- ✅ Configuração automática por plataforma
- ✅ Logs de debug implementados
- ✅ Z-API otimizado para produção
- ✅ Código limpo e organizado