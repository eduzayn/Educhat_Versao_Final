# Guia de Teste - Sistema de Transferências de Equipes

## Como Testar o Sistema

### 1. Acesse a Página de Transferências
- **URL Direta**: `http://localhost:5000/teams/transfer`
- **Navegação**: Dashboard → Menu → Transferências de Equipes

### 2. Interface da Página
A página exibe um **kanban board** com:
- **Coluna "Não Atribuídas"**: Conversas sem equipe definida
- **Colunas de Equipes**: Uma coluna para cada equipe do sistema
- **Filtros**: Busca por nome/mensagem e filtro por equipe
- **Histórico**: Lista das últimas transferências realizadas

### 3. Como Fazer uma Transferência

#### Método Drag & Drop:
1. **Localize uma conversa** em qualquer coluna
2. **Arraste a conversa** para outra coluna de equipe
3. **Solte** na coluna de destino
4. **Confirme** no dialog que aparece:
   - Informe o motivo da transferência
   - Clique em "Confirmar Transferência"

#### Elementos Visuais:
- **Cards de Conversa** mostram:
  - Nome do contato
  - Última mensagem
  - Status (aberta/pendente/fechada)
  - Canal (WhatsApp, Instagram, etc.)
  - Usuário responsável
  - Contador de mensagens não lidas

### 4. Testando Cenários

#### Cenário 1 - Transferência Simples:
```
1. Acesse /teams/transfer
2. Arraste uma conversa da "Equipe Suporte" para "Equipe Vendas"
3. Adicione motivo: "Cliente interessado em produto"
4. Confirme a transferência
5. Verifique que a conversa mudou de coluna
6. Confira o histórico na parte inferior
```

#### Cenário 2 - Transferência de Não Atribuída:
```
1. Localize conversas na coluna "Não Atribuídas"
2. Arraste para uma equipe específica
3. Adicione motivo: "Classificação inicial"
4. Confirme
```

#### Cenário 3 - Usando Filtros:
```
1. Digite um nome no campo de busca
2. Selecione uma equipe no filtro
3. Observe que apenas conversas correspondentes aparecem
4. Faça transferências nos resultados filtrados
```

### 5. Verificações Automáticas

O sistema automaticamente:
- ✅ **Atualiza em tempo real** outras telas abertas
- ✅ **Registra no histórico** com data/hora/usuário
- ✅ **Valida permissões** do usuário
- ✅ **Impede transferências inválidas** (ex: para "não atribuídas")

### 6. Histórico de Transferências

Na parte inferior da página você verá:
- **Nome do contato** transferido
- **Equipe origem** → **Equipe destino**
- **Motivo** da transferência
- **Quem fez** a transferência
- **Data e hora** da operação

### 7. APIs Testáveis

#### Transferir Conversa (POST):
```bash
curl -X POST http://localhost:5000/api/teams/transfer-conversation \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": 123,
    "fromTeamId": 1,
    "toTeamId": 2,
    "reason": "Teste via API"
  }'
```

#### Consultar Histórico (GET):
```bash
curl http://localhost:5000/api/teams/transfer-history
```

#### Listar Conversas com Info de Equipes (GET):
```bash
curl "http://localhost:5000/api/conversations?include_team_info=true&limit=100"
```

### 8. Solução de Problemas

#### Se a página não carregar:
- Verifique se está logado no sistema
- Confirme que tem permissões de "teams:manage"
- Verifique o console do navegador para erros

#### Se o drag & drop não funcionar:
- Teste com diferentes navegadores
- Verifique se há erros no console
- Certifique-se que as conversas têm IDs válidos

#### Se não aparecem conversas:
- Verifique se existem conversas no sistema
- Confirme se as equipes estão criadas
- Teste com filtros diferentes

### 9. Dados de Teste

Para criar dados de teste rapidamente:
```sql
-- Criar algumas equipes de teste
INSERT INTO teams (name, team_type) VALUES 
('Equipe Teste A', 'vendas'),
('Equipe Teste B', 'suporte');

-- Ver conversas disponíveis
SELECT id, contact_id, assigned_team_id FROM conversations LIMIT 10;
```

### 10. Funcionalidades Avançadas

- **Responsividade**: Teste em mobile/tablet
- **Temas**: Funciona com modo claro/escuro
- **Performance**: Carrega apenas 100 conversas por vez
- **Validações**: Impede ações inválidas automaticamente
- **Notificações**: Mostra sucesso/erro via toast

## Resultado Esperado

Após o teste bem-sucedido, você deve conseguir:
- ✅ Arrastar conversas entre equipes
- ✅ Ver confirmação visual da transferência
- ✅ Consultar histórico detalhado
- ✅ Usar filtros para encontrar conversas
- ✅ Receber notificações de sucesso/erro