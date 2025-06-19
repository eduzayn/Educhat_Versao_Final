# 🚀 Guia de Deploy - Ambiente de Desenvolvimento

## 📋 Visão Geral

Este guia explica como criar um ambiente de produção separado para testar o branch `feature/development-environment` antes de fazer merge na `main`.

## 🌿 Estratégia de Branches

```
main (produção atual)
└── feature/development-environment (testes)
```

## 🎯 Opções de Deploy

### Opção 1: Render (Recomendado)

#### 1. Criar Novo Projeto no Render
1. Acesse [render.com](https://render.com)
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub
4. Configure:
   - **Name**: `educhat-dev`
   - **Branch**: `feature/development-environment`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

#### 2. Configurar Variáveis de Ambiente
No painel do Render, vá em "Environment" e configure:

```bash
NODE_ENV=production
DATABASE_URL=sua_url_do_banco_dev
SESSION_SECRET=chave_secreta_dev
ZAPI_TOKEN=seu_token_zapi
ZAPI_INSTANCE_ID=seu_instance_id
ANTHROPIC_API_KEY=sua_chave_anthropic
SENDGRID_API_KEY=sua_chave_sendgrid
```

#### 3. Configurar Auto-Deploy
- **Auto-Deploy**: ✅ Enabled
- **Branch**: `feature/development-environment`
- **Pull Request Deploy**: ✅ Enabled

### Opção 2: Railway

#### 1. Criar Projeto no Railway
1. Acesse [railway.app](https://railway.app)
2. Clique em "New Project"
3. Selecione "Deploy from GitHub repo"
4. Configure o branch `feature/development-environment`

#### 2. Configurar Variáveis
No Railway, vá em "Variables" e configure as mesmas variáveis do Render.

## 🔄 Workflow de Desenvolvimento

### 1. Desenvolvimento Local
```bash
# Fazer alterações no branch
git checkout feature/development-environment
# ... fazer alterações ...
git add .
git commit -m "feat: nova funcionalidade"
git push origin feature/development-environment
```

### 2. Deploy Automático
- Render/Railway detecta o push
- Faz deploy automático do branch
- Testa em ambiente de produção

### 3. Testes
- Acesse a URL do ambiente de desenvolvimento
- Teste todas as funcionalidades
- Verifique logs e métricas

### 4. Merge para Main
```bash
# Após testes bem-sucedidos
git checkout main
git merge feature/development-environment
git push origin main
```

## 🌐 URLs dos Ambientes

- **Produção**: `https://educhat.com.br` (branch main)
- **Desenvolvimento**: `https://educhat-dev.onrender.com` (branch feature/development-environment)

## 🔧 Configurações Específicas

### Banco de Dados Separado
Recomenda-se usar um banco de dados separado para desenvolvimento:

```bash
# Produção
DATABASE_URL=postgresql://prod_user:prod_pass@prod_host/prod_db

# Desenvolvimento  
DATABASE_URL=postgresql://dev_user:dev_pass@dev_host/dev_db
```

### Variáveis de Ambiente
```bash
# Desenvolvimento
NODE_ENV=production
BRANCH=feature/development-environment
ENVIRONMENT=staging

# Produção
NODE_ENV=production
BRANCH=main
ENVIRONMENT=production
```

## 📊 Monitoramento

### Health Checks
- **Endpoint**: `/health`
- **Timeout**: 30 segundos
- **Intervalo**: 5 minutos

### Logs
- Render: Dashboard → Logs
- Railway: Deployments → Logs

### Métricas
- Uptime
- Response time
- Error rate
- Memory usage

## 🚨 Rollback

Se algo der errado:

### Render
1. Dashboard → Deployments
2. Clique no deploy anterior
3. "Redeploy"

### Railway
1. Deployments
2. "Redeploy" no deploy estável

## ✅ Checklist de Deploy

- [ ] Branch criado e configurado
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados separado configurado
- [ ] Auto-deploy ativado
- [ ] Health checks funcionando
- [ ] Logs sendo coletados
- [ ] Métricas configuradas
- [ ] Equipe notificada sobre novo ambiente

## 🎉 Benefícios

1. **Testes seguros** em ambiente de produção
2. **Zero downtime** na produção atual
3. **Deploy automático** para testes
4. **Rollback rápido** se necessário
5. **Desenvolvimento paralelo** sem conflitos 