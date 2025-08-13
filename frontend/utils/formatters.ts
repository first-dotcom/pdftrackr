/**
 * Shared formatting utilities for consistent data display
 */

// File size formatting - ALWAYS use 1 decimal place
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  if (bytes < 0) return 'Invalid size';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  // Ensure we don't go beyond our sizes array
  if (i >= sizes.length) {
    const tb = bytes / Math.pow(k, 4);
    return `${tb.toFixed(1)} TB`;
  }
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

// Storage color - CONSISTENT thresholds (80% warning, 90% critical)
export const getStorageColor = (percentage: number): string => {
  if (percentage >= 90) return 'bg-gradient-to-r from-red-500 to-red-600';
  if (percentage >= 80) return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
  return 'bg-gradient-to-r from-primary-500 to-primary-600';
};

// Progress bar color - for non-gradient use
export const getProgressColor = (percentage: number): string => {
  if (percentage >= 90) return 'bg-red-500';
  if (percentage >= 80) return 'bg-yellow-500';
  return 'bg-primary-600';
};

// View time formatting - consistent seconds/minutes display
export const formatViewTime = (seconds: number): string => {
  if (seconds < 0) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${Math.round(remainingSeconds)}s`;
};

// Percentage formatting with bounds checking
export const formatPercentage = (value: number, decimals: number = 1): string => {
  const bounded = Math.max(0, Math.min(100, value));
  return `${bounded.toFixed(decimals)}%`;
};

// Safe percentage calculation
export const calculatePercentage = (used: number, total: number): number => {
  if (total <= 0 || used < 0) return 0;
  return Math.min((used / total) * 100, 100);
};
