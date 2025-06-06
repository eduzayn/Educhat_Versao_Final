# Configuração do Educhat no Render

Este guia contém todas as instruções necessárias para configurar e implantar o Educhat no Render com sucesso.

## 1. Configuração do Serviço Web

Ao criar um novo serviço Web no Render:

- **Nome do Serviço**: `Educhat_Versao_Final` (ou outro nome de sua escolha)
- **Tipo de Runtime**: `Node`
- **Branch**: `main`
- **Diretório Raiz**: Deixe em branco (usa a raiz do repositório)
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

## 2. Variáveis de Ambiente Essenciais

Adicione as seguintes variáveis de ambiente no painel do Render:

### Sistema e Segurança
```
NODE_ENV=production
SESSION_SECRET=valor-secreto-aqui
```

### Banco de Dados (Neon)
```
DATABASE_URL=postgresql://neondb_owner:senha@ep-nome-do-projeto.region.aws.neon.tech/neondb?sslmode=require

# Opcionalmente, também configure estas variáveis individuais
PGDATABASE=neondb
PGHOST=ep-nome-do-projeto.region.aws.neon.tech
PGPORT=5432
PGUSER=neondb_owner
PGPASSWORD=senha-aqui
```

### Z-API (WhatsApp)
```
ZAPI_TOKEN=seu-token-aqui
ZAPI_INSTANCE_ID=seu-id-de-instancia-aqui
ZAPI_BASE_URL=https://api.z-api.io
ZAPI_CLIENT_TOKEN=seu-token-cliente-aqui
```

### API Anthropic
```
ANTHROPIC_API_KEY=sua-chave-api-aqui
```

## 3. Configurações Avançadas

### Health Check

Configure o health check no Render:

- **Health Check Path**: `/api/health`
- **Health Check Status**: `200`
- **Interval**: `10s`
- **Timeout**: `5s`
- **Initial Delay**: `30s`

### Auto-Deploy

- Ative a opção "Auto-Deploy" para o branch `main`
- Isso garante que novos commits sejam automaticamente implantados

### Escalonamento

- **Plano Inicial**: Web Service (Starter) - $7/mês
- Para maior tráfego, considere escalonar verticalmente para o plano Standard

## 4. WebSockets

O Render suporta WebSockets nativamente, mas algumas configurações podem ajudar:

- **Timeout da Sessão**: Aumente para 120 segundos ou mais
- **Limite de Carga Útil**: O Render suporta até 10MB, mas recomendamos manter abaixo de 5MB

## 5. Armazenamento de Arquivos

Os arquivos enviados para `/uploads` são armazenados no disco efêmero do Render. Para produção:

- Considere migrar para um serviço de armazenamento como AWS S3, Cloudinary ou Render Disk
- Para persistência de dados em produção, defina uma estratégia de backup dos uploads

## 6. Domínio Personalizado

Para usar um domínio personalizado:

1. Vá para a seção "Settings" do seu serviço
2. Clique em "Custom Domains"
3. Adicione seu domínio (ex: educhat.com.br)
4. Siga as instruções para configurar os registros DNS

## 7. Verificação Pós-Deploy

Após o deploy, verifique:

- Acesso ao `/api/health` para confirmar que o servidor está respondendo
- Faça login para testar a autenticação
- Verifique se as conexões WebSocket estão funcionando
- Teste o upload e download de arquivos

## 8. Solução de Problemas

### Conexão com Banco de Dados
Se houver problemas de conexão com o banco Neon:
- Verifique as credenciais
- Confirme que o endereço IP do Render está na lista de permissões
- Teste a conexão usando o console do Render

### WebSockets
Se os WebSockets não funcionarem:
- Verifique os logs para erros de CORS
- Confirme que os domínios do cliente estão na lista de origens permitidas
- Teste com o transporte de fallback (polling)

### Memória e Performance
- O plano Starter tem 512MB de RAM
- Monitore o uso de memória nos logs do Render
- Se necessário, otimize o código ou atualize para um plano com mais recursos

## 9. Monitoramento

O Render fornece monitoramento básico incluído:
- CPU e memória
- Logs em tempo real
- Métricas de solicitação HTTP

Para monitoramento avançado, considere:
- Integrar com Datadog, New Relic ou serviços similares
- Implementar logging estruturado para melhor análise 