import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Email, ArrowBack, CheckCircle } from '@mui/icons-material';
import { forgotPasswordAsync, clearError } from '../../store/slices/authSlice';
import type { RootState, AppDispatch } from '../../store';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { GlassInput } from '../../components/common/GlassInput';

export const ForgotPasswordPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setValidationError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      return;
    }

    dispatch(clearError());
    
    try {
      await dispatch(forgotPasswordAsync({ email })).unwrap();
      setIsSubmitted(true);
    } catch (error) {
      // Error is handled by the Redux slice
      console.error('Forgot password failed:', error);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (validationError) {
      setValidationError('');
    }
  };

  const handleTryAgain = () => {
    setIsSubmitted(false);
    setEmail('');
    dispatch(clearError());
  };

  if (isSubmitted) {
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
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{ marginBottom: '32px' }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '32px',
                color: '#ffffff',
              }}>
                <CheckCircle style={{ fontSize: '32px' }} />
              </div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                margin: '0 0 8px 0',
                color: '#ffffff',
              }}>
                Check Your Email
              </h1>
              <p style={{
                color: '#ffffff',
                opacity: 0.7,
                margin: 0,
                fontSize: '16px',
                lineHeight: 1.5,
              }}>
                We've sent a password reset link to
              </p>
              <p style={{
                color: '#8B5CF6',
                margin: '8px 0 0 0',
                fontSize: '16px',
                fontWeight: 600,
              }}>
                {email}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              style={{ marginBottom: '24px' }}
            >
              <p style={{
                color: '#ffffff',
                opacity: 0.7,
                fontSize: '14px',
                margin: '0 0 16px 0',
                lineHeight: 1.5,
              }}>
                Click the link in the email to reset your password. If you don't see the email, check your spam folder.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              style={{ marginBottom: '16px' }}
            >
              <GlassButton
                variant="primary"
                size="large"
                isDark={true}
                onClick={handleTryAgain}
                style={{
                  width: '100%',
                  marginBottom: '12px',
                }}
              >
                Send Another Email
              </GlassButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              style={{ textAlign: 'center' }}
            >
              <Link
                to="/login"
                style={{
                  color: '#8B5CF6',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <ArrowBack style={{ fontSize: '16px' }} />
                Back to Sign In
              </Link>
            </motion.div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

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
              Reset Password
            </h1>
            <p style={{
              color: '#ffffff',
              opacity: 0.7,
              margin: 0,
              fontSize: '16px',
              lineHeight: 1.5,
            }}>
              Enter your email address and we'll send you a link to reset your password
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

          {/* Reset Form */}
          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              style={{ marginBottom: '32px' }}
            >
              <GlassInput
                type="email"
                label="Email Address"
                value={email}
                onChange={handleEmailChange}
                error={validationError}
                icon={<Email />}
                iconPosition="left"
                isDark={true}
                required
                autoComplete="email"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              style={{ marginBottom: '16px' }}
            >
              <GlassButton
                type="submit"
                variant="primary"
                size="large"
                loading={loading}
                isDark={true}
                style={{
                  width: '100%',
                }}
              >
                Send Reset Link
              </GlassButton>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            style={{ textAlign: 'center' }}
          >
            <Link
              to="/login"
              style={{
                color: '#8B5CF6',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <ArrowBack style={{ fontSize: '16px' }} />
              Back to Sign In
            </Link>
          </motion.div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;