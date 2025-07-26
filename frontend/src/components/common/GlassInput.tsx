import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createGlassStyle } from '../../styles/glassmorphism';

export interface GlassInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isDark?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyPress?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * GlassInput component with glassmorphism effects and floating label
 * Features blur effects, validation states, and smooth animations
 */
export const GlassInput: React.FC<GlassInputProps> = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  label,
  error,
  disabled = false,
  required = false,
  autoComplete,
  icon,
  iconPosition = 'left',
  isDark = false,
  style,
  className,
  onFocus,
  onBlur,
  onKeyPress,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasValue = value.length > 0;
  const hasError = !!error;
  const showFloatingLabel = label && (isFocused || hasValue);

  // Create glassmorphism styles
  const glassStyle = createGlassStyle(isDark, {
    variant: 'input',
    elevation: hasError ? 'high' : isFocused ? 'medium' : 'low',
  });

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  // Handle change
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  // Handle label click
  const handleLabelClick = () => {
    inputRef.current?.focus();
  };

  // Container styles
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    ...style,
  };

  // Input container styles
  const inputContainerStyle: React.CSSProperties = {
    ...glassStyle,
    display: 'flex',
    alignItems: 'center',
    padding: label ? '20px 16px 8px 16px' : '12px 16px',
    gap: '12px',
    transition: 'all 0.2s ease-in-out',
    border: hasError 
      ? `1px solid #EF4444` 
      : isFocused 
        ? `1px solid ${isDark ? '#8B5CF6' : '#7C3AED'}` 
        : glassStyle.border,
    boxShadow: hasError
      ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
      : isFocused
        ? `0 0 0 3px ${isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(124, 58, 237, 0.1)'}`
        : glassStyle.boxShadow,
  };

  // Input styles
  const inputStyle: React.CSSProperties = {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: isDark ? '#F8FAFC' : '#2D3748',
    fontSize: '16px',
    fontWeight: 400,
  };

  // Floating label styles
  const floatingLabelStyle: React.CSSProperties = {
    position: 'absolute',
    left: icon && iconPosition === 'left' ? '48px' : '16px',
    top: showFloatingLabel ? '8px' : '50%',
    transform: showFloatingLabel ? 'translateY(0)' : 'translateY(-50%)',
    fontSize: showFloatingLabel ? '12px' : '16px',
    fontWeight: showFloatingLabel ? 600 : 400,
    color: hasError
      ? '#EF4444'
      : isFocused
        ? isDark ? '#8B5CF6' : '#7C3AED'
        : isDark ? 'rgba(248, 250, 252, 0.7)' : 'rgba(45, 55, 72, 0.7)',
    pointerEvents: 'none',
    transition: 'all 0.2s ease-in-out',
    zIndex: 1,
  };

  // Icon styles
  const iconStyle: React.CSSProperties = {
    color: hasError
      ? '#EF4444'
      : isFocused
        ? isDark ? '#8B5CF6' : '#7C3AED'
        : isDark ? 'rgba(248, 250, 252, 0.7)' : 'rgba(45, 55, 72, 0.7)',
    transition: 'color 0.2s ease-in-out',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={containerStyle} className={className}>
      <motion.div
        style={inputContainerStyle}
        whileFocus={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {/* Left Icon */}
        {icon && iconPosition === 'left' && (
          <div style={iconStyle}>
            {icon}
          </div>
        )}

        {/* Floating Label */}
        {label && (
          <motion.label
            style={floatingLabelStyle}
            onClick={handleLabelClick}
            animate={{
              top: showFloatingLabel ? '8px' : '50%',
              transform: showFloatingLabel ? 'translateY(0)' : 'translateY(-50%)',
              fontSize: showFloatingLabel ? '12px' : '16px',
              fontWeight: showFloatingLabel ? 600 : 400,
            }}
            transition={{ duration: 0.2 }}
          >
            {label}
            {required && <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>}
          </motion.label>
        )}

        {/* Input */}
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyPress={onKeyPress}
          placeholder={label ? '' : placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          style={inputStyle}
        />

        {/* Right Icon */}
        {icon && iconPosition === 'right' && (
          <div style={iconStyle}>
            {icon}
          </div>
        )}
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              color: '#EF4444',
              fontSize: '14px',
              fontWeight: 500,
              marginTop: '8px',
              paddingLeft: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '16px' }}>⚠️</span>
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlassInput;