'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { User, Shield, Bell, CreditCard, Download, Trash2 } from 'lucide-react';
import { config } from '@/lib/config';

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
  const { getToken } = useAuth();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.error('No authentication token available');
        setLoading(false);
        return;
      }

      const response = await fetch(`${config.api.url}/api/users/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
      } else {
        // For now, create default settings
        setSettings({
          email: 'user@example.com',
          name: 'User',
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
            limit: 500 * 1024 * 1024, // 500MB
            plan: 'free',
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${config.api.url}/api/users/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        setSettings(prev => ({ ...prev!, ...newSettings }));
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatStorage = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getStoragePercentage = () => {
    if (!settings) return 0;
    return (settings.storage.used / settings.storage.limit) * 100;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card animate-pulse">
          <div className="card-body">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="card-body text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Settings Unavailable</h3>
            <p className="mt-2 text-gray-600">Unable to load your settings at this time.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Account Information */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <User className="mr-2 h-5 w-5" />
            Account Information
          </h3>
        </div>
        <div className="card-body space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={settings.email}
              disabled
              className="input mt-1 w-full bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => updateSettings({ name: e.target.value })}
              className="input mt-1 w-full"
            />
          </div>
        </div>
      </div>

      {/* Storage Usage */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Storage & Plan
          </h3>
        </div>
        <div className="card-body space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Storage Used</span>
              <span className="text-sm text-gray-500">
                {formatStorage(settings.storage.used)} / {formatStorage(settings.storage.limit)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(getStoragePercentage(), 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {settings.storage.plan.charAt(0).toUpperCase() + settings.storage.plan.slice(1)} Plan
            </p>
          </div>
          <button className="btn-outline btn-sm">
            Upgrade Plan
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Notifications
          </h3>
        </div>
        <div className="card-body space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Email Notifications</p>
              <p className="text-xs text-gray-500">Receive notifications via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(e) => updateSettings({ 
                  notifications: { ...settings.notifications, email: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Browser Notifications</p>
              <p className="text-xs text-gray-500">Show notifications in your browser</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.browser}
                onChange={(e) => updateSettings({ 
                  notifications: { ...settings.notifications, browser: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">New View Notifications</p>
              <p className="text-xs text-gray-500">Notify when someone views your files</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.newViews}
                onChange={(e) => updateSettings({ 
                  notifications: { ...settings.notifications, newViews: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Weekly Reports</p>
              <p className="text-xs text-gray-500">Receive weekly analytics summaries</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.weeklyReport}
                onChange={(e) => updateSettings({ 
                  notifications: { ...settings.notifications, weeklyReport: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Privacy & Data */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Privacy & Data
          </h3>
        </div>
        <div className="card-body space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Track Analytics</p>
              <p className="text-xs text-gray-500">Collect viewer analytics for your files</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.privacy.trackAnalytics}
                onChange={(e) => updateSettings({ 
                  privacy: { ...settings.privacy, trackAnalytics: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Share Usage Data</p>
              <p className="text-xs text-gray-500">Help improve PDFTrackr with anonymous usage data</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.privacy.shareUsageData}
                onChange={(e) => updateSettings({ 
                  privacy: { ...settings.privacy, shareUsageData: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Retention</label>
            <select
              value={settings.privacy.dataRetention}
              onChange={(e) => updateSettings({ 
                privacy: { ...settings.privacy, dataRetention: parseInt(e.target.value) }
              })}
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
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Download className="mr-2 h-5 w-5" />
            Data Management
          </h3>
        </div>
        <div className="card-body space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Export My Data</p>
              <p className="text-xs text-gray-500">Download all your data in JSON format</p>
            </div>
            <button className="btn-outline btn-sm">
              Export
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Delete My Account</p>
              <p className="text-xs text-gray-500">Permanently delete your account and all data</p>
            </div>
            <button className="btn-outline btn-sm text-red-600 hover:text-red-700">
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {saving && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg">
          Settings saved!
        </div>
      )}
    </div>
  );
} 