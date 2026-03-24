'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ScopeChangeConfirmationModal from './ScopeChangeConfirmationModal'

interface EditProjectFormProps {
  project: any
  onSubmit: (formData: FormData) => Promise<{ success?: boolean; error?: string; projectId?: string }>
}

const PROJECT_TYPE_OPTIONS = [
  { value: 'adu', label: 'ADU' },
  { value: 'addition', label: 'Addition' },
  { value: 'remodel', label: 'Remodel' },
  { value: 'new_build', label: 'New Build' },
  { value: 'pool', label: 'Pool' },
  { value: 'garage', label: 'Garage' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'outdoor_kitchen', label: 'Outdoor Kitchen' },
  { value: 'structural', label: 'Structural Changes' }
]

export default function EditProjectForm({ project, onSubmit }: EditProjectFormProps) {
  const router = useRouter()

  // Parse existing project types from description or projectType field
  const getInitialProjectTypes = () => {
    const types: string[] = []
    const description = project.description?.toLowerCase() || ''
    const projectType = project.projectType?.toLowerCase() || ''

    PROJECT_TYPE_OPTIONS.forEach(option => {
      if (description.includes(option.value.replace('_', ' ')) ||
          projectType.includes(option.value.replace('_', ' '))) {
        types.push(option.value)
      }
    })

    return types
  }

  const initialTypes = getInitialProjectTypes()
  const [selectedTypes, setSelectedTypes] = useState<string[]>(initialTypes)
  const [originalTypes] = useState<string[]>(initialTypes) // Track original for comparison
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [removedItems, setRemovedItems] = useState<string[]>([])
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)
  const [impactData, setImpactData] = useState<{
    totalTasks: number
    estimatedRequirements: number
    estimatedCostDecrease: number
  } | null>(null)
  const [isCalculatingImpact, setIsCalculatingImpact] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleType = (value: string) => {
    setSelectedTypes(prev =>
      prev.includes(value)
        ? prev.filter(t => t !== value)
        : [...prev, value]
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null) // Clear any previous errors

    const formData = new FormData(e.currentTarget)

    // Add selected types as comma-separated string
    formData.set('projectTypes', selectedTypes.join(','))

    // Detect removed scope items by comparing original vs current
    const removed = originalTypes.filter(type => !selectedTypes.includes(type))

    // If items were removed, calculate impact and show confirmation modal
    if (removed.length > 0) {
      setRemovedItems(removed)
      setPendingFormData(formData)
      setIsCalculatingImpact(true)

      try {
        // Call API to get real impact counts
        const response = await fetch(`/api/projects/${project.id}/scope-impact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ removedScopes: removed })
        })

        if (response.ok) {
          const data = await response.json()
          setImpactData({
            totalTasks: data.totalTasks,
            estimatedRequirements: data.estimatedRequirements,
            estimatedCostDecrease: data.estimatedCostDecrease
          })
        } else {
          // Fallback to placeholder if API fails
          setImpactData({
            totalTasks: removed.length * 2,
            estimatedRequirements: removed.length * 3,
            estimatedCostDecrease: removed.length * 15000
          })
        }
      } catch (error) {
        console.error('Error calculating impact:', error)
        // Fallback to placeholder
        setImpactData({
          totalTasks: removed.length * 2,
          estimatedRequirements: removed.length * 3,
          estimatedCostDecrease: removed.length * 15000
        })
      } finally {
        setIsCalculatingImpact(false)
        setShowConfirmModal(true)
      }
    } else {
      // No removals, proceed with save directly
      await handleFormSubmit(formData)
    }
  }

  const handleFormSubmit = async (formData: FormData) => {
    setIsSaving(true)
    setError(null)

    try {
      const result = await onSubmit(formData)

      if (result.error) {
        // Show error message
        setError(result.error)
        setIsSaving(false)
      } else if (result.success) {
        // Redirect to project detail page
        router.push(`/projects/${result.projectId}`)
      }
    } catch (err) {
      console.error('Error saving project:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsSaving(false)
    }
  }

  const handleConfirmChanges = async () => {
    if (pendingFormData) {
      setShowConfirmModal(false)
      await handleFormSubmit(pendingFormData)
    }
    setPendingFormData(null)
    setRemovedItems([])
  }

  const handleCancelChanges = () => {
    setShowConfirmModal(false)
    setPendingFormData(null)
    setRemovedItems([])
  }

  return (
    <>
      <ScopeChangeConfirmationModal
        isOpen={showConfirmModal}
        removedItems={removedItems}
        impactData={impactData}
        onCancel={handleCancelChanges}
        onConfirm={handleConfirmChanges}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <input type="hidden" name="projectId" value={project.id} />

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <input
              type="text"
              name="address"
              defaultValue={project.fullAddress || ''}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123 Main St, Phoenix, AZ 85001"
            />
            <p className="text-xs text-gray-500 mt-1">
              Correct typos - changing to a different property will require a new project
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Type *
            </label>
            <select
              name="propertyType"
              defaultValue={project.propertyType || ''}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select property type...</option>
              <option value="Single Family">Single Family</option>
              <option value="Multi Family">Multi Family</option>
              <option value="Commercial">Commercial</option>
              <option value="Industrial">Industrial</option>
              <option value="Mixed Use">Mixed Use</option>
            </select>
          </div>
        </div>
      </div>

      {/* Read-Only Fields */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Property Details</h3>
        <p className="text-sm text-gray-500">Auto-populated from property data</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* APN - Read Only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400" />
              Parcel ID (APN)
            </label>
            <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-600">
              {project.parcel?.apn || 'Not available'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Cannot change</p>
          </div>

          {/* Jurisdiction - Read Only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400" />
              Jurisdiction
            </label>
            <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-600">
              {project.jurisdiction || 'Not specified'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Pulled from address</p>
          </div>

          {/* Lot Size - Read Only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400" />
              Lot Size (Sq Ft)
            </label>
            <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-600">
              {project.lotSizeSqFt ? project.lotSizeSqFt.toLocaleString() : 'Not available'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Pulled from Regrid</p>
          </div>
        </div>
      </div>

      {/* Project Scope - Multi-Select Buttons */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Project Scope *</h3>
        <p className="text-sm text-gray-500">Select all that apply to your project</p>

        <div className="flex flex-wrap gap-3">
          {PROJECT_TYPE_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleType(option.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedTypes.includes(option.value)
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {selectedTypes.length === 0 && (
          <p className="text-sm text-red-600">Please select at least one project type</p>
        )}
      </div>

      {/* Building Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Building Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Building Footprint (Sq Ft)
            </label>
            <input
              type="number"
              name="squareFootage"
              defaultValue={project.buildingFootprintSqFt || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2500"
            />
            <p className="text-xs text-gray-500 mt-1">Ground floor footprint area</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Modified (Sq Ft)
            </label>
            <input
              type="number"
              name="totalSfModified"
              defaultValue={project.totalSfModified || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1500"
            />
            <p className="text-xs text-gray-500 mt-1">Total area being modified</p>
          </div>
        </div>
      </div>

      {/* Property Characteristics */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Property Characteristics</h3>

        <div className="flex flex-col sm:flex-row gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="hillsideGrade"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span className="ml-2 text-sm text-gray-700">Hillside Property (&gt;10% grade)</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="onSeptic"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span className="ml-2 text-sm text-gray-700">On Septic System</span>
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Unable to save changes</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-6 border-t">
        <a
          href={`/projects/${project.id}`}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={selectedTypes.length === 0 || isCalculatingImpact || isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isCalculatingImpact ? 'Calculating Impact...' : isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      </form>
    </>
  )
}
