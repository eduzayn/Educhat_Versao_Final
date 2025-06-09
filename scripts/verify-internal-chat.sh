#!/bin/bash

# Script de verificação de integridade do chat interno
# Data: 2025-06-09

echo "🔍 Verificando integridade do chat interno..."

ERRORS=0

# Verificar se arquivos essenciais existem
REQUIRED_FILES=(
    "client/src/pages/InternalChat/InternalChatPage.tsx"
    "client/src/pages/InternalChat/store/internalChatStore.ts"
    "client/src/pages/InternalChat/components/ChannelSidebar.tsx"
    "client/src/pages/InternalChat/components/ChatMessages.tsx"
    "client/src/pages/InternalChat/components/ChatInput.tsx"
    "client/src/pages/InternalChat/components/InfoPanel.tsx"
    "client/src/pages/InternalChat/components/PrivateMessageModal.tsx"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Arquivo ausente: $file"
        ERRORS=$((ERRORS + 1))
    else
        echo "✅ $file"
    fi
done

# Verificar importações corretas
echo "🔍 Verificando importações..."
if grep -r "@/shared/store/internalChatStore" client/src/pages/InternalChat/components/ > /dev/null; then
    echo "⚠️  Importações incorretas encontradas! Execute a correção:"
    echo "   find client/src/pages/InternalChat/components -name '*.tsx' -exec sed -i 's|@/shared/store/internalChatStore|../store/internalChatStore|g' {} \\;"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Importações corretas"
fi

# Verificar caminhos de UI duplicados
if grep -r "@/shared/ui/ui/" client/src/pages/InternalChat/components/ > /dev/null; then
    echo "⚠️  Caminhos de UI duplicados encontrados! Execute a correção:"
    echo "   find client/src/pages/InternalChat/components -name '*.tsx' -exec sed -i 's|@/shared/ui/ui/|@/shared/ui/|g' {} \\;"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Caminhos de UI corretos"
fi

# Verificar backup
if [ ! -d "backups/internal-chat-production" ]; then
    echo "❌ Backup de produção não encontrado!"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Backup de produção disponível"
fi

# Resultado final
if [ $ERRORS -eq 0 ]; then
    echo "🎉 Chat interno íntegro e funcional!"
    exit 0
else
    echo "💥 $ERRORS problemas encontrados!"
    echo "📝 Execute 'bash scripts/restore-internal-chat.sh' para restaurar"
    exit 1
fi