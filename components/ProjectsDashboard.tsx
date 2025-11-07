'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { SignOutButton } from './SignOutButton'
import dynamic from 'next/dynamic'
import DashboardEmptyState from './DashboardEmptyState'

const PropertyVisualization = dynamic(() => import('./PropertyVisualization'), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-gray-100 animate-pulse rounded-lg" />
})

const ProjectChatWrapper = dynamic(() => import('./ProjectChatWrapper'), {
  ssr: false,
})

type SortField = 'name' | 'address' | 'createdAt' | 'status'
type SortOrder = 'asc' | 'desc'

interface ProjectsDashboardProps {
  projects: any[]
  userEmail: string
  selectedProject?: any
}

export function ProjectsDashboard({ 
  projects: initialProjects, 
  userEmail,
  selectedProject: initialSelectedProject
}: ProjectsDashboardProps) {
  const router = useRouter()
  const [projects, setProjects] = useState(initialProjects)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    initialSelectedProject?.id || null
  )
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [expandedSections, setExpandedSections] = useState({
    engineering: true,
    tasks: true,
    notes: true,
  })

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  // Sorting logic
  const sortedProjects = [...projects].sort((a, b) => {
    let comparison = 0
    
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'address':
        comparison = (a.fullAddress || '').localeCompare(b.fullAddress || '')
        break
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case 'status':
        comparison = a.status.localeCompare(b.status)
        break
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete project')

      setProjects(projects.filter(p => p.id !== projectId))
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null)
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project')
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status: 'COMPLETED' }),
      })

      if (!res.ok) throw new Error('Failed to complete task')

      setProjects(projects.map(p => {
        if (p.id === selectedProjectId) {
          return {
            ...p,
            tasks: p.tasks.map((t: any) => 
              t.id === taskId ? { ...t, status: 'COMPLETED' } : t
            )
          }
        }
        return p
      }))
    } catch (error) {
      console.error('Error completing task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      })

      if (!res.ok) throw new Error('Failed to delete task')

      setProjects(projects.map(p => {
        if (p.id === selectedProjectId) {
          return {
            ...p,
            tasks: p.tasks.filter((t: any) => t.id !== taskId)
          }
        }
        return p
      }))
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const description = formData.get('description') as string

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          title,
          description,
        }),
      })

      if (!res.ok) throw new Error('Failed to create task')

      const newTask = await res.json()

      setProjects(projects.map(p => {
        if (p.id === selectedProjectId) {
          return {
            ...p,
            tasks: [...p.tasks, newTask]
          }
        }
        return p
      }))

      e.currentTarget.reset()
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      const res = await fetch('/api/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId }),
      })

      if (!res.ok) throw new Error('Failed to delete note')

      setProjects(projects.map(p => {
        if (p.id === selectedProjectId) {
          return {
            ...p,
            notes: p.notes.filter((n: any) => n.id !== noteId)
          }
        }
        return p
      }))
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const handleAddNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const content = formData.get('content') as string

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          content,
        }),
      })

      if (!res.ok) throw new Error('Failed to create note')

      const newNote = await res.json()

      setProjects(projects.map(p => {
        if (p.id === selectedProjectId) {
          return {
            ...p,
            notes: [...p.notes, newNote]
          }
        }
        return p
      }))

      e.currentTarget.reset()
    } catch (error) {
      console.error('Error creating note:', error)
    }
  }

  const handleConvertToTasks = async () => {
    if (!selectedProject) return

    try {
      const res = await fetch('/api/requirements-to-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProjectId }),
      })

      if (!res.ok) throw new Error('Failed to convert requirements')

      const newTasks = await res.json()

      setProjects(projects.map(p => {
        if (p.id === selectedProjectId) {
          return {
            ...p,
            tasks: [...p.tasks, ...newTasks]
          }
        }
        return p
      }))

      alert(`Created ${newTasks.length} tasks from engineering requirements!`)
    } catch (error) {
      console.error('Error converting requirements:', error)
      alert('Failed to convert requirements to tasks')
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // If no projects, show beautiful empty state
  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#faf8f3] via-[#faf8f3] to-[#9caf88]/10">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1e3a5f]">CityWise AI</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{userEmail}</span>
              <SignOutButton />
            </div>
          </div>
        </div>

        <DashboardEmptyState />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#faf8f3]">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-white shadow-lg">
        {/* Sidebar Header with Gradient */}
        <div className="p-6 bg-gradient-to-br from-[#1e3a5f] to-[#2c4f6f] text-white">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">CityWise AI</h1>
              <p className="text-xs text-white/80">{userEmail}</p>
            </div>
          </div>
          <SignOutButton />
        </div>

        {/* Projects Section */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-[#9caf88]/10 to-transparent">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[#1e3a5f] text-lg">Projects</h2>
            <button
              onClick={() => router.push('/ai-scope')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#d4836f] to-[#c86f4d] hover:from-[#c86f4d] hover:to-[#d4836f] text-white rounded-lg text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>

          {/* Sort Buttons */}
          <div className="flex gap-2 flex-wrap">
            {[
              { field: 'name' as SortField, label: 'Name' },
              { field: 'address' as SortField, label: 'Address' },
              { field: 'createdAt' as SortField, label: 'Date' },
              { field: 'status' as SortField, label: 'Status' },
            ].map(({ field, label }) => (
              <button
                key={field}
                onClick={() => toggleSort(field)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  sortField === field
                    ? 'bg-[#9caf88] text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label} {sortField === field && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            ))}
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto">
          {sortedProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => {
                setSelectedProjectId(project.id)
                router.push(`/dashboard?project=${project.id}`, { scroll: false })
              }}
              className={`p-4 cursor-pointer transition-all duration-200 border-l-4 relative group ${
                selectedProjectId === project.id
                  ? 'bg-gradient-to-r from-[#9caf88]/20 to-transparent border-[#9caf88]'
                  : 'border-transparent hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className={`w-4 h-4 flex-shrink-0 ${
                      selectedProjectId === project.id ? 'text-[#9caf88]' : 'text-gray-400'
                    }`} />
                    <h3 className="font-semibold text-[#1e3a5f] truncate text-sm">
                      {project.name}
                    </h3>
                  </div>
                  {project.fullAddress && (
                    <p className="text-xs text-gray-500 truncate ml-6">
                      {project.fullAddress}
                    </p>
                  )}
                  {project.description && (
                    <p className="text-xs text-gray-600 truncate mt-1 ml-6">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 ml-6">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      project.status === 'active' 
                        ? 'bg-[#9caf88]/20 text-[#9caf88]' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteProject(project.id, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1.5 hover:bg-red-50 rounded-lg"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {!selectedProject ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#9caf88]/20 to-[#d4836f]/20 flex items-center justify-center">
                <Building2 className="w-12 h-12 text-[#1e3a5f]/40" />
              </div>
              <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2">Select a Project</h2>
              <p className="text-gray-600">Choose a project from the sidebar to view its details</p>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto p-8">
            {/* Project Header */}
            <div className="mb-8 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-[#1e3a5f] mb-2">
                    {selectedProject.name}
                  </h1>
                  {selectedProject.description && (
                    <p className="text-gray-600 mb-4">{selectedProject.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                      selectedProject.status === 'active' 
                        ? 'bg-[#9caf88]/20 text-[#9caf88]' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {selectedProject.status}
                    </span>
                    {selectedProject.fullAddress && (
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                        📍 {selectedProject.fullAddress}
                      </span>
                    )}
                    {selectedProject.propertyType && (
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                        🏠 {selectedProject.propertyType}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/projects/${selectedProject.id}/edit`)}
                  className="px-6 py-3 border-2 border-[#9caf88] text-[#9caf88] hover:bg-[#9caf88] hover:text-white rounded-xl font-medium transition-all duration-200"
                >
                  Edit Project
                </button>
              </div>
            </div>

            {/* Property Visualization */}
            {selectedProject.parcel && (
              <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-[#1e3a5f] mb-4">Property Visualization</h2>
                <PropertyVisualization
                  parcelData={{
                    id: selectedProject.parcel.id,
                    latitude: selectedProject.parcel.latitude,
                    longitude: selectedProject.parcel.longitude,
                    boundaryCoordinates: selectedProject.parcel.boundaryCoordinates,
                    zoningRules: selectedProject.parcel.zoningRules,
                  }}
                  parcelId={selectedProject.parcel.id}
                />
              </div>
            )}

            {/* Engineering Requirements */}
            {selectedProject.engineeringReqs && selectedProject.engineeringReqs.length > 0 && (
              <div className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <button
                  onClick={() => toggleSection('engineering')}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h2 className="text-xl font-bold text-[#1e3a5f]">Engineering Requirements</h2>
                  {expandedSections.engineering ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                {expandedSections.engineering && (
                  <div className="px-6 pb-6">
                    <div className="space-y-3 mb-4">
                      {selectedProject.engineeringReqs.map((req: any) => (
                        <div 
                          key={req.id}
                          className="p-4 bg-gradient-to-r from-gray-50 to-transparent rounded-xl border border-gray-200"
                        >
                          <div className="flex items-start gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              req.required
                                ? 'bg-[#d4836f]/20 text-[#d4836f]'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {req.required ? 'Required' : 'Optional'}
                            </span>
                            <div className="flex-1">
                              <h4 className="font-semibold text-[#1e3a5f] mb-1">{req.discipline}</h4>
                              <p className="text-sm text-gray-600">{req.notes}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleConvertToTasks}
                      className="w-full px-4 py-3 bg-gradient-to-r from-[#9caf88] to-[#8a9d78] hover:from-[#8a9d78] hover:to-[#9caf88] text-white rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Convert to Tasks
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tasks & Notes Side by Side */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Tasks */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <button
                  onClick={() => toggleSection('tasks')}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-bold text-[#1e3a5f]">
                    Tasks ({selectedProject.tasks?.length || 0})
                  </h3>
                  {expandedSections.tasks ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {expandedSections.tasks && (
                  <div className="px-6 pb-6">
                    <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                      {selectedProject.tasks?.map((task: any) => (
                        <div 
                          key={task.id}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#9caf88] transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={task.status === 'COMPLETED'}
                              onChange={() => handleCompleteTask(task.id)}
                              className="mt-1 w-4 h-4 text-[#9caf88] rounded focus:ring-[#9caf88]"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-medium text-sm ${
                                task.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-[#1e3a5f]'
                              }`}>
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                              )}
                              <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                                task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {task.status}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1 hover:bg-red-50 rounded"
                              title="Delete task"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Task Form */}
                    <form onSubmit={handleAddTask} className="space-y-2">
                      <input
                        type="text"
                        name="title"
                        placeholder="Task title"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88] focus:border-transparent"
                      />
                      <input
                        type="text"
                        name="description"
                        placeholder="Description (optional)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88] focus:border-transparent"
                      />
                      <button
                        type="submit"
                        className="w-full px-4 py-2 bg-[#9caf88] hover:bg-[#8a9d78] text-white rounded-lg font-medium transition-colors"
                      >
                        Add Task
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <button
                  onClick={() => toggleSection('notes')}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-bold text-[#1e3a5f]">
                    Notes ({selectedProject.notes?.length || 0})
                  </h3>
                  {expandedSections.notes ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {expandedSections.notes && (
                  <div className="px-6 pb-6">
                    <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                      {selectedProject.notes?.map((note: any) => (
                        <div 
                          key={note.id}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(note.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1 hover:bg-red-50 rounded"
                              title="Delete note"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Note Form */}
                    <form onSubmit={handleAddNote}>
                      <textarea
                        name="content"
                        placeholder="Add a note..."
                        required
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88] focus:border-transparent mb-2"
                      />
                      <button
                        type="submit"
                        className="w-full px-4 py-2 bg-[#9caf88] hover:bg-[#8a9d78] text-white rounded-lg font-medium transition-colors"
                      >
                        Add Note
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* AI Assistant */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-[#1e3a5f] mb-4">AI Project Assistant</h3>
              <ProjectChatWrapper projectId={selectedProject.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
