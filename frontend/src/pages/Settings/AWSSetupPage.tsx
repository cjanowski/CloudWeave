import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { GlassInput } from '../../components/common/GlassInput';
import { Icon } from '../../components/common/Icon';

interface AWSCredentials {
  id: string;
  provider: string;
  credentialType: string;
  isActive: boolean;
  createdAt: string;
}

export const AWSSetupPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'root' | 'access-key'>('root');
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<AWSCredentials[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Root credentials form
  const [rootForm, setRootForm] = useState({
    email: '',
    password: '',
  });

  // Access key form
  const [accessKeyForm, setAccessKeyForm] = useState({
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
  });

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const response = await fetch('/api/cloud-credentials', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCredentials(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }
  };

  const handleRootCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/cloud-credentials/aws/root', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(rootForm),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('AWS root credentials configured successfully!');
        setRootForm({ email: '', password: '' });
        loadCredentials();
      } else {
        setError(data.error?.message || 'Failed to setup AWS credentials');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/cloud-credentials/aws/access-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(accessKeyForm),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('AWS access key configured successfully!');
        setAccessKeyForm({ accessKeyId: '', secretAccessKey: '', region: 'us-east-1' });
        loadCredentials();
      } else {
        setError(data.error?.message || 'Failed to setup AWS credentials');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/cloud-credentials/aws/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('AWS connection test successful!');
      } else {
        setError(data.error?.message || 'Connection test failed');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          marginBottom: '8px',
          color: '#ffffff'
        }}>
          AWS Account Setup
        </h1>
        <p style={{ 
          color: '#ffffff', 
          opacity: 0.7, 
          marginBottom: '32px' 
        }}>
          Connect your AWS account to start managing your cloud infrastructure
        </p>

        {/* Status Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '24px',
              color: '#EF4444',
              fontSize: '14px',
            }}
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '24px',
              color: '#22C55E',
              fontSize: '14px',
            }}
          >
            {success}
          </motion.div>
        )}

        {/* Current Credentials */}
        {credentials.length > 0 && (
          <GlassCard style={{ marginBottom: '24px', padding: '24px' }}>
            <h3 style={{ color: '#ffffff', marginBottom: '16px' }}>Current AWS Configuration</h3>
            {credentials.map((cred) => (
              <div key={cred.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                marginBottom: '8px',
              }}>
                <div>
                  <span style={{ color: '#ffffff', fontWeight: 'medium' }}>
                    {cred.credentialType === 'root_credentials' ? 'Root Account' : 'Access Key'}
                  </span>
                  <span style={{ 
                    color: cred.isActive ? '#22C55E' : '#EF4444', 
                    marginLeft: '8px',
                    fontSize: '12px'
                  }}>
                    {cred.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <GlassButton
                  onClick={testConnection}
                  variant="secondary"
                  size="small"
                  loading={loading}
                >
                  Test Connection
                </GlassButton>
              </div>
            ))}
          </GlassCard>
        )}

        {/* Setup Form */}
        <GlassCard style={{ padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex', 
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: '4px',
            }}>
              <button
                onClick={() => setActiveTab('root')}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: activeTab === 'root' ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Root Account
              </button>
              <button
                onClick={() => setActiveTab('access-key')}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: activeTab === 'access-key' ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Access Keys
              </button>
            </div>
          </div>

          {activeTab === 'root' && (
            <form onSubmit={handleRootCredentialsSubmit}>
              <h3 style={{ color: '#ffffff', marginBottom: '16px' }}>
                AWS Root Account Credentials
              </h3>
              <p style={{ color: '#ffffff', opacity: 0.7, marginBottom: '24px', fontSize: '14px' }}>
                Enter your AWS root account email and password. This will be securely stored and used to manage your AWS resources.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <GlassInput
                  type="email"
                  label="AWS Root Email"
                  value={rootForm.email}
                  onChange={(value) => setRootForm(prev => ({ ...prev, email: value }))}
                  icon={<Icon name="auth-mail" size="sm" />}
                  iconPosition="left"
                  required
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <GlassInput
                  type="password"
                  label="AWS Root Password"
                  value={rootForm.password}
                  onChange={(value) => setRootForm(prev => ({ ...prev, password: value }))}
                  icon={<Icon name="auth-lock" size="sm" />}
                  iconPosition="left"
                  required
                />
              </div>

              <GlassButton
                type="submit"
                variant="primary"
                loading={loading}
                style={{ width: '100%' }}
              >
                Configure AWS Root Account
              </GlassButton>
            </form>
          )}

          {activeTab === 'access-key' && (
            <form onSubmit={handleAccessKeySubmit}>
              <h3 style={{ color: '#ffffff', marginBottom: '16px' }}>
                AWS Access Keys
              </h3>
              <p style={{ color: '#ffffff', opacity: 0.7, marginBottom: '24px', fontSize: '14px' }}>
                Enter your AWS access key ID and secret access key. You can create these in the AWS IAM console.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <GlassInput
                  type="text"
                  label="Access Key ID"
                  value={accessKeyForm.accessKeyId}
                  onChange={(value) => setAccessKeyForm(prev => ({ ...prev, accessKeyId: value }))}
                  icon={<Icon name="key" size="sm" />}
                  iconPosition="left"
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <GlassInput
                  type="password"
                  label="Secret Access Key"
                  value={accessKeyForm.secretAccessKey}
                  onChange={(value) => setAccessKeyForm(prev => ({ ...prev, secretAccessKey: value }))}
                  icon={<Icon name="auth-lock" size="sm" />}
                  iconPosition="left"
                  required
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <GlassInput
                  type="text"
                  label="Default Region"
                  value={accessKeyForm.region}
                  onChange={(value) => setAccessKeyForm(prev => ({ ...prev, region: value }))}
                  icon={<Icon name="globe" size="sm" />}
                  iconPosition="left"
                  required
                />
              </div>

              <GlassButton
                type="submit"
                variant="primary"
                loading={loading}
                style={{ width: '100%' }}
              >
                Configure AWS Access Keys
              </GlassButton>
            </form>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default AWSSetupPage;