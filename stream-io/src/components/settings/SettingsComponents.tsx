import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Status Badge Component
interface StatusBadgeProps {
  type: 'success' | 'warning' | 'error' | 'neutral';
  text: string;
  icon?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, text, icon }) => {
  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium ${getColors()}`}>
      {icon}
      {text}
    </div>
  );
};

// Capsule Button Component (following StreamingPanel pattern)
interface CapsuleButtonProps {
  label: string;
  active: boolean;
  icon?: React.ReactNode;
  badge?: string | number;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const CapsuleButton: React.FC<CapsuleButtonProps> = ({ 
  label, 
  active, 
  icon, 
  badge, 
  onClick, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 rounded-full border transition-all duration-200
        ${sizeClasses[size]}
        ${active 
          ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/25' 
          : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-750'
        }
      `}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {badge && (
        <span className="bg-purple-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
};

// Toggle Switch Component
interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ 
  enabled, 
  onChange, 
  size = 'md',
  disabled = false 
}) => {
  const sizes = {
    sm: { container: 'w-8 h-5', toggle: 'w-3 h-3', translate: 'translate-x-3' },
    md: { container: 'w-10 h-6', toggle: 'w-4 h-4', translate: 'translate-x-4' },
    lg: { container: 'w-12 h-7', toggle: 'w-5 h-5', translate: 'translate-x-5' }
  };

  const currentSize = sizes[size];

  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`
        relative inline-flex ${currentSize.container} rounded-full transition-colors duration-200 ease-in-out
        ${enabled ? 'bg-purple-600' : 'bg-gray-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900
      `}
    >
      <span
        className={`
          ${currentSize.toggle} bg-white rounded-full shadow-lg transform transition-transform duration-200 ease-in-out
          ${enabled ? currentSize.translate : 'translate-x-0.5'}
        `}
      />
    </button>
  );
};

// Setting Row Component
interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  rightElement: React.ReactNode;
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpanded?: () => void;
  statusBadge?: React.ReactNode;
  children?: React.ReactNode;
}

export const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  title,
  description,
  rightElement,
  expandable = false,
  expanded = false,
  onToggleExpanded,
  statusBadge,
  children
}) => {
  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
      <div 
        className={`
          p-4 flex items-center justify-between
          ${expandable ? 'cursor-pointer hover:bg-gray-800/70' : ''}
        `}
        onClick={expandable ? onToggleExpanded : undefined}
      >
        <div className="flex items-center space-x-3 flex-1">
          <div className="text-purple-400">
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-medium">{title}</h3>
              {statusBadge}
            </div>
            {description && (
              <p className="text-sm text-gray-400 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {rightElement}
          {expandable && (
            <div className="text-gray-400">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {expandable && expanded && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-700/50"
          >
            <div className="p-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Section Header Component
interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  badge?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  icon, 
  title, 
  description, 
  badge 
}) => {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-purple-600/20 rounded-lg text-purple-400">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
};

// Radio Group Component (for single selection)
interface RadioOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  name: string;
  layout?: 'vertical' | 'horizontal';
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  value,
  onChange,
  name,
  layout = 'vertical'
}) => {
  return (
    <div className={`
      ${layout === 'horizontal' ? 'flex flex-wrap gap-3' : 'space-y-2'}
    `}>
      {options.map((option) => (
        <label
          key={option.value}
          className={`
            flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200
            ${value === option.value 
              ? 'bg-purple-600/20 border-purple-500 text-white' 
              : 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:bg-gray-800/70'
            }
            ${layout === 'horizontal' ? 'flex-1 min-w-[200px]' : ''}
          `}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          
          <div className={`
            w-4 h-4 rounded-full border-2 flex items-center justify-center
            ${value === option.value ? 'border-purple-500' : 'border-gray-500'}
          `}>
            {value === option.value && (
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
            )}
          </div>
          
          {option.icon && (
            <div className="text-purple-400">
              {option.icon}
            </div>
          )}
          
          <div className="flex-1">
            <div className="font-medium">{option.label}</div>
            {option.description && (
              <div className="text-sm text-gray-400 mt-0.5">{option.description}</div>
            )}
          </div>
        </label>
      ))}
    </div>
  );
};

// Multi-Select Chips Component (following StreamingPanel pattern)
interface MultiSelectOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface MultiSelectChipsProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  max?: number;
}

export const MultiSelectChips: React.FC<MultiSelectChipsProps> = ({
  options,
  selected,
  onChange,
  max
}) => {
  const handleToggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(item => item !== id));
    } else if (!max || selected.length < max) {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option.id);
        const isDisabled = max && !isSelected && selected.length >= max;
        
        return (
          <button
            key={option.id}
            onClick={() => !isDisabled && handleToggle(option.id)}
                     disabled={!!isDisabled}
         className={`
           inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium transition-all duration-200
           ${isSelected 
             ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/25' 
             : isDisabled
               ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed opacity-50'
               : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-750'
           }
         `}
          >
            {option.icon}
            {option.label}
            {isSelected && <Check className="w-3 h-3" />}
          </button>
        );
      })}
    </div>
  );
};

// Confirmation Modal Component
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  icon
}) => {
  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-red-400',
          button: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'warning':
        return {
          icon: 'text-yellow-400',
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        };
      default:
        return {
          icon: 'text-purple-400',
          button: 'bg-purple-600 hover:bg-purple-700 text-white'
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-900 rounded-xl border border-gray-700 p-6 max-w-md w-full"
      >
        <div className="flex items-center gap-3 mb-4">
          {icon && (
            <div className={colors.icon}>
              {icon}
            </div>
          )}
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        
        <p className="text-gray-300 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${colors.button}`}
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
}; 