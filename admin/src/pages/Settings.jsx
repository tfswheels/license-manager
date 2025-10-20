import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Plus, Trash2, Save, Play, Tag, DollarSign, Package, Store } from 'lucide-react';
import { adminAPI } from '../utils/api';

export default function Settings() {
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [rules, setRules] = useState([]);
  const [exclusionTag, setExclusionTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);

  // New rule form state
  const [newRule, setNewRule] = useState({
    template_id: '',
    rule_type: 'tag',
    rule_value: '',
    priority: 100
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedShop) {
      loadShopData();
    }
  }, [selectedShop]);

  const loadData = async () => {
    try {
      const response = await adminAPI.getShops();
      const shopsData = response.data || response;
      console.log('Shops loaded:', shopsData);
      setShops(shopsData);
      if (shopsData.length > 0) {
        console.log('Setting selected shop to:', shopsData[0].id);
        setSelectedShop(shopsData[0].id);
      } else {
        console.warn('No shops found');
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load shops:', error);
      alert('Failed to load shops. Check console.');
      setLoading(false);
    }
  };

  const loadShopData = async () => {
    if (!selectedShop) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const [templatesData, rulesData, exclusionData] = await Promise.all([
        adminAPI.getTemplates(selectedShop),
        adminAPI.getTemplateRules(selectedShop),
        adminAPI.getExclusionTag(selectedShop)
      ]);
      
      setTemplates(templatesData.data || templatesData);
      setRules(rulesData.data || rulesData);
      setExclusionTag(exclusionData.data?.exclusion_tag || exclusionData.exclusion_tag || '');
    } catch (error) {
      console.error('Failed to load shop data:', error);
      alert('Failed to load settings data. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    if (!newRule.template_id || !newRule.rule_value) {
      alert('Please fill in all fields');
      return;
    }

    // For price_range, convert to JSON
    let ruleValue = newRule.rule_value;
    if (newRule.rule_type === 'price_range') {
      try {
        const [min, max] = newRule.rule_value.split('-').map(v => parseFloat(v.trim()) || null);
        ruleValue = JSON.stringify({ min, max });
      } catch (error) {
        alert('Invalid price range format. Use: 10-50');
        return;
      }
    }

    try {
      await adminAPI.createTemplateRule(selectedShop, {
        template_id: newRule.template_id,
        rule_type: newRule.rule_type,
        rule_value: ruleValue,
        priority: newRule.priority
      });

      setShowAddRule(false);
      setNewRule({
        template_id: '',
        rule_type: 'tag',
        rule_value: '',
        priority: 100
      });

      // Ask if user wants to apply the rule now
      if (confirm('Rule created! Apply this rule to existing products now?')) {
        setApplying(true);
        try {
          const response = await adminAPI.applyTemplateRules(selectedShop);
          const result = response.data || response;
          alert(`Rules applied!\n\n${result.applied || 0} products updated\n${result.skipped || 0} products skipped\n${result.errors || 0} errors`);
        } catch (error) {
          console.error('Failed to apply rules:', error);
          alert('Failed to apply rules');
        } finally {
          setApplying(false);
        }
      }

      loadShopData();
    } catch (error) {
      console.error('Failed to create rule:', error);
      alert('Failed to create rule');
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      await adminAPI.deleteTemplateRule(selectedShop, ruleId);
      alert('Rule deleted');
      loadShopData();
    } catch (error) {
      console.error('Failed to delete rule:', error);
      alert('Failed to delete rule');
    }
  };

  const handleToggleRule = async (ruleId, currentStatus) => {
    try {
      await adminAPI.updateTemplateRule(selectedShop, ruleId, {
        is_active: !currentStatus
      });
      loadShopData();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
      alert('Failed to update rule');
    }
  };

  const handleSaveExclusionTag = async () => {
    try {
      await adminAPI.setExclusionTag(selectedShop, exclusionTag);
      alert('Exclusion tag saved');
    } catch (error) {
      console.error('Failed to save exclusion tag:', error);
      alert('Failed to save exclusion tag');
    }
  };

  const handleApplyRules = async () => {
    if (!confirm('This will re-assign templates to ALL products based on current rules. Continue?')) {
      return;
    }

    setApplying(true);
    try {
      const response = await adminAPI.applyTemplateRules(selectedShop);
      const result = response.data || response;
      alert(`Rules applied!\n\n${result.applied || 0} products updated\n${result.skipped || 0} products skipped\n${result.errors || 0} errors`);
      loadShopData();
    } catch (error) {
      console.error('Failed to apply rules:', error);
      alert('Failed to apply rules');
    } finally {
      setApplying(false);
    }
  };

  const formatRuleValue = (rule) => {
    if (rule.rule_type === 'price_range') {
      try {
        const range = JSON.parse(rule.rule_value);
        return `$${range.min || '0'} - $${range.max || '∞'}`;
      } catch (e) {
        return rule.rule_value;
      }
    }
    return rule.rule_value;
  };

  const getRuleIcon = (type) => {
    switch (type) {
      case 'tag': return <Tag className="w-4 h-4" />;
      case 'price_range': return <DollarSign className="w-4 h-4" />;
      case 'collection': return <Package className="w-4 h-4" />;
      case 'vendor': return <Store className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Configure template assignment rules and preferences</p>
        </div>

        {shops.length > 1 && (
          <select
            value={selectedShop || ''}
            onChange={(e) => setSelectedShop(e.target.value || null)}
            className="input w-64"
          >
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.shop_domain}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Exclusion Tag Section */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Rule Exclusion Tag</h2>
        <p className="text-gray-600 mb-4">
          Products with this tag will bypass all template assignment rules.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={exclusionTag}
            onChange={(e) => setExclusionTag(e.target.value)}
            placeholder="e.g., no-auto-template"
            className="input flex-1"
          />
          <button onClick={handleSaveExclusionTag} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      {/* Template Assignment Rules Section */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Template Assignment Rules</h2>
            <p className="text-gray-500 text-sm mt-1">
              Automatically assign templates based on product attributes. Lower priority number = higher priority.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleApplyRules}
              disabled={applying || rules.length === 0}
              className="btn-secondary flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {applying ? 'Applying...' : 'Apply Rules Now'}
            </button>
            <button onClick={() => setShowAddRule(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Rule
            </button>
          </div>
        </div>

        {/* Rules Table */}
        {rules.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <SettingsIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No template assignment rules yet</p>
            <button onClick={() => setShowAddRule(true)} className="btn-primary">
              Create Your First Rule
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rule Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rule Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Template</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {rules.map((rule) => (
                  <tr key={rule.id} className={!rule.is_active ? 'opacity-50' : ''}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {rule.priority}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        {getRuleIcon(rule.rule_type)}
                        <span className="capitalize">{rule.rule_type.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatRuleValue(rule)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {rule.template_name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleRule(rule.id, rule.is_active)}
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          rule.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Rule Modal */}
      {showAddRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Template Assignment Rule</h3>

            <div className="space-y-4">
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template
                </label>
                <select
                  value={newRule.template_id}
                  onChange={(e) => setNewRule({ ...newRule, template_id: e.target.value })}
                  className="input w-full"
                >
                  <option value="">Select template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.template_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rule Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rule Type
                </label>
                <select
                  value={newRule.rule_type}
                  onChange={(e) => setNewRule({ ...newRule, rule_type: e.target.value })}
                  className="input w-full"
                >
                  <option value="tag">Product Tag</option>
                  <option value="vendor">Vendor</option>
                  <option value="price_range">Price Range</option>
                  <option value="collection">Collection ID</option>
                </select>
              </div>

              {/* Rule Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rule Value
                </label>
                <input
                  type="text"
                  value={newRule.rule_value}
                  onChange={(e) => setNewRule({ ...newRule, rule_value: e.target.value })}
                  placeholder={
                    newRule.rule_type === 'price_range'
                      ? 'e.g., 10-50'
                      : newRule.rule_type === 'collection'
                      ? 'Collection ID'
                      : newRule.rule_type === 'vendor'
                      ? 'Vendor name'
                      : 'Tag name'
                  }
                  className="input w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {newRule.rule_type === 'price_range' && 'Format: min-max (e.g., 10-50)'}
                  {newRule.rule_type === 'tag' && 'Case-insensitive tag match'}
                  {newRule.rule_type === 'vendor' && 'Exact vendor name (case-insensitive)'}
                  {newRule.rule_type === 'collection' && 'Shopify collection ID number'}
                </p>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority (lower = higher priority)
                </label>
                <input
                  type="number"
                  value={newRule.priority}
                  onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) || 100 })}
                  className="input w-full"
                  min="1"
                  max="999"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddRule(false);
                  setNewRule({
                    template_id: '',
                    rule_type: 'tag',
                    rule_value: '',
                    priority: 100
                  });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleCreateRule} className="btn-primary">
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}