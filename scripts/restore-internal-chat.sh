#!/bin/bash

# Script de restauração do chat interno de produção
# Data: 2025-06-09

echo "🔄 Restaurando chat interno de produção..."

# Verificar se o backup existe
if [ ! -d "backups/internal-chat-production" ]; then
    echo "❌ Backup não encontrado em backups/internal-chat-production"
    exit 1
fi

# Fazer backup da versão atual antes de restaurar
echo "💾 Criando backup da versão atual..."
mkdir -p backups/internal-chat-current-$(date +%Y%m%d_%H%M%S)
cp -r client/src/pages/InternalChat/* backups/internal-chat-current-$(date +%Y%m%d_%H%M%S)/

# Restaurar arquivos de produção
echo "📁 Restaurando arquivos de produção..."
rm -rf client/src/pages/InternalChat/*
cp -r backups/internal-chat-production/* client/src/pages/InternalChat/

# Verificar importações
echo "🔍 Verificando importações..."
find client/src/pages/InternalChat/components -name "*.tsx" -exec grep -l "@/shared/store/internalChatStore" {} \; | while read file; do
    echo "⚠️  Corrigindo importação em $file"
    sed -i 's|@/shared/store/internalChatStore|../store/internalChatStore|g' "$file"
done

# Corrigir caminhos de UI duplicados
echo "🛠️  Corrigindo caminhos de UI..."
find client/src/pages/InternalChat/components -name "*.tsx" -exec sed -i 's|@/shared/ui/ui/|@/shared/ui/|g' {} \;

echo "✅ Restauração concluída!"
echo "🔄 Reinicie o servidor com: npm run dev"