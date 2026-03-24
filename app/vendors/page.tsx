'use client';

import { useState, useEffect } from 'react';
import {
  Users, Search, Plus, Star, DollarSign,
  TrendingUp, Phone, Mail, Building2,
  ChevronRight, X
} from 'lucide-react';
import Link from 'next/link';

interface VendorStats {
  totalBids: number;
  acceptedBids: number;
  totalAcceptedValue: number;
  totalPaid: number;
  totalOutstanding: number;
  winRate: number;
  projectCount: number;
}

interface Vendor {
  id: string;
  name: string;
  company?: string;
  trade?: string;
  email?: string;
  phone?: string;
  rating?: number;
  notes?: string;
  stats: VendorStats;
  bids: any[];
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tradeFilter, setTradeFilter] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const trades = [...new Set(vendors.map(v => v.trade).filter(Boolean))];

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors?includeStats=true');
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = !searchTerm ||
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTrade = !tradeFilter || v.trade === tradeFilter;
    return matchesSearch && matchesTrade;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalVendors = vendors.length;
  const totalAwarded = vendors.reduce((sum, v) => sum + (v.stats?.totalAcceptedValue || 0), 0);
  const totalOutstanding = vendors.reduce((sum, v) => sum + (v.stats?.totalOutstanding || 0), 0);
  const avgWinRate = vendors.length > 0
    ? Math.round(vendors.reduce((sum, v) => sum + (v.stats?.winRate || 0), 0) / vendors.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-7 h-7 text-blue-600" />
                Vendor Directory
              </h1>
              <p className="text-gray-500 mt-1">Manage vendors, view bid history, and track performance</p>
            </div>
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalVendors}</div>
                <div className="text-sm text-gray-500">Total Vendors</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalAwarded)}</div>
                <div className="text-sm text-gray-500">Total Awarded</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalOutstanding)}</div>
                <div className="text-sm text-gray-500">Outstanding</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{avgWinRate}%</div>
                <div className="text-sm text-gray-500">Avg Win Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vendors..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-black placeholder:text-gray-400"
              />
            </div>
            <select
              value={tradeFilter}
              onChange={(e) => setTradeFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg text-black bg-white"
            >
              <option value="">All Trades</option>
              {trades.map(trade => (
                <option key={trade} value={trade}>{trade}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Vendor List */}
        <div className="bg-white rounded-lg border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading vendors...</div>
          ) : filteredVendors.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
              <p className="text-gray-500">Add vendors from the Projects dashboard</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Vendor</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Trade</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Rating</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Bids</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Win Rate</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Awarded</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Outstanding</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map(vendor => (
                  <tr
                    key={vendor.id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedVendor(vendor)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {vendor.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{vendor.name}</div>
                          {vendor.company && (
                            <div className="text-sm text-gray-500">{vendor.company}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {vendor.trade && (
                        <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                          {vendor.trade}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {vendor.rating ? (
                        <div className="inline-flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="font-medium text-gray-900">{vendor.rating}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center text-gray-900">
                      <span>{vendor.stats?.acceptedBids || 0}</span>
                      <span className="text-gray-400">/{vendor.stats?.totalBids || 0}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${vendor.stats?.winRate || 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{vendor.stats?.winRate || 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-gray-900">
                      {formatCurrency(vendor.stats?.totalAcceptedValue || 0)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={(vendor.stats?.totalOutstanding || 0) > 0 ? 'text-orange-600' : 'text-green-600'}>
                        {formatCurrency(vendor.stats?.totalOutstanding || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Vendor Detail Panel */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedVendor(null)} />
          <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">
                    {selectedVendor.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{selectedVendor.name}</h2>
                  {selectedVendor.company && (
                    <p className="text-sm text-gray-500">{selectedVendor.company}</p>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedVendor(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Contact Info */}
              <div className="space-y-2">
                {selectedVendor.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${selectedVendor.email}`} className="text-blue-500 hover:underline">
                      {selectedVendor.email}
                    </a>
                  </div>
                )}
                {selectedVendor.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${selectedVendor.phone}`} className="text-blue-500 hover:underline">
                      {selectedVendor.phone}
                    </a>
                  </div>
                )}
                {selectedVendor.trade && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{selectedVendor.trade}</span>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-900">{selectedVendor.stats?.acceptedBids || 0}</div>
                  <div className="text-xs text-gray-500">Accepted Bids</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-900">{selectedVendor.stats?.winRate || 0}%</div>
                  <div className="text-xs text-gray-500">Win Rate</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-700">{formatCurrency(selectedVendor.stats?.totalAcceptedValue || 0)}</div>
                  <div className="text-xs text-green-600">Total Awarded</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-orange-700">{formatCurrency(selectedVendor.stats?.totalOutstanding || 0)}</div>
                  <div className="text-xs text-orange-600">Outstanding</div>
                </div>
              </div>

              {/* Bid History */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Bid History</h3>
                <div className="space-y-2">
                  {(!selectedVendor.bids || selectedVendor.bids.length === 0) ? (
                    <p className="text-sm text-gray-500">No bids yet</p>
                  ) : (
                    selectedVendor.bids.map((bid: any) => (
                      <div key={bid.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">{formatCurrency(bid.amount)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            bid.status === 'accepted'
                              ? 'bg-green-100 text-green-700'
                              : bid.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {bid.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">{bid.task?.title || 'Unknown Task'}</div>
                        <div className="text-xs text-gray-400">{bid.task?.project?.name || 'Unknown Project'}</div>
                        {bid.status === 'accepted' && bid.paymentStatus && (
                          <div className="mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              bid.paymentStatus === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : bid.paymentStatus === 'partial'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {bid.paymentStatus === 'paid' ? '✓ Paid' :
                               bid.paymentStatus === 'partial' ? `Partial (${formatCurrency(bid.amountPaid || 0)})` :
                               'Unpaid'}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedVendor.notes && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selectedVendor.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
