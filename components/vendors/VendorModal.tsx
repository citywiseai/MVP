'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Vendor {
  id?: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  trade: string;
  licenseNumber?: string;
  insuranceExpiry?: string;
  rating?: number;
  notes?: string;
  isPreferred?: boolean;
}

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vendor: Vendor) => void;
  vendor?: Vendor | null; // null for create, vendor object for edit
}

const TRADES = [
  'Surveyor',
  'Structural Engineer',
  'Civil Engineer',
  'Architect',
  'Electrical Engineer',
  'Mechanical Engineer',
  'Plumbing Engineer',
  'General Contractor',
  'Electrician',
  'Plumber',
  'HVAC Contractor',
  'Roofer',
  'Concrete/Foundation',
  'Framing',
  'Drywall',
  'Painter',
  'Flooring',
  'Landscaper',
  'Pool Contractor',
  'Solar Installer',
  'Plan Reviewer',
  'Permit Expediter',
  'Other',
];

export default function VendorModal({
  isOpen,
  onClose,
  onSave,
  vendor,
}: VendorModalProps) {
  const [formData, setFormData] = useState<Vendor>({
    name: '',
    company: '',
    email: '',
    phone: '',
    trade: '',
    licenseNumber: '',
    insuranceExpiry: '',
    rating: undefined,
    notes: '',
    isPreferred: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || '',
        company: vendor.company || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        trade: vendor.trade || '',
        licenseNumber: vendor.licenseNumber || '',
        insuranceExpiry: vendor.insuranceExpiry
          ? new Date(vendor.insuranceExpiry).toISOString().split('T')[0]
          : '',
        rating: vendor.rating,
        notes: vendor.notes || '',
        isPreferred: vendor.isPreferred || false,
      });
    } else {
      // Reset form for create
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        trade: '',
        licenseNumber: '',
        insuranceExpiry: '',
        rating: undefined,
        notes: '',
        isPreferred: false,
      });
    }
    setError(null);
  }, [vendor, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.name || !formData.trade) {
      setError('Name and Trade are required');
      return;
    }

    console.log('📤 Submitting vendor form:', {
      name: formData.name,
      trade: formData.trade,
      company: formData.company,
    });

    setSaving(true);

    try {
      const url = vendor ? `/api/vendors/${vendor.id}` : '/api/vendors';
      const method = vendor ? 'PUT' : 'POST';

      console.log(`🌐 Sending ${method} request to ${url}`);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error('❌ API Error:', data);
        const errorMsg = data.details
          ? `${data.error}: ${data.details}`
          : data.error || 'Failed to save vendor';
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('✅ Vendor saved:', data.vendor);
      onSave(data.vendor);
      onClose();
    } catch (err) {
      console.error('❌ Error in handleSubmit:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save vendor';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {vendor ? 'Edit Vendor' : 'Add New Vendor'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                required
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
            </div>

            {/* Trade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trade <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.trade}
                onChange={(e) =>
                  setFormData({ ...formData, trade: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                required
              >
                <option value="">Select trade...</option>
                {TRADES.map((trade) => (
                  <option key={trade} value={trade}>
                    {trade}
                  </option>
                ))}
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
            </div>

            {/* License Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Number
              </label>
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={(e) =>
                  setFormData({ ...formData, licenseNumber: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
            </div>

            {/* Insurance Expiry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Insurance Expiry
              </label>
              <input
                type="date"
                value={formData.insuranceExpiry}
                onChange={(e) =>
                  setFormData({ ...formData, insuranceExpiry: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={formData.rating || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rating: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            />
          </div>

          {/* Preferred Vendor */}
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="isPreferred"
              checked={formData.isPreferred}
              onChange={(e) =>
                setFormData({ ...formData, isPreferred: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="isPreferred"
              className="ml-2 text-sm font-medium text-gray-700"
            >
              Preferred Vendor
            </label>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? 'Saving...' : vendor ? 'Update Vendor' : 'Create Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
