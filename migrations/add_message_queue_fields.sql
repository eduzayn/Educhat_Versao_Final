-- Adicionar campos para sistema de fila de mensagens
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'sent',
ADD COLUMN IF NOT EXISTS temp_id varchar(36),
ADD COLUMN IF NOT EXISTS error text,
ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0;

-- Criar índice para busca por temp_id
CREATE INDEX IF NOT EXISTS idx_messages_temp_id ON messages(temp_id);

-- Criar índice para status
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status); 