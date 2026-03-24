'use client'

import { useState, useEffect } from 'react'
import { Clock, Plus, Minus, Edit3, FileText } from 'lucide-react'
import { formatScopeItem, formatFieldName } from '@/lib/audit-logger'

interface AuditLog {
  id: string
  action: string
  scopeItem: string | null
  details: any
  requirementsAffected: number
  tasksAffected: number
  previousValue: string | null
  newValue: string | null
  createdAt: string
  createdBy: string | null
}

interface ProjectAuditHistoryProps {
  projectId: string
}

export default function ProjectAuditHistory({ projectId }: ProjectAuditHistoryProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    async function fetchAuditLogs() {
      try {
        const response = await fetch(`/api/projects/${projectId}/audit-logs`)
        if (response.ok) {
          const data = await response.json()
          setAuditLogs(data.auditLogs)
        }
      } catch (error) {
        console.error('Failed to fetch audit logs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAuditLogs()
  }, [projectId])

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'project_created':
        return <FileText className="w-4 h-4" />
      case 'scope_added':
        return <Plus className="w-4 h-4" />
      case 'scope_removed':
        return <Minus className="w-4 h-4" />
      case 'field_updated':
        return <Edit3 className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'project_created':
        return 'bg-blue-100 text-blue-600'
      case 'scope_added':
        return 'bg-green-100 text-green-600'
      case 'scope_removed':
        return 'bg-red-100 text-red-600'
      case 'field_updated':
        return 'bg-amber-100 text-amber-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const formatLogMessage = (log: AuditLog) => {
    switch (log.action) {
      case 'project_created':
        return (
          <span>
            Project created via <span className="font-semibold">{log.details?.source || 'manual'}</span>
          </span>
        )
      case 'scope_added':
        return (
          <span>
            <span className="font-semibold">{formatScopeItem(log.scopeItem || '')}</span> added to project scope
          </span>
        )
      case 'scope_removed':
        return (
          <span>
            <span className="font-semibold">{formatScopeItem(log.scopeItem || '')}</span> removed from project
            {log.tasksAffected > 0 && (
              <span className="text-sm text-gray-500 ml-1">
                ({log.tasksAffected} task{log.tasksAffected !== 1 ? 's' : ''} affected)
              </span>
            )}
          </span>
        )
      case 'field_updated':
        const field = log.details?.field || ''
        return (
          <span>
            <span className="font-semibold">{formatFieldName(field)}</span> updated
            {log.previousValue && log.newValue && (
              <span className="text-sm text-gray-500 ml-1">
                from "{log.previousValue}" to "{log.newValue}"
              </span>
            )}
          </span>
        )
      default:
        return log.action
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Change History</h3>
        </div>
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    )
  }

  if (auditLogs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Change History</h3>
        </div>
        <div className="text-sm text-gray-500">No changes recorded yet</div>
      </div>
    )
  }

  const displayedLogs = isExpanded ? auditLogs : auditLogs.slice(0, 5)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Change History</h3>
          <span className="text-sm text-gray-500">({auditLogs.length})</span>
        </div>
        {auditLogs.length > 5 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {isExpanded ? 'Show Less' : `Show All (${auditLogs.length})`}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {displayedLogs.map((log, index) => (
          <div key={log.id} className="flex gap-3">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActionColor(log.action)}`}>
                {getActionIcon(log.action)}
              </div>
              {index < displayedLogs.length - 1 && (
                <div className="w-0.5 h-full bg-gray-200 mt-2" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="text-sm text-gray-900">
                {formatLogMessage(log)}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span>{formatDate(log.createdAt)}</span>
                {log.createdBy && (
                  <>
                    <span>•</span>
                    <span>{log.createdBy}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
