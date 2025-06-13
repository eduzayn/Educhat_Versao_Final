-- Migração para consolidar sistema de usuários
-- Remove duplicação entre tabelas 'users' e 'system_users'
-- Data: 2025-06-13
-- Objetivo: Usar apenas 'system_users' como fonte única da verdade

-- 1. Verificar dados existentes
SELECT 'Usuários em users:' as info, COUNT(*) as count FROM users
UNION ALL
SELECT 'Usuários em system_users:' as info, COUNT(*) as count FROM system_users;

-- 2. Verificar usuários únicos por email
SELECT 'Usuários únicos em users não migrados:' as info, COUNT(*) as count 
FROM users 
WHERE email NOT IN (SELECT email FROM system_users);

-- 3. Atualizar referências na tabela contacts
-- Migrar assignedUserId de varchar (users.id) para integer (system_users.id)
UPDATE contacts 
SET assigned_user_id = (
  SELECT id FROM system_users 
  WHERE system_users.email = (
    SELECT email FROM users WHERE users.id = contacts.assigned_user_id
  )
)
WHERE assigned_user_id IN (SELECT id FROM users);

-- 4. Atualizar referências na tabela contact_notes
-- Migrar authorId de varchar para integer
UPDATE contact_notes 
SET author_id = (
  SELECT CAST(id AS VARCHAR) FROM system_users 
  WHERE system_users.email = (
    SELECT email FROM users WHERE users.id = contact_notes.author_id
  )
)
WHERE author_id IN (SELECT id FROM users);

-- 5. Atualizar referências na tabela quick_replies
-- Migrar createdBy para system_users
UPDATE quick_replies 
SET created_by = (
  SELECT CAST(id AS VARCHAR) FROM system_users 
  WHERE system_users.email = (
    SELECT email FROM users WHERE users.id = quick_replies.created_by
  )
)
WHERE created_by IN (SELECT id FROM users);

-- 6. Atualizar referências na tabela quick_reply_shares
-- Migrar userId e sharedBy para system_users
UPDATE quick_reply_shares 
SET user_id = (
  SELECT CAST(id AS VARCHAR) FROM system_users 
  WHERE system_users.email = (
    SELECT email FROM users WHERE users.id = quick_reply_shares.user_id
  )
)
WHERE user_id IN (SELECT id FROM users);

UPDATE quick_reply_shares 
SET shared_by = (
  SELECT CAST(id AS VARCHAR) FROM system_users 
  WHERE system_users.email = (
    SELECT email FROM users WHERE users.id = quick_reply_shares.shared_by
  )
)
WHERE shared_by IN (SELECT id FROM users);

-- 7. Verificar integridade após migração
SELECT 'Verificação pós-migração:' as status;

SELECT 'Contacts com assigned_user_id inválido:' as check, COUNT(*) as count
FROM contacts 
WHERE assigned_user_id IS NOT NULL 
AND assigned_user_id NOT IN (SELECT CAST(id AS VARCHAR) FROM system_users);

SELECT 'Quick replies com created_by inválido:' as check, COUNT(*) as count
FROM quick_replies 
WHERE created_by IS NOT NULL 
AND created_by NOT IN (SELECT CAST(id AS VARCHAR) FROM system_users);

-- 8. Criar backup da tabela users antes de deprecá-la
CREATE TABLE users_backup AS SELECT * FROM users;

-- 9. Adicionar comentário indicando depreciação
COMMENT ON TABLE users IS 'DEPRECATED: Use system_users instead. Kept for backup purposes only.';

-- 10. Relatório final
SELECT 'MIGRAÇÃO CONCLUÍDA' as status;
SELECT 'Total usuários em system_users:' as info, COUNT(*) as count FROM system_users;
SELECT 'Backup criado em users_backup:' as info, COUNT(*) as count FROM users_backup;