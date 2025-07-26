-- Insert a default organization for testing
INSERT INTO organizations (id, name, settings) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000', 
    'CloudWeave Demo', 
    '{}'
) ON CONFLICT (id) DO NOTHING;

-- Insert a demo user for testing (password: password123)
-- Password hash generated with bcrypt cost 12
INSERT INTO users (
    id, 
    email, 
    name, 
    password_hash, 
    organization_id
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'demo@cloudweave.com',
    'Demo User',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Txjyvq', -- password123
    '550e8400-e29b-41d4-a716-446655440000'
) ON CONFLICT (email) DO NOTHING;