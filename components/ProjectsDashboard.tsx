'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Plus, ChevronDown, ChevronUp, Trash2, Upload, FileText, MessageSquare } from 'lucide-react'
import { SignOutButton } from './SignOutButton'
import dynamic from 'next/dynamic'
import DashboardEmptyState from './DashboardEmptyState'
import PropertyReportModal from './PropertyReportModal'
import AssessorReportModal from './AssessorReportModal'

const MapboxPropertyVisualization = dynamic(() => import('./MapboxPropertyVisualization'), {
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
    files: true,
  })
  const [uploadingFile, setUploadingFile] = useState(false)
  const [expandedTaskNotes, setExpandedTaskNotes] = useState<{ [key: string]: boolean }>({})
  const [showPropertyReport, setShowPropertyReport] = useState(false)
  const [assessorLoading, setAssessorLoading] = useState(false)
  const [showAssessorReport, setShowAssessorReport] = useState(false)
  const [assessorData, setAssessorData] = useState<any>(null)

  const selectedProject = projects.find(p => p.id === selectedProjectId)


  // Auto-fetch parcel data if project has address but no parcel
  // Also fetch complete Regrid data if propertyMetadata is missing
  useEffect(() => {
    console.log('🔄 useEffect: selectedProject changed:', selectedProject?.name || 'none');
    console.log('🔄 useEffect: Has parcel?', !!selectedProject?.parcel);
    console.log('🔄 useEffect: Parcel ID:', selectedProject?.parcel?.id);
    console.log('🔄 useEffect: Parcel APN:', selectedProject?.parcel?.apn);

    const fetchParcelData = async () => {
      if (!selectedProject || !selectedProject.fullAddress) return;

      // Case 1: No parcel data at all - fetch it
      if (!selectedProject.parcel) {
        console.log('🔄 No parcel data found, fetching...');
        try {
          const res = await fetch(`/api/projects/${selectedProject.id}/fetch-parcel`, {
            method: 'POST',
          })
          if (res.ok) {
            const data = await res.json()
            if (data.parcel) {
              // Update project with parcel data
              setProjects(projects.map(p =>
                p.id === selectedProject.id
                  ? { ...p, parcel: data.parcel }
                  : p
              ))
            }
          }
        } catch (error) {
          console.error('Failed to fetch parcel:', error)
        }
        return;
      }

      // Case 2: Parcel exists but propertyMetadata is missing - fetch complete data
      const hasMetadata = selectedProject.parcel.propertyMetadata &&
                         Object.keys(selectedProject.parcel.propertyMetadata).length > 0;

      if (!hasMetadata) {
        console.log('🔄 Property metadata missing, fetching complete Regrid data...');
        try {
          const res = await fetch('/api/parcels/fetch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: selectedProject.fullAddress }),
          })

          if (res.ok) {
            const data = await res.json()
            if (data.success && data.parcel) {
              console.log('✅ Complete parcel data fetched, updating project');
              // Update project with complete parcel data
              setProjects(projects.map(p =>
                p.id === selectedProject.id
                  ? { ...p, parcel: data.parcel }
                  : p
              ))
            }
          }
        } catch (error) {
          console.error('Failed to fetch complete parcel data:', error)
        }
      } else {
        console.log('✅ Property metadata already exists');
      }
    }
    fetchParcelData()
  }, [selectedProjectId, selectedProject?.parcel?.propertyMetadata])

  // Auto-fetch assessor data when project loads (if not already fetched)
  useEffect(() => {
    const autoFetchAssessorData = async () => {
      if (!selectedProject?.parcel?.apn || !selectedProject?.parcel?.id) {
        console.log('⏭️  Skip auto-fetch assessor: No parcel APN');
        return;
      }

      // Skip if already fetched (totalBuildingSF exists and is greater than 0)
      if (selectedProject.parcel.totalBuildingSF && selectedProject.parcel.totalBuildingSF > 0) {
        console.log('✅ Assessor data already exists:', selectedProject.parcel.totalBuildingSF, 'sq ft');
        return;
      }

      console.log('🤖 Auto-fetching assessor data for APN:', selectedProject.parcel.apn);

      try {
        const response = await fetch('/api/parcels/scrape-assessor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apn: selectedProject.parcel.apn,
            parcelId: selectedProject.parcel.id
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Auto-fetched assessor data:', data);

          // Update the selected project with new parcel data
          if (data.parcel) {
            setProjects(projects.map(p =>
              p.id === selectedProject.id
                ? { ...p, parcel: data.parcel }
                : p
            ));
          }
        } else {
          console.log('⚠️  Auto-fetch assessor failed:', response.status);
        }
      } catch (error) {
        console.error('Error auto-fetching assessor data:', error);
      }
    };

    // Small delay to let parcel data load first
    const timeoutId = setTimeout(autoFetchAssessorData, 1000);
    return () => clearTimeout(timeoutId);
  }, [selectedProject?.id, selectedProject?.parcel?.totalBuildingSF]);

  const getProjectScope = (project: any) => {
    return project.scopeOfWork || project.description || ''
  }

  const formatAddress = (address: string | null | undefined) => {
    if (!address) return null
    return address
      .replace(/,\s*phoenix/i, ', Phoenix')
      .replace(/,\s*az\s*/i, ', AZ ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const formatSqFt = (sqft: number | null | undefined) => {
    if (!sqft) return null
    return sqft.toLocaleString() + ' sq ft'
  }

  const formatTimestamp = (date: Date | string) => {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d ago`
    return then.toLocaleDateString()
  }

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

  const sortTasksByPriority = (tasks: any[]) => {
    const priorityOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 }
    return [...tasks].sort((a, b) => {
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 1
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 1
      return aPriority - bPriority
    })
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const fetchAssessorData = async () => {
    // IMMEDIATE feedback - fires BEFORE anything else
    console.log('🎯 BUTTON CLICKED! fetchAssessorData starting...');
    console.log('🔍 fetchAssessorData called');
    console.log('📦 selectedProject:', selectedProject);
    console.log('📦 selectedProject?.parcel:', selectedProject?.parcel);

    if (!selectedProject?.parcel?.id || !selectedProject?.parcel?.apn) {
      console.error('❌ Missing parcel data:', {
        hasProject: !!selectedProject,
        hasParcel: !!selectedProject?.parcel,
        parcelId: selectedProject?.parcel?.id,
        apn: selectedProject?.parcel?.apn
      });
      alert('Missing parcel data');
      return;
    }

    console.log('📤 Calling API with:', {
      parcelId: selectedProject.parcel.id,
      apn: selectedProject.parcel.apn
    });

    setAssessorLoading(true);

    try {
      const response = await fetch('/api/parcels/scrape-assessor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcelId: selectedProject.parcel.id,
          apn: selectedProject.parcel.apn,
        }),
      });

      console.log('📥 API response status:', response.status);

      const data = await response.json();

      console.log('📥 API response data:', data);

      if (data.success) {
        // Update the selected project with new parcel data
        setProjects(projects.map(p =>
          p.id === selectedProject.id
            ? { ...p, parcel: data.parcel }
            : p
        ));

        // Show success message with guidance
        if (data.buildingSections && data.buildingSections.length > 0) {
          alert(`✅ Success! Found ${data.buildingSections.length} building section(s) totaling ${data.totalBuildingSF.toLocaleString()} sq ft.\n\nClick "Property Report" to view details.`);
        } else {
          alert(`⚠️ Assessor data fetched, but no building information found on the county website.\n\nThe property may not have recorded building data.`);
        }
      } else {
        alert(`❌ Failed to fetch assessor data:\n${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error fetching assessor data:', error);
      alert(`❌ Error: ${error.message || 'Failed to connect to assessor'}`);
    } finally {
      setAssessorLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this project?')) return

    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setProjects(projects.filter(p => p.id !== projectId))
      if (selectedProjectId === projectId) setSelectedProjectId(null)
    } catch (error) {
      console.error(error)
      alert('Failed to delete project')
    }
  }

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, ...updates }),
      })
      if (!res.ok) throw new Error('Failed')
      const updatedTask = await res.json()
      setProjects(projects.map(p => {
        if (p.id === selectedProjectId) {
          return { ...p, tasks: p.tasks.map((t: any) => t.id === taskId ? updatedTask : t) }
        }
        return p
      }))
    } catch (error) {
      console.error(error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      })
      if (!res.ok) throw new Error('Failed')
      setProjects(projects.map(p => {
        if (p.id === selectedProjectId) {
          return { ...p, tasks: p.tasks.filter((t: any) => t.id !== taskId) }
        }
        return p
      }))
    } catch (error) {
      console.error(error)
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
        body: JSON.stringify({ projectId: selectedProjectId, title, description }),
      })
      if (!res.ok) throw new Error('Failed')
      const newTask = await res.json()
      setProjects(projects.map(p => {
        if (p.id === selectedProjectId) {
          return { ...p, tasks: [...(p.tasks || []), newTask] }
        }
        return p
      }))
      e.currentTarget.reset()
    } catch (error) {
      console.error(error)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      const res = await fetch('/api/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId }),
      })
      if (!res.ok) throw new Error('Failed')
      setProjects(projects.map(p => {
        if (p.id === selectedProjectId) {
          return { ...p, notes: p.notes.filter((n: any) => n.id !== noteId) }
        }
        return p
      }))
    } catch (error) {
      console.error(error)
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
        body: JSON.stringify({ projectId: selectedProjectId, content }),
      })
      if (!res.ok) throw new Error('Failed')
      const newNote = await res.json()
      setProjects(projects.map(p => {
        if (p.id === selectedProjectId) {
          return { ...p, notes: [...(p.notes || []), newNote] }
        }
        return p
      }))
      e.currentTarget.reset()
    } catch (error) {
      console.error(error)
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
      if (!res.ok) throw new Error('Failed')
      const newTasks = await res.json()
      setProjects(projects.map(p => {
        if (p.id === selectedProjectId) {
          return { ...p, tasks: [...(p.tasks || []), ...newTasks] }
        }
        return p
      }))
      alert(`Created ${newTasks.length} tasks!`)
    } catch (error) {
      console.error(error)
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const toggleTaskNotes = (taskId: string) => {
    setExpandedTaskNotes(prev => ({ ...prev, [taskId]: !prev[taskId] }))
  }

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toUpperCase()
    switch (normalizedStatus) {
      case 'TODO':
      case 'TO DO':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'IN PROGRESS':
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'UNDER REVIEW':
      case 'UNDER_REVIEW':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'ON HOLD':
      case 'ON_HOLD':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'COMPLETED':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    const normalizedPriority = priority.toUpperCase()
    switch (normalizedPriority) {
      case 'HIGH':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'LOW':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#faf8f3] via-[#faf8f3] to-[#9caf88]/10">
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
      <div className="w-80 border-r border-gray-200 flex flex-col bg-white shadow-lg">
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

        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-[#9caf88]/10 to-transparent">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[#1e3a5f] text-lg">Projects</h2>
            <button onClick={() => router.push('/ai-scope')} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#d4836f] to-[#c86f4d] hover:from-[#c86f4d] hover:to-[#d4836f] text-white rounded-lg text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg">
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {[
              { field: 'name' as SortField, label: 'Name' },
              { field: 'address' as SortField, label: 'Address' },
              { field: 'createdAt' as SortField, label: 'Date' },
              { field: 'status' as SortField, label: 'Status' },
            ].map(({ field, label }) => (
              <button key={field} onClick={() => toggleSort(field)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${sortField === field ? 'bg-[#9caf88] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {label} {sortField === field && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sortedProjects.map((project) => (
            <div key={project.id} onClick={() => { setSelectedProjectId(project.id); router.push(`/dashboard?project=${project.id}`, { scroll: false }) }} className={`p-4 cursor-pointer transition-all duration-200 border-l-4 relative group ${selectedProjectId === project.id ? 'bg-gradient-to-r from-[#9caf88]/20 to-transparent border-[#9caf88]' : 'border-transparent hover:bg-gray-50 hover:border-gray-300'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className={`w-4 h-4 flex-shrink-0 ${selectedProjectId === project.id ? 'text-[#9caf88]' : 'text-gray-400'}`} />
                    <h3 className="font-semibold text-[#1e3a5f] truncate text-sm">{project.name}</h3>
                  </div>
                  {project.fullAddress && <p className="text-xs text-gray-500 truncate ml-6">{formatAddress(project.fullAddress)}</p>}
                  {getProjectScope(project) && <p className="text-xs text-gray-600 line-clamp-2 mt-1 ml-6">{getProjectScope(project)}</p>}
                  <div className="flex items-center gap-2 mt-2 ml-6">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${project.status === 'active' ? 'bg-[#9caf88]/20 text-[#9caf88]' : 'bg-gray-100 text-gray-600'}`}>{project.status}</span>
                  </div>
                </div>
                <button onClick={(e) => handleDeleteProject(project.id, e)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1.5 hover:bg-red-50 rounded-lg" title="Delete">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!selectedProject ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#9caf88]/20 to-[#d4836f]/20 flex items-center justify-center">
                <Building2 className="w-12 h-12 text-[#1e3a5f]/40" />
              </div>
              <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2">Select a Project</h2>
              <p className="text-gray-600">Choose a project from the sidebar</p>
            </div>
          </div>
        ) : (
          <div className="px-8 py-8">
            <div className="mb-8 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-[#1e3a5f] mb-2">{selectedProject.name}</h1>
                  {getProjectScope(selectedProject) && <p className="text-gray-700 mb-4 whitespace-pre-wrap">{getProjectScope(selectedProject)}</p>}
                  <div className="flex flex-wrap items-center justify-between gap-4 w-full mt-3">
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${selectedProject.status === 'active' ? 'bg-[#9caf88]/20 text-[#9caf88]' : 'bg-gray-100 text-gray-600'}`}>{selectedProject.status}</span>
                    {selectedProject.fullAddress && <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">📍 {formatAddress(selectedProject.fullAddress)}</span>}
                    {selectedProject.propertyType && <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">🏠 {selectedProject.propertyType}</span>}
                    {(selectedProject.parcel?.lotSizeSqFt || selectedProject.lotSizeSqFt) && <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">📐 Lot: {formatSqFt(selectedProject.parcel?.lotSizeSqFt || selectedProject.lotSizeSqFt)}</span>}
                    {(selectedProject.parcel?.existingSqFt) && <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">🏗️ Building: {formatSqFt(selectedProject.parcel.existingSqFt)}</span>}
                    {selectedProject.parcel?.apn && <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">📋 APN: {selectedProject.parcel.apn}</span>}
                    {selectedProject.parcel?.zoning && <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">🏘️ Zoning: {selectedProject.parcel.zoning}</span>}
                    {selectedProject.parcel?.city && <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">🏛️ Jurisdiction: {selectedProject.parcel.city.charAt(0).toUpperCase() + selectedProject.parcel.city.slice(1)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {selectedProject.parcel && (
                    <>
                      <button
                        onClick={async () => {
                          if (!selectedProject?.parcel?.apn) {
                            alert('Missing parcel APN');
                            return;
                          }

                          setAssessorLoading(true);

                          try {
                            const response = await fetch(`/api/assessor/${selectedProject.parcel.apn}`);
                            const data = await response.json();

                            if (data.success) {
                              setAssessorData(data);
                              setShowAssessorReport(true);
                            } else {
                              alert(`❌ Failed to fetch assessor data: ${data.error}`);
                            }
                          } catch (error: any) {
                            console.error('❌ Error fetching assessor data:', error);
                            alert(`❌ Error: ${error.message}`);
                          } finally {
                            setAssessorLoading(false);
                          }
                        }}
                        disabled={assessorLoading}
                        className="px-6 py-3 bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FileText className="h-5 w-5" />
                        {assessorLoading ? 'Loading...' : 'Assessor Report'}
                      </button>
                      {/* Import Buildings button - Hidden: auto-fetch handles this now */}
                      {/* Only show if auto-fetch failed and no building data exists */}
                      {!selectedProject.parcel.totalBuildingSF && !assessorLoading && (
                        <button
                          onClick={fetchAssessorData}
                          className="px-6 py-3 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                        >
                          <Building2 className="h-5 w-5" />
                          Retry Import Buildings
                        </button>
                      )}
                      <button
                        onClick={() => setShowPropertyReport(true)}
                        className="px-6 py-3 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                      >
                        <FileText className="h-5 w-5" />
                        Property Report
                      </button>
                    </>
                  )}
                  <button onClick={() => router.push(`/projects/${selectedProject.id}/edit`)} className="px-6 py-3 border-2 border-[#9caf88] text-[#9caf88] hover:bg-[#9caf88] hover:text-white rounded-xl font-medium transition-all duration-200">Edit</button>
                </div>
              </div>
            </div>

            {/* Property Visualization Map */}
            {selectedProject.parcel?.boundaryCoordinates && selectedProject.parcel?.latitude && selectedProject.parcel?.longitude && (
              <div className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-3 py-4 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-[#1e3a5f]">Property Map</h2>
                </div>
                <div className="px-3 py-4">
                  <MapboxPropertyVisualization
                    parcelId={selectedProject.parcel.id}
                    projectId={selectedProject.id}
                    boundaryCoords={typeof selectedProject.parcel.boundaryCoordinates === 'string'
                      ? JSON.parse(selectedProject.parcel.boundaryCoordinates)
                      : selectedProject.parcel.boundaryCoordinates}
                    centerLat={selectedProject.parcel.latitude}
                    centerLng={selectedProject.parcel.longitude}
                    parcel={selectedProject.parcel}
                  />
                </div>
              </div>
            )}

            {selectedProject.engineeringReqs && selectedProject.engineeringReqs.length > 0 && (
              <div className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <button onClick={() => toggleSection('engineering')} className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <h2 className="text-xl font-bold text-[#1e3a5f]">Requirements</h2>
                  {expandedSections.engineering ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                {expandedSections.engineering && (
                  <div className="px-6 pb-6">
                    <div className="space-y-3 mb-4">
                      {selectedProject.engineeringReqs.map((req: any) => (
                        <div key={req.id} className="p-4 bg-gradient-to-r from-gray-50 to-transparent rounded-xl border border-gray-200">
                          <div className="flex items-start gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${req.required ? 'bg-[#d4836f]/20 text-[#d4836f]' : 'bg-gray-200 text-gray-600'}`}>{req.required ? 'Required' : 'Optional'}</span>
                            <div className="flex-1">
                              <h4 className="font-semibold text-[#1e3a5f] mb-1">{req.discipline}</h4>
                              <p className="text-sm text-gray-600">{req.notes}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={handleConvertToTasks} className="w-full px-4 py-3 bg-gradient-to-r from-[#9caf88] to-[#8a9d78] hover:from-[#8a9d78] hover:to-[#9caf88] text-white rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg">Convert to Tasks</button>
                  </div>
                )}
              </div>
            )}

            <div className="mb-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <button onClick={() => toggleSection('tasks')} className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <h3 className="text-lg font-bold text-[#1e3a5f]">Tasks ({selectedProject.tasks?.length || 0})</h3>
                  {expandedSections.tasks ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                {expandedSections.tasks && (
                  <div className="px-6 pb-6">
                    <div className="space-y-3 mb-4 max-h-[600px] overflow-y-auto">
                      {sortTasksByPriority(selectedProject.tasks || []).map((task: any) => (
                        <div key={task.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#9caf88] transition-colors">
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <select value={task.priority} onChange={(e) => handleTaskUpdate(task.id, { priority: e.target.value })} className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(task.priority)} focus:outline-none focus:ring-2 focus:ring-[#9caf88]`}>
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                              </select>
                              <select value={task.status} onChange={(e) => handleTaskUpdate(task.id, { status: e.target.value })} className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(task.status)} focus:outline-none focus:ring-2 focus:ring-[#9caf88]`}>
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="UNDER_REVIEW">Under Review</option>
                                <option value="ON_HOLD">On Hold</option>
                                <option value="COMPLETED">Completed</option>
                              </select>
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-medium text-sm ${task.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-[#1e3a5f]'}`}>{task.title}</h4>
                              </div>
                              <button onClick={() => handleDeleteTask(task.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-500" /></button>
                            </div>
                            
                            {task.description && <p className="text-xs text-gray-500 pl-2">{task.description}</p>}
                            
                            <div className="flex items-center gap-2 text-xs text-gray-400 pl-2">
                              <span>Updated {formatTimestamp(task.lastStatusChange)}</span>
                            </div>

                            <input
                              type="text"
                              placeholder="Assigned to..."
                              value={task.assignedTo || ''}
                              onChange={(e) => handleTaskUpdate(task.id, { assignedTo: e.target.value })}
                              onBlur={(e) => {
                                if (e.target.value !== task.assignedTo) {
                                  handleTaskUpdate(task.id, { assignedTo: e.target.value })
                                }
                              }}
                              className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#9caf88] focus:border-transparent"
                            />

                            <button
                              onClick={() => toggleTaskNotes(task.id)}
                              className="flex items-center gap-1 text-xs text-[#9caf88] hover:text-[#8a9d78] transition-colors"
                            >
                              <MessageSquare className="w-3 h-3" />
                              {expandedTaskNotes[task.id] ? 'Hide notes' : 'Show notes'}
                            </button>

                            {expandedTaskNotes[task.id] && (
                              <textarea
                                value={task.description || ''}
                                onChange={(e) => {
                                  const updatedTasks = selectedProject.tasks.map((t: any) =>
                                    t.id === task.id ? { ...t, description: e.target.value } : t
                                  )
                                  setProjects(projects.map(p =>
                                    p.id === selectedProjectId ? { ...p, tasks: updatedTasks } : p
                                  ))
                                }}
                                onBlur={() => handleTaskUpdate(task.id, { description: selectedProject.tasks.find((t: any) => t.id === task.id)?.description })}
                                placeholder="Add notes about this task..."
                                rows={3}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88] focus:border-transparent resize-none"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleAddTask} className="space-y-2">
                      <input type="text" name="title" placeholder="Task title" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88] text-sm" />
                      <input type="text" name="description" placeholder="Description" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88] text-sm" />
                      <button type="submit" className="w-full px-4 py-2 bg-[#9caf88] hover:bg-[#8a9d78] text-white rounded-lg font-medium transition-colors text-sm">Add Task</button>
                    </form>
                  </div>
                )}
              </div>

            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <button onClick={() => toggleSection('notes')} className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <h3 className="text-lg font-bold text-[#1e3a5f]">Notes ({selectedProject.notes?.length || 0})</h3>
                  {expandedSections.notes ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                {expandedSections.notes && (
                  <div className="px-6 pb-6">
                    <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                      {selectedProject.notes?.map((note: any) => (
                        <div key={note.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                              <p className="text-xs text-gray-400 mt-2">{new Date(note.createdAt).toLocaleString()}</p>
                            </div>
                            <button onClick={() => handleDeleteNote(note.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-500" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleAddNote}>
                      <textarea name="content" placeholder="Add a note..." required rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88] mb-2 text-sm" />
                      <button type="submit" className="w-full px-4 py-2 bg-[#9caf88] hover:bg-[#8a9d78] text-white rounded-lg font-medium transition-colors text-sm">Add Note</button>
                    </form>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <button onClick={() => toggleSection('files')} className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <h3 className="text-lg font-bold text-[#1e3a5f]">Files ({selectedProject.files?.length || 0})</h3>
                  {expandedSections.files ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                {expandedSections.files && (
                  <div className="px-6 pb-6">
                    <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                      {selectedProject.files?.map((file: any) => (
                        <div key={file.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                              <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <button className="p-1 hover:bg-red-50 rounded ml-2"><Trash2 className="w-4 h-4 text-red-500" /></button>
                        </div>
                      ))}
                    </div>
                    <label className="w-full px-4 py-3 bg-[#9caf88] hover:bg-[#8a9d78] text-white rounded-lg font-medium transition-colors cursor-pointer flex items-center justify-center gap-2">
                      {uploadingFile ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>Uploading...</> : <><Upload className="w-4 h-4" />Upload File</>}
                      <input type="file" className="hidden" disabled={uploadingFile} />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9caf88] to-[#8a9d78] flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <h3 className="text-lg font-bold text-[#1e3a5f]">Scout</h3>
              </div>
              <ProjectChatWrapper projectId={selectedProject.id} />
            </div>
          </div>
        )}

        {/* Property Report Modal */}
        {selectedProject?.parcel && (
          <PropertyReportModal
            parcelData={selectedProject.parcel ? {
              ...selectedProject.parcel,
              ...(selectedProject.parcel.propertyMetadata as object || {}),
              zip: selectedProject.parcel.zipCode,
            } : null}
            isOpen={showPropertyReport}
            onClose={() => setShowPropertyReport(false)}
          />
        )}

        {/* Assessor Report Modal */}
        <AssessorReportModal
          data={assessorData}
          isOpen={showAssessorReport}
          onClose={() => setShowAssessorReport(false)}
        />
      </div>
    </div>
  )
}
