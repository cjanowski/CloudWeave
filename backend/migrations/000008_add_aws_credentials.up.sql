-- Add AWS credentials to organizations table
ALTER TABLE organizations ADD COLUMN aws_credentials JSONB DEFAULT '{}';

-- Add index for AWS credentials
CREATE INDEX idx_organizations_aws_credentials ON organizations USING GIN (aws_credentials);

-- Add cloud provider credentials table for future extensibility
CREATE TABLE cloud_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    credential_type VARCHAR(50) NOT NULL, -- 'root_credentials', 'iam_role', 'access_key'
    credentials JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, provider, credential_type)
);

-- Create trigger for updated_at column
CREATE TRIGGER update_cloud_credentials_updated_at 
    BEFORE UPDATE ON cloud_credentials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_cloud_credentials_organization_id ON cloud_credentials(organization_id);
CREATE INDEX idx_cloud_credentials_provider ON cloud_credentials(provider);
CREATE INDEX idx_cloud_credentials_active ON cloud_credentials(is_active);