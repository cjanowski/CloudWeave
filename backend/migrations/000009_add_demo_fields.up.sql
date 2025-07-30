-- Add demo-related fields to users table (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'onboarding_completed') THEN
        ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'demo_mode') THEN
        ALTER TABLE users ADD COLUMN demo_mode BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'demo_scenario') THEN
        ALTER TABLE users ADD COLUMN demo_scenario VARCHAR(50) DEFAULT 'startup';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'sso_provider') THEN
        ALTER TABLE users ADD COLUMN sso_provider VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'sso_subject') THEN
        ALTER TABLE users ADD COLUMN sso_subject VARCHAR(255);
    END IF;
END $$;

-- Create demo_data table to store demo datasets (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'demo_data') THEN
        CREATE TABLE demo_data (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            scenario VARCHAR(50) NOT NULL,
            data_type VARCHAR(50) NOT NULL, -- 'infrastructure', 'deployments', 'metrics', 'alerts', 'cost'
            data JSONB NOT NULL,
            generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE
        );

        -- Create indexes for demo_data table
        CREATE INDEX idx_demo_data_user_id ON demo_data(user_id);
        CREATE INDEX idx_demo_data_scenario ON demo_data(scenario);
        CREATE INDEX idx_demo_data_type ON demo_data(data_type);
        CREATE INDEX idx_demo_data_expires_at ON demo_data(expires_at);
    END IF;
END $$;

-- Add demo metadata to existing tables (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'infrastructure' AND column_name = 'is_demo') THEN
        ALTER TABLE infrastructure ADD COLUMN is_demo BOOLEAN DEFAULT false;
        CREATE INDEX idx_infrastructure_is_demo ON infrastructure(is_demo);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deployments' AND column_name = 'is_demo') THEN
        ALTER TABLE deployments ADD COLUMN is_demo BOOLEAN DEFAULT false;
        CREATE INDEX idx_deployments_is_demo ON deployments(is_demo);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metrics' AND column_name = 'is_demo') THEN
        ALTER TABLE metrics ADD COLUMN is_demo BOOLEAN DEFAULT false;
        CREATE INDEX idx_metrics_is_demo ON metrics(is_demo);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'is_demo') THEN
        ALTER TABLE alerts ADD COLUMN is_demo BOOLEAN DEFAULT false;
        CREATE INDEX idx_alerts_is_demo ON alerts(is_demo);
    END IF;
END $$;