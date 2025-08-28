"use client";

import { useApi } from "@/hooks/useApi";
import type { CreateShareLinkRequest, File as FileType, ShareLink } from "@/shared/types";
import { Calendar, CheckCircle, Copy, Shield, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileType;
  onSuccess?: () => void;
  existingShareLink?: ShareLink | null; // For editing
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

export default function ShareLinkModal({
  isOpen,
  onClose,
  file,
  onSuccess,
  existingShareLink,
}: ShareLinkModalProps) {
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [copied, setCopied] = useState(false);
  const api = useApi();

  const [form, setForm] = useState<ShareLinkForm>({
    title: existingShareLink?.title || `${file.title || "Untitled Document"} - Shared`,
    description: existingShareLink?.description || "",
    password: "", // Never pre-fill passwords for security
    emailGatingEnabled: existingShareLink?.emailGatingEnabled || false,
    downloadEnabled: existingShareLink?.downloadEnabled !== false, // default true
    watermarkEnabled: existingShareLink?.watermarkEnabled || false,
    expiresAt: existingShareLink?.expiresAt
      ? new Date(existingShareLink.expiresAt).toISOString().slice(0, 16)
      : "",
    maxViews: existingShareLink?.maxViews?.toString() || "",
  });

  const [errors, setErrors] = useState<Partial<ShareLinkForm>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ShareLinkForm, boolean>>>({});

  // Validation function
  const validateForm = () => {
    const newErrors: Partial<ShareLinkForm> = {};

    // Title is required
    if (!form.title.trim()) {
      newErrors.title = "Title is required";
    } else if (form.title.length > 255) {
      newErrors.title = "Title must be less than 255 characters";
    }

    // Password validation (if provided)
    if (form.password && form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    // Max views validation (if provided)
    if (form.maxViews && (Number.isNaN(parseInt(form.maxViews)) || parseInt(form.maxViews) < 1)) {
      newErrors.maxViews = "Max views must be a positive number";
    }

    // Expiration date validation (if provided)
    if (form.expiresAt && new Date(form.expiresAt) <= new Date()) {
      newErrors.expiresAt = "Expiration date must be in the future";
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
      const payload: CreateShareLinkRequest = {
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
      if (form.maxViews.trim() && !Number.isNaN(parseInt(form.maxViews.trim()))) {
        payload.maxViews = parseInt(form.maxViews.trim());
      }

      const isEditing = !!existingShareLink;

      // Use the API client - it handles CSRF automatically
      const response = isEditing
        ? await api.shareLinks.update(existingShareLink.shareId, payload)
        : await api.shareLinks.create(payload);

      if (response.success) {
        setShareLink((response.data as any)?.shareLink || null);
        onSuccess?.();
      } else {
        console.error("API Error:", response.error);

        // Handle validation errors from backend
        if (
          response.error &&
          typeof response.error === "object" &&
          (response.error as any).details
        ) {
          const backendErrors: Partial<ShareLinkForm> = {};
          for (const detail of (response.error as any).details as Array<{
            path?: string[];
            message: string;
          }>) {
            const field = detail.path?.[0];
            if (field) {
              (backendErrors as any)[field as keyof ShareLinkForm] = detail.message;
            }
          }
          setErrors(backendErrors);
        } else {
          const errorMessage =
            typeof response.error === "string"
              ? response.error
              : typeof response.error === "object" && response.error?.message
                ? (response.error as any).message
                : "Failed to create share link";
          alert(errorMessage);
        }
      }
    } catch (error) {
      console.error("Failed to create share link:", error);
      alert("Failed to create share link");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (shareLink?.shareId) {
      const url = `${window.location.origin}/view/${shareLink.shareId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetModal = () => {
    setShareLink(null);
    setErrors({});
    setTouched({});
    setForm({
      title: existingShareLink?.title || `${file.title || "Untitled Document"} - Shared`,
      description: existingShareLink?.description || "",
      password: "", // Never pre-fill passwords for security
      emailGatingEnabled: existingShareLink?.emailGatingEnabled || false,
      downloadEnabled: existingShareLink?.downloadEnabled !== false,
      watermarkEnabled: existingShareLink?.watermarkEnabled || false,
      expiresAt: existingShareLink?.expiresAt
        ? new Date(existingShareLink.expiresAt).toISOString().slice(0, 16)
        : "",
      maxViews: existingShareLink?.maxViews?.toString() || "",
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

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {shareLink ? "Share Link Created!" : "Create Share Link"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500 p-2 -m-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {shareLink ? (
          // Success state - show created link
          <div className="p-4 sm:p-6 space-y-4">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Share link created!</h3>
              <p className="text-gray-500">Your secure share link is ready to use.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Share URL</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="share-url"
                    name="shareUrl"
                    type="text"
                    value={`${window.location.origin}/view/${shareLink.shareId}`}
                    readOnly
                    className="flex-1 input rounded-md sm:rounded-r-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="btn-primary btn-md rounded-md sm:rounded-l-none flex items-center justify-center min-h-[44px] touch-manipulation"
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
                  <span className="font-medium">{shareLink.title}</span>
                </div>
                {shareLink.expiresAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Expires:</span>
                    <span className="font-medium">
                      {new Date(shareLink.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {shareLink.maxViews && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Max Views:</span>
                    <span className="font-medium">{shareLink.maxViews}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Download:</span>
                  <span className="font-medium">
                    {shareLink.downloadEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShareLink(null)}
                className="flex-1 btn-outline btn-md min-h-[44px] touch-manipulation"
              >
                Create Another
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 btn-primary btn-md min-h-[44px] touch-manipulation"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          // Form state - create new link
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Creating share link for:{" "}
              <span className="font-medium">{file.title || "Untitled Document"}</span>
            </div>

            {/* Basic Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="share-title"
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  onBlur={() => handleFieldBlur("title")}
                  className={`input w-full ${
                    errors.title && touched.title ? "border-red-500" : ""
                  }`}
                  placeholder="Enter a title for your share link"
                />
                {errors.title && touched.title && (
                  <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  id="share-description"
                  name="description"
                  value={form.description}
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                  className="input w-full"
                  rows={2}
                  placeholder="Optional description for your share link"
                />
              </div>
            </div>

            {/* Security Settings */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                Security & Access
              </h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Allow Downloads</p>
                    <p className="text-xs text-gray-500">Let viewers download the file</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="download-enabled"
                      name="downloadEnabled"
                      type="checkbox"
                      checked={form.downloadEnabled}
                      onChange={(e) => handleFieldChange("downloadEnabled", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Require Email</p>
                    <p className="text-xs text-gray-500">Collect viewer email addresses</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="email-gating-enabled"
                      name="emailGatingEnabled"
                      type="checkbox"
                      checked={form.emailGatingEnabled}
                      onChange={(e) => handleFieldChange("emailGatingEnabled", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                  </label>
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Advanced Options
              </h4>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expires After
                  </label>
                  <input
                    id="expires-at-input"
                    name="expiresAt"
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => handleFieldChange("expiresAt", e.target.value)}
                    onBlur={() => handleFieldBlur("expiresAt")}
                    className={`input w-full ${
                      errors.expiresAt && touched.expiresAt ? "border-red-500" : ""
                    }`}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  {errors.expiresAt && touched.expiresAt && (
                    <p className="text-red-500 text-xs mt-1">{errors.expiresAt}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Views</label>
                  <input
                    id="max-views-input"
                    name="maxViews"
                    type="number"
                    value={form.maxViews}
                    onChange={(e) => handleFieldChange("maxViews", e.target.value)}
                    onBlur={() => handleFieldBlur("maxViews")}
                    className={`input w-full ${
                      errors.maxViews && touched.maxViews ? "border-red-500" : ""
                    }`}
                    placeholder="Unlimited"
                    min="1"
                  />
                  {errors.maxViews && touched.maxViews && (
                    <p className="text-red-500 text-xs mt-1">{errors.maxViews}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 btn-outline btn-md min-h-[44px] touch-manipulation"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary btn-md min-h-[44px] touch-manipulation"
              >
                {loading ? "Creating..." : "Create Share Link"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
