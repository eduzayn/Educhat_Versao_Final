# ARQUIVOS PROTEGIDOS - SISTEMA DE CARREGAMENTO DE MÍDIAS SOB DEMANDA

## ⚠️ ATENÇÃO: ARQUIVOS CRÍTICOS DO SISTEMA DE MÍDIAS

Os arquivos listados abaixo são **CRÍTICOS** para o funcionamento do sistema de carregamento de mídias sob demanda e não devem ser modificados sem autorização explícita. O sistema está estável e qualquer alteração pode comprometer a funcionalidade.

### ARQUIVOS PROTEGIDOS

#### Frontend - Componentes de Mídia Lazy Loading
- `client/src/modules/Messages/components/LazyMediaContent/LazyMediaContent.tsx` - Componente principal de carregamento sob demanda
- `client/src/modules/Messages/components/LazyMediaContent/index.ts` - Export do componente

#### Frontend - Hooks de Otimização
- `client/src/shared/lib/hooks/useOptimizedMedia.ts` - Hook principal de otimização de mídia
- `client/src/shared/lib/hooks/usePerformanceOptimizedMedia.ts` - Hook de performance
- `client/src/shared/lib/hooks/useMessageOptimizations.ts` - Otimizações de mensagens
- `client/src/shared/lib/hooks/useMessageCache.ts` - Cache de mensagens
- `client/src/shared/lib/hooks/useOptimizedMessageLoading.ts` - Carregamento otimizado

#### Frontend - Utilitários de Mídia
- `client/src/shared/lib/utils/mediaUrlProcessor.ts` - Processador de URLs de mídia
- `client/src/shared/lib/utils/messageOptimizations.ts` - Otimizações de mensagens

#### Backend - Rotas de Mídia
- `server/routes/messages/routes/media.ts` - API de carregamento de mídia
- `server/routes/webhooks/handlers/zapi-media.ts` - Handler de webhook para mídia
- `server/utils/mediaUrlExtractor.ts` - Extrator de URLs de mídia

### FUNCIONALIDADES PROTEGIDAS

1. **Carregamento Sob Demanda**: Sistema que carrega mídias apenas quando solicitado
2. **Cache Inteligente**: Gerenciamento de cache para otimização de performance
3. **Otimização de URLs**: Processamento inteligente de URLs de mídia
4. **Performance**: Sistema de lazy loading para melhorar velocidade
5. **Retry Logic**: Sistema de tentativas para carregamento falhado

## 🔒 POLÍTICA DE PROTEÇÃO

1. **Nenhuma modificação** sem aprovação explícita
2. **Backup obrigatório** antes de qualquer alteração
3. **Testes extensivos** em ambiente de desenvolvimento
4. **Revisão de código** por pelo menos 2 pessoas
5. **Rollback plan** sempre disponível

## 📋 SISTEMA ESTÁVEL

O sistema de carregamento de mídias sob demanda está atualmente **ESTÁVEL** e funcionando corretamente:
- Carregamento sob demanda operacional para todas as mensagens
- Cache funcionando eficientemente
- Performance otimizada
- URLs sendo processadas corretamente
- Retry logic funcionando

## ⚠️ CONSEQUÊNCIAS DE ALTERAÇÕES NÃO AUTORIZADAS

- Quebra do carregamento sob demanda
- Perda de performance na interface
- Falhas no cache de mídias
- Problemas de memória
- Experiência do usuário degradada
- Carregamento automático indevido

## 📞 CONTATO PARA ALTERAÇÕES

Para qualquer alteração necessária nos arquivos protegidos, entre em contato com a equipe responsável antes de proceder.

---
**Data de Proteção:** 18/06/2025 15:39
**Status:** SISTEMA ESTÁVEL - NÃO MODIFICAR