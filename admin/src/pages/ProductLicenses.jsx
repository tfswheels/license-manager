import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Trash2, RotateCcw, Download } from 'lucide-react';
import { adminAPI } from '../utils/api';

function ProductLicenses() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [parsedLicenses, setParsedLicenses] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, available, allocated

  useEffect(() => {
    loadData();
  }, [productId, filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, licensesRes] = await Promise.all([
        adminAPI.getProducts(),
        adminAPI.getLicenses(
          productId,
          filter === 'all' ? null : filter === 'allocated'
        ),
      ]);
      
      const prod = productsRes.data.find(p => p.id === parseInt(productId));
      setProduct(prod);
      setLicenses(licensesRes.data);
    } catch (error) {
      console.error('Failed to load licenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target.result;
      setCsvContent(content);

      try {
        const response = await adminAPI.parseCSV(content);
        setParsedLicenses(response.data.licenses);
        setShowUpload(true);
      } catch (error) {
        console.error('Failed to parse CSV:', error);
        alert('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  const handleUploadLicenses = async () => {
    if (parsedLicenses.length === 0) return;

    try {
      setUploading(true);
      await adminAPI.uploadLicenses(productId, parsedLicenses);
      alert(`Successfully uploaded ${parsedLicenses.length} licenses!`);
      setShowUpload(false);
      setParsedLicenses([]);
      setCsvContent('');
      await loadData();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload licenses');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLicense = async (licenseId) => {
    if (!confirm('Are you sure you want to delete this license?')) return;

    try {
      await adminAPI.deleteLicense(licenseId);
      await loadData();
    } catch (error) {
      console.error('Delete failed:', error);
      alert(error.response?.data?.error || 'Failed to delete license');
    }
  };

  const handleReleaseLicense = async (licenseId) => {
    if (!confirm('Release this license to make it available again?')) return;

    try {
      await adminAPI.releaseLicense(licenseId);
      await loadData();
    } catch (error) {
      console.error('Release failed:', error);
      alert('Failed to release license');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading licenses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/products')} className="btn-secondary">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{product?.product_name}</h1>
          <p className="text-gray-500 mt-1">Manage license keys for this product</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Total Licenses</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {product?.total_licenses || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Available</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {product?.available_licenses || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Allocated</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {(product?.total_licenses || 0) - (product?.available_licenses || 0)}
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Licenses</h2>
        
        {!showUpload ? (
          <div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Upload a CSV file with license keys (one per line)
              </p>
              <label className="btn-primary cursor-pointer inline-block">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                Choose CSV File
              </label>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>CSV Format:</strong> One license key per line. The first column will be used.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Found <strong>{parsedLicenses.length}</strong> license keys
              </p>
              <div className="max-h-40 overflow-y-auto bg-gray-50 p-4 rounded border border-gray-200">
                {parsedLicenses.slice(0, 10).map((license, idx) => (
                  <div key={idx} className="text-sm font-mono text-gray-700">
                    {license}
                  </div>
                ))}
                {parsedLicenses.length > 10 && (
                  <p className="text-sm text-gray-500 mt-2">
                    ... and {parsedLicenses.length - 10} more
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUploadLicenses}
                disabled={uploading}
                className="btn-primary"
              >
                {uploading ? 'Uploading...' : `Upload ${parsedLicenses.length} Licenses`}
              </button>
              <button
                onClick={() => {
                  setShowUpload(false);
                  setParsedLicenses([]);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Licenses List */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">License Keys</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'badge badge-info' : 'badge'}
            >
              All
            </button>
            <button
              onClick={() => setFilter('available')}
              className={filter === 'available' ? 'badge badge-success' : 'badge'}
            >
              Available
            </button>
            <button
              onClick={() => setFilter('allocated')}
              className={filter === 'allocated' ? 'badge badge-warning' : 'badge'}
            >
              Allocated
            </button>
          </div>
        </div>

        {licenses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No licenses found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">License Key</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Allocated At</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((license) => (
                  <tr key={license.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{license.license_key}</td>
                    <td className="py-3 px-4">
                      {license.allocated ? (
                        <span className="badge badge-warning">Allocated</span>
                      ) : (
                        <span className="badge badge-success">Available</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {license.allocated_at
                        ? new Date(license.allocated_at).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex gap-2 justify-end">
                        {license.allocated ? (
                          <button
                            onClick={() => handleReleaseLicense(license.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Release license"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteLicense(license.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete license"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductLicenses;