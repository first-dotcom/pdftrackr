'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { X, Copy, CheckCircle, Eye, EyeOff, Calendar, Users, Shield } from 'lucide-react';
import { config } from '@/lib/config';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id: number;
    title: string;
    originalName: string;
  };
  onSuccess?: () => void;
}

interface ShareLinkForm {
  title: string;
  description: string;
  password: string;
  emailGatingEnabled: boolean;
  downloadEnabled: boolean;
  watermarkEnabled: boolean;
  expiresAt: string;
  maxViews: string;
}

export default function ShareLinkModal({ isOpen, onClose, file, onSuccess }: ShareLinkModalProps) {
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { getToken } = useAuth();

  const [form, setForm] = useState<ShareLinkForm>({
    title: `${file.title} - Shared`,
    description: '',
    password: '',
    emailGatingEnabled: false,
    downloadEnabled: true,
    watermarkEnabled: false,
    expiresAt: '',
    maxViews: '',
  });

  const [errors, setErrors] = useState<Partial<ShareLinkForm>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ShareLinkForm, boolean>>>({});

  // Validation function
  const validateForm = () => {
    const newErrors: Partial<ShareLinkForm> = {};

    // Title is required
    if (!form.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (form.title.length > 255) {
      newErrors.title = 'Title must be less than 255 characters';
    }

    // Password validation (if provided)
    if (form.password && form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Max views validation (if provided)
    if (form.maxViews && (isNaN(parseInt(form.maxViews)) || parseInt(form.maxViews) < 1)) {
      newErrors.maxViews = 'Max views must be a positive number';
    }

    // Expiration date validation (if provided)
    if (form.expiresAt && new Date(form.expiresAt) <= new Date()) {
      newErrors.expiresAt = 'Expiration date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      title: true,
      password: true,
      maxViews: true,
      expiresAt: true,
    });

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = await getToken();
      const payload: any = {
        fileId: file.id,
        title: form.title.trim(),
        emailGatingEnabled: form.emailGatingEnabled,
        downloadEnabled: form.downloadEnabled,
        watermarkEnabled: form.watermarkEnabled,
      };

      // Add optional fields only if they have values
      if (form.description.trim()) {
        payload.description = form.description.trim();
      }
      if (form.password.trim()) {
        payload.password = form.password.trim();
      }
      if (form.expiresAt.trim()) {
        payload.expiresAt = new Date(form.expiresAt).toISOString();
      }
      if (form.maxViews.trim() && !isNaN(parseInt(form.maxViews.trim()))) {
        payload.maxViews = parseInt(form.maxViews.trim());
      }

      const response = await fetch(`${config.api.url}/api/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setShareLink(data.data);
        onSuccess?.();
      } else {
        const error = await response.json();
        console.error('API Error:', error);
        
        // Handle validation errors from backend
        if (error.details) {
          const backendErrors: Partial<ShareLinkForm> = {};
          error.details.forEach((detail: any) => {
            const field = detail.path?.[0];
            if (field) backendErrors[field as keyof ShareLinkForm] = detail.message;
          });
          setErrors(backendErrors);
        } else {
          alert(error.message || 'Failed to create share link');
        }
      }
    } catch (error) {
      console.error('Failed to create share link:', error);
      alert('Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (shareLink?.url) {
      await navigator.clipboard.writeText(shareLink.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetModal = () => {
    setShareLink(null);
    setErrors({});
    setTouched({});
    setForm({
      title: `${file.title} - Shared`,
      description: '',
      password: '',
      emailGatingEnabled: false,
      downloadEnabled: true,
      watermarkEnabled: false,
      expiresAt: '',
      maxViews: '',
    });
  };

  const handleFieldChange = (field: keyof ShareLinkForm, value: string | boolean) => {
    setForm({ ...form, [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleFieldBlur = (field: keyof ShareLinkForm) => {
    setTouched({ ...touched, [field]: true });
    validateForm();
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {shareLink ? 'Share Link Created!' : 'Create Share Link'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {shareLink ? (
          // Success state - show created link
          <div className="p-6 space-y-4">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Share link created!</h3>
              <p className="text-gray-500">Your secure share link is ready to use.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Share URL</label>
                <div className="flex">
                  <input
                    type="text"
                    value={shareLink.url}
                    readOnly
                    className="flex-1 input rounded-r-none"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="btn-primary btn-md rounded-l-none flex items-center"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Title:</span>
                  <span className="font-medium">{shareLink.shareLink.title}</span>
                </div>
                {shareLink.shareLink.expiresAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Expires:</span>
                    <span className="font-medium">
                      {new Date(shareLink.shareLink.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {shareLink.shareLink.maxViews && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Max Views:</span>
                    <span className="font-medium">{shareLink.shareLink.maxViews}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Download:</span>
                  <span className="font-medium">
                    {shareLink.shareLink.downloadEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShareLink(null)}
                className="flex-1 btn-outline btn-md"
              >
                Create Another
              </button>
              <button
                onClick={handleClose}
                className="flex-1 btn-primary btn-md"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          // Form state - create new link
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Creating share link for: <span className="font-medium">{file.originalName}</span>
            </div>

            {/* Basic Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  onBlur={() => handleFieldBlur('title')}
                  className={`input w-full ${errors.title && touched.title ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                  placeholder="Enter a title for this share link"
                  required
                />
                {errors.title && touched.title && (
                  <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className="input w-full h-20 resize-none"
                  placeholder="Add a description for viewers"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">{form.description.length}/1000 characters</p>
              </div>
            </div>

            {/* Security Settings */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Security & Access
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password Protection <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => handleFieldChange('password', e.target.value)}
                      onBlur={() => handleFieldBlur('password')}
                      className={`input w-full pr-10 ${errors.password && touched.password ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                      placeholder="Enter password to protect this link"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && touched.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                  )}
                  {form.password && form.password.length > 0 && (
                    <div className="mt-1">
                      <div className="flex items-center space-x-1 text-xs">
                        <div className={`h-1 w-1 rounded-full ${form.password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className={form.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                          At least 8 characters
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="emailGating"
                    checked={form.emailGatingEnabled}
                    onChange={(e) => handleFieldChange('emailGatingEnabled', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  />
                  <label htmlFor="emailGating" className="ml-2 text-sm text-gray-700">
                    Require email to access <span className="text-gray-400">(recommended for lead generation)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Expiration Settings */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Expiration
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expires On <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) => handleFieldChange('expiresAt', e.target.value)}
                    onBlur={() => handleFieldBlur('expiresAt')}
                    className={`input w-full text-sm ${errors.expiresAt && touched.expiresAt ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  {errors.expiresAt && touched.expiresAt && (
                    <p className="text-red-500 text-xs mt-1">{errors.expiresAt}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Views <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="number"
                    value={form.maxViews}
                    onChange={(e) => handleFieldChange('maxViews', e.target.value)}
                    onBlur={() => handleFieldBlur('maxViews')}
                    className={`input w-full ${errors.maxViews && touched.maxViews ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                    placeholder="e.g. 100"
                    min="1"
                  />
                  {errors.maxViews && touched.maxViews && (
                    <p className="text-red-500 text-xs mt-1">{errors.maxViews}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Viewer Settings */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Viewer Permissions
              </h3>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="downloadEnabled"
                    checked={form.downloadEnabled}
                    onChange={(e) => handleFieldChange('downloadEnabled', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  />
                  <label htmlFor="downloadEnabled" className="ml-2 text-sm text-gray-700">
                    Allow PDF download <span className="text-gray-400">(viewers can save the PDF)</span>
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="watermarkEnabled"
                    checked={form.watermarkEnabled}
                    onChange={(e) => handleFieldChange('watermarkEnabled', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  />
                  <label htmlFor="watermarkEnabled" className="ml-2 text-sm text-gray-700">
                    Add viewer watermark <span className="text-gray-400">(protects content)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 btn-outline btn-md"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 btn-primary btn-md"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Share Link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}