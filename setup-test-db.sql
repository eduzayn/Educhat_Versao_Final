CREATE DATABASE test;
CREATE USER test WITH PASSWORD 'test';
GRANT ALL PRIVILEGES ON DATABASE test TO test;

\c test;

CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    profile_image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER REFERENCES contacts(id),
    channel VARCHAR(50) DEFAULT 'whatsapp',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id),
    content TEXT,
    message_type VARCHAR(50) DEFAULT 'text',
    is_from_contact BOOLEAN DEFAULT true,
    sent_at TIMESTAMP DEFAULT NOW(),
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    is_deleted BOOLEAN DEFAULT false,
    is_deleted_by_user BOOLEAN DEFAULT false,
    deleted_by_user_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO contacts (name, phone, email) VALUES 
('Test Contact', '5511999999999', 'test@example.com'),
('Marco Test', '5511888888888', 'marco@test.com')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO conversations (contact_id, channel, status) VALUES 
(1, 'whatsapp', 'active'),
(2, 'whatsapp', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO messages (conversation_id, content, message_type, is_from_contact, sent_at, metadata) VALUES 
(1, 'Test text message', 'text', true, NOW(), '{}'),
(1, 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4', 'video', true, NOW(), '{"fileName": "test_video.mp4"}'),
(1, 'https://via.placeholder.com/300.jpg', 'image', true, NOW(), '{"fileName": "test_image.jpg"}'),
(1, 'Test outbound message', 'text', false, NOW(), '{"zaapId": "test123"}'),
(2, 'Another test message', 'text', true, NOW(), '{}')
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON messages(is_deleted);
