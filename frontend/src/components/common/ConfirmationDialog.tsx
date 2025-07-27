import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from './GlassCard';
import { GlassButton } from './GlassButton';
import { Icon } from './Icon';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isDark?: boolean;
  className?: string;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  isDark = false,
  className = '',
}: ConfirmationDialogProps) {
  const variantConfig = {
    danger: {
      icon: 'status-warning',
      iconColor: '#EF4444',
      confirmVariant: 'primary' as const,
    },
    warning: {
      icon: 'status-warning',
      iconColor: '#F59E0B',
      confirmVariant: 'primary' as const,
    },
    info: {
      icon: 'status-info',
      iconColor: '#3B82F6',
      confirmVariant: 'primary' as const,
    },
    success: {
      icon: 'status-check-circle',
      iconColor: '#10B981',
      confirmVariant: 'primary' as const,
    },
  };

  const config = variantConfig[variant];

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`confirmation-dialog-backdrop ${className}`}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
          }}
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            style={{ maxWidth: '400px', width: '100%' }}
          >
            <GlassCard isDark={isDark}>
              <div style={{ padding: '24px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                }}>
                  <Icon
                    name={config.icon}
                    size="lg"
                    color={config.iconColor}
                  />
                  <h3 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '600',
                    color: isDark ? '#ffffff' : '#333333',
                  }}>
                    {title}
                  </h3>
                </div>
                
                <p style={{
                  margin: '0 0 24px 0',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: isDark ? '#cccccc' : '#666666',
                }}>
                  {message}
                </p>
                
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                }}>
                  <GlassButton
                    onClick={onClose}
                    variant="outline"
                    isDark={isDark}
                  >
                    {cancelText}
                  </GlassButton>
                  
                  <GlassButton
                    onClick={handleConfirm}
                    variant={config.confirmVariant}
                    isDark={isDark}
                  >
                    {confirmText}
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for using confirmation dialogs
export function useConfirmationDialog() {
  const [dialog, setDialog] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    confirmText?: string;
    cancelText?: string;
  } | null>(null);

  const showConfirmation = React.useCallback((options: {
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    confirmText?: string;
    cancelText?: string;
  }) => {
    setDialog({
      isOpen: true,
      ...options,
    });
  }, []);

  const hideConfirmation = React.useCallback(() => {
    setDialog(null);
  }, []);

  const ConfirmationDialogComponent = React.useCallback(
    ({ isDark = false }: { isDark?: boolean }) => {
      if (!dialog) return null;

      return (
        <ConfirmationDialog
          isOpen={dialog.isOpen}
          onClose={hideConfirmation}
          onConfirm={dialog.onConfirm}
          title={dialog.title}
          message={dialog.message}
          variant={dialog.variant}
          confirmText={dialog.confirmText}
          cancelText={dialog.cancelText}
          isDark={isDark}
        />
      );
    },
    [dialog, hideConfirmation]
  );

  return {
    showConfirmation,
    hideConfirmation,
    ConfirmationDialog: ConfirmationDialogComponent,
  };
}