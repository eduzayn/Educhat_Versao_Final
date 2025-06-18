# ARQUIVOS PROTEGIDOS - SISTEMA DE TRANSFERÊNCIAS

## ⚠️ ATENÇÃO: ARQUIVOS CRÍTICOS DO SISTEMA DE TRANSFERÊNCIAS

Os arquivos listados abaixo são **CRÍTICOS** para o funcionamento do sistema de transferências e não devem ser modificados sem autorização explícita. O sistema está estável e qualquer alteração pode comprometer a funcionalidade.

### ARQUIVOS PROTEGIDOS

#### Backend - Rotas de Handoffs
- `server/routes/handoffs/index.ts` - Rota principal do sistema
- `server/routes/handoffs/intelligent.ts` - Atribuição inteligente com IA
- `server/routes/handoffs/round-robin.ts` - Sistema de rodízio
- `server/routes/handoffs/stats.ts` - Estatísticas de transferências
- `server/routes/handoffs/pending.ts` - Handoffs pendentes
- `server/routes/handoffs/base.ts` - Operações básicas
- `server/routes/handoffs/config.ts` - Configurações
- `server/routes/handoffs/middleware.ts` - Middleware de validação
- `server/routes/handoffs/types.ts` - Tipos TypeScript

#### Backend - Serviços de Atribuição
- `server/services/immediate-ai-assignment.ts` - Atribuição imediata com IA
- `server/services/auto-ai-assignment.ts` - Atribuição automática
- `server/services/assignmentCompatibilityService.ts` - Compatibilidade
- `server/services/assignmentExecutionService.ts` - Execução de atribuições
- `server/services/assignmentAnalysisService.ts` - Análise de atribuições
- `server/services/assignmentUtils.ts` - Utilitários
- `server/services/assignmentTypes.ts` - Tipos de atribuição
- `server/services/handoffOperations.ts` - Operações de handoff
- `server/services/handoffStats.ts` - Estatísticas
- `server/services/handoffEvaluation.ts` - Avaliação
- `server/services/handoff-types.ts` - Tipos de handoff

#### Frontend - Interface de Handoffs
- `client/src/modules/Handoffs/HandoffsPage.tsx` - Página principal
- `client/src/modules/Handoffs/HandoffsList.tsx` - Lista de transferências
- `client/src/modules/Handoffs/` - Todo o módulo de handoffs

#### Database - Schema e Migrações
- `shared/schema.ts` - Schema da tabela handoffs
- `migrations/0007_create_handoffs.sql` - Migração da tabela

#### Scripts de Manutenção
- `scripts/fix-pending-handoffs.js` - Correção de handoffs pendentes

#### Admin - Atribuições Retroativas
- `server/routes/admin/retroactive-assignment.ts` - Atribuições retroativas
- `server/routes/admin/retroactive-assignment-router.ts` - Router

#### Teams - Atribuições de Equipes
- `server/routes/teams/teams-assignments.ts` - Atribuições de equipes

### CLASSIFICAÇÃO DE IA RELACIONADA
- `server/services/ai-classification.ts` - Sistema de classificação por IA
- `server/services/aiService.ts` - Serviços de IA

### WEBHOOK HANDLERS
- `server/routes/webhooks/index.ts` - Processamento de webhooks (seções de handoff)

## 🔒 POLÍTICA DE PROTEÇÃO

1. **Nenhuma modificação** sem aprovação explícita
2. **Backup obrigatório** antes de qualquer alteração
3. **Testes extensivos** em ambiente de desenvolvimento
4. **Revisão de código** por pelo menos 2 pessoas
5. **Rollback plan** sempre disponível

## 📋 SISTEMA ESTÁVEL

O sistema de transferências está atualmente **ESTÁVEL** e funcionando corretamente:
- Atribuição inteligente com IA operacional
- Round-robin funcionando
- Estatísticas precisas
- Interface funcional
- Webhooks processando corretamente

## ⚠️ CONSEQUÊNCIAS DE ALTERAÇÕES NÃO AUTORIZADAS

- Quebra do sistema de atribuição automática
- Perda de conversas não atribuídas
- Falhas na análise de IA
- Inconsistências nas estatísticas
- Impacto na experiência do usuário

## 📞 CONTATO PARA ALTERAÇÕES

Para qualquer alteração necessária nos arquivos protegidos, entre em contato com a equipe responsável antes de proceder.

---
**Data de Proteção:** 18/06/2025 15:37
**Status:** SISTEMA ESTÁVEL - NÃO MODIFICAR