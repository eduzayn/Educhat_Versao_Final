#!/bin/bash

echo "🧪 Testando performance dos endpoints de mensagens..."

cat > curl-format.txt << 'EOF'
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
EOF

echo "📊 Testando endpoint de mídia..."
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:5000/api/messages/1/media"

echo ""
echo "📊 Testando endpoint de conversas..."
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:5000/api/conversations"

echo ""
echo "📊 Testando soft delete..."
curl -X POST -H "Content-Type: application/json" \
  -w "@curl-format.txt" -o /dev/null -s \
  -d '{"messageId": 1, "conversationId": 1}' \
  "http://localhost:5000/api/messages/soft-delete"

rm curl-format.txt
echo "✅ Testes de performance concluídos"
