-- Criar tabela de handoffs/transferências
CREATE TABLE IF NOT EXISTS handoffs (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id),
  from_user_id INTEGER REFERENCES system_users(id),
  to_user_id INTEGER REFERENCES system_users(id),
  from_team_id INTEGER REFERENCES teams(id),
  to_team_id INTEGER REFERENCES teams(id),
  type VARCHAR(20) NOT NULL, -- manual, automatic, escalation
  reason TEXT,
  priority VARCHAR(10) DEFAULT 'normal', -- low, normal, high, urgent
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, completed
  ai_classification JSONB,
  metadata JSONB,
  accepted_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_handoffs_conversation_id ON handoffs(conversation_id);
CREATE INDEX idx_handoffs_from_user_id ON handoffs(from_user_id);
CREATE INDEX idx_handoffs_to_user_id ON handoffs(to_user_id);
CREATE INDEX idx_handoffs_status ON handoffs(status);
CREATE INDEX idx_handoffs_type ON handoffs(type);
CREATE INDEX idx_handoffs_created_at ON handoffs(created_at);