'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Star, Plus } from 'lucide-react';
import VendorModal from './VendorModal';

interface Vendor {
  id: string;
  name: string;
  company?: string;
  trade: string;
  isPreferred: boolean;
  _count?: {
    tasks: number;
    bids: number;
  };
}

interface VendorSelectorProps {
  value?: string | null; // Selected vendor ID
  onChange: (vendorId: string | null) => void;
  trade?: string; // Optional filter by trade
  allowCreate?: boolean; // Show "Add New Vendor" option
  compact?: boolean; // Smaller version for inline use
  placeholder?: string; // Custom placeholder text
}

export default function VendorSelector({
  value,
  onChange,
  trade,
  allowCreate = true,
  compact = false,
  placeholder,
}: VendorSelectorProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Fetch vendors
  useEffect(() => {
    fetchVendors();
  }, [trade]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const url = trade
        ? `/api/vendors?trade=${encodeURIComponent(trade)}`
        : '/api/vendors';
      const response = await fetch(url);
      const data = await response.json();
      setVendors(data.vendors || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedVendor = vendors.find((v) => v.id === value);

  const filteredVendors = vendors.filter((vendor) =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVendorCreated = (vendor: Vendor) => {
    fetchVendors();
    onChange(vendor.id);
    setShowModal(false);
  };

  return (
    <>
      <div className="relative">
        {/* Selected Display / Dropdown Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`${compact ? 'w-48' : 'w-full'} ${compact ? 'px-2 py-1' : 'px-3 py-2'} ${compact ? 'text-xs' : 'text-sm'} border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedVendor ? (
              <>
                {selectedVendor.isPreferred && (
                  <Star className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-yellow-500 fill-yellow-500 flex-shrink-0`} />
                )}
                <span className="truncate text-black">
                  {selectedVendor.name}
                  {!compact && selectedVendor.company && (
                    <span className="text-gray-500 ml-1">
                      ({selectedVendor.company})
                    </span>
                  )}
                </span>
              </>
            ) : (
              <span className="text-gray-400">
                {loading ? 'Loading...' : (placeholder || 'Select vendor...')}
              </span>
            )}
          </div>
          <ChevronDown
            className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-gray-400 flex-shrink-0 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Panel */}
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col">
              {/* Search */}
              <div className="p-2 border-b">
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Vendor List */}
              <div className="overflow-y-auto flex-1">
                {loading ? (
                  <div className="p-3 text-center text-gray-500 text-sm">
                    Loading vendors...
                  </div>
                ) : filteredVendors.length === 0 ? (
                  <div className="p-3 text-center text-gray-500 text-sm">
                    No vendors found
                  </div>
                ) : (
                  <>
                    {/* Clear Selection */}
                    {value && (
                      <button
                        type="button"
                        onClick={() => {
                          onChange(null);
                          setIsOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-gray-600 border-b"
                      >
                        <span className="italic">Clear selection</span>
                      </button>
                    )}

                    {/* Vendor Options */}
                    {filteredVendors.map((vendor) => (
                      <button
                        key={vendor.id}
                        type="button"
                        onClick={() => {
                          onChange(vendor.id);
                          setIsOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center justify-between gap-2 ${
                          value === vendor.id ? 'bg-blue-50 text-blue-700' : 'text-black'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {vendor.isPreferred && (
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                          )}
                          <div className="truncate">
                            <div className="font-medium truncate">{vendor.name}</div>
                            {vendor.company && (
                              <div className="text-xs text-gray-500 truncate">
                                {vendor.company}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 flex-shrink-0">
                          {vendor.trade}
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>

              {/* Add New Vendor */}
              {allowCreate && (
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(true);
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 text-blue-600 font-medium border-t flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New Vendor
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Vendor Modal */}
      <VendorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleVendorCreated}
        vendor={null}
      />
    </>
  );
}
