# Guia de Deploy EduChat no Railway

## 🚀 Configuração Inicial

### 1. Preparar o Repositório
- Certifique-se que o código está no GitHub
- Os arquivos de configuração já estão criados: `railway.json`, `nixpacks.toml`, `Procfile`

### 2. Criar Conta no Railway
1. Acesse https://railway.app
2. Faça login com GitHub
3. Autorize o Railway a acessar seus repositórios

### 3. Criar Projeto no Railway
1. Clique em "New Project"
2. Selecione "Deploy from GitHub repo"
3. Escolha o repositório do EduChat
4. Railway detectará automaticamente como aplicação Node.js

## 🗄️ Configurar Banco de Dados

### Opção 1: PostgreSQL no Railway (Recomendado)
1. No dashboard do projeto, clique em "Add Service"
2. Selecione "Database" → "PostgreSQL"
3. Railway criará automaticamente um banco PostgreSQL
4. A variável `DATABASE_URL` será configurada automaticamente

### Opção 2: Banco Externo (Neon, Supabase, etc.)
1. Configure manualmente a variável `DATABASE_URL`
2. Use formato: `postgresql://user:password@host:port/database`

## ⚙️ Configurar Variáveis de Ambiente

No painel do Railway, vá em "Variables" e adicione:

```env
# Obrigatórias
NODE_ENV=production
PORT=5000
SESSION_SECRET=sua-chave-secreta-muito-segura-aqui

# Z-API (se usar WhatsApp)
ZAPI_INSTANCE_ID=seu-instance-id
ZAPI_TOKEN=seu-token
ZAPI_CLIENT_TOKEN=seu-client-token

# IA (se usar detecção de cursos)
ANTHROPIC_API_KEY=sua-chave-anthropic
```

## 🔧 Executar Migrações

Após o primeiro deploy:
1. Acesse o terminal do Railway
2. Execute: `npm run db:push`
3. Verifique se as tabelas foram criadas

## 📋 Checklist de Deploy

- [ ] Código no GitHub atualizado
- [ ] Projeto criado no Railway
- [ ] PostgreSQL configurado
- [ ] Variáveis de ambiente definidas
- [ ] Deploy realizado com sucesso
- [ ] Migrações executadas
- [ ] Teste de login funcionando
- [ ] Webhooks Z-API configurados (se aplicável)

## 🔐 Credenciais de Teste

Use estas credenciais após o deploy:
- **Email:** admin@educhat.com
- **Senha:** admin123

## 🌍 Configurar Domínio (Opcional)

1. Railway fornece domínio automático: `app-name.railway.app`
2. Para domínio customizado:
   - Vá em "Settings" → "Domains"
   - Adicione seu domínio
   - Configure DNS CNAME

## 📊 Monitoramento

Railway oferece:
- Logs em tempo real
- Métricas de performance
- Alertas de erro
- Histórico de deploys

## 💰 Custos Estimados

- **Starter Plan:** $0 (500 horas/mês gratuitas)
- **Pro Plan:** ~$20-50/mês (dependendo do uso)
- **PostgreSQL:** ~$5-15/mês (dependendo do tamanho)

## 🔄 Deploy Automático

Railway configurará deploy automático:
- Push para `main` → Deploy automático
- Preview deploys para PRs
- Rollback instantâneo disponível

## 🐛 Troubleshooting

### Build Falha
- Verifique logs de build no Railway
- Confirme que `npm run build` funciona localmente

### App não Inicia
- Verifique `DATABASE_URL` está configurada
- Confirme que porta 5000 está sendo usada
- Veja logs de runtime

### Banco não Conecta
- Teste connection string
- Verifique se PostgreSQL está rodando
- Execute migrações manualmente se necessário

## 📞 Suporte

- Documentação: https://docs.railway.app
- Discord: https://discord.gg/railway
- GitHub Issues: Para bugs específicos do EduChat