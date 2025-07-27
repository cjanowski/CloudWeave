import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '../../components/common/Icon';
import { loginAsync, clearError } from '../../store/slices/authSlice';
import type { RootState, AppDispatch } from '../../store';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { GlassInput } from '../../components/common/GlassInput';
import AuthService from '../../services/authService';

export const LoginPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [ssoConfig, setSsoConfig] = useState<any>(null);
  const [ssoLoading, setSsoLoading] = useState(false);

  useEffect(() => {
    const loadSSOConfig = async () => {
      try {
        const config = await AuthService.getSSOConfig();
        setSsoConfig(config);
      } catch (error) {
        console.error('Failed to load SSO config:', error);
      }
    };
    loadSSOConfig();
  }, []);

  const handleSSOLogin = async (provider: string) => {
    setSsoLoading(true);
    try {
      const { authUrl } = await AuthService.initiateOAuthLogin(provider);
      window.location.href = authUrl;
    } catch (error) {
      console.error('SSO login failed:', error);
      setSsoLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    dispatch(clearError());
    
    try {
      await dispatch(loginAsync({ email, password })).unwrap();
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by the Redux slice
      console.error('Login failed:', error);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (validationErrors.email) {
      setValidationErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (validationErrors.password) {
      setValidationErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F0F23 0%, #1A1B3A 25%, #252659 50%, #2D2F73 75%, #3A3D8F 100%)',
      padding: '20px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: '400px' }}
      >
        <GlassCard
          variant="modal"
          elevation="high"
          isDark={true}
          style={{
            padding: '40px',
            textAlign: 'center',
          }}
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ marginBottom: '32px' }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '32px',
              color: '#ffffff',
            }}>
              ☁️
            </div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              margin: '0 0 8px 0',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              CloudWeave
            </h1>
            <p style={{
              color: '#ffffff',
              opacity: 0.7,
              margin: 0,
              fontSize: '16px',
            }}>
              Sign in to your account
            </p>
          </motion.div>

          {/* Error Message */}
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
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⚠️</span>
              {error}
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              style={{ marginBottom: '20px' }}
            >
              <GlassInput
                type="email"
                label="Email Address"
                value={email}
                onChange={handleEmailChange}
                error={validationErrors.email}
                icon={<Icon name="auth-mail" size="sm" />}
                iconPosition="left"
                isDark={true}
                required
                autoComplete="email"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              style={{ marginBottom: '32px', position: 'relative' }}
            >
              <GlassInput
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={password}
                onChange={handlePasswordChange}
                error={validationErrors.password}
                icon={<Icon name="auth-lock" size="sm" />}
                iconPosition="left"
                isDark={true}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '20px',
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  opacity: 0.7,
                  cursor: 'pointer',
                  padding: '4px',
                  zIndex: 2,
                }}
              >
                {showPassword ? <Icon name="auth-eye-off" size="sm" /> : <Icon name="auth-eye" size="sm" />}
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <GlassButton
                type="submit"
                variant="primary"
                size="large"
                loading={loading}
                isDark={true}
                style={{
                  width: '100%',
                  marginBottom: '16px',
                }}
              >
                Sign In
              </GlassButton>
            </motion.div>

            {/* SSO Login Options */}
            {ssoConfig && (ssoConfig.oauth?.enabled || ssoConfig.saml?.enabled) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.55 }}
                style={{ marginBottom: '24px' }}
              >
                <div style={{
                  position: 'relative',
                  marginBottom: '16px',
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    <div style={{
                      width: '100%',
                      borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                    }} />
                  </div>
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    fontSize: '14px',
                  }}>
                    <span style={{
                      padding: '0 8px',
                      backgroundColor: 'rgba(17, 24, 39, 0.9)',
                      color: 'rgba(255, 255, 255, 0.7)',
                    }}>
                      Or continue with
                    </span>
                  </div>
                </div>

                {ssoConfig.oauth?.enabled && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '12px',
                  }}>
                    {ssoConfig.oauth.providers?.google?.enabled && (
                      <GlassButton
                        onClick={() => handleSSOLogin('google')}
                        disabled={ssoLoading}
                        variant="secondary"
                        isDark={true}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '12px',
                        }}
                      >
                        <Icon name="google" size="sm" />
                        Continue with Google
                      </GlassButton>
                    )}
                    {ssoConfig.oauth.providers?.microsoft?.enabled && (
                      <GlassButton
                        onClick={() => handleSSOLogin('microsoft')}
                        disabled={ssoLoading}
                        variant="secondary"
                        isDark={true}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '12px',
                        }}
                      >
                        <Icon name="microsoft" size="sm" />
                        Continue with Microsoft
                      </GlassButton>
                    )}
                    {ssoConfig.oauth.providers?.github?.enabled && (
                      <GlassButton
                        onClick={() => handleSSOLogin('github')}
                        disabled={ssoLoading}
                        variant="secondary"
                        isDark={true}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '12px',
                        }}
                      >
                        <Icon name="github" size="sm" />
                        Continue with GitHub
                      </GlassButton>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Additional Links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <Link
                to="/forgot-password"
                style={{
                  color: '#8B5CF6',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Forgot Password?
              </Link>
              <Link
                to="/register"
                style={{
                  color: '#8B5CF6',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Create Account
              </Link>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            style={{
              textAlign: 'center',
              marginBottom: '16px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setEmail('demo@cloudweave.com');
                setPassword('password123');
              }}
              style={{
                background: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                padding: '8px 16px',
                color: '#8B5CF6',
                fontSize: '12px',
                cursor: 'pointer',
                marginBottom: '8px',
              }}
            >
              Use Demo Credentials
            </button>
            <p style={{
              color: '#ffffff',
              opacity: 0.7,
              fontSize: '14px',
              margin: 0,
            }}>
              Demo credentials: demo@cloudweave.com / password123
            </p>
          </motion.div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default LoginPage;