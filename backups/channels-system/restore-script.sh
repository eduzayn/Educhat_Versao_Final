#!/bin/bash

# Script de Restauração do Sistema de Canais
# Data: 2025-06-09
# Descrição: Restaura o sistema completo de canais WhatsApp

echo "🔄 Iniciando restauração do sistema de canais..."

# Verificar se os backups existem
if [ ! -d "backups/channels-system" ]; then
    echo "❌ Diretório de backup não encontrado!"
    exit 1
fi

# Função para criar backup antes da restauração
create_safety_backup() {
    echo "📦 Criando backup de segurança dos arquivos atuais..."
    mkdir -p "backups/pre-restore-$(date +%Y%m%d_%H%M%S)"
    
    cp "server/storage/modules/channelStorage.ts" "backups/pre-restore-$(date +%Y%m%d_%H%M%S)/" 2>/dev/null || true
    cp "server/routes/channels/index.ts" "backups/pre-restore-$(date +%Y%m%d_%H%M%S)/" 2>/dev/null || true
    cp "server/routes/webhooks/index.ts" "backups/pre-restore-$(date +%Y%m%d_%H%M%S)/" 2>/dev/null || true
    cp "server/core/zapi-utils.ts" "backups/pre-restore-$(date +%Y%m%d_%H%M%S)/" 2>/dev/null || true
    cp "client/src/pages/Settings/ChannelsPage.tsx" "backups/pre-restore-$(date +%Y%m%d_%H%M%S)/" 2>/dev/null || true
}

# Função para verificar integridade dos arquivos
verify_integrity() {
    echo "🔍 Verificando integridade dos arquivos de backup..."
    
    local files=(
        "backups/channels-system/channelStorage.ts"
        "backups/channels-system/channels-routes.ts"
        "backups/channels-system/webhooks-routes.ts"
        "backups/channels-system/zapi-utils.ts"
        "backups/channels-system/ChannelsPage.tsx"
    )
    
    for file in "${files[@]}"; do
        if [ ! -f "$file" ]; then
            echo "❌ Arquivo de backup não encontrado: $file"
            exit 1
        fi
        echo "✅ $file verificado"
    done
}

# Função para restaurar arquivos
restore_files() {
    echo "📁 Restaurando arquivos do sistema..."
    
    # Restaurar storage
    cp "backups/channels-system/channelStorage.ts" "server/storage/modules/channelStorage.ts"
    echo "✅ channelStorage.ts restaurado"
    
    # Restaurar routes de canais
    cp "backups/channels-system/channels-routes.ts" "server/routes/channels/index.ts"
    echo "✅ channels routes restauradas"
    
    # Restaurar webhooks
    cp "backups/channels-system/webhooks-routes.ts" "server/routes/webhooks/index.ts"
    echo "✅ webhooks restaurados"
    
    # Restaurar utilitários Z-API
    cp "backups/channels-system/zapi-utils.ts" "server/core/zapi-utils.ts"
    echo "✅ zapi-utils restaurado"
    
    # Restaurar interface frontend
    cp "backups/channels-system/ChannelsPage.tsx" "client/src/pages/Settings/ChannelsPage.tsx"
    echo "✅ ChannelsPage restaurada"
}

# Função para verificar dependências
check_dependencies() {
    echo "📦 Verificando dependências..."
    
    if ! grep -q "qrcode.react" package.json; then
        echo "⚠️ Instalando qrcode.react..."
        npm install qrcode.react
    else
        echo "✅ qrcode.react já instalado"
    fi
}

# Função para testar o sistema
test_system() {
    echo "🧪 Executando testes do sistema..."
    
    # Verificar se o servidor inicia sem erros
    echo "Verificando se o servidor inicia..."
    timeout 10s npm run dev &
    local server_pid=$!
    sleep 5
    
    if ps -p $server_pid > /dev/null; then
        echo "✅ Servidor iniciou com sucesso"
        kill $server_pid 2>/dev/null || true
    else
        echo "❌ Falha ao iniciar servidor"
        return 1
    fi
    
    echo "✅ Testes básicos concluídos"
}

# Executar restauração
main() {
    verify_integrity
    create_safety_backup
    restore_files
    check_dependencies
    test_system
    
    echo ""
    echo "🎉 Restauração concluída com sucesso!"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Reinicie o servidor: npm run dev"
    echo "2. Acesse a página de canais"
    echo "3. Teste a criação de um canal"
    echo "4. Verifique a geração de QR Code"
    echo "5. Confirme o processamento de webhooks"
    echo ""
    echo "📚 Consulte o backup-manifest.json para mais detalhes"
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi