"use client";

import { Bell, Download, Shield, Trash2, User, HardDrive, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { formatFileSize, getProgressColor, calculatePercentage } from "@/utils/formatters";
import { planQuotas } from "@/shared/types";

interface UserSettings {
  email: string;
  name: string;
  notifications: {
    email: boolean;
    browser: boolean;
    newViews: boolean;
    weeklyReport: boolean;
  };
  privacy: {
    trackAnalytics: boolean;
    shareUsageData: boolean;
    dataRetention: number; // days
  };
  storage: {
    used: number;
    limit: number;
    plan: string;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const api = useApi();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.users.settings();

      if (response.success && response.data) {
        setSettings(response.data as UserSettings);
      } else {
        // For now, create default settings
        setSettings({
          email: "user@example.com",
          name: "User",
          notifications: {
            email: true,
            browser: true,
            newViews: true,
            weeklyReport: false,
          },
          privacy: {
            trackAnalytics: true,
            shareUsageData: false,
            dataRetention: 365,
          },
          storage: {
            used: 0,
            limit: planQuotas.free.storage, // Use shared plan quotas
            plan: "free",
          },
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    setSaving(true);
    try {
      const response = await api.users.updateSettings(newSettings);

      if (response.success) {
        setSettings((prev) => (prev ? { ...prev, ...newSettings } : null));
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
    } finally {
      setSaving(false);
    }
  };



  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="card animate-pulse">
          <div className="card-body p-4 sm:p-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={`skeleton-${i}`} className="h-4 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="card">
          <div className="card-body p-4 sm:p-6 text-center py-12">
            <User className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
            <h3 className="mt-4 text-lg sm:text-xl font-medium text-gray-900">Settings Unavailable</h3>
            <p className="mt-2 text-sm sm:text-base text-gray-600">Unable to load your settings at this time.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Account Information */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center border border-blue-200 mr-3">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            Account Information
          </h3>
          <p className="mt-1 text-sm text-gray-500">Manage your account details and preferences</p>
        </div>
        <div className="card-body p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={settings.email}
              disabled
              className="input w-full bg-gray-50 cursor-not-allowed"
              placeholder="your@email.com"
            />
            <p className="text-xs text-gray-500 mt-1">Email address cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => updateSettings({ name: e.target.value })}
              className="input w-full"
              placeholder="Enter your display name"
            />
          </div>
        </div>
      </div>

      {/* Storage Usage */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center border border-green-200 mr-3">
              <HardDrive className="h-4 w-4 text-green-600" />
            </div>
            Storage & Plan
          </h3>
          <p className="mt-1 text-sm text-gray-500">Monitor your storage usage and plan details</p>
        </div>
        <div className="card-body p-4 sm:p-6 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Storage Used</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatFileSize(settings.storage.used)} / {formatFileSize(settings.storage.limit)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ease-out shadow-sm ${getProgressColor(calculatePercentage(settings.storage.used, settings.storage.limit))}`}
                style={{ width: `${Math.min(calculatePercentage(settings.storage.used, settings.storage.limit), 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                {calculatePercentage(settings.storage.used, settings.storage.limit).toFixed(1)}% used
              </p>
              <p className="text-xs font-medium text-gray-700 capitalize">
                {settings.storage.plan} Plan
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-outline btn-md w-full sm:w-auto flex items-center justify-center"
            onClick={() => document.getElementById("waitlist-modal")?.classList.remove("hidden")}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Upgrade Plan
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg flex items-center justify-center border border-purple-200 mr-3">
              <Bell className="h-4 w-4 text-purple-600" />
            </div>
            Notifications
          </h3>
          <p className="mt-1 text-sm text-gray-500">Configure how you receive notifications</p>
        </div>
        <div className="card-body p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Email Notifications</p>
              <p className="text-xs text-gray-500">Receive notifications via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(e) =>
                  updateSettings({
                    notifications: { ...settings.notifications, email: e.target.checked },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">New View Notifications</p>
              <p className="text-xs text-gray-500">Notify when someone views your files</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.newViews}
                onChange={(e) =>
                  updateSettings({
                    notifications: { ...settings.notifications, newViews: e.target.checked },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
            </label>
          </div>
        </div>
      </div>

      {/* Privacy & Data */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg flex items-center justify-center border border-orange-200 mr-3">
              <Shield className="h-4 w-4 text-orange-600" />
            </div>
            Privacy & Data
          </h3>
          <p className="mt-1 text-sm text-gray-500">Control your privacy settings and data collection</p>
        </div>
        <div className="card-body p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Track Analytics</p>
              <p className="text-xs text-gray-500">Collect viewer analytics for your files</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.privacy.trackAnalytics}
                onChange={(e) =>
                  updateSettings({
                    privacy: { ...settings.privacy, trackAnalytics: e.target.checked },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Retention Period</label>
            <select
              id="data-retention-select"
              name="dataRetention"
              value={settings.privacy.dataRetention}
              onChange={(e) =>
                updateSettings({
                  privacy: { ...settings.privacy, dataRetention: parseInt(e.target.value) },
                })
              }
              className="input w-full"
            >
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={365}>1 year</option>
              <option value={730}>2 years</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">How long to keep viewer analytics data</p>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-red-50 to-red-100 rounded-lg flex items-center justify-center border border-red-200 mr-3">
              <Download className="h-4 w-4 text-red-600" />
            </div>
            Data Management
          </h3>
          <p className="mt-1 text-sm text-gray-500">Export your data or manage your account</p>
        </div>
        <div className="card-body p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Export My Data</p>
              <p className="text-xs text-gray-500">Download all your data in JSON format</p>
            </div>
            <button type="button" className="btn-outline btn-md flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700">Delete My Account</p>
              <p className="text-xs text-red-600">Permanently delete your account and all data</p>
            </div>
            <button type="button" className="btn-outline btn-md text-red-600 hover:text-red-700 border-red-300 hover:border-red-400 hover:bg-red-50 flex items-center">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Save Status */}
      {saving && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Saving settings...
        </div>
      )}
    </div>
  );
}
