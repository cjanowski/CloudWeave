-- Insert a default organization for testing
INSERT INTO organizations (id, name, slug, settings) 
VALUES (
    'org-123', 
    'CloudWeave Demo', 
    'cloudweave-demo', 
    '{}'
) ON CONFLICT (id) DO NOTHING;

-- Insert a demo user for testing (password: password123)
-- Password hash generated with bcrypt cost 12
INSERT INTO users (
    id, 
    email, 
    name, 
    password_hash, 
    role, 
    organization_id, 
    preferences, 
    email_verified
) VALUES (
    'user-123',
    'demo@cloudweave.com',
    'Demo User',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Txjyvq', -- password123
    'admin',
    'org-123',
    '{}',
    true
) ON CONFLICT (email) DO NOTHING;