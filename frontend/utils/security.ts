/**
 * Frontend Security Utilities
 * XSS Protection and Input Sanitization
 */

// Simple XSS protection for user-generated content
export const sanitizeHtml = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;');
};

// Sanitize user input for display
export const sanitizeUserInput = (input: string): string => {
  if (!input) return '';
  
  // Remove dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript|file|ftp):/i;
  if (dangerousProtocols.test(input)) {
    return '';
  }
  
  // Basic HTML sanitization
  return sanitizeHtml(input.trim());
};

// Validate and sanitize URLs
export const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    
    // Only allow safe protocols
    const safeProtocols = ['http:', 'https:', 'mailto:'];
    if (!safeProtocols.includes(parsed.protocol)) {
      return '';
    }
    
    return parsed.toString();
  } catch {
    return '';
  }
};

// Safe filename for display
export const sanitizeFilename = (filename: string): string => {
  if (!filename) return '';
  
  return filename
    .replace(/[<>:"|?*\x00-\x1f]/g, '') // Remove dangerous chars
    .replace(/\.\./g, '') // Prevent path traversal
    .trim()
    .substring(0, 255); // Limit length
};

// Generate CSRF token for forms
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Content Security Policy nonce generator
export const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
};

// Safe JSON parsing
export const safeParse = (json: string): any => {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
};

// Prevent XSS in React components
export const createSafeProps = (props: Record<string, any>) => {
  const safeProps: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'string') {
      safeProps[key] = sanitizeUserInput(value);
    } else if (key === 'dangerouslySetInnerHTML') {
      // Skip dangerous props
      continue;
    } else {
      safeProps[key] = value;
    }
  }
  
  return safeProps;
};

// Rate limiting helper for frontend
export const createClientRateLimit = (maxRequests: number, timeWindow: number) => {
  const requests: number[] = [];
  
  return {
    canMakeRequest: (): boolean => {
      const now = Date.now();
      const windowStart = now - timeWindow;
      
      // Remove old requests
      while (requests.length > 0 && requests[0] < windowStart) {
        requests.shift();
      }
      
      // Check if we're within limits
      if (requests.length >= maxRequests) {
        return false;
      }
      
      // Record this request
      requests.push(now);
      return true;
    },
    
    getRemainingRequests: (): number => {
      const now = Date.now();
      const windowStart = now - timeWindow;
      
      // Remove old requests
      while (requests.length > 0 && requests[0] < windowStart) {
        requests.shift();
      }
      
      return Math.max(0, maxRequests - requests.length);
    }
  };
};