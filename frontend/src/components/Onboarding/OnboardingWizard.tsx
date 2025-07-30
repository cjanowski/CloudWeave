import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../common/Icon';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { GlassInput } from '../common/GlassInput';
import type { RootState, AppDispatch } from '../../store';
import { setOnboardingCompleted, setDemoMode, setUserPreferences } from '../../store/slices/userSlice';
import { addCloudProvider } from '../../store/slices/cloudProviderSlice';
import { CloudProviderSetup } from './CloudProviderSetup';
import { PreferencesSetup } from './PreferencesSetup';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<OnboardingStepProps>;
  required: boolean;
  completed: boolean;
}

export interface OnboardingStepProps {
  onNext: () => void;
  onSkip?: () => void;
  onBack?: () => void;
  isFirst: boolean;
  isLast: boolean;
  isDark: boolean;
}

export interface OnboardingFlow {
  steps: OnboardingStep[];
  currentStep: number;
  completed: boolean;
  skipped: boolean;
}

// Welcome Step Component
const WelcomeStep: React.FC<OnboardingStepProps> = ({ onNext, isDark }) => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0 0 16px 0',
          color: isDark ? '#ffffff' : '#000000',
        }}>
          Welcome to CloudWeave, {user?.name?.split(' ')[0] || 'there'}! 👋
        </h2>
        <p style={{
          fontSize: '16px',
          color: isDark ? '#ffffff' : '#666666',
          opacity: 0.8,
          margin: '0 0 32px 0',
          lineHeight: 1.6,
          maxWidth: '500px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          CloudWeave is your comprehensive cloud management platform. We'll help you connect your cloud providers,
          monitor your infrastructure, manage costs, and ensure security across all your cloud resources.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          margin: '32px 0',
        }}>
          {[
            { icon: '🏗️', title: 'Infrastructure Management', desc: 'Monitor and manage your cloud resources' },
            { icon: '💰', title: 'Cost Optimization', desc: 'Track spending and optimize costs' },
            { icon: '🔒', title: 'Security & Compliance', desc: 'Ensure security across all environments' },
            { icon: '📊', title: 'Real-time Monitoring', desc: 'Get insights with live dashboards' },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>{feature.icon}</div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                margin: '0 0 8px 0',
                color: isDark ? '#ffffff' : '#000000',
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: '14px',
                color: isDark ? '#ffffff' : '#666666',
                opacity: 0.8,
                margin: 0,
                lineHeight: 1.4,
              }}>
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <GlassButton
          variant="primary"
          size="large"
          isDark={isDark}
          onClick={onNext}
          style={{
            marginTop: '24px',
            padding: '16px 32px',
            fontSize: '16px',
          }}
        >
          Let's Get Started
          <Icon name="arrow-right" size="sm" />
        </GlassButton>
      </motion.div>
    </div>
  );
};

// Demo or Real Step Component
const DemoOrRealStep: React.FC<OnboardingStepProps> = ({ onNext, isDark }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedMode, setSelectedMode] = useState<'demo' | 'real' | null>(null);

  const handleModeSelect = (mode: 'demo' | 'real') => {
    setSelectedMode(mode);
    dispatch(setDemoMode(mode === 'demo'));
  };

  const handleContinue = () => {
    if (selectedMode) {
      onNext();
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', marginBottom: '32px' }}
      >
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0 0 16px 0',
          color: isDark ? '#ffffff' : '#000000',
        }}>
          How would you like to explore CloudWeave?
        </h2>
        <p style={{
          fontSize: '16px',
          color: isDark ? '#ffffff' : '#666666',
          opacity: 0.8,
          margin: 0,
          lineHeight: 1.6,
        }}>
          Choose your preferred way to get started with the platform
        </p>
      </motion.div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        margin: '32px 0',
      }}>
        {/* Demo Mode */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onClick={() => handleModeSelect('demo')}
          style={{
            background: selectedMode === 'demo'
              ? (isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)')
              : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'),
            border: selectedMode === 'demo'
              ? '2px solid #8B5CF6'
              : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            borderRadius: '16px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
          }}
        >
          {selectedMode === 'demo' && (
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#8B5CF6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '14px',
            }}>
              ✓
            </div>
          )}
          <div style={{ fontSize: '48px', marginBottom: '16px', textAlign: 'center' }}>🎮</div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 600,
            margin: '0 0 12px 0',
            color: isDark ? '#ffffff' : '#000000',
            textAlign: 'center',
          }}>
            Explore with Demo Data
          </h3>
          <p style={{
            fontSize: '14px',
            color: isDark ? '#ffffff' : '#666666',
            opacity: 0.8,
            margin: '0 0 16px 0',
            lineHeight: 1.5,
            textAlign: 'center',
          }}>
            Perfect for getting familiar with CloudWeave's features using realistic sample data
          </p>
          <ul style={{
            fontSize: '14px',
            color: isDark ? '#ffffff' : '#666666',
            opacity: 0.8,
            margin: 0,
            paddingLeft: '20px',
            lineHeight: 1.5,
          }}>
            <li>Explore all features safely</li>
            <li>No cloud accounts needed</li>
            <li>Realistic sample scenarios</li>
            <li>Switch to real data anytime</li>
          </ul>
        </motion.div>

        {/* Real Mode */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          onClick={() => handleModeSelect('real')}
          style={{
            background: selectedMode === 'real'
              ? (isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)')
              : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'),
            border: selectedMode === 'real'
              ? '2px solid #8B5CF6'
              : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            borderRadius: '16px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
          }}
        >
          {selectedMode === 'real' && (
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#8B5CF6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '14px',
            }}>
              ✓
            </div>
          )}
          <div style={{ fontSize: '48px', marginBottom: '16px', textAlign: 'center' }}>🚀</div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 600,
            margin: '0 0 12px 0',
            color: isDark ? '#ffffff' : '#000000',
            textAlign: 'center',
          }}>
            Connect Real Infrastructure
          </h3>
          <p style={{
            fontSize: '14px',
            color: isDark ? '#ffffff' : '#666666',
            opacity: 0.8,
            margin: '0 0 16px 0',
            lineHeight: 1.5,
            textAlign: 'center',
          }}>
            Connect your cloud accounts to manage your actual infrastructure and resources
          </p>
          <ul style={{
            fontSize: '14px',
            color: isDark ? '#ffffff' : '#666666',
            opacity: 0.8,
            margin: 0,
            paddingLeft: '20px',
            lineHeight: 1.5,
          }}>
            <li>Manage real cloud resources</li>
            <li>Live cost and usage data</li>
            <li>Real-time monitoring</li>
            <li>Production-ready features</li>
          </ul>
        </motion.div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <GlassButton
          variant="primary"
          size="large"
          isDark={isDark}
          onClick={handleContinue}
          disabled={!selectedMode}
          style={{
            padding: '16px 32px',
            fontSize: '16px',
            opacity: selectedMode ? 1 : 0.5,
          }}
        >
          Continue
          <Icon name="arrow-right" size="sm" />
        </GlassButton>
      </div>
    </div>
  );
};

// Cloud Provider Step Component
const CloudProviderStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, isDark }) => {
  const { demoMode } = useSelector((state: RootState) => state.user);

  if (demoMode) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎮</div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            margin: '0 0 16px 0',
            color: isDark ? '#ffffff' : '#000000',
          }}>
            Demo Mode Active
          </h2>
          <p style={{
            fontSize: '16px',
            color: isDark ? '#ffffff' : '#666666',
            opacity: 0.8,
            margin: '0 0 32px 0',
            lineHeight: 1.6,
            maxWidth: '400px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Since you chose demo mode, we'll skip cloud provider setup. You can always add real providers later from the settings page.
          </p>
          <GlassButton
            variant="primary"
            size="large"
            isDark={isDark}
            onClick={onNext}
            style={{
              padding: '16px 32px',
              fontSize: '16px',
            }}
          >
            Continue to Preferences
            <Icon name="arrow-right" size="sm" />
          </GlassButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <CloudProviderSetup
        onComplete={onNext}
        onSkip={onSkip}
        isDark={isDark}
        isOnboarding={true}
      />
    </div>
  );
};

// Preferences Step Component
const PreferencesStep: React.FC<OnboardingStepProps> = ({ onNext, isDark }) => {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PreferencesSetup
        onComplete={onNext}
        isDark={isDark}
        isOnboarding={true}
      />
    </div>
  );
};

const OnboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to CloudWeave',
    description: 'Get started with your cloud management platform',
    component: WelcomeStep,
    required: true,
    completed: false,
  },
  {
    id: 'demo-or-real',
    title: 'Choose Your Experience',
    description: 'Explore with demo data or use your real infrastructure',
    component: DemoOrRealStep,
    required: true,
    completed: false,
  },
  {
    id: 'cloud-providers',
    title: 'Connect Cloud Providers',
    description: 'Add your AWS, Azure, or GCP accounts',
    component: CloudProviderStep,
    required: false,
    completed: false,
  },
  {
    id: 'preferences',
    title: 'Set Your Preferences',
    description: 'Customize your dashboard and notifications',
    component: PreferencesStep,
    required: false,
    completed: false,
  },
];

export const OnboardingWizard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { theme } = useSelector((state: RootState) => state.ui);
  const { user } = useSelector((state: RootState) => state.auth);
  const isDark = theme === 'dark';

  const [flow, setFlow] = useState<OnboardingFlow>({
    steps: OnboardingSteps,
    currentStep: 0,
    completed: false,
    skipped: false,
  });

  const currentStepData = flow.steps[flow.currentStep];
  const CurrentStepComponent = currentStepData?.component;

  const handleStepComplete = (stepId: string) => {
    setFlow(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, completed: true } : step
      ),
    }));
    handleNext();
  };

  const handleNext = () => {
    if (flow.currentStep < flow.steps.length - 1) {
      setFlow(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (flow.currentStep > 0) {
      setFlow(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleSkipOnboarding = () => {
    dispatch(setDemoMode(true));
    dispatch(setOnboardingCompleted(true));
    setFlow(prev => ({ ...prev, skipped: true, completed: true }));
    navigate('/dashboard');
  };

  const handleComplete = () => {
    dispatch(setOnboardingCompleted(true));
    setFlow(prev => ({ ...prev, completed: true }));
    navigate('/dashboard');
  };

  if (!CurrentStepComponent) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDark
        ? 'linear-gradient(135deg, #0F0F23 0%, #1A1B3A 25%, #252659 50%, #2D2F73 75%, #3A3D8F 100%)'
        : 'linear-gradient(135deg, #9eb5e7 0%, #afbfea 8%, #bfc9ec 17%, #cdd3ee 25%, #dbdef1 33%, #dce3f6 42%, #dde8fb 50%, #deedff 58%, #cdefff 67%, #b9f1ff 75%, #a7f4fa 83%, #9df5eb 100%)',
      padding: '20px',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: '800px' }}
      >
        <GlassCard
          variant="modal"
          elevation="high"
          isDark={isDark}
          style={{
            padding: '40px',
            borderRadius: '24px',
            minHeight: '600px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
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
              {currentStepData.title}
            </h1>
            <p style={{
              color: isDark ? '#ffffff' : '#666666',
              opacity: 0.8,
              margin: 0,
              fontSize: '16px',
            }}>
              {currentStepData.description}
            </p>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}>
              <span style={{
                color: isDark ? '#ffffff' : '#666666',
                fontSize: '14px',
                opacity: 0.8,
              }}>
                Step {flow.currentStep + 1} of {flow.steps.length}
              </span>
              <span style={{
                color: isDark ? '#ffffff' : '#666666',
                fontSize: '14px',
                opacity: 0.8,
              }}>
                {Math.round(((flow.currentStep + 1) / flow.steps.length) * 100)}% Complete
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '4px',
              background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((flow.currentStep + 1) / flow.steps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                  borderRadius: '2px',
                }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStepData.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                <CurrentStepComponent
                  onNext={() => handleStepComplete(currentStepData.id)}
                  onSkip={handleSkip}
                  onBack={handleBack}
                  isFirst={flow.currentStep === 0}
                  isLast={flow.currentStep === flow.steps.length - 1}
                  isDark={isDark}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Skip Onboarding Button */}
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <GlassButton
              variant="ghost"
              size="small"
              isDark={isDark}
              onClick={handleSkipOnboarding}
              style={{
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                fontSize: '14px',
              }}
            >
              Skip onboarding and explore with demo data
            </GlassButton>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};



export default OnboardingWizard;