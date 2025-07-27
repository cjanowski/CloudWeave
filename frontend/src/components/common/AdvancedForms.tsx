import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';
import { GlassInput } from './GlassInput';
import { GlassCard } from './GlassCard';

// Multi-Select Component
export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  isDark?: boolean;
  className?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select options...',
  label,
  error,
  disabled = false,
  isDark = false,
  className = '',
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOptions = options.filter(option => value.includes(option.value));

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleRemoveOption = (optionValue: string) => {
    onChange(value.filter(v => v !== optionValue));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`multi-select ${className}`} style={{ position: 'relative' }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '500',
          color: isDark ? '#ffffff' : '#333333',
        }}>
          {label}
        </label>
      )}
      
      <div
        onClick={handleToggle}
        style={{
          border: `1px solid ${error ? '#EF4444' : isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
          borderRadius: '8px',
          padding: '12px',
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          minHeight: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {selectedOptions.length > 0 ? (
            selectedOptions.map(option => (
              <span
                key={option.value}
                style={{
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                  color: isDark ? '#ffffff' : '#2563EB',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {option.label}
                <Icon
                  name="status-x"
                  size="xs"
                  onClick={() => {
                    handleRemoveOption(option.value);
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </span>
            ))
          ) : (
            <span style={{ color: isDark ? '#666666' : '#999999' }}>
              {placeholder}
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedOptions.length > 0 && (
            <Icon
              name="action-clear"
              size="sm"
              onClick={() => {
                handleClearAll();
              }}
              style={{ cursor: 'pointer' }}
            />
          )}
          <Icon
            name={isOpen ? 'nav-up' : 'nav-down'}
            size="sm"
            color={isDark ? '#ffffff' : '#666666'}
          />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              marginTop: '4px',
            }}
          >
            <GlassCard isDark={isDark} style={{ maxHeight: '300px', overflow: 'hidden' }}>
              <div style={{ padding: '8px' }}>
                <GlassInput
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(value: string) => setSearchTerm(value)}
                  isDark={isDark}
                  style={{ marginBottom: '8px' }}
                />
              </div>
              
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {filteredOptions.length > 0 ? (
                  filteredOptions.map(option => (
                    <div
                      key={option.value}
                      onClick={() => !option.disabled && handleOptionClick(option.value)}
                      style={{
                        padding: '8px 12px',
                        cursor: option.disabled ? 'not-allowed' : 'pointer',
                        backgroundColor: value.includes(option.value)
                          ? (isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
                          : 'transparent',
                        opacity: option.disabled ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                      onMouseEnter={(e) => {
                        if (!option.disabled) {
                          e.currentTarget.style.backgroundColor = isDark 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : 'rgba(0, 0, 0, 0.02)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!option.disabled) {
                          e.currentTarget.style.backgroundColor = value.includes(option.value)
                            ? (isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
                            : 'transparent';
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={value.includes(option.value)}
                        disabled={option.disabled}
                        readOnly
                        style={{ pointerEvents: 'none' }}
                      />
                      <span style={{ color: isDark ? '#ffffff' : '#333333' }}>
                        {option.label}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{
                    padding: '16px',
                    textAlign: 'center',
                    color: isDark ? '#666666' : '#999999',
                  }}>
                    No options found
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div style={{
          marginTop: '4px',
          fontSize: '12px',
          color: '#EF4444',
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

// Date Picker Component
export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  isDark?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date...',
  label,
  error,
  disabled = false,
  isDark = false,
  className = '',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleDateSelect = (date: string) => {
    onChange(date);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`date-picker ${className}`} style={{ position: 'relative' }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '500',
          color: isDark ? '#ffffff' : '#333333',
        }}>
          {label}
        </label>
      )}
      
      <div
        onClick={handleToggle}
        style={{
          border: `1px solid ${error ? '#EF4444' : isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
          borderRadius: '8px',
          padding: '12px',
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span style={{ color: value ? (isDark ? '#ffffff' : '#333333') : (isDark ? '#666666' : '#999999') }}>
          {value || placeholder}
        </span>
        <Icon
          name="monitor-clock"
          size="sm"
          color={isDark ? '#ffffff' : '#666666'}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              zIndex: 1000,
              marginTop: '4px',
            }}
          >
            <GlassCard isDark={isDark}>
              <input
                type="date"
                value={value}
                onChange={(e) => handleDateSelect(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: isDark ? '#ffffff' : '#333333',
                  fontSize: '14px',
                  padding: '8px',
                  width: '100%',
                  outline: 'none',
                }}
              />
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div style={{
          marginTop: '4px',
          fontSize: '12px',
          color: '#EF4444',
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

// File Upload Component
export interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  label?: string;
  error?: string;
  disabled?: boolean;
  isDark?: boolean;
  className?: string;
}

export function FileUpload({
  onFileSelect,
  accept,
  multiple = false,
  maxSize,
  label,
  error,
  disabled = false,
  isDark = false,
  className = '',
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      if (maxSize && file.size > maxSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSize}MB.`);
        return false;
      }
      return true;
    });

    setSelectedFiles(validFiles);
    onFileSelect(validFiles);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFileSelect(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`file-upload ${className}`}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '500',
          color: isDark ? '#ffffff' : '#333333',
        }}>
          {label}
        </label>
      )}
      
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragActive ? '#3B82F6' : error ? '#EF4444' : isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
          borderRadius: '8px',
          padding: '32px 16px',
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'center',
          transition: 'all 0.2s ease',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Icon
          name="action-upload"
          size="xl"
          color={isDark ? '#666666' : '#999999'}
          style={{ marginBottom: '16px' }}
        />
        
        <div style={{
          fontSize: '16px',
          fontWeight: '500',
          color: isDark ? '#ffffff' : '#333333',
          marginBottom: '8px',
        }}>
          Drop files here or click to browse
        </div>
        
        <div style={{
          fontSize: '14px',
          color: isDark ? '#666666' : '#999999',
        }}>
          {accept && `Accepted formats: ${accept}`}
          {maxSize && ` (Max size: ${maxSize}MB)`}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {selectedFiles.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '500',
            color: isDark ? '#ffffff' : '#333333',
            marginBottom: '8px',
          }}>
            Selected Files:
          </div>
          
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                borderRadius: '4px',
                marginBottom: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="action-file" size="sm" color={isDark ? '#666666' : '#999999'} />
                <span style={{ color: isDark ? '#ffffff' : '#333333' }}>
                  {file.name}
                </span>
                <span style={{ color: isDark ? '#666666' : '#999999', fontSize: '12px' }}>
                  ({formatFileSize(file.size)})
                </span>
              </div>
              
              <Icon
                name="action-delete"
                size="sm"
                onClick={() => removeFile(index)}
                style={{ cursor: 'pointer', color: '#EF4444' }}
              />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{
          marginTop: '4px',
          fontSize: '12px',
          color: '#EF4444',
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

// Toggle Switch Component
export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  isDark?: boolean;
  className?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled = false,
  isDark = false,
  className = '',
}: ToggleSwitchProps) {
  return (
    <div className={`toggle-switch ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: '48px',
          height: '24px',
          backgroundColor: checked 
            ? (isDark ? '#3B82F6' : '#2563EB')
            : (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'),
          borderRadius: '12px',
          position: 'relative',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <motion.div
          animate={{
            x: checked ? 24 : 0,
          }}
          transition={{ duration: 0.2 }}
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            position: 'absolute',
            top: '2px',
            left: '2px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          }}
        />
      </div>
      
      {label && (
        <span style={{
          fontSize: '14px',
          color: isDark ? '#ffffff' : '#333333',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }} onClick={() => !disabled && onChange(!checked)}>
          {label}
        </span>
      )}
    </div>
  );
} 