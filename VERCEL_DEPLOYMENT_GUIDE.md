# Guia de Deploy EduChat no Vercel

## 🔐 Credenciais de Login

### Conta Administrador Principal
- **Email:** `admin@educhat.com`
- **Senha:** `admin123`
- **Tipo:** Administrador completo

### Contas Alternativas
- **Email:** `teste@gmail.com` / **Senha:** `123456` (Agente)
- **Email:** `ana.diretoria@eduzayn.com.br` / **Senha:** `senha123` (Admin)
- **Email:** `atendente@educhat.com` / **Senha:** `password` (Agente)

## ⚠️ Problema Identificado

O erro 405 "Method Not Allowed" no deploy do Vercel indica que a configuração atual não está adequada para uma aplicação Node.js full-stack. O EduChat requer:

1. **Servidor Express** rodando continuamente
2. **Socket.IO** para comunicação em tempo real
3. **Sessões** com autenticação persistente
4. **Banco PostgreSQL** para dados
5. **WebSockets** ativos

## 🚫 Limitações do Vercel

O Vercel é otimizado para:
- Sites estáticos (Jamstack)
- Funções serverless isoladas
- APIs sem estado

**NÃO é adequado para:**
- Servidores Express persistentes
- Socket.IO com conexões WebSocket
- Sessões de autenticação com estado
- Aplicações que precisam de um servidor sempre ativo

## ✅ Soluções Recomendadas

### 1. **Railway** (Recomendado)
```bash
# 1. Criar conta no Railway
# 2. Conectar repositório GitHub
# 3. Configurar variáveis de ambiente:
DATABASE_URL=postgresql://...
SESSION_SECRET=educhat-secret-key
NODE_ENV=production

# 4. Railway detecta automaticamente Node.js e deploya
```

### 2. **Render**
```bash
# 1. Criar conta no Render
# 2. Novo Web Service do GitHub
# 3. Configurações:
Build Command: npm install && npm run build
Start Command: npm start
```

### 3. **DigitalOcean App Platform**
```bash
# 1. Criar Droplet ou App Platform
# 2. Configurar PostgreSQL gerenciado
# 3. Deploy via GitHub Actions
```

### 4. **Heroku** (Se ainda disponível)
```bash
# 1. Criar app Heroku
# 2. Adicionar PostgreSQL addon
# 3. Deploy via Git
```

## 🔧 Configuração para Deploy Correto

### 1. Variáveis de Ambiente Necessárias
```env
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=sua-chave-secreta-segura
NODE_ENV=production
PORT=5000
```

### 2. Scripts do package.json (já configurados)
```json
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "cross-env NODE_ENV=production node dist/index.js"
  }
}
```

### 3. Dockerfile (se necessário)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🗄️ Banco de Dados

O sistema precisa de PostgreSQL com todas as tabelas criadas. Execute:

```bash
npm run db:push
```

## 📝 Próximos Passos

1. **Escolher plataforma adequada** (Railway, Render, DigitalOcean)
2. **Configurar banco PostgreSQL** na plataforma escolhida
3. **Configurar variáveis de ambiente**
4. **Fazer deploy do repositório**
5. **Executar migrações do banco**
6. **Testar login com credenciais fornecidas**

## 🔍 Verificação do Deploy

Após o deploy bem-sucedido:

1. ✅ Página de login carrega corretamente
2. ✅ POST /api/login funciona (não retorna 405)
3. ✅ Autenticação persiste entre navegação
4. ✅ Socket.IO conecta para tempo real
5. ✅ Interface completa do EduChat disponível

## 💡 Nota Importante

O EduChat é uma aplicação enterprise complexa que requer infraestrutura robusta. O Vercel não suporta adequadamente este tipo de aplicação devido às suas limitações com aplicações stateful e WebSockets.