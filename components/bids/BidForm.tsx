'use client';

import { useState } from 'react';
import { X, DollarSign, Calendar, FileText, Link } from 'lucide-react';
import VendorSelector from '@/components/vendors/VendorSelector';

interface BidFormProps {
  taskId: string;
  onSubmit: (bid: any) => void;
  onCancel: () => void;
  existingVendorId?: string | null;
}

export default function BidForm({
  taskId,
  onSubmit,
  onCancel,
  existingVendorId,
}: BidFormProps) {
  const [vendorId, setVendorId] = useState<string | null>(
    existingVendorId || null
  );
  const [amount, setAmount] = useState('');
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!vendorId) {
      setError('Please select a vendor');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📤 Submitting bid:', {
        taskId,
        vendorId,
        amount: parseFloat(amount),
      });

      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          vendorId,
          amount: parseFloat(amount),
          estimatedCompletionDate: estimatedCompletionDate || null,
          notes: notes || null,
          attachmentUrl: attachmentUrl || null,
          attachmentName: attachmentName || null,
        }),
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error('❌ API Error:', data);
        throw new Error(data.error || 'Failed to create bid');
      }

      const data = await response.json();
      console.log('✅ Bid created:', data.bid);
      onSubmit(data.bid);
    } catch (err: any) {
      console.error('❌ Error submitting bid:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 mt-2 border border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium text-gray-900">Add Bid</h4>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {/* Vendor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vendor <span className="text-red-500">*</span>
          </label>
          <VendorSelector
            value={vendorId}
            onChange={setVendorId}
            placeholder="Select vendor"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bid Amount <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Estimated Completion */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Est. Completion Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={estimatedCompletionDate}
              onChange={(e) => setEstimatedCompletionDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black resize-none"
              rows={2}
              placeholder="Additional details about this bid..."
            />
          </div>
        </div>

        {/* Attachment URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attachment URL (optional)
          </label>
          <div className="relative">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="url"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              placeholder="https://drive.google.com/... or Dropbox link"
            />
          </div>
          <input
            type="text"
            value={attachmentName}
            onChange={(e) => setAttachmentName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black mt-2"
            placeholder="Document name (e.g., 'Electrical Quote v2')"
          />
          <p className="text-xs text-gray-500 mt-1">
            Link to quote, proposal, or scope document in Google Drive, Dropbox, etc.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save Bid'}
        </button>
      </div>
    </form>
  );
}
