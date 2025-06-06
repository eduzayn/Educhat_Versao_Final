# Configuração Manual do Render - URGENTE

## Problema Identificado
O Render não está usando o `render.yaml` e continua executando:
```
npm install; npm run build
```

Ao invés do comando correto:
```
npm install && npm run build
```

## Solução: Configuração Manual

### 1. Acesse o Painel do Render
- Vá para: https://dashboard.render.com/
- Selecione seu serviço "educhat-versao-final"

### 2. Edite as Configurações de Build
Na aba "Settings" → "Build & Deploy":

**Build Command**: 
```
npm install && npm run build
```

**Start Command**:
```
npm start
```

### 3. Configurações Adicionais
- **Health Check Path**: `/api/health`
- **Health Check Timeout**: 5 segundos
- **Health Check Interval**: 10 segundos
- **Auto-Deploy**: Habilitado

### 4. Redeploy Manual
Após alterar as configurações:
1. Clique em "Manual Deploy" 
2. Selecione "Deploy latest commit"
3. Aguarde o build executar

### 5. Verificação
O novo log de build deve mostrar:
```
==> Executando o comando de compilação 'npm install && npm run build'...
```

E não mais:
```
==> Executando o comando de compilação 'npm install; npm run build'...
```

## Por que o && É Importante
- `npm install; npm run build` - executa o build mesmo se npm install falhar
- `npm install && npm run build` - só executa o build se npm install for bem-sucedido

A diferença é crucial para detectar erros de dependências.