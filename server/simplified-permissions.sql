-- Script para simplificar permissões obsoletas
-- Remove permissões que agora são controladas por roles

-- Primeiro, vamos consultar as permissões atuais
SELECT id, name, category, description FROM permissions 
WHERE category IN ('admin', 'analytics', 'administracao') 
ORDER BY category, name;

-- Remover permissões obsoletas que agora são controladas por roles
DELETE FROM role_permissions WHERE permission_id IN (
  SELECT id FROM permissions WHERE name IN (
    'settings_view',
    'settings_edit', 
    'bi_view',
    'integrations_view',
    'commissions_view',
    'admin_panel_access'
  )
);

DELETE FROM permissions WHERE name IN (
  'settings_view',
  'settings_edit',
  'bi_view', 
  'integrations_view',
  'commissions_view',
  'admin_panel_access'
);

-- Manter apenas permissões essenciais que não são cobertas por roles
-- Exemplo: permissões específicas dentro de cada módulo que requerem controle granular