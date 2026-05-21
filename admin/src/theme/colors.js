/**
 * Color Palette and Theme Configuration
 * Centralized color management for the entire application
 */

export const colors = {
  // Primary Colors
  primary: {
    main: '#6366f1',
    light: '#818cf8',
    lighter: '#c7d2fe',
    dark: '#4f46e5',
    darker: '#4338ca',
    contrast: '#ffffff',
  },

  // Secondary Colors
  secondary: {
    main: '#8b5cf6',
    light: '#a78bfa',
    lighter: '#ddd6fe',
    dark: '#7c3aed',
    darker: '#6d28d9',
    contrast: '#ffffff',
  },

  // Accent Colors
  accent: {
    main: '#06b6d4',
    light: '#22d3ee',
    lighter: '#cffafe',
    dark: '#0891b2',
    darker: '#086f8c',
    contrast: '#ffffff',
  },

  // Status Colors
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    pending: '#f97316',
  },

  // Semantic Colors
  success: {
    main: '#10b981',
    light: '#6ee7b7',
    lighter: '#d1fae5',
    dark: '#059669',
    contrast: '#ffffff',
  },

  warning: {
    main: '#f59e0b',
    light: '#fcd34d',
    lighter: '#fef3c7',
    dark: '#d97706',
    contrast: '#000000',
  },

  error: {
    main: '#ef4444',
    light: '#fca5a5',
    lighter: '#fee2e2',
    dark: '#dc2626',
    contrast: '#ffffff',
  },

  info: {
    main: '#3b82f6',
    light: '#93c5fd',
    lighter: '#dbeafe',
    dark: '#1d4ed8',
    contrast: '#ffffff',
  },

  // Neutral Colors (Grays)
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },

  // Background Colors
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
    dark: '#111827',
    darkSecondary: '#1f2937',
  },

  // Text Colors
  text: {
    primary: '#111827',
    secondary: '#4b5563',
    tertiary: '#9ca3af',
    disabled: '#d1d5db',
    inverse: '#ffffff',
  },

  // Border Colors
  border: {
    light: '#e5e7eb',
    main: '#d1d5db',
    dark: '#9ca3af',
  },

  // Special Colors
  gradient: {
    primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    secondary: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
    success: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
    error: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
  },

  // Overlay Colors
  overlay: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.3)',
    heavy: 'rgba(0, 0, 0, 0.5)',
  },
};

/**
 * Dark Mode Color Overrides
 */
export const darkModeColors = {
  background: {
    primary: '#111827',
    secondary: '#1f2937',
    tertiary: '#374151',
  },
  text: {
    primary: '#f9fafb',
    secondary: '#d1d5db',
    tertiary: '#9ca3af',
    disabled: '#4b5563',
    inverse: '#111827',
  },
  border: {
    light: '#374151',
    main: '#4b5563',
    dark: '#6b7280',
  },
};

/**
 * Get color by path (e.g., 'primary.main', 'status.success')
 */
export const getColor = (path, isDark = false) => {
  const colorSet = isDark ? { ...colors, ...darkModeColors } : colors;
  return path.split('.').reduce((obj, key) => obj?.[key], colorSet);
};

/**
 * Generate shadow based on elevation
 */
export const getShadow = (elevation = 1) => {
  const shadows = {
    0: 'none',
    1: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    2: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    3: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    4: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    5: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  };
  return shadows[elevation] || shadows[1];
};

export default colors;
