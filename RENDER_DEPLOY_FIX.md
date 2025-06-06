# Correção para Deploy no Render - EduChat

## Problemas Identificados

Baseado nos erros 502 (Bad Gateway) e 500 (Internal Server Error) mostrados no console do Render:

1. **Erro 502 Bad Gateway**: O servidor não consegue inicializar adequadamente
2. **Erro 500**: Falha interna do servidor durante o startup
3. **Build Command**: Comando de build inadequado (corrigido para `npm ci && npm run build`)

## Correções Necessárias

### 1. Configuração de Build Corrigida

O comando de build no `package.json` está correto, mas precisa garantir que os arquivos estáticos sejam servidos adequadamente:

```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "cross-env NODE_ENV=production node dist/index.js"
  }
}
```

### 2. Variáveis de Ambiente Obrigatórias

Configure essas variáveis no painel do Render:

```
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=sua_chave_secreta_segura
ZAPI_TOKEN=seu_token_zapi
ZAPI_INSTANCE_ID=seu_instance_id
ZAPI_BASE_URL=https://api.z-api.io
ZAPI_CLIENT_TOKEN=seu_client_token
PORT=10000
```

### 3. Configuração do render.yaml

Atualize o arquivo `render.yaml`:

```yaml
services:
  - type: web
    name: educhat
    env: node
    plan: starter
    buildCommand: npm ci && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    healthCheckTimeout: 10
    healthCheckInterval: 30
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
      - key: SESSION_SECRET
        generateValue: true
      - key: DATABASE_URL
        sync: false
      - key: ZAPI_TOKEN
        sync: false
      - key: ZAPI_INSTANCE_ID
        sync: false
      - key: ZAPI_BASE_URL
        value: https://api.z-api.io
      - key: ZAPI_CLIENT_TOKEN
        sync: false
```

### 4. Configuração de CORS para Render

O CORS já está configurado adequadamente no `server/index.ts` para aceitar o domínio do Render:

```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://educhat.com.br', 
        'https://www.educhat.com.br', 
        ...(process.env.RENDER_EXTERNAL_URL ? [process.env.RENDER_EXTERNAL_URL] : [])
      ] 
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

### 5. Verificação de Health Check

O endpoint `/api/health` está configurado e deve responder adequadamente:

```javascript
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || '5000',
    version: '1.0.0'
  });
});
```

## Passos para Deploy Correto

1. **Configure o Banco de Dados**: 
   - Use um banco PostgreSQL do Render ou externo (Neon configurado ✅)
   - Configure a `DATABASE_URL` com a string de conexão completa (configurado ✅)

2. **Configure as Variáveis Z-API** (todas configuradas ✅):
   - `ZAPI_TOKEN`: Token de autenticação
   - `ZAPI_INSTANCE_ID`: ID da instância
   - `ZAPI_CLIENT_TOKEN`: Token do cliente

3. **Comandos de Deploy Corretos**:
   - Build Command: `npm install && npm run build` (corrigido para incluir devDependencies ✅)
   - Start Command: `npm start`
   - Health Check Path: `/api/health`

4. **Adicionar Variável NODE_ENV**:
   No painel do Render, adicione explicitamente:
   ```
   NODE_ENV=production
   ```

5. **Verificar Logs de Build**:
   - Acesse os logs de build no Render
   - Verifique se `npm ci` e `npm run build` executam sem erros
   - Confirme se o diretório `dist/` é criado com `index.js` e `public/`

## Debugging

Se ainda houver problemas:

1. **Verifique os logs**: Acesse os logs do Render para ver erros específicos
2. **Teste o health check**: Acesse `https://seu-app.onrender.com/api/health`
3. **Verifique as variáveis**: Confirme se todas as variáveis estão configuradas

## Estrutura de Arquivos Esperada Após Build

```
dist/
├── index.js           # Servidor Node.js
└── public/           # Arquivos estáticos do frontend
    ├── index.html
    ├── assets/
    │   ├── index-*.js
    │   └── index-*.css
    └── ...
```

A configuração do Vite em `vite.config.ts` já está correta para gerar os arquivos no local adequado (`dist/public`).