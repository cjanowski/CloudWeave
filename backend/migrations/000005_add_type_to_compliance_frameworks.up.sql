-- Add type field to compliance_frameworks table
ALTER TABLE compliance_frameworks ADD COLUMN type VARCHAR(50) DEFAULT 'standard';