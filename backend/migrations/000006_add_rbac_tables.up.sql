-- Create permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    permissions TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

-- Create user_roles table
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, role_id, organization_id)
);

-- Create resource_permissions table
CREATE TABLE resource_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    permissions TEXT[] DEFAULT '{}',
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, resource_type, resource_id, organization_id)
);

-- Create api_keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(20) NOT NULL,
    permissions TEXT[] DEFAULT '{}',
    scopes TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX idx_roles_organization_id ON roles(organization_id);
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_organization_id ON user_roles(organization_id);
CREATE INDEX idx_user_roles_active ON user_roles(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_resource_permissions_user_id ON resource_permissions(user_id);
CREATE INDEX idx_resource_permissions_resource ON resource_permissions(resource_type, resource_id);
CREATE INDEX idx_resource_permissions_organization_id ON resource_permissions(organization_id);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_organization_id ON api_keys(organization_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_active ON sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);

-- Insert default permissions
INSERT INTO permissions (name, resource, action, description, category) VALUES
-- Infrastructure permissions
('infrastructure:view', 'infrastructure', 'view', 'View infrastructure resources', 'infrastructure'),
('infrastructure:create', 'infrastructure', 'create', 'Create infrastructure resources', 'infrastructure'),
('infrastructure:update', 'infrastructure', 'update', 'Update infrastructure resources', 'infrastructure'),
('infrastructure:delete', 'infrastructure', 'delete', 'Delete infrastructure resources', 'infrastructure'),
('infrastructure:manage', 'infrastructure', 'manage', 'Full infrastructure management', 'infrastructure'),

-- Deployment permissions
('deployment:view', 'deployment', 'view', 'View deployments', 'deployment'),
('deployment:create', 'deployment', 'create', 'Create deployments', 'deployment'),
('deployment:update', 'deployment', 'update', 'Update deployments', 'deployment'),
('deployment:delete', 'deployment', 'delete', 'Delete deployments', 'deployment'),
('deployment:manage', 'deployment', 'manage', 'Full deployment management', 'deployment'),

-- Security permissions
('security:view', 'security', 'view', 'View security information', 'security'),
('security:scan', 'security', 'scan', 'Perform security scans', 'security'),
('security:manage', 'security', 'manage', 'Full security management', 'security'),

-- Compliance permissions
('compliance:view', 'compliance', 'view', 'View compliance information', 'compliance'),
('compliance:manage', 'compliance', 'manage', 'Manage compliance frameworks', 'compliance'),
('compliance:audit', 'compliance', 'audit', 'Access compliance audit logs', 'compliance'),

-- User management permissions
('user:view', 'user', 'view', 'View users', 'user'),
('user:create', 'user', 'create', 'Create users', 'user'),
('user:update', 'user', 'update', 'Update users', 'user'),
('user:delete', 'user', 'delete', 'Delete users', 'user'),
('user:manage', 'user', 'manage', 'Full user management', 'user'),

-- Organization permissions
('organization:view', 'organization', 'view', 'View organization', 'organization'),
('organization:update', 'organization', 'update', 'Update organization', 'organization'),
('organization:manage', 'organization', 'manage', 'Full organization management', 'organization'),

-- Cost management permissions
('cost:view', 'cost', 'view', 'View cost information', 'cost'),
('cost:manage', 'cost', 'manage', 'Manage cost settings', 'cost'),

-- Monitoring permissions
('monitoring:view', 'monitoring', 'view', 'View monitoring data', 'monitoring'),
('monitoring:manage', 'monitoring', 'manage', 'Manage monitoring settings', 'monitoring'),

-- Admin permissions
('admin:full', 'admin', 'full', 'Full administrative access', 'admin');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();