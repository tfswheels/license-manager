// admin/src/pages/Templates.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Plus, 
  Edit2, 
  Trash2, 
  Star, 
  Package,
  AlertCircle
} from 'lucide-react';
import api from '../utils/api';

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null);
  const [reassignTemplateId, setReassignTemplateId] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const shopId = localStorage.getItem('currentShopId') || 1;
      const response = await api.get(`/api/admin/templates?shopId=${shopId}`);
      setTemplates(response.data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (templateId) => {
    try {
      await api.post(`/api/admin/templates/${templateId}/set-default`);
      await loadTemplates();
    } catch (error) {
      console.error('Error setting default:', error);
      alert('Failed to set default template');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;

    try {
      await api.delete(`/api/admin/templates/${deleteModal.id}`, {
        data: { reassignTemplateId: reassignTemplateId || null }
      });
      setDeleteModal(null);
      setReassignTemplateId('');
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert(error.response?.data?.error || 'Failed to delete template');
    }
  };

  const openDeleteModal = (template) => {
    const defaultTemplate = templates.find(t => t.is_default);
    setReassignTemplateId(defaultTemplate?.id.toString() || '');
    setDeleteModal(template);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
            <p className="mt-2 text-gray-600">
              Manage email templates for license delivery
            </p>
          </div>
          <button
            onClick={() => navigate('/templates/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            New Template
          </button>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>How templates work:</strong> Products without an assigned template will use your default template. 
            You can assign specific templates to products in the Products page.
          </div>
        </div>
      </div>

      {/* Templates Table */}
      {templates.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-600 mb-4">Create your first email template to get started</p>
          <button
            onClick={() => navigate('/templates/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Create Template
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject Line
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {template.template_name}
                      </span>
                      {Boolean(template.is_default) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                          <Star className="w-3 h-3" />
                          Default
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 line-clamp-1">
                      {template.email_subject}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Package className="w-4 h-4" />
                      <span>{template.product_count}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      template.is_default 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.is_default ? 'Active' : 'Ready'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/templates/${template.id}/edit`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      
                      {!template.is_default && (
                        <>
                          <button
                            onClick={() => handleSetDefault(template.id)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Set as Default"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => openDeleteModal(template)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Template
            </h3>
            
            <p className="text-gray-600 mb-4">
              This template is assigned to <strong>{deleteModal.product_count} products</strong>.
            </p>

            {deleteModal.product_count > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reassign products to:
                </label>
                <select
                  value={reassignTemplateId}
                  onChange={(e) => setReassignTemplateId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Default Template</option>
                  {templates
                    .filter(t => t.id !== deleteModal.id)
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        {t.template_name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}