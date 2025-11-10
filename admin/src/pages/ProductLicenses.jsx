import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Trash2, RotateCcw, FileText, FileSpreadsheet, Edit3, CheckSquare, Square } from 'lucide-react';
import { adminAPI } from '../utils/api';
import * as XLSX from 'xlsx';

function ProductLicenses() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [parsedLicenses, setParsedLicenses] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, available, allocated
  const [fileName, setFileName] = useState('');
  const [entryMode, setEntryMode] = useState('file'); // 'file' or 'manual'
  const [manualInput, setManualInput] = useState('');
  const [selectedLicenses, setSelectedLicenses] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

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

  const parseCSV = (content) => {
    // Simple CSV parsing - split by lines and take first column
    const lines = content.split(/\r?\n/);
    const licenses = lines
      .map(line => {
        // Handle comma-separated values - take first column
        const firstColumn = line.split(',')[0];
        return firstColumn.trim();
      })
      .filter(key => key && key.length > 0);
    
    return licenses;
  };

  const parseExcel = (arrayBuffer) => {
    try {
      // Read the workbook
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON (array of arrays)
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Extract first column, skip empty rows
      const licenses = data
        .map(row => {
          // Get first cell in row
          const firstCell = row[0];
          return firstCell ? String(firstCell).trim() : '';
        })
        .filter(key => key && key.length > 0);
      
      return licenses;
    } catch (error) {
      console.error('Excel parse error:', error);
      throw new Error('Failed to parse Excel file');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const fileExtension = file.name.split('.').pop().toLowerCase();

    try {
      if (fileExtension === 'csv') {
        // Parse CSV
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target.result;
          const licenses = parseCSV(content);
          setParsedLicenses(licenses);
          setShowUpload(true);
        };
        reader.readAsText(file);

      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel
        const reader = new FileReader();
        reader.onload = (event) => {
          const arrayBuffer = event.target.result;
          try {
            const licenses = parseExcel(arrayBuffer);
            setParsedLicenses(licenses);
            setShowUpload(true);
          } catch (error) {
            alert('Failed to parse Excel file. Please ensure the first column contains license keys.');
          }
        };
        reader.readAsArrayBuffer(file);

      } else {
        alert('Unsupported file type. Please upload CSV or Excel (.xlsx, .xls) files.');
      }
    } catch (error) {
      console.error('File parse error:', error);
      alert('Failed to parse file');
    }
  };

  const handleManualEntry = () => {
    // Parse manual input (one license per line)
    const licenses = manualInput
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (licenses.length === 0) {
      alert('Please enter at least one license key');
      return;
    }

    setParsedLicenses(licenses);
    setFileName('Manual Entry');
    setShowUpload(true);
  };

  const handleUploadLicenses = async () => {
    if (parsedLicenses.length === 0) return;

    try {
      setUploading(true);
      const response = await adminAPI.uploadLicenses(productId, parsedLicenses);
      const data = response.data;

      // Build detailed message
      let message = '';
      if (data.uniqueness_enforced) {
        // Detailed breakdown when uniqueness is enforced
        const parts = [];
        if (data.uploaded > 0) {
          parts.push(`✓ Uploaded ${data.uploaded} unique license${data.uploaded !== 1 ? 's' : ''}`);
        }
        if (data.duplicates_in_batch > 0) {
          parts.push(`⚠️ Skipped ${data.duplicates_in_batch} duplicate${data.duplicates_in_batch !== 1 ? 's' : ''} within upload`);
        }
        if (data.duplicates_in_database > 0) {
          parts.push(`⚠️ Skipped ${data.duplicates_in_database} duplicate${data.duplicates_in_database !== 1 ? 's' : ''} already in database`);
        }

        message = parts.join('\n\n');

        // Add samples if available
        if (data.sample_batch_duplicates?.length > 0) {
          message += `\n\nSample duplicates in upload:\n${data.sample_batch_duplicates.join(', ')}`;
        }
        if (data.sample_db_duplicates?.length > 0) {
          message += `\n\nSample duplicates already in DB:\n${data.sample_db_duplicates.join(', ')}`;
        }

        // Show warning if no licenses were uploaded
        if (data.uploaded === 0) {
          alert(`⚠️ No licenses uploaded!\n\n${message}`);
        } else {
          alert(`Upload Complete!\n\n${message}`);
        }
      } else {
        // Simple message when uniqueness is not enforced
        alert(`Successfully uploaded ${data.uploaded} licenses!\n(Uniqueness validation is disabled)`);
      }

      setShowUpload(false);
      setParsedLicenses([]);
      setFileName('');
      setManualInput('');
      await loadData();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload licenses: ' + (error.response?.data?.error || error.message));
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

  const toggleLicenseSelection = (licenseId) => {
    const newSelection = new Set(selectedLicenses);
    if (newSelection.has(licenseId)) {
      newSelection.delete(licenseId);
    } else {
      newSelection.add(licenseId);
    }
    setSelectedLicenses(newSelection);
  };

  const toggleSelectAll = () => {
    const currentPageLicenses = paginatedLicenses.map(l => l.id);
    const allCurrentSelected = currentPageLicenses.every(id => selectedLicenses.has(id));

    const newSelection = new Set(selectedLicenses);
    if (allCurrentSelected) {
      // Deselect all on current page
      currentPageLicenses.forEach(id => newSelection.delete(id));
    } else {
      // Select all on current page
      currentPageLicenses.forEach(id => newSelection.add(id));
    }
    setSelectedLicenses(newSelection);
  };

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // Calculate pagination
  const totalPages = Math.ceil(licenses.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedLicenses = licenses.slice(startIndex, endIndex);

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLicenses.size === 0) {
      alert('Please select licenses to delete');
      return;
    }

    const allocatedCount = licenses.filter(l => selectedLicenses.has(l.id) && l.allocated).length;
    if (allocatedCount > 0) {
      alert(`Cannot delete ${allocatedCount} allocated license(s). Only unallocated licenses can be deleted.`);
      return;
    }

    if (!confirm(`Delete ${selectedLicenses.size} selected license(s)?`)) return;

    try {
      setBulkActionLoading(true);
      await adminAPI.bulkDeleteLicenses(Array.from(selectedLicenses));
      setSelectedLicenses(new Set());
      await loadData();
      alert(`Successfully deleted ${selectedLicenses.size} license(s)`);
    } catch (error) {
      console.error('Bulk delete failed:', error);
      alert(error.response?.data?.error || 'Failed to delete licenses');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkRelease = async () => {
    if (selectedLicenses.size === 0) {
      alert('Please select licenses to release');
      return;
    }

    const allocatedCount = licenses.filter(l => selectedLicenses.has(l.id) && l.allocated).length;
    if (allocatedCount === 0) {
      alert('No allocated licenses selected to release');
      return;
    }

    if (!confirm(`Release ${allocatedCount} allocated license(s)?`)) return;

    try {
      setBulkActionLoading(true);
      await adminAPI.bulkReleaseLicenses(Array.from(selectedLicenses));
      setSelectedLicenses(new Set());
      await loadData();
      alert(`Successfully released ${allocatedCount} license(s)`);
    } catch (error) {
      console.error('Bulk release failed:', error);
      alert(error.response?.data?.error || 'Failed to release licenses');
    } finally {
      setBulkActionLoading(false);
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
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Licenses</h2>

        {!showUpload ? (
          <div>
            {/* Mode Selector */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setEntryMode('file')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  entryMode === 'file'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Upload className="w-5 h-5 inline mr-2" />
                Upload File
              </button>
              <button
                onClick={() => setEntryMode('manual')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  entryMode === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Edit3 className="w-5 h-5 inline mr-2" />
                Manual Entry
              </button>
            </div>

            {entryMode === 'file' ? (
              <div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Upload a CSV or Excel file with license keys
                  </p>
                  <label className="btn-primary cursor-pointer inline-block">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    Choose File
                  </label>
                </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CSV Instructions */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <strong className="text-sm text-blue-800">CSV Format</strong>
                </div>
                <p className="text-sm text-blue-800">
                  One license key per line. First column will be used if multiple columns exist.
                </p>
                <div className="mt-2 p-2 bg-white rounded text-xs font-mono text-gray-700">
                  ABC123-DEF456-GHI789<br/>
                  JKL012-MNO345-PQR678<br/>
                  STU901-VWX234-YZA567
                </div>
              </div>
              
              {/* Excel Instructions */}
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  <strong className="text-sm text-green-800">Excel Format (.xlsx, .xls)</strong>
                </div>
                <p className="text-sm text-green-800">
                  First column of first sheet will be used. Each row should contain one license key.
                </p>
                <div className="mt-2 p-2 bg-white rounded text-xs text-gray-700">
                  Column A: License keys<br/>
                  Row 1: ABC123-DEF456-GHI789<br/>
                  Row 2: JKL012-MNO345-PQR678
                </div>
              </div>
            </div>
              </div>
            ) : (
              <div>
                {/* Manual Entry */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter License Keys (one per line)
                    </label>
                    <textarea
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="ABC123-DEF456-GHI789&#10;JKL012-MNO345-PQR678&#10;STU901-VWX234-YZA567"
                      rows={12}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter each license key on a new line. Paste from Excel, CSV, or type manually.
                    </p>
                  </div>

                  <button
                    onClick={handleManualEntry}
                    disabled={!manualInput.trim()}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Preview Licenses
                  </button>
                </div>

                {/* Instructions */}
                <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Edit3 className="w-5 h-5 text-purple-600" />
                    <strong className="text-sm text-purple-800">Manual Entry Tips</strong>
                  </div>
                  <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
                    <li>Enter one license key per line</li>
                    <li>You can paste from Excel or CSV files</li>
                    <li>Empty lines will be ignored</li>
                    <li>Leading and trailing spaces will be removed</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <p className="text-sm text-gray-600">
                  <strong>{fileName}</strong>
                </p>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Found <strong className="text-green-600">{parsedLicenses.length}</strong> license keys
              </p>
              <div className="max-h-60 overflow-y-auto bg-gray-50 p-4 rounded border border-gray-200">
                {parsedLicenses.slice(0, 20).map((license, idx) => (
                  <div key={idx} className="text-sm font-mono text-gray-700 py-1">
                    {idx + 1}. {license}
                  </div>
                ))}
                {parsedLicenses.length > 20 && (
                  <p className="text-sm text-gray-500 mt-2 font-sans">
                    ... and {parsedLicenses.length - 20} more
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
                  setFileName('');
                  setManualInput('');
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
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({licenses.length})
            </button>
            <button
              onClick={() => setFilter('available')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === 'available'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Available ({licenses.filter(l => !l.allocated).length})
            </button>
            <button
              onClick={() => setFilter('allocated')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === 'allocated'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Allocated ({licenses.filter(l => l.allocated).length})
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedLicenses.size > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedLicenses.size} license(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkRelease}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Release Selected
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedLicenses(new Set())}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {licenses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No licenses found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 w-12">
                    <button
                      onClick={toggleSelectAll}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title={
                        paginatedLicenses.every(l => selectedLicenses.has(l.id))
                          ? 'Deselect All on Page'
                          : 'Select All on Page'
                      }
                    >
                      {paginatedLicenses.every(l => selectedLicenses.has(l.id)) && paginatedLicenses.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">License Key</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Order</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLicenses.map((license) => (
                  <tr key={license.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleLicenseSelection(license.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        {selectedLicenses.has(license.id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono text-sm text-gray-900">
                      {license.license_key}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          license.allocated
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {license.allocated ? 'Allocated' : 'Available'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {license.order_number || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {license.allocated ? (
                          <button
                            onClick={() => handleReleaseLicense(license.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Release license"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteLicense(license.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

            {/* Pagination Controls */}
            {licenses.length > 0 && (
              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    Showing {startIndex + 1}-{Math.min(endIndex, licenses.length)} of {licenses.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Per page:</label>
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={200}>200</option>
                      <option value={500}>500</option>
                    </select>
                  </div>
                </div>

                {/* Page Navigation */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      First
                    </button>
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Previous
                    </button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`px-3 py-1 rounded-lg border text-sm ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Last
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductLicenses;