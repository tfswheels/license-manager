import { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, AlertCircle, Mail, Key, Bell } from 'lucide-react';
import { adminAPI } from '../utils/api';

export default function SystemSettings() {
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    if (selectedShop) {
      loadSettings();
    }
  }, [selectedShop]);

  const loadShops = async () => {
    try {
      const response = await adminAPI.getShops();
      const shopsData = response.data || response;
      setShops(shopsData);
      if (shopsData.length > 0) {
        setSelectedShop(shopsData[0].id);
      }
    } catch (error) {
      console.error('Failed to load shops:', error);
      showMessage('error', 'Failed to load shops');
    }
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getShopSettings(selectedShop);
      const settingsData = response.data || response;
      setSettings(settingsData);
    } catch (error) {
      console.error('Failed to load settings:', error);
      showMessage('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.updateShopSettings(selectedShop, settings);
      showMessage('success', 'Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showMessage('error', error.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) {
      return;
    }

    setSaving(true);
    try {
      const response = await adminAPI.resetShopSettings(selectedShop);
      const resetSettings = response.data?.settings || response.settings;
      setSettings(resetSettings);
      showMessage('success', 'Settings reset to defaults');
    } catch (error) {
      console.error('Failed to reset settings:', error);
      showMessage('error', 'Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No settings found. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
              <p className="text-sm text-gray-600">Configure license delivery and email settings</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleReset}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Shop Selector */}
        {shops.length > 1 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Shop
            </label>
            <select
              value={selectedShop || ''}
              onChange={(e) => setSelectedShop(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {shops.map(shop => (
                <option key={shop.id} value={shop.id}>
                  {shop.shop_domain}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Message Banner */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className={`w-5 h-5 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>{message.text}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* License Delivery Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">License Delivery</h2>
          </div>

          <div className="space-y-4">
            {/* FIFO/LIFO */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License Delivery Method
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="delivery_method"
                    value="FIFO"
                    checked={settings.license_delivery_method === 'FIFO'}
                    onChange={(e) => updateSetting('license_delivery_method', e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">
                    <strong>FIFO</strong> - First In First Out (oldest licenses first)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="delivery_method"
                    value="LIFO"
                    checked={settings.license_delivery_method === 'LIFO'}
                    onChange={(e) => updateSetting('license_delivery_method', e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">
                    <strong>LIFO</strong> - Last In First Out (newest licenses first)
                  </span>
                </label>
              </div>
            </div>

            {/* License Uniqueness */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">License Uniqueness</h3>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enforce_unique_licenses}
                    onChange={(e) => updateSetting('enforce_unique_licenses', e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Enforce unique licenses for product</div>
                    <div className="text-sm text-gray-600">
                      Ensures all licenses allocated for a product are unique. If disabled, duplicate licenses can be sent.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enforce_unique_per_order}
                    onChange={(e) => updateSetting('enforce_unique_per_order', e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Prevent duplicate licenses in same order</div>
                    <div className="text-sm text-gray-600">
                      Ensures the same order will never receive duplicate license keys, even if the above setting is disabled.
                    </div>
                  </div>
                </label>
              </div>

              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> If uniqueness is enforced and a customer orders 2 licenses but only 1 unique license exists,
                  they will receive only 1 license. The remaining quantity will follow the out-of-stock behavior below.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Out of Stock Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">Out of Stock Behavior</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What happens when no licenses are available?
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="out_of_stock"
                    value="no_email"
                    checked={settings.out_of_stock_behavior === 'no_email'}
                    onChange={(e) => updateSetting('out_of_stock_behavior', e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">
                    <strong>Don't send email</strong> - No email will be sent to the customer
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="out_of_stock"
                    value="send_placeholder"
                    checked={settings.out_of_stock_behavior === 'send_placeholder'}
                    onChange={(e) => updateSetting('out_of_stock_behavior', e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">
                    <strong>Send with placeholder</strong> - Send email with custom message instead of license keys
                  </span>
                </label>
              </div>
            </div>

            {settings.out_of_stock_behavior === 'send_placeholder' && (
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Placeholder Message
                </label>
                <textarea
                  value={settings.out_of_stock_placeholder}
                  onChange={(e) => updateSetting('out_of_stock_placeholder', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Please contact us at support@example.com for your license key"
                />
                <p className="mt-1 text-sm text-gray-600">
                  This message will be shown instead of license keys when none are available
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Email Settings</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Sender Email
              </label>
              <input
                type="email"
                value={settings.custom_sender_email || ''}
                onChange={(e) => updateSetting('custom_sender_email', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., licenses@yourcompany.com (leave blank to use default)"
              />
              <p className="mt-1 text-sm text-gray-600">
                Override the default sender email address for license emails
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Sender Name
              </label>
              <input
                type="text"
                value={settings.custom_sender_name || ''}
                onChange={(e) => updateSetting('custom_sender_name', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Your Company Licenses (leave blank to use default)"
              />
              <p className="mt-1 text-sm text-gray-600">
                Override the default sender name for license emails
              </p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Email Address
              </label>
              <input
                type="email"
                value={settings.notification_email || ''}
                onChange={(e) => updateSetting('notification_email', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., admin@yourcompany.com"
              />
              <p className="mt-1 text-sm text-gray-600">
                Receive notifications about license allocation issues (leave blank to disable)
              </p>
            </div>

            {settings.notification_email && (
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notify_on_out_of_stock}
                    onChange={(e) => updateSetting('notify_on_out_of_stock', e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Notify when out of stock</div>
                    <div className="text-sm text-gray-600">
                      Send notification when an order cannot be fulfilled due to no licenses available
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notify_on_uniqueness_issue}
                    onChange={(e) => updateSetting('notify_on_uniqueness_issue', e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Notify on uniqueness issues</div>
                    <div className="text-sm text-gray-600">
                      Send notification when uniqueness constraints prevent full license allocation
                    </div>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Save Button */}
      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={handleReset}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
