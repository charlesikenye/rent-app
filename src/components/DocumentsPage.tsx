import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Eye, Trash2, CheckCircle } from 'lucide-react';

interface Document {
  id: number;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  status: 'pending' | 'processed';
  recordsImported: number;
}

export function DocumentsPage() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>(() => {
    const savedDocs = localStorage.getItem('documents');
    if (savedDocs) {
      return JSON.parse(savedDocs);
    }
    return [
      {
        id: 1,
        name: 'tenant_data_december.xlsx',
        type: 'excel',
        size: '2.3 MB',
        uploadDate: '2024-12-28',
        status: 'processed',
        recordsImported: 24
      },
      {
        id: 2,
        name: 'lease_agreements.pdf',
        type: 'pdf',
        size: '5.7 MB',
        uploadDate: '2024-12-25',
        status: 'pending',
        recordsImported: 0
      }
    ];
  });
  
  useEffect(() => {
    localStorage.setItem('documents', JSON.stringify(documents));
  }, [documents]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const file = files[0];
    if (file) {
      setIsUploading(true);
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
            // Add uploaded file to documents list with status 'pending'
            const newDoc = {
              id: documents.length ? documents[documents.length - 1].id + 1 : 1,
              name: file.name,
              type: file.name.split('.').pop() || 'unknown',
              size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
              uploadDate: new Date().toISOString().split('T')[0],
              status: 'pending',
              recordsImported: 0
            };
            setDocuments((prevDocs: any[]) => [...prevDocs, newDoc]);
            // Simulate processing completion after 3 seconds
            setTimeout(() => {
              setDocuments((prevDocs: any[]) =>
                prevDocs.map((doc: any) =>
                  doc.id === newDoc.id ? { ...doc, status: 'processed', recordsImported: 10 } : doc
                )
              );
            }, 3000);
          }, 500);
        }
      }, 200);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Document Management</h2>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Documents</h3>
        
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-lg font-medium text-gray-900">
                Drop files here or click to upload
              </span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept=".xlsx,.xls,.pdf,.csv"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </label>
            <p className="text-sm text-gray-500 mt-2">
              Supports Excel (.xlsx, .xls), PDF (.pdf), and CSV (.csv) files
            </p>
          </div>

          {isUploading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">Uploading... {uploadProgress}%</p>
            </div>
          )}
        </div>

        {/* Upload Instructions */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Data Import Instructions</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Excel files should contain tenant data with columns: Name, Email, Phone, Unit, Rent Amount</li>
            <li>• PDF files will be parsed for tenant information and lease details</li>
            <li>• CSV files should follow the same structure as Excel files</li>
            <li>• Rent amounts should be in Kenya Shillings (KSh)</li>
            <li>• Data will be automatically validated and imported after upload</li>
          </ul>
        </div>
      </div>

      {/* Data Mapping */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Column Mapping</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tenant Name Column</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="name">Name</option>
              <option value="tenant_name">Tenant Name</option>
              <option value="full_name">Full Name</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Column</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="email">Email</option>
              <option value="email_address">Email Address</option>
              <option value="contact_email">Contact Email</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Unit Column</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="unit">Unit</option>
              <option value="unit_number">Unit Number</option>
              <option value="apartment">Apartment</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rent Amount Column</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="rent">Rent</option>
              <option value="rent_amount">Rent Amount</option>
              <option value="monthly_rent">Monthly Rent</option>
            </select>
          </div>
        </div>
        <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
          Save Mapping
        </button>
      </div>

      {/* Document History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Uploads</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upload Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Records
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      doc.type === 'excel' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {doc.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{doc.size}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(doc.uploadDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {doc.status === 'processed' ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      ) : (
                        <div className="h-4 w-4 bg-yellow-500 rounded-full mr-2 animate-pulse" />
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        doc.status === 'processed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {doc.recordsImported > 0 ? `${doc.recordsImported} imported` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => alert(`View document: ${doc.name}`)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => alert(`Download document: ${doc.name}`)}
                        className="text-green-600 hover:text-green-900 flex items-center"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete ${doc.name}?`)) {
                            setDocuments(prevDocs => prevDocs.filter(d => d.id !== doc.id));
                          }
                        }}
                        className="text-red-600 hover:text-red-900 flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
