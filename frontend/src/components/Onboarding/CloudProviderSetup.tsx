import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { Icon } from '../common/Icon';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { GlassInput } from '../common/GlassInput';
import type { AppDispatch } from '../../store';
import { addCloudProvider, testCloudProviderConnection } from '../../store/slices/cloudProviderSlice';

export interface CloudProviderSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
  isDark: boolean;
  isOnboarding?: boolean;
}

export interface CloudProvider {
  id: string;
  name: string;
  provider: 'aws' | 'gcp' | 'azure';
  icon: string;
  description: string;
  credentialTypes: CredentialType[];
}

export interface CredentialType {
  id: string;
  name: string;
  description: string;
  fields: CredentialField[];
}

export interface CredentialField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

const cloudProviders: CloudProvider[] = [
  {
    id: 'aws',
    name: 'Amazon Web Services',
    provider: 'aws',
    icon: 'aws',
    description: 'Connect your AWS account to manage EC2, S3, RDS, and other services',
    credentialTypes: [
      {
        id: 'access_key',
        name: 'Access Key',
        description: 'Use AWS Access Key ID and Secret Access Key',
        fields: [
          {
            id: 'accessKeyId',
            name: 'accessKeyId',
            label: 'Access Key ID',
            type: 'text',
            required: true,
            placeholder: 'AKIAIOSFODNN7EXAMPLE',
            validation: {
              pattern: '^AKIA[0-9A-Z]{16}$',
              minLength: 20,
              maxLength: 20,
            },
          },
          {
            id: 'secretAccessKey',
            name: 'secretAccessKey',
            label: 'Secret Access Key',
            type: 'password',
            required: true,
            placeholder: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
            validation: {
              minLength: 40,
              maxLength: 40,
            },
          },
          {
            id: 'region',
            name: 'region',
            label: 'Default Region',
            type: 'select',
            required: true,
            options: [
              { value: 'us-east-1', label: 'US East (N. Virginia)' },
              { value: 'us-east-2', label: 'US East (Ohio)' },
              { value: 'us-west-1', label: 'US West (N. California)' },
              { value: 'us-west-2', label: 'US West (Oregon)' },
              { value: 'eu-west-1', label: 'Europe (Ireland)' },
              { value: 'eu-west-2', label: 'Europe (London)' },
              { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
              { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
              { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
              { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
            ],
          },
        ],
      },
      {
        id: 'iam_role',
        name: 'IAM Role',
        description: 'Use IAM Role ARN for cross-account access',
        fields: [
          {
            id: 'roleArn',
            name: 'roleArn',
            label: 'Role ARN',
            type: 'text',
            required: true,
            placeholder: 'arn:aws:iam::123456789012:role/CloudWeaveRole',
            validation: {
              pattern: '^arn:aws:iam::[0-9]{12}:role/.+$',
            },
          },
          {
            id: 'externalId',
            name: 'externalId',
            label: 'External ID (Optional)',
            type: 'text',
            required: false,
            placeholder: 'unique-external-id',
          },
          {
            id: 'region',
            name: 'region',
            label: 'Default Region',
            type: 'select',
            required: true,
            options: [
              { value: 'us-east-1', label: 'US East (N. Virginia)' },
              { value: 'us-east-2', label: 'US East (Ohio)' },
              { value: 'us-west-1', label: 'US West (N. California)' },
              { value: 'us-west-2', label: 'US West (Oregon)' },
              { value: 'eu-west-1', label: 'Europe (Ireland)' },
              { value: 'eu-west-2', label: 'Europe (London)' },
              { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
              { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
              { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
              { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'gcp',
    name: 'Google Cloud Platform',
    provider: 'gcp',
    icon: 'gcp',
    description: 'Connect your GCP project to manage Compute Engine, Cloud Storage, and other services',
    credentialTypes: [
      {
        id: 'service_account',
        name: 'Service Account',
        description: 'Use a service account JSON key file',
        fields: [
          {
            id: 'projectId',
            name: 'projectId',
            label: 'Project ID',
            type: 'text',
            required: true,
            placeholder: 'my-gcp-project-123456',
          },
          {
            id: 'serviceAccountKey',
            name: 'serviceAccountKey',
            label: 'Service Account Key (JSON)',
            type: 'textarea',
            required: true,
            placeholder: '{\n  "type": "service_account",\n  "project_id": "...",\n  ...\n}',
          },
          {
            id: 'region',
            name: 'region',
            label: 'Default Region',
            type: 'select',
            required: true,
            options: [
              { value: 'us-central1', label: 'us-central1 (Iowa)' },
              { value: 'us-east1', label: 'us-east1 (South Carolina)' },
              { value: 'us-east4', label: 'us-east4 (Northern Virginia)' },
              { value: 'us-west1', label: 'us-west1 (Oregon)' },
              { value: 'us-west2', label: 'us-west2 (Los Angeles)' },
              { value: 'europe-west1', label: 'europe-west1 (Belgium)' },
              { value: 'europe-west2', label: 'europe-west2 (London)' },
              { value: 'europe-west3', label: 'europe-west3 (Frankfurt)' },
              { value: 'asia-east1', label: 'asia-east1 (Taiwan)' },
              { value: 'asia-southeast1', label: 'asia-southeast1 (Singapore)' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'azure',
    name: 'Microsoft Azure',
    provider: 'azure',
    icon: 'azure',
    description: 'Connect your Azure subscription to manage Virtual Machines, Storage, and other services',
    credentialTypes: [
      {
        id: 'service_principal',
        name: 'Service Principal',
        description: 'Use Azure Service Principal credentials',
        fields: [
          {
            id: 'subscriptionId',
            name: 'subscriptionId',
            label: 'Subscription ID',
            type: 'text',
            required: true,
            placeholder: '12345678-1234-1234-1234-123456789012',
            validation: {
              pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            },
          },
          {
            id: 'tenantId',
            name: 'tenantId',
            label: 'Tenant ID',
            type: 'text',
            required: true,
            placeholder: '12345678-1234-1234-1234-123456789012',
            validation: {
              pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            },
          },
          {
            id: 'clientId',
            name: 'clientId',
            label: 'Client ID',
            type: 'text',
            required: true,
            placeholder: '12345678-1234-1234-1234-123456789012',
            validation: {
              pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            },
          },
          {
            id: 'clientSecret',
            name: 'clientSecret',
            label: 'Client Secret',
            type: 'password',
            required: true,
            placeholder: 'your-client-secret',
          },
          {
            id: 'region',
            name: 'region',
            label: 'Default Region',
            type: 'select',
            required: true,
            options: [
              { value: 'eastus', label: 'East US' },
              { value: 'eastus2', label: 'East US 2' },
              { value: 'westus', label: 'West US' },
              { value: 'westus2', label: 'West US 2' },
              { value: 'centralus', label: 'Central US' },
              { value: 'northcentralus', label: 'North Central US' },
              { value: 'southcentralus', label: 'South Central US' },
              { value: 'westcentralus', label: 'West Central US' },
              { value: 'northeurope', label: 'North Europe' },
              { value: 'westeurope', label: 'West Europe' },
              { value: 'eastasia', label: 'East Asia' },
              { value: 'southeastasia', label: 'Southeast Asia' },
            ],
          },
        ],
      },
    ],
  },
];

export const CloudProviderSetup: React.FC<CloudProviderSetupProps> = ({
  onComplete,
  onSkip,
  isDark,
  isOnboarding = false,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider | null>(null);
  const [selectedCredentialType, setSelectedCredentialType] = useState<CredentialType | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleProviderSelect = (provider: CloudProvider) => {
    setSelectedProvider(provider);
    setSelectedCredentialType(provider.credentialTypes[0]);
    setCredentials({});
    setValidationErrors({});
    setConnectionResult(null);
  };

  const handleCredentialTypeSelect = (credentialType: CredentialType) => {
    setSelectedCredentialType(credentialType);
    setCredentials({});
    setValidationErrors({});
    setConnectionResult(null);
  };

  const handleCredentialChange = (fieldId: string, value: string) => {
    setCredentials(prev => ({ ...prev, [fieldId]: value }));
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  const validateCredentials = (): boolean => {
    if (!selectedCredentialType) return false;

    const errors: Record<string, string> = {};

    selectedCredentialType.fields.forEach(field => {
      const value = credentials[field.id] || '';

      if (field.required && !value.trim()) {
        errors[field.id] = `${field.label} is required`;
        return;
      }

      if (value && field.validation) {
        if (field.validation.pattern && !new RegExp(field.validation.pattern).test(value)) {
          errors[field.id] = `${field.label} format is invalid`;
        }
        if (field.validation.minLength && value.length < field.validation.minLength) {
          errors[field.id] = `${field.label} must be at least ${field.validation.minLength} characters`;
        }
        if (field.validation.maxLength && value.length > field.validation.maxLength) {
          errors[field.id] = `${field.label} must be no more than ${field.validation.maxLength} characters`;
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTestConnection = async () => {
    if (!validateCredentials() || !selectedProvider || !selectedCredentialType) {
      return;
    }

    setIsConnecting(true);
    setConnectionResult(null);

    try {
      const result = await dispatch(testCloudProviderConnection({
        provider: selectedProvider.provider,
        credentialType: selectedCredentialType.id,
        credentials,
      })).unwrap();

      setConnectionResult({
        success: true,
        message: 'Connection successful! Your credentials are valid.',
      });
    } catch (error: any) {
      setConnectionResult({
        success: false,
        message: error.message || 'Connection failed. Please check your credentials.',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSaveProvider = async () => {
    if (!connectionResult?.success || !selectedProvider || !selectedCredentialType) {
      return;
    }

    try {
      await dispatch(addCloudProvider({
        name: `${selectedProvider.name} Account`,
        provider: selectedProvider.provider,
        credentialType: selectedCredentialType.id,
        credentials,
      })).unwrap();

      onComplete();
    } catch (error: any) {
      setConnectionResult({
        success: false,
        message: error.message || 'Failed to save cloud provider.',
      });
    }
  };

  const handleBack = () => {
    if (selectedCredentialType) {
      setSelectedCredentialType(null);
      setCredentials({});
      setValidationErrors({});
      setConnectionResult(null);
    } else if (selectedProvider) {
      setSelectedProvider(null);
    }
  };

  const renderProviderSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0 0 16px 0',
          color: isDark ? '#ffffff' : '#000000',
        }}>
          Choose Your Cloud Provider
        </h2>
        <p style={{
          fontSize: '16px',
          color: isDark ? '#ffffff' : '#666666',
          opacity: 0.8,
          margin: 0,
          lineHeight: 1.6,
        }}>
          Select the cloud provider you'd like to connect to CloudWeave
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        {cloudProviders.map((provider, index) => (
          <motion.div
            key={provider.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            onClick={() => handleProviderSelect(provider)}
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              borderRadius: '16px',
              padding: '24px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center',
            }}
            whileHover={{
              scale: 1.02,
              boxShadow: isDark 
                ? '0 8px 32px rgba(139, 92, 246, 0.3)' 
                : '0 8px 32px rgba(139, 92, 246, 0.2)',
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
            }}>
              <Icon name={provider.icon} size="lg" />
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              margin: '0 0 8px 0',
              color: isDark ? '#ffffff' : '#000000',
            }}>
              {provider.name}
            </h3>
            <p style={{
              fontSize: '14px',
              color: isDark ? '#ffffff' : '#666666',
              opacity: 0.8,
              margin: 0,
              lineHeight: 1.5,
            }}>
              {provider.description}
            </p>
          </motion.div>
        ))}
      </div>

      {isOnboarding && onSkip && (
        <div style={{ textAlign: 'center' }}>
          <GlassButton
            variant="ghost"
            size="medium"
            isDark={isDark}
            onClick={onSkip}
            style={{ marginRight: '16px' }}
          >
            Skip for Now
          </GlassButton>
        </div>
      )}
    </motion.div>
  );

  const renderCredentialForm = () => {
    if (!selectedProvider || !selectedCredentialType) return null;

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <GlassButton
              variant="ghost"
              size="small"
              isDark={isDark}
              onClick={handleBack}
              style={{ marginRight: '16px' }}
            >
              <Icon name="arrow-left" size="sm" />
            </GlassButton>
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                margin: '0 0 4px 0',
                color: isDark ? '#ffffff' : '#000000',
              }}>
                Configure {selectedProvider.name}
              </h2>
              <p style={{
                fontSize: '14px',
                color: isDark ? '#ffffff' : '#666666',
                opacity: 0.8,
                margin: 0,
              }}>
                {selectedCredentialType.description}
              </p>
            </div>
          </div>

          {/* Credential Type Selection */}
          {selectedProvider.credentialTypes.length > 1 && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                color: isDark ? '#ffffff' : '#666666',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '8px',
                display: 'block',
              }}>
                Authentication Method
              </label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {selectedProvider.credentialTypes.map(credType => (
                  <GlassButton
                    key={credType.id}
                    variant={selectedCredentialType.id === credType.id ? 'primary' : 'ghost'}
                    size="small"
                    isDark={isDark}
                    onClick={() => handleCredentialTypeSelect(credType)}
                    style={{
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  >
                    {credType.name}
                  </GlassButton>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Credential Fields */}
        <div style={{
          display: 'grid',
          gap: '20px',
          marginBottom: '32px',
        }}>
          {selectedCredentialType.fields.map(field => (
            <div key={field.id}>
              {field.type === 'select' ? (
                <div>
                  <label style={{
                    color: isDark ? '#ffffff' : '#666666',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '8px',
                    display: 'block',
                  }}>
                    {field.label} {field.required && <span style={{ color: '#EF4444' }}>*</span>}
                  </label>
                  <select
                    value={credentials[field.id] || ''}
                    onChange={(e) => handleCredentialChange(field.id, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: validationErrors[field.id] 
                        ? '1px solid #EF4444' 
                        : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      color: isDark ? '#ffffff' : '#000000',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {validationErrors[field.id] && (
                    <div style={{
                      color: '#EF4444',
                      fontSize: '12px',
                      marginTop: '4px',
                    }}>
                      {validationErrors[field.id]}
                    </div>
                  )}
                </div>
              ) : field.type === 'textarea' ? (
                <div>
                  <label style={{
                    color: isDark ? '#ffffff' : '#666666',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '8px',
                    display: 'block',
                  }}>
                    {field.label} {field.required && <span style={{ color: '#EF4444' }}>*</span>}
                  </label>
                  <textarea
                    value={credentials[field.id] || ''}
                    onChange={(e) => handleCredentialChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    rows={6}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: validationErrors[field.id] 
                        ? '1px solid #EF4444' 
                        : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      color: isDark ? '#ffffff' : '#000000',
                      fontSize: '14px',
                      resize: 'vertical',
                      fontFamily: 'monospace',
                    }}
                  />
                  {validationErrors[field.id] && (
                    <div style={{
                      color: '#EF4444',
                      fontSize: '12px',
                      marginTop: '4px',
                    }}>
                      {validationErrors[field.id]}
                    </div>
                  )}
                </div>
              ) : (
                <GlassInput
                  type={field.type}
                  label={field.label}
                  value={credentials[field.id] || ''}
                  onChange={(value) => handleCredentialChange(field.id, value)}
                  error={validationErrors[field.id]}
                  placeholder={field.placeholder}
                  required={field.required}
                  isDark={isDark}
                />
              )}
            </div>
          ))}
        </div>

        {/* Connection Result */}
        {connectionResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: connectionResult.success 
                ? 'rgba(16, 185, 129, 0.1)' 
                : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${connectionResult.success ? '#10B981' : '#EF4444'}`,
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '16px' }}>
              {connectionResult.success ? '✅' : '❌'}
            </span>
            <span style={{
              color: connectionResult.success ? '#10B981' : '#EF4444',
              fontSize: '14px',
            }}>
              {connectionResult.message}
            </span>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <GlassButton
            variant="ghost"
            size="medium"
            isDark={isDark}
            onClick={handleTestConnection}
            loading={isConnecting}
            disabled={!selectedCredentialType?.fields.every(field => 
              !field.required || credentials[field.id]?.trim()
            )}
          >
            <Icon name="cloud-check" size="sm" />
            Test Connection
          </GlassButton>

          <GlassButton
            variant="primary"
            size="medium"
            isDark={isDark}
            onClick={handleSaveProvider}
            disabled={!connectionResult?.success}
          >
            <Icon name="cloud-plus" size="sm" />
            Save Provider
          </GlassButton>
        </div>
      </motion.div>
    );
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <AnimatePresence mode="wait">
        {!selectedProvider ? (
          <motion.div key="provider-selection">
            {renderProviderSelection()}
          </motion.div>
        ) : (
          <motion.div key="credential-form">
            {renderCredentialForm()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CloudProviderSetup;