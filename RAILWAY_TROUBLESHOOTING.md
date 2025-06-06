# Railway Deployment - Troubleshooting

## ⚠️ Problema Identificado: Erro de Porta

Baseado na imagem fornecida, o Railway está tentando acessar a aplicação na porta 8080, mas a aplicação estava configurada para rodar na porta 5000.

## ✅ Correção Implementada

### 1. Servidor Atualizado
- O arquivo `server/index.ts` foi modificado para usar a variável de ambiente `PORT`
- Agora a aplicação usa automaticamente a porta definida pelo Railway

### 2. Configuração Corrigida
```javascript
// Antes (fixo na porta 5000)
const port = 5000;

// Depois (usa PORT do Railway ou 5000 como fallback)
const port = parseInt(process.env.PORT || "5000", 10);
```

## 🚀 Passos para Resolver no Railway

### 1. Fazer Redeploy
1. Acesse o projeto no Railway
2. Vá na aba "Deployments"
3. Clique em "Redeploy" no último deployment

### 2. Verificar Logs
1. Vá na aba "Observabilidade"
2. Monitore os logs de deploy
3. Procure por: `serving on port XXXX`

### 3. Testar Aplicação
Após o redeploy, teste:
- Health check: `https://seu-app.railway.app/api/health`
- Login: `https://seu-app.railway.app/login`

## 🔧 Configurações Railway

### Variáveis de Ambiente
**NÃO configurar PORT manualmente**
- O Railway define automaticamente
- Aplicação agora aceita qualquer porta

### Configurações Necessárias
```env
NODE_ENV=production
SESSION_SECRET=sua-chave-secreta
DATABASE_URL=postgresql://... (auto-configurado)
```

## 📊 Verificação de Status

### Indicadores de Sucesso
- ✅ Build: Success
- ✅ Deploy: Success  
- ✅ Health Check: Responding
- ✅ Application: Accessible

### Logs Esperados
```
serving on port 8080
Health check endpoint available at /api/health
Database connected successfully
```

## 🐛 Outros Problemas Comuns

### Database Connection
Se houver erro de banco:
1. Verificar se PostgreSQL service está ativo
2. Confirmar DATABASE_URL nas variáveis
3. Executar migrações: `npm run db:push`

### Build Errors
Se build falhar:
1. Verificar package.json
2. Confirmar dependências
3. Checar logs de build detalhados

### Network Timeout
Se timeouts ocorrerem:
1. Aumentar healthcheckTimeout no railway.json
2. Verificar se aplicação inicia rapidamente
3. Otimizar tempo de boot

O problema da porta está resolvido. Faça o redeploy no Railway para aplicar as correções.