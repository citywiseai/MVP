'use client';

import { useMemo, useState } from 'react';
import { DollarSign, ChevronDown, ChevronUp, Users, Layers, Briefcase, AlertTriangle } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  company?: string;
  trade?: string;
}

interface Bid {
  id: string;
  amount: number;
  status: string;
  vendor?: Vendor;
  paymentStatus?: string;
  amountPaid?: number;
}

interface Task {
  id: string;
  title: string;
  estimatedCost?: number | null;
  actualCost?: number | null;
  paymentStatus?: string;
  phase?: {
    id: string;
    name: string;
    order?: number;
  };
  vendor?: Vendor;
  bids?: Bid[];
}

interface Phase {
  id: string;
  name: string;
  order: number;
}

interface CostSummaryProps {
  tasks: Task[];
  phases?: Phase[];
  budget?: number;
}

type ViewMode = 'phase' | 'vendor' | 'trade' | 'status';

export default function CostSummary({ tasks, phases, budget }: CostSummaryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('phase');
  const [isExpanded, setIsExpanded] = useState(true);

  const costData = useMemo(() => {
    let totalAccepted = 0;
    let totalPending = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;

    const byPhase: Record<string, { name: string; order: number; amount: number; count: number }> = {};
    const byVendor: Record<string, { name: string; company?: string; amount: number; count: number }> = {};
    const byTrade: Record<string, { name: string; amount: number; count: number }> = {};
    const byStatus: Record<string, { name: string; amount: number; count: number }> = {
      accepted: { name: 'Accepted Bids', amount: 0, count: 0 },
      pending: { name: 'Pending Bids', amount: 0, count: 0 },
      paid: { name: 'Paid', amount: 0, count: 0 },
      unpaid: { name: 'Unpaid', amount: 0, count: 0 },
    };

    // Initialize phases
    phases?.forEach(phase => {
      byPhase[phase.id] = { name: phase.name, order: phase.order, amount: 0, count: 0 };
    });

    tasks.forEach(task => {
      // Get accepted bid amount or estimated cost
      const acceptedBid = task.bids?.find(b => b.status === 'accepted');
      const pendingBids = task.bids?.filter(b => b.status === 'received') || [];
      const taskCost = acceptedBid?.amount || task.estimatedCost || 0;

      // Total calculations
      if (acceptedBid) {
        totalAccepted += acceptedBid.amount;
        byStatus.accepted.amount += acceptedBid.amount;
        byStatus.accepted.count += 1;

        // Payment status - use bid's payment info
        const paid = acceptedBid.amountPaid || 0;
        const remaining = acceptedBid.amount - paid;

        if (paid > 0) {
          totalPaid += paid;
        }
        if (remaining > 0) {
          totalUnpaid += remaining;
        }

        if (acceptedBid.paymentStatus === 'paid') {
          byStatus.paid.amount += acceptedBid.amount;
          byStatus.paid.count += 1;
        } else if (acceptedBid.paymentStatus === 'partial') {
          byStatus.unpaid.amount += remaining;
          byStatus.unpaid.count += 1;
        } else {
          byStatus.unpaid.amount += acceptedBid.amount;
          byStatus.unpaid.count += 1;
        }
      }

      // Pending bids
      pendingBids.forEach(bid => {
        totalPending += bid.amount;
        byStatus.pending.amount += bid.amount;
        byStatus.pending.count += 1;
      });

      // By Phase
      if (task.phase?.id && byPhase[task.phase.id]) {
        byPhase[task.phase.id].amount += taskCost;
        byPhase[task.phase.id].count += 1;
      }

      // By Vendor (from accepted bid or assigned vendor)
      const vendor = acceptedBid?.vendor || task.vendor;
      if (vendor && taskCost > 0) {
        if (!byVendor[vendor.id]) {
          byVendor[vendor.id] = { name: vendor.name, company: vendor.company, amount: 0, count: 0 };
        }
        byVendor[vendor.id].amount += taskCost;
        byVendor[vendor.id].count += 1;

        // By Trade
        const trade = vendor.trade || 'Other';
        if (!byTrade[trade]) {
          byTrade[trade] = { name: trade, amount: 0, count: 0 };
        }
        byTrade[trade].amount += taskCost;
        byTrade[trade].count += 1;
      }
    });

    return {
      totalAccepted,
      totalPending,
      totalPaid,
      totalUnpaid,
      byPhase: Object.values(byPhase).filter(p => p.amount > 0).sort((a, b) => a.order - b.order),
      byVendor: Object.values(byVendor).sort((a, b) => b.amount - a.amount),
      byTrade: Object.values(byTrade).sort((a, b) => b.amount - a.amount),
      byStatus: Object.values(byStatus).filter(s => s.amount > 0 || s.count > 0),
    };
  }, [tasks, phases]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getBreakdownData = () => {
    switch (viewMode) {
      case 'phase': return costData.byPhase;
      case 'vendor': return costData.byVendor;
      case 'trade': return costData.byTrade;
      case 'status': return costData.byStatus;
      default: return costData.byPhase;
    }
  };

  const isOverBudget = budget && costData.totalAccepted > budget;
  const budgetRemaining = budget ? budget - costData.totalAccepted : null;

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Cost Summary</h3>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>

      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Total Card */}
          <div className={`rounded-lg p-4 mb-4 ${isOverBudget ? 'bg-red-50 border border-red-200' : 'bg-green-50'}`}>
            <div className="flex justify-between items-start">
              <div>
                <div className={`text-sm ${isOverBudget ? 'text-red-600' : 'text-green-600'} mb-1`}>
                  Total Estimated Cost
                </div>
                <div className={`text-3xl font-bold ${isOverBudget ? 'text-red-700' : 'text-green-700'}`}>
                  {formatCurrency(costData.totalAccepted)}
                </div>
              </div>
              {isOverBudget && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-medium">Over Budget</span>
                </div>
              )}
            </div>

            {/* Budget info */}
            {budget && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Budget:</span>
                  <span className="font-medium">{formatCurrency(budget)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Remaining:</span>
                  <span className={`font-medium ${budgetRemaining && budgetRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(budgetRemaining || 0)}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min((costData.totalAccepted / budget) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Payment tracking */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-green-200">
              <div className="text-sm">
                <span className="text-gray-500">Paid: </span>
                <span className="text-green-600 font-medium">{formatCurrency(costData.totalPaid)}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Unpaid: </span>
                <span className="text-orange-600 font-medium">{formatCurrency(costData.totalUnpaid)}</span>
              </div>
            </div>
            {costData.totalPending > 0 && (
              <div className="mt-2 text-sm">
                <span className="text-gray-500">Pending Bids: </span>
                <span className="text-yellow-600 font-medium">{formatCurrency(costData.totalPending)}</span>
              </div>
            )}
          </div>

          {/* View Mode Tabs */}
          <div className="flex gap-1 mb-3 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('phase')}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                viewMode === 'phase' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Layers className="w-3 h-3" />
              Phase
            </button>
            <button
              onClick={() => setViewMode('vendor')}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                viewMode === 'vendor' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-3 h-3" />
              Vendor
            </button>
            <button
              onClick={() => setViewMode('trade')}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                viewMode === 'trade' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Briefcase className="w-3 h-3" />
              Trade
            </button>
          </div>

          {/* Breakdown List */}
          <div className="space-y-2">
            {getBreakdownData().map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  {'company' in item && item.company && (
                    <div className="text-xs text-gray-500">{item.company}</div>
                  )}
                  <div className="text-xs text-gray-400">{item.count} item{item.count !== 1 ? 's' : ''}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(item.amount)}
                  </div>
                  {costData.totalAccepted > 0 && (
                    <div className="text-xs text-gray-400">
                      {Math.round((item.amount / costData.totalAccepted) * 100)}%
                    </div>
                  )}
                </div>
              </div>
            ))}

            {getBreakdownData().length === 0 && (
              <div className="text-center py-6 text-gray-400 text-sm">
                No accepted bids yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
