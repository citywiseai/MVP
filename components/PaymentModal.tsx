'use client';

import { useState } from 'react';
import { X, DollarSign, Calendar, FileText, Hash } from 'lucide-react';

interface PaymentModalProps {
  bid: {
    id: string;
    amount: number;
    amountPaid: number;
    paymentStatus: string;
    paymentNotes?: string;
    invoiceNumber?: string;
    vendor?: { name: string };
  };
  onClose: () => void;
  onSave: (paymentData: any) => Promise<void>;
}

export default function PaymentModal({ bid, onClose, onSave }: PaymentModalProps) {
  const [paymentStatus, setPaymentStatus] = useState(bid.paymentStatus || 'unpaid');
  const [amountPaid, setAmountPaid] = useState(bid.amountPaid?.toString() || '0');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [invoiceNumber, setInvoiceNumber] = useState(bid.invoiceNumber || '');
  const [paymentNotes, setPaymentNotes] = useState(bid.paymentNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remaining = bid.amount - parseFloat(amountPaid || '0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSave({
        paymentStatus,
        amountPaid: parseFloat(amountPaid),
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        invoiceNumber: invoiceNumber || null,
        paymentNotes: paymentNotes || null,
      });
      onClose();
    } catch (error) {
      console.error('Error saving payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-update status based on amount
  const handleAmountChange = (value: string) => {
    setAmountPaid(value);
    const paid = parseFloat(value) || 0;
    if (paid >= bid.amount) {
      setPaymentStatus('paid');
    } else if (paid > 0) {
      setPaymentStatus('partial');
    } else {
      setPaymentStatus('unpaid');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Update Payment</h2>
            <p className="text-sm text-gray-500">{bid.vendor?.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Bid Amount Display */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Bid Amount:</span>
              <span className="font-semibold text-gray-900">${bid.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-semibold text-green-600">${parseFloat(amountPaid || '0').toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mt-1 pt-1 border-t">
              <span className="text-gray-600">Remaining:</span>
              <span className={`font-semibold ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                ${Math.max(0, remaining).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status
            </label>
            <div className="flex gap-2">
              {['unpaid', 'partial', 'paid'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setPaymentStatus(status)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    paymentStatus === status
                      ? status === 'paid'
                        ? 'bg-green-100 border-green-300 text-green-700'
                        : status === 'partial'
                        ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
                        : 'bg-gray-100 border-gray-300 text-gray-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Paid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount Paid
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="number"
                step="0.01"
                value={amountPaid}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-black"
                placeholder="0.00"
              />
            </div>
            {/* Quick buttons */}
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleAmountChange((bid.amount * 0.5).toString())}
                className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => handleAmountChange(bid.amount.toString())}
                className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
              >
                Full Amount
              </button>
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-black"
              />
            </div>
          </div>

          {/* Invoice Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Number (optional)
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-black"
                placeholder="INV-001"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Notes (optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-black resize-none"
                rows={2}
                placeholder="Check #1234, paid via wire transfer, etc."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
