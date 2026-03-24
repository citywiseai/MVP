'use client'

import { AlertTriangle, X, CheckCircle, FileText, DollarSign } from 'lucide-react'

interface ScopeChangeConfirmationModalProps {
  isOpen: boolean
  removedItems: string[]
  impactData: {
    totalTasks: number
    estimatedRequirements: number
    estimatedCostDecrease: number
  } | null
  onCancel: () => void
  onConfirm: () => void
}

const PROJECT_TYPE_LABELS: Record<string, string> = {
  'adu': 'ADU',
  'addition': 'Addition',
  'remodel': 'Remodel',
  'new_build': 'New Build',
  'pool': 'Pool',
  'garage': 'Garage',
  'kitchen': 'Kitchen',
  'bathroom': 'Bathroom',
  'outdoor_kitchen': 'Outdoor Kitchen',
  'structural': 'Structural Changes'
}

export default function ScopeChangeConfirmationModal({
  isOpen,
  removedItems,
  impactData,
  onCancel,
  onConfirm
}: ScopeChangeConfirmationModalProps) {
  if (!isOpen) return null

  // Use real impact data if available, otherwise fallback to placeholders
  const estimatedRequirementsRemoved = impactData?.estimatedRequirements ?? removedItems.length * 3
  const estimatedTasksRemoved = impactData?.totalTasks ?? removedItems.length * 2
  const estimatedCostDecrease = impactData?.estimatedCostDecrease ?? removedItems.length * 15000

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Confirm Scope Changes</h2>
                <p className="text-sm text-amber-700 mt-0.5">Review the impact before saving</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6">
          {/* Removed Items */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              You're removing the following from your project:
            </h3>
            <div className="space-y-2">
              {removedItems.map(item => (
                <div
                  key={item}
                  className="flex items-center gap-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <X className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-sm font-medium text-red-900">
                    {PROJECT_TYPE_LABELS[item] || item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Impact Preview */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              This will affect:
            </h3>
            <div className="space-y-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3 text-sm">
                <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-gray-700">
                  <span className="font-semibold text-gray-900">{estimatedRequirementsRemoved} requirements</span> will be removed
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-gray-700">
                  <span className="font-semibold text-gray-900">{estimatedTasksRemoved} tasks</span> will be removed
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <DollarSign className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-gray-700">
                  Estimated cost will decrease by{' '}
                  <span className="font-semibold text-gray-900">
                    ${estimatedCostDecrease.toLocaleString()}
                  </span>
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">
              {impactData
                ? 'These numbers are based on your current project data'
                : 'Note: These are estimated impacts based on typical requirements'}
            </p>
          </div>

          {/* Warning Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-xs text-amber-800">
              <span className="font-semibold">Important:</span> Removed requirements and tasks cannot be automatically restored.
              You'll need to add them back manually if you change your mind.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between gap-4 border-t">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-gray-700 font-medium hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            Confirm Changes
          </button>
        </div>
      </div>
    </div>
  )
}
