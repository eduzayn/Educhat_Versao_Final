# Padronização REST - APIs Z-API

## Rotas Padronizadas

### Antes (Não-REST) → Depois (REST Padronizado)

#### Reações
- `POST /api/zapi/send-reaction` → `POST /api/zapi/reactions`
- `POST /api/zapi/remove-reaction` → `DELETE /api/zapi/reactions`

#### Mensagens
- `POST /api/zapi/send-message` → `POST /api/zapi/messages`
- `POST /api/zapi/delete-message` → `DELETE /api/zapi/messages/:messageId`
- `POST /api/zapi/read-message` → `PATCH /api/zapi/messages/read`

#### Mídia
- `POST /api/zapi/send-audio` → `POST /api/zapi/media/audio`
- `POST /api/zapi/send-image` → `POST /api/zapi/media/images`
- `POST /api/zapi/send-video` → `POST /api/zapi/media/videos`
- `POST /api/zapi/send-document` → `POST /api/zapi/media/documents`

#### Links
- `POST /api/zapi/send-link` → `POST /api/zapi/links`

#### Configuração
- `POST /api/zapi/configure-webhook` → `PUT /api/zapi/webhook`
- `POST /api/zapi/disconnect` → `DELETE /api/zapi/connection`

#### Contatos
- `POST /api/zapi/contacts/:phone/block` → `PATCH /api/zapi/contacts/:phone/block`

## Princípios REST Aplicados

1. **Recursos como Substantivos**: URLs representam recursos (reactions, messages, media)
2. **Métodos HTTP Semânticos**:
   - POST: Criar novos recursos
   - GET: Recuperar recursos
   - PUT: Atualizar/substituir recursos completos
   - PATCH: Atualizar parcialmente recursos
   - DELETE: Remover recursos

3. **Hierarquia de Recursos**: Agrupamento lógico (/media/audio, /media/images)
4. **Parâmetros de Rota**: IDs de recursos na URL (/messages/:messageId)

## Status da Integração
✅ Todas as mudanças mantêm compatibilidade total com Z-API
✅ Sistema funcionando com autenticação e Socket.IO
✅ 137 endpoints ativos após consolidação e padronização