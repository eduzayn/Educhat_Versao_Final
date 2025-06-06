# Como Obter a String de Conexão Correta do Neon Database

## Passos para Acessar a String de Conexão

### 1. Acesse o Console do Neon
- Vá para: https://console.neon.tech/
- Faça login na sua conta

### 2. Selecione seu Projeto
- Escolha o projeto onde está o banco "neondb"
- Clique no nome do projeto para acessar

### 3. Acesse a Aba "Dashboard" ou "Connection Details"
- Procure por "Connection string" ou "Database URL"
- Você verá algo como:

```
postgresql://neondb_owner:[password]@[host]/neondb?sslmode=require
```

### 4. Exemplo de String Completa
A string deve ter este formato:
```
postgresql://neondb_owner:SUA_SENHA_AQUI@ep-shy-mode-a5b4ocv7.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 5. Componentes da String
- **Usuário**: neondb_owner
- **Senha**: A senha que você definiu (não é a mesma do painel)
- **Host**: ep-shy-mode-a5b4ocv7.us-east-2.aws.neon.tech
- **Banco**: neondb
- **SSL**: sslmode=require (obrigatório)

## Como Resetar a Senha (se necessário)

1. No console do Neon, vá em "Settings" → "Reset password"
2. Defina uma nova senha
3. Use essa nova senha na string de conexão

## Teste Local
Para testar se a string está correta, você pode usar no terminal:
```bash
psql "postgresql://neondb_owner:NOVA_SENHA@ep-shy-mode-a5b4ocv7.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

## Atualização no Render
Após obter a string correta:
1. Render Dashboard → Seu serviço → Settings → Environment Variables
2. Edite DATABASE_URL
3. Cole a string completa
4. Save Changes
5. Manual Deploy (para reiniciar com novas credenciais)