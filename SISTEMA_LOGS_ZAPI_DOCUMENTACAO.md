# Sistema de Logs Detalhados Z-API - Documentação Técnica

## Visão Geral

Implementei um sistema abrangente de logs para diagnosticar problemas de envio de mensagens Z-API em produção. O sistema captura todos os pontos críticos do processo de envio e fornece análises detalhadas para identificar falhas específicas.

## Funcionalidades Implementadas

### 1. Logger Z-API Detalhado (`server/utils/zapiLogger.ts`)

**Características:**
- Rastreamento por `requestId` único para cada operação
- Logs estruturados com dados mascarados para segurança
- Análise de performance com tempos de resposta
- Categorização automática de erros
- Relatórios de diagnóstico com métricas de sucesso

**Tipos de Logs Capturados:**
- `SEND_MESSAGE_START` - Início do processo de envio
- `CREDENTIALS_VALIDATION` - Validação de credenciais Z-API
- `CHANNEL_CONFIG` - Configuração de canal específico
- `API_REQUEST` - Detalhes da requisição para Z-API
- `API_RESPONSE` - Resposta da Z-API com análise
- `DATABASE_UPDATE` - Atualizações no banco de dados
- `REQUEST_TIMEOUT` - Timeouts de requisição
- `SEND_MESSAGE_ERROR` - Erros gerais de envio

### 2. Endpoints de Diagnóstico

#### GET /api/zapi/diagnostic
Retorna relatório completo de diagnóstico:
```json
{
  "success": true,
  "report": {
    "period": "24h",
    "totalOperations": 125,
    "successCount": 118,
    "errorCount": 7,
    "timeoutCount": 2,
    "successRate": "94.40%",
    "avgResponseTime": "1247ms",
    "commonErrors": [
      {"error": "Credenciais Z-API não configuradas", "count": 3},
      {"error": "Timeout: Requisição cancelada após 8 segundos", "count": 2}
    ]
  },
  "recentLogs": [...]
}
```

#### GET /api/zapi/logs/:requestId
Busca logs específicos por ID de requisição:
```json
{
  "success": true,
  "requestId": "zapi_1750462123_abc123xyz",
  "logs": [
    {
      "timestamp": "2025-06-20T23:30:15.123Z",
      "level": "INFO",
      "operation": "SEND_MESSAGE_START",
      "data": {...},
      "requestId": "zapi_1750462123_abc123xyz"
    }
  ]
}
```

### 3. Interface Administrative (Frontend)

**Componente:** `client/src/modules/Admin/components/ZApiDiagnostic.tsx`

**Funcionalidades:**
- Dashboard em tempo real com métricas principais
- Visualização de logs recentes com filtros
- Análise de erros mais comuns
- Detalhamento de requisições específicas
- Auto-refresh opcional para monitoramento contínuo

**Métricas Exibidas:**
- Taxa de sucesso de envios
- Número total de erros
- Tempo médio de resposta
- Quantidade de timeouts

### 4. Logs Aprimorados nos Handlers

Todos os handlers de envio foram atualizados com logs detalhados:

- **Mensagens de Texto** (`utilities-zapi.ts`)
- **Imagens** (`webhooks/handlers/zapi.ts`)
- **Áudios** (`webhooks/handlers/zapi.ts`)
- **Uploads de Mídia** (`media/routes/upload.ts`)

## Como Usar para Diagnóstico

### 1. Identificar Problemas Gerais
```bash
curl "http://localhost:5000/api/zapi/diagnostic"
```

Analise:
- `successRate` - Taxa geral de sucesso
- `commonErrors` - Erros mais frequentes
- `avgResponseTime` - Performance da API

### 2. Investigar Erro Específico
1. Encontre o `requestId` nos logs recentes
2. Busque detalhes completos:
```bash
curl "http://localhost:5000/api/zapi/logs/REQUEST_ID"
```

### 3. Monitorar em Tempo Real
Acesse o painel administrativo:
- Vá para Admin → Z-API Diagnóstico
- Ative o auto-refresh
- Monitore métricas em tempo real

## Cenários de Diagnóstico Comuns

### Problema: Mensagens não sendo enviadas
**Investigação:**
1. Verifique `errorCount` no diagnóstico
2. Analise `commonErrors` para padrões
3. Possíveis causas:
   - Credenciais Z-API inválidas
   - Timeout de rede
   - Problema de conectividade

### Problema: Lentidão no envio
**Investigação:**
1. Verifique `avgResponseTime`
2. Analise logs de `API_RESPONSE` com `duration` alto
3. Possíveis causas:
   - Latência de rede
   - Sobrecarga da Z-API
   - Problemas de DNS

### Problema: Erros intermitentes
**Investigação:**
1. Use o `requestId` para rastrear requisições específicas
2. Compare logs de sucesso vs falha
3. Identifique padrões temporais

## Segurança e Performance

### Dados Mascarados
- Telefones: `5511999****999`
- Tokens: `[REDACTED]`
- Base64: `[BASE64_IMAGE_1234_BYTES]`

### Rotação de Logs
- Máximo 1000 entradas mantidas em memória
- Logs mais antigos são automaticamente removidos
- Exportação disponível para análise externa

### Performance
- Logs estruturados para consulta eficiente
- Cache de métricas para reduzir carga
- Operações assíncronas para não bloquear requisições

## Resolução de Problemas Identificados

### 1. Credenciais Z-API
```bash
# Verificar variáveis de ambiente
echo $ZAPI_INSTANCE_ID
echo $ZAPI_TOKEN  
echo $ZAPI_CLIENT_TOKEN
```

### 2. Conectividade de Rede
```bash
# Testar conectividade direta
curl -I "https://api.z-api.io/instances/INSTANCE/token/TOKEN/status"
```

### 3. Performance da API
- Monitorar tempos de resposta no diagnóstico
- Configurar timeouts adequados (atual: 8 segundos)
- Implementar retry logic se necessário

## Logs de Exemplo

### Envio Bem-sucedido
```
[Z-API-INFO] SEND_MESSAGE_START {
  "phone": "5511999****999",
  "messageLength": 45,
  "messageType": "text",
  "requestId": "zapi_1750462123_abc123xyz"
}

[Z-API-INFO] CREDENTIALS_VALIDATION {
  "isValid": true,
  "source": "env",
  "requestId": "zapi_1750462123_abc123xyz"
}

[Z-API-INFO] API_RESPONSE {
  "status": 200,
  "messageId": "3EB005D673E37C3951EAFE",
  "duration": 1247,
  "isSuccess": true,
  "requestId": "zapi_1750462123_abc123xyz"
}
```

### Erro de Credenciais
```
[Z-API-ERROR] CREDENTIALS_VALIDATION {
  "isValid": false,
  "source": "env",
  "error": "Credenciais Z-API não configuradas",
  "hasInstanceId": false,
  "hasToken": false,
  "hasClientToken": false,
  "requestId": "zapi_1750462124_def456uvw"
}
```

## Conclusão

O sistema de logs implementado fornece visibilidade completa sobre o processo de envio de mensagens Z-API, permitindo:

1. **Diagnóstico Rápido** - Identificação imediata de problemas
2. **Análise Detalhada** - Rastreamento completo de requisições
3. **Monitoramento Proativo** - Métricas em tempo real
4. **Resolução Eficiente** - Informações específicas para correção

Este sistema é essencial para manter a estabilidade do envio de mensagens em produção e reduzir significativamente o tempo de resolução de problemas.