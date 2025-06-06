# Resolução de Problemas de Login no Render - EduChat

## Problemas Identificados no Console

Os erros exibidos no console do navegador indicam:

1. **Erro 401** em `/api/user` - Não autenticado
2. **Erro 500** em `/api/zapi/status` - Erro interno do servidor
3. **Status Z-API indisponível: 500**
4. **Erro 500** em `/api/login` - Falha no processo de login

## Soluções Passo a Passo

### 1. Verificar Conexão com Banco de Dados

O erro 500 geralmente indica um problema com o banco de dados. Verifique:

1. **Configure a variável DATABASE_URL no Render**:
   ```
   DATABASE_URL=postgresql://neondb_owner:senha@ep-shy-mode-a5b4ocv7.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

2. **Verifique se o banco está acessível**:
   - O IP do Render deve estar na lista de permitidos no Neon
   - As credenciais devem estar corretas
   - O banco deve estar online

### 2. Verificar Configuração de Sessão

O erro 401 indica problemas com autenticação:

1. **Configure SESSION_SECRET no Render**:
   ```
   SESSION_SECRET=uma_string_secreta_longa_e_aleatoria
   ```

2. **Verifique a configuração de cookies**:
   - No Render, adicione a seguinte variável:
   ```
   COOKIE_SECURE=true
   ```
   
3. **Modifique a configuração de sessão** (se necessário, crie um PR):
   ```javascript
   const sessionSettings = {
     secret: process.env.SESSION_SECRET || 'default-secret',
     resave: false,
     saveUninitialized: false,
     cookie: {
       secure: process.env.NODE_ENV === 'production',
       sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
       maxAge: 24 * 60 * 60 * 1000 // 24 horas
     }
   };
   ```

### 3. Verificar Configuração Z-API

O erro em `/api/zapi/status` indica problemas com a Z-API:

1. **Configure todas as variáveis Z-API no Render**:
   ```
   ZAPI_TOKEN=seu_token
   ZAPI_INSTANCE_ID=seu_id_instancia
   ZAPI_BASE_URL=https://api.z-api.io
   ZAPI_CLIENT_TOKEN=seu_token_cliente
   ```

2. **Verifique se a instância Z-API está ativa**:
   - Acesse o painel da Z-API para confirmar

### 4. Verificar CORS e Proxying

1. **Configure CORS para incluir o domínio do Render**:
   - Verifique se o arquivo `server/index.ts` inclui o domínio do Render:
   ```javascript
   origin: [
     'https://educhat.com.br',
     'https://seu-app.onrender.com'
   ]
   ```

2. **Adicione a variável RENDER_EXTERNAL_URL**:
   ```
   RENDER_EXTERNAL_URL=https://educhat-versao-final.onrender.com
   ```

### 5. Inicialização do Banco de Dados

Se as tabelas não existirem:

1. **Execute o script de migração no console do Render**:
   ```
   npm run db:push
   ```

2. **Ou adicione um comando de pós-deploy**:
   ```
   npm run db:push && npm start
   ```

### 6. Passo a Passo para Teste

1. **Acesse o endpoint de saúde**:
   - `https://seu-app.onrender.com/api/health`
   - Deve retornar `{"status":"ok",...}`

2. **Verifique os logs do Render em tempo real** durante uma tentativa de login:
   - Procure por erros específicos de conexão com banco de dados
   - Procure por erros de autenticação

3. **Teste com dados de usuário de teste**:
   - Crie um usuário de teste através do console do banco
   - Tente fazer login com esse usuário

### 7. Criar Usuário Administrativo

Se não existir um usuário admin:

1. **Conecte ao banco via console ou ferramenta como Beekeeper Studio**
2. **Insira um usuário admin**:
   ```sql
   INSERT INTO system_users (email, username, password, role, "displayName", "isActive", status)
   VALUES ('admin@educhat.com', 'admin', 'admin123', 'admin', 'Administrador', true, 'active');
   ```

### 8. Reiniciar o Serviço

Após fazer as alterações:

1. **Vá ao painel do Render**
2. **Selecione o serviço**
3. **Clique em "Manual Deploy" > "Clear build cache & deploy"**

## Informações para Suporte

Quando reportar problemas, forneça:

1. URL do Render
2. Screenshots dos erros no console
3. Logs do servidor do Render
4. Versão do Node.js (deve ser 18+)

O problema mais comum é a falta de configuração de variáveis de ambiente ou problemas de conexão com o banco de dados. 