import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Mail, Phone, Calendar, Edit, Trash2, X, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../api/supabaseClient';

export interface Tenant {
  id: number;
  name: string;
  email: string;
  phone: string;
  unit: string;
  rent: number;
  status: string;
  leaseBegin: string | null;
  ownedByLandlord: boolean;
  avatar: string;
  block: 'OLD' | 'NEW' | 'NYERI';
}

export function TenantsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);

  const [newTenant, setNewTenant] = useState<{
    name: string;
    email: string;
    phone: string;
    unit: string;
    rent: string;
    leaseBegin: string;
    ownedByLandlord: boolean;
    block: 'OLD' | 'NEW' | 'NYERI';
  }>({
    name: '',
    email: '',
    phone: '',
    unit: '',
    rent: '',
    leaseBegin: '',
    ownedByLandlord: false,
    block: 'OLD',
  });

  const [selectedProperty, setSelectedProperty] = useState<string>('All Properties');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const properties = [
    'All Properties',
    'El-Shaddai Apartments Old Block (Nakuru)',
    'El-Shaddai Apartments NEW BLOCK (Nakuru)',
    'Outspan-Kamakwa Rd Nyeri',
  ];

  // ✅ FETCH tenants from Supabase
  useEffect(() => {
    const fetchTenants = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('tenants').select('*').order('id', { ascending: true });
      if (error) {
        console.error('Error fetching tenants:', error);
      } else {
        setTenants(data as Tenant[]);
      }
      setLoading(false);
    };
    fetchTenants();
  }, []);

  const filteredTenants = tenants.filter((tenant) => {
    let tenantProperty = '';
    if (tenant.block === 'OLD') tenantProperty = 'El-Shaddai Apartments Old Block (Nakuru)';
    else if (tenant.block === 'NEW') tenantProperty = 'El-Shaddai Apartments NEW BLOCK (Nakuru)';
    else if (tenant.block === 'NYERI') tenantProperty = 'Outspan-Kamakwa Rd Nyeri';

    const matchesProperty =
      selectedProperty === 'All Properties' || tenantProperty === selectedProperty;
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.unit.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesProperty && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'bg-green-100 text-green-800';
      case 'vacant': return 'bg-gray-200 text-gray-800';
      case 'former': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // ✅ ADD Tenant to Supabase
  const handleAddTenant = async () => {
    if (!newTenant.name || !newTenant.email || !newTenant.unit || !newTenant.rent) return;

    const tenantToInsert = {
      name: newTenant.name,
      email: newTenant.email,
      phone: newTenant.phone,
      unit: newTenant.unit,
      rent: parseInt(newTenant.rent),
      leaseBegin: newTenant.leaseBegin || null,
      ownedByLandlord: newTenant.ownedByLandlord,
      block: newTenant.block,
      status: 'current',
      avatar: newTenant.name.split(' ').map((n) => n[0]).join('').toUpperCase(),
    };

    const { data, error } = await supabase.from('tenants').insert(tenantToInsert).select().single();

    if (error) {
      console.error('Error adding tenant:', error);
      return;
    }

    setTenants((prev) => [...prev, data as Tenant]);
    resetModal();
  };

  // ✅ UPDATE Tenant in Supabase
  const handleUpdateTenant = async () => {
    if (!editingTenant) return;
    const updatedTenant = {
      name: newTenant.name,
      email: newTenant.email,
      phone: newTenant.phone,
      unit: newTenant.unit,
      rent: parseInt(newTenant.rent),
      leaseBegin: newTenant.leaseBegin || null,
      ownedByLandlord: newTenant.ownedByLandlord,
      block: newTenant.block,
      status: editingTenant.status,
      avatar: newTenant.name.split(' ').map((n) => n[0]).join('').toUpperCase(),
    };

    const { data, error } = await supabase
      .from('tenants')
      .update(updatedTenant)
      .eq('id', editingTenant.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating tenant:', error);
      return;
    }

    setTenants((prev) => prev.map((t) => (t.id === editingTenant.id ? (data as Tenant) : t)));
    resetModal();
  };

  // ✅ DELETE Tenant from Supabase
  const handleDeleteTenant = async (tenantId: number) => {
    if (!confirm('Are you sure you want to delete this tenant?')) return;
    const { error } = await supabase.from('tenants').delete().eq('id', tenantId);
    if (error) {
      console.error('Error deleting tenant:', error);
      return;
    }
    setTenants((prev) => prev.filter((t) => t.id !== tenantId));
    if (selectedTenant?.id === tenantId) setSelectedTenant(null);
  };

  const resetModal = () => {
    setNewTenant({
      name: '',
      email: '',
      phone: '',
      unit: '',
      rent: '',
      leaseBegin: '',
      ownedByLandlord: false,
      block: 'OLD',
    });
    setEditingTenant(null);
    setShowAddModal(false);
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setNewTenant({
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      unit: tenant.unit,
      rent: tenant.rent.toString(),
      leaseBegin: tenant.leaseBegin || '',
      ownedByLandlord: tenant.ownedByLandlord,
      block: tenant.block,
    });
    setShowAddModal(true);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result;
      if (!data) return;

      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const newTenants: any[] = jsonData.map((row) => ({
        name: row['name'] || row['Name'] || '',
        email: row['email'] || row['Email'] || '',
        phone: row['phone'] || row['Phone'] || '',
        unit: row['unit'] || row['Unit'] || '',
        rent: parseInt(row['rent'] || row['Rent'] || 0),
        leaseBegin: row['leaseBegin'] || row['LeaseBegin'] || null,
        ownedByLandlord: false,
        block: 'OLD',
        status: 'current',
        avatar: (row['name'] || row['Name'] || '?')
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase(),
      }));

      const { data: inserted, error } = await supabase.from('tenants').insert(newTenants).select();
      if (error) {
        console.error('Error importing tenants:', error);
        return;
      }
      setTenants((prev) => [...prev, ...(inserted as Tenant[])]);
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Tenant Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Tenant
          </button>
          <button
            onClick={handleImportClick}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Tenants
          </button>
          <input
            type="file"
            accept=".xlsx, .xls"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {loading && <p>Loading tenants...</p>}

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search tenants by name or unit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* PROPERTY FILTER */}
      <div className="mt-4 mb-6">
        <label htmlFor="property-select" className="block mb-2 font-semibold text-gray-700">
          Filter by Property:
        </label>
        <select
          id="property-select"
          value={selectedProperty}
          onChange={(e) => setSelectedProperty(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {properties.map((property) => (
            <option key={property} value={property}>
              {property}
            </option>
          ))}
        </select>
      </div>

      {/* TENANTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTenants.map((tenant) => (
          <div
            key={tenant.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedTenant(tenant)}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">{tenant.avatar}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{tenant.name}</h3>
                <p className="text-sm text-gray-600">Unit {tenant.unit}</p>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                  tenant.status
                )}`}
              >
                {tenant.status}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2" />
                {tenant.email}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                {tenant.phone}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                Lease begins:{' '}
                {tenant.leaseBegin ? new Date(tenant.leaseBegin).toLocaleDateString() : 'N/A'}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly Rent</span>
                <span className="text-lg font-semibold text-gray-900">
                  KSh {tenant.rent.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-4 flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditTenant(tenant);
                }}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTenant(tenant.id);
                }}
                className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center text-sm"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* TENANT DETAILS MODAL */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Tenant Details</h3>
              <button
                onClick={() => setSelectedTenant(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-medium">{selectedTenant.avatar}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedTenant.name}</h2>
                  <p className="text-gray-600">Unit {selectedTenant.unit}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {selectedTenant.email}
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {selectedTenant.phone}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Lease Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Monthly Rent:</span>
                      <span className="text-sm font-medium">
                        KSh {selectedTenant.rent.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Lease Begin:</span>
                      <span className="text-sm font-medium">
                        {selectedTenant.leaseBegin
                          ? new Date(selectedTenant.leaseBegin).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span
                        className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(
                          selectedTenant.status
                        )}`}
                      >
                        {selectedTenant.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Send Receipt
                </button>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  View Payment History
                </button>
                <button
                  onClick={() => {
                    setSelectedTenant(null);
                    handleEditTenant(selectedTenant);
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Edit Tenant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT TENANT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTenant ? 'Edit Tenant' : 'Add New Tenant'}
              </h3>
              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={newTenant.name}
                onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <input
                type="email"
                placeholder="Email"
                value={newTenant.email}
                onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <input
                type="text"
                placeholder="Phone"
                value={newTenant.phone}
                onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <input
                type="text"
                placeholder="Unit"
                value={newTenant.unit}
                onChange={(e) => setNewTenant({ ...newTenant, unit: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <input
                type="number"
                placeholder="Rent"
                value={newTenant.rent}
                onChange={(e) => setNewTenant({ ...newTenant, rent: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <input
                type="date"
                placeholder="Lease Begin"
                value={newTenant.leaseBegin}
                onChange={(e) => setNewTenant({ ...newTenant, leaseBegin: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <select
                value={newTenant.block}
                onChange={(e) =>
                  setNewTenant({ ...newTenant, block: e.target.value as 'OLD' | 'NEW' | 'NYERI' })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="OLD">El-Shaddai Apartments Old Block (Nakuru)</option>
                <option value="NEW">El-Shaddai Apartments NEW BLOCK (Nakuru)</option>
                <option value="NYERI">Outspan-Kamakwa Rd Nyeri</option>
              </select>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={resetModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={editingTenant ? handleUpdateTenant : handleAddTenant}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingTenant ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
