'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface EditProjectModalProps {
  project: any
  isOpen: boolean
  onClose: () => void
  onSave: (updatedProject: Partial<any>) => void
}

export default function EditProjectModal({
  project,
  isOpen,
  onClose,
  onSave,
}: EditProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    priority: 'medium',
    status: 'active',
    dueDate: '',
    clientName: '',
    projectNotes: '',
  })

  // Tags state
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  // Predefined common tags
  const suggestedTags = ['ADU', 'Pool', 'Remodel', 'Addition', 'New Build', 'Garage', 'Kitchen', 'Bathroom']

  // Add tag function
  const addTag = (tag: string) => {
    const normalizedTag = tag.trim().toLowerCase()
    if (normalizedTag && !tags.includes(normalizedTag)) {
      setTags([...tags, normalizedTag])
    }
    setTagInput('')
  }

  // Remove tag function
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  // Update form when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        priority: project.priority || 'medium',
        status: project.status || 'active',
        dueDate: project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : '',
        clientName: project.clientName || '',
        projectNotes: project.projectNotes || '',
      })
      setTags(project.tags || [])
    }
  }, [project])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updates: any = {
      name: formData.name,
      priority: formData.priority,
      status: formData.status,
      clientName: formData.clientName || null,
      projectNotes: formData.projectNotes || null,
      dueDate: formData.dueDate || null,
      tags: tags,
    }

    onSave(updates)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#1e3a5f] to-[#2c4f6f] text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold">Edit Project</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88] focus:border-transparent"
              placeholder="My Project"
            />
          </div>

          {/* Priority and Status Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88] focus:border-transparent"
              >
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88] focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Due Date and Client Name Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88] focus:border-transparent"
              />
            </div>

            {/* Client Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name
              </label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88] focus:border-transparent"
                placeholder="John Doe"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>

            {/* Current tags */}
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Tag input */}
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag(tagInput)
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => addTag(tagInput)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
              >
                Add
              </button>
            </div>

            {/* Suggested tags */}
            <div className="flex flex-wrap gap-1">
              {suggestedTags.filter(t => !tags.includes(t.toLowerCase())).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.projectNotes}
              onChange={(e) => setFormData({ ...formData, projectNotes: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88] focus:border-transparent resize-none"
              placeholder="Project notes and details..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#9caf88] to-[#8a9d78] hover:from-[#8a9d78] hover:to-[#9caf88] text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
