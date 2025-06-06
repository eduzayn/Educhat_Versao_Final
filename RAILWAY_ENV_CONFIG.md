# Configuração de Variáveis de Ambiente no Railway

Para resolver o problema do healthcheck no Railway, certifique-se de adicionar as seguintes variáveis de ambiente no painel do Railway:

## Variáveis Essenciais

```
NODE_ENV=production
PORT=8080
SESSION_SECRET=N4UFeCrSCXl0dP7IHWDBzYfvZQ5NowxC82L5+6AGNJppypFIGh5h4PR6gVAKfIC0vYEpp8wSDDScBSz+U99w==
```

## Configuração do Banco de Dados
```
DATABASE_URL=postgresql://neondb_owner:npg_Bm1IRe39SAqQ@ep-shy-mode-a5b4ocv7.us-east-2.aws.neon.tech/neondb?sslmode=require
PGDATABASE=neondb
PGHOST=ep-shy-mode-a5b4ocv7.us-east-2.aws.neon.tech
PGPORT=5432
PGUSER=neondb_owner
PGPASSWORD=npg_Bm1IRe39SAqQ
```

## API Z-API (WhatsApp)
```
ZAPI_TOKEN=A4E42029C248B7DA0842F47
ZAPI_INSTANCE_ID=3DF871A7ADF820F049998E66862CE0C1
ZAPI_BASE_URL=https://api.z-api.io
ZAPI_CLIENT_TOKEN=Fe4f45c32c552449dbf8b290c83f5200d5
```

## API Anthropic
```
ANTHROPIC_API_KEY=sk-ant-api03-og_RdDV0g7q7xfPd0wwLTeNVl6V_p3MYSrIXsjhw0RHnFLlkmGMPtRl7E_xqhCUp18msjP5jDo04qUpkQFQ-MDG-KgAA
```

## Passos para configurar no Railway:

1. Acesse o projeto no Railway
2. Vá para a aba "Variables"
3. Adicione todas as variáveis listadas acima
4. Clique em "Save Changes"
5. Faça um novo deploy após salvar as variáveis

## Notas importantes:

- Certifique-se que o endpoint `/api/health` está funcionando corretamente
- A aplicação deve estar ouvindo na porta 8080 (configurada pelo Railway)
- O healthcheck está configurado no railway.json para usar o caminho `/api/health` 