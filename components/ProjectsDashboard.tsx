'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Plus, ChevronDown, ChevronUp, Trash2, Upload, FileText, MessageSquare, Pencil, FileDown, Search, Archive, ArchiveRestore, Sparkles, X } from 'lucide-react'
import { SignOutButton } from './SignOutButton'
import dynamic from 'next/dynamic'
import DashboardEmptyState from './DashboardEmptyState'
import PropertyReportModal from './PropertyReportModal'
import AssessorReportModal from './AssessorReportModal'
import EditProjectModal from './EditProjectModal'
import PDFPreviewModal from './PDFPreviewModal'
import AIVisualizationPanel from './AIVisualizationPanel'
import { exportPropertyPdf } from '@/lib/exportPdf'
import { toast } from 'sonner'
import CompactTimeline from '@/components/roadmap/CompactTimeline'
import { ProjectRoadmap } from '@/types/roadmap'

const MapboxPropertyVisualization = dynamic(() => import('./MapboxPropertyVisualization'), {
  ssr: false,
loading: () => <div className="h-[800px] bg-gray-100 animate-pulse rounded-lg" />
})

const ProjectChatWrapper = dynamic(() => import('./ProjectChatWrapper'), {
  ssr: false,
})

type SortField = 'name' | 'address' | 'dueDate' | 'status'
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
  const [sortField, setSortField] = useState<SortField>('dueDate')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
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
  const [editingProject, setEditingProject] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [showPdfPreview, setShowPdfPreview] = useState(false)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const [pdfFileName, setPdfFileName] = useState<string>('')
  const [pdfInstance, setPdfInstance] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [showArchived, setShowArchived] = useState(false)

  // Vision Board state
  const [visionBoard, setVisionBoard] = useState<Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    metadata?: { prompt?: string } | null;
    createdAt: string;
  }>>([])
  const [showAIVisualization, setShowAIVisualization] = useState(false)
  const [selectedVisionImage, setSelectedVisionImage] = useState<{
    fileUrl: string;
    fileName: string;
    prompt?: string;
  } | null>(null)
  const [editingVisionId, setEditingVisionId] = useState<string | null>(null)
  const [editingVisionName, setEditingVisionName] = useState('')

  // Roadmap state
  const [roadmap, setRoadmap] = useState<ProjectRoadmap | null>(null)
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('')

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  // Map height state (default 700px for better visibility)
  const [mapHeight, setMapHeight] = useState(800)

  // Debug initial projects on mount
  useEffect(() => {
    console.log('🏷️ Initial projects:', initialProjects.map(p => ({ name: p.name, tags: p.tags })));
  }, [])

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

  // Load Vision Board items when project changes
  useEffect(() => {
    const loadVisualizations = async () => {
      if (!selectedProjectId) return;

      try {
        const response = await fetch(`/api/projects/${selectedProjectId}/visualizations`);
        if (response.ok) {
          const data = await response.json();
          setVisionBoard(data.visualizations || []);
        }
      } catch (error) {
        console.error('Error loading visualizations:', error);
      }
    };

    loadVisualizations();
  }, [selectedProjectId]);

  // Load Roadmap when project changes
  useEffect(() => {
    const loadRoadmap = async () => {
      if (!selectedProjectId) {
        setRoadmap(null);
        return;
      }

      try {
        const response = await fetch(`/api/projects/${selectedProjectId}/roadmap`);
        if (response.ok) {
          const data = await response.json();
          setRoadmap(data);
        } else {
          setRoadmap(null);
        }
      } catch (error) {
        console.error('Error loading roadmap:', error);
        setRoadmap(null);
      }
    };

    loadRoadmap();
  }, [selectedProjectId]);

  // Refresh visualizations callback
  const refreshVisualizations = async () => {
    if (!selectedProjectId) return;

    try {
      const response = await fetch(`/api/projects/${selectedProjectId}/visualizations`);
      if (response.ok) {
        const data = await response.json();
        setVisionBoard(data.visualizations || []);
      }
    } catch (error) {
      console.error('Error refreshing visualizations:', error);
    }
  };

  const handleRenameVisualization = async (fileId: string, newFileName: string) => {
    if (!selectedProjectId || !newFileName.trim()) return;

    try {
      const response = await fetch(`/api/projects/${selectedProjectId}/visualizations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, fileName: newFileName }),
      });

      if (response.ok) {
        const data = await response.json();
        setVisionBoard(prev => prev.map(viz =>
          viz.id === fileId ? { ...viz, fileName: data.visualization.fileName } : viz
        ));
        setEditingVisionId(null);
        setEditingVisionName('');
        toast.success('Visualization renamed successfully');
      } else {
        toast.error('Failed to rename visualization');
      }
    } catch (error) {
      console.error('Error renaming visualization:', error);
      toast.error('Failed to rename visualization');
    }
  };

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

  // Get all unique tags from projects
  const allTags = useMemo(() => {
    console.log('🏷️ Computing allTags from', projects.length, 'projects');
    const tagSet = new Set<string>()
    projects.forEach(p => {
      console.log('🏷️ Project:', p.name, 'has tags:', p.tags);
      p.tags?.forEach(t => tagSet.add(t))
    })
    const uniqueTags = Array.from(tagSet).sort()
    console.log('🏷️ All unique tags:', uniqueTags);
    return uniqueTags
  }, [projects])

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    console.log('🏷️ Filtering projects with tagFilter:', tagFilter);
    console.log('🏷️ tagFilter === "all":', tagFilter === 'all');
    console.log('🏷️ typeof tagFilter:', typeof tagFilter);

    // First, filter projects
    const filtered = projects.filter(project => {
      // Archive filter - hide archived unless showArchived is true
      const isArchived = !!project.archivedAt
      if (isArchived && !showArchived) return false

      // Search filter - check name, address, client name
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery ||
        project.name?.toLowerCase().includes(searchLower) ||
        project.parcel?.address?.toLowerCase().includes(searchLower) ||
        project.fullAddress?.toLowerCase().includes(searchLower) ||
        project.clientName?.toLowerCase().includes(searchLower)

      // Status filter
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter

      // Priority filter
      const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter

      // Tag filter - more defensive logic
      const matchesTag = !tagFilter || tagFilter === 'all' || (project.tags && project.tags.includes(tagFilter))

      console.log('🏷️ Project:', project.name, '| tags:', project.tags, '| tagFilter:', tagFilter, '| matchesTag:', matchesTag);

      return matchesSearch && matchesStatus && matchesPriority && matchesTag
    })

    console.log('🏷️ Filtered', filtered.length, 'of', projects.length, 'projects');

    // Then, sort the filtered results
    return [...filtered].sort((a, b) => {
      switch (sortField) {
        case 'name':
          // Name sort - alphabetical A-Z
          return (a.name || '').localeCompare(b.name || '') * (sortOrder === 'asc' ? 1 : -1)

        case 'address':
          // Address sort - alphabetical A-Z (using parcel.address)
          return (a.parcel?.address || a.fullAddress || '').localeCompare(b.parcel?.address || b.fullAddress || '') * (sortOrder === 'asc' ? 1 : -1)

        case 'dueDate':
          // Date sort - by DUE DATE (projects without due dates go to the end)
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
          return (dateA - dateB) * (sortOrder === 'asc' ? 1 : -1)

        case 'status':
          // Status sort - by status THEN by due date within each status
          const statusOrder: { [key: string]: number } = { 'active': 1, 'on-hold': 2, 'completed': 3, 'archived': 4 }
          const statusA = statusOrder[a.status] || 99
          const statusB = statusOrder[b.status] || 99

          // First sort by status
          const statusDiff = statusA - statusB
          if (statusDiff !== 0) return statusDiff * (sortOrder === 'asc' ? 1 : -1)

          // Then sort by due date within same status (always earliest first)
          const dueDateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
          const dueDateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
          return dueDateA - dueDateB

        default:
          return 0
      }
    })
  }, [projects, searchQuery, statusFilter, priorityFilter, tagFilter, showArchived, sortField, sortOrder])

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

  const handleEditProject = (project: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingProject(project)
    setShowEditModal(true)
  }

  const handleSaveProject = async (updates: Partial<any>) => {
    console.log('🔧 handleSaveProject called')
    console.log('   editingProject:', editingProject)
    console.log('   updates:', updates)

    if (!editingProject) {
      console.error('❌ No editingProject!')
      return
    }

    try {
      console.log('📤 Sending PATCH request to:', `/api/projects/${editingProject.id}`)
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      console.log('📥 Response status:', res.status)
      console.log('📥 Response ok:', res.ok)

      if (!res.ok) {
        const errorData = await res.json()
        console.error('❌ Server error:', errorData)
        throw new Error('Failed to update project')
      }

      const updatedProject = await res.json()
      console.log('✅ Updated project:', updatedProject)

      // Update projects in state
      setProjects(projects.map(p =>
        p.id === editingProject.id ? updatedProject : p
      ))

      setShowEditModal(false)
      setEditingProject(null)
    } catch (error) {
      console.error('❌ handleSaveProject error:', error)
      alert('Failed to update project')
    }
  }

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

  const handleArchiveProject = async (projectId: string, archive: boolean, e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archivedAt: archive ? new Date().toISOString() : null
        }),
      })

      if (!res.ok) throw new Error('Failed to archive/restore project')

      const updatedProject = await res.json()
      setProjects(projects.map(p => p.id === projectId ? updatedProject : p))

      // If archiving the currently selected project and not showing archived, deselect it
      if (archive && selectedProjectId === projectId && !showArchived) {
        setSelectedProjectId(null)
      }
    } catch (error) {
      console.error(error)
      alert(`Failed to ${archive ? 'archive' : 'restore'} project`)
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
        body: JSON.stringify({
          projectId: selectedProjectId,
          title,
          description,
          phaseId: selectedPhaseId || null
        }),
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
      setSelectedPhaseId('')
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

  const getProjectPriorityBadge = (priority: string) => {
    const normalizedPriority = priority?.toLowerCase() || 'medium'
    switch (normalizedPriority) {
      case 'high':
        return { emoji: '🔴', color: 'bg-red-100 text-red-700' }
      case 'medium':
        return { emoji: '🟡', color: 'bg-yellow-100 text-yellow-700' }
      case 'low':
        return { emoji: '🟢', color: 'bg-green-100 text-green-700' }
      default:
        return { emoji: '🟡', color: 'bg-yellow-100 text-yellow-700' }
    }
  }

  const formatDueDate = (date: Date | string | null | undefined) => {
    if (!date) return null
    const d = new Date(date)
    const now = new Date()
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return `Overdue ${Math.abs(diffDays)}d`
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    if (diffDays < 7) return `Due in ${diffDays}d`
    return d.toLocaleDateString()
  }

  // Handle PDF download from preview modal
  const handlePdfDownload = () => {
    if (pdfInstance && pdfFileName) {
      pdfInstance.save(pdfFileName);
      toast.success(`PDF downloaded: ${pdfFileName}`);
      // Clean up blob URL
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
      setShowPdfPreview(false);
      setPdfBlobUrl(null);
      setPdfFileName('');
      setPdfInstance(null);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#faf8f3] via-[#faf8f3] to-[#9caf88]/10">
        <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1e3a5f]">CityWise</h1>
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
      <div className="w-96 border-r border-gray-200 flex flex-col bg-white shadow-lg">
        <div className="p-6 bg-gradient-to-br from-[#1e3a5f] to-[#2c4f6f] text-white">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">CityWise</h1>
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

          {/* Search Input */}
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9caf88] focus:border-[#9caf88] text-sm"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex gap-2 mb-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#9caf88] focus:border-[#9caf88]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#9caf88] focus:border-[#9caf88]"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={tagFilter}
              onChange={(e) => {
                console.log('🏷️ Tag filter changed to:', e.target.value);
                console.log('🏷️ e.target.value === "all":', e.target.value === 'all');
                setTagFilter(e.target.value);
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#9caf88] focus:border-[#9caf88]"
            >
              <option value="all">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          {/* Show Archived Checkbox */}
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900 transition-colors">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-gray-300 text-[#9caf88] focus:ring-[#9caf88] cursor-pointer"
            />
            <span>Show archived projects</span>
          </label>

          {/* Sort Buttons */}
          <div className="flex gap-2 flex-wrap">
            {[
              { field: 'name' as SortField, label: 'Name' },
              { field: 'address' as SortField, label: 'Address' },
              { field: 'dueDate' as SortField, label: 'Date' },
              { field: 'status' as SortField, label: 'Status' },
            ].map(({ field, label }) => (
              <button key={field} onClick={() => toggleSort(field)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${sortField === field ? 'bg-[#9caf88] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {label} {sortField === field && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            ))}
          </div>

          {/* Result Count */}
          <p className="text-sm text-gray-500 mt-3 mb-2">
            {filteredProjects.length} of {projects.length} projects
          </p>
        </div>

        {/* Project List - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {filteredProjects.map((project) => {
            const priorityBadge = getProjectPriorityBadge(project.priority)
            const dueDate = formatDueDate(project.dueDate)

            return (
              <div key={project.id} onClick={() => { setSelectedProjectId(project.id); router.push(`/dashboard?project=${project.id}`, { scroll: false }) }} className={`p-4 cursor-pointer transition-all duration-200 border-l-4 relative group ${project.archivedAt ? 'opacity-60' : ''} ${selectedProjectId === project.id ? 'bg-gradient-to-r from-[#9caf88]/20 to-transparent border-[#9caf88]' : 'border-transparent hover:bg-gray-50 hover:border-gray-300'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className={`w-4 h-4 flex-shrink-0 ${selectedProjectId === project.id ? 'text-[#9caf88]' : 'text-gray-400'}`} />
                      <h3 className="font-semibold text-[#1e3a5f] truncate text-sm">{project.name}</h3>
                    </div>
                    {project.clientName && <p className="text-xs text-gray-600 ml-6 mb-1">👤 {project.clientName}</p>}
                    {project.fullAddress && <p className="text-xs text-gray-500 truncate ml-6">{formatAddress(project.fullAddress)}</p>}
                    {getProjectScope(project) && <p className="text-xs text-gray-600 line-clamp-2 mt-1 ml-6">{getProjectScope(project)}</p>}
                    <div className="flex items-center gap-2 mt-2 ml-6 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityBadge.color}`}>
                        {priorityBadge.emoji} {project.priority || 'medium'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        project.status === 'active' ? 'bg-[#9caf88]/20 text-[#9caf88]' :
                        project.status === 'on-hold' ? 'bg-orange-100 text-orange-700' :
                        project.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{project.status}</span>
                      {dueDate && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          dueDate.includes('Overdue') ? 'bg-red-100 text-red-700' :
                          dueDate.includes('today') || dueDate.includes('tomorrow') ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>📅 {dueDate}</span>
                      )}
                      {project.archivedAt && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-500">
                          📦 Archived
                        </span>
                      )}
                    </div>
                    {/* Tags */}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 ml-6">
                        {project.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <button onClick={(e) => handleEditProject(project, e)} className="p-1.5 hover:bg-blue-50 rounded-lg" title="Edit">
                      <Pencil className="w-4 h-4 text-blue-500" />
                    </button>
                    {project.archivedAt ? (
                      <button onClick={(e) => handleArchiveProject(project.id, false, e)} className="p-1.5 hover:bg-green-50 rounded-lg" title="Restore">
                        <ArchiveRestore className="w-4 h-4 text-green-600" />
                      </button>
                    ) : (
                      <button onClick={(e) => handleArchiveProject(project.id, true, e)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Archive">
                        <Archive className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                    <button onClick={(e) => handleDeleteProject(project.id, e)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Delete">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
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
              {/* Title and Description */}
              <h1 className="text-3xl font-bold text-[#1e3a5f] mb-2">{selectedProject.name}</h1>
              {getProjectScope(selectedProject) && <p className="text-gray-700 mb-4 whitespace-pre-wrap">{getProjectScope(selectedProject)}</p>}

              {/* Info Bubbles */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${selectedProject.status === 'active' ? 'bg-[#9caf88]/20 text-[#9caf88]' : 'bg-gray-100 text-gray-600'}`}>{selectedProject.status}</span>
                {selectedProject.fullAddress && <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">📍 {formatAddress(selectedProject.fullAddress)}</span>}
                {selectedProject.propertyType && <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">🏠 {selectedProject.propertyType}</span>}
                {(selectedProject.parcel?.lotSizeSqFt || selectedProject.lotSizeSqFt) && <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">📐 Lot: {formatSqFt(selectedProject.parcel?.lotSizeSqFt || selectedProject.lotSizeSqFt)}</span>}
                {(selectedProject.parcel?.existingSqFt) && <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">🏗️ Building: {formatSqFt(selectedProject.parcel.existingSqFt)}</span>}
                {selectedProject.parcel?.apn && <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">📋 APN: {selectedProject.parcel.apn}</span>}
                {selectedProject.parcel?.zoning && <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">🏘️ Zoning: {selectedProject.parcel.zoning}</span>}
                {selectedProject.parcel?.city && <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">🏛️ Jurisdiction: {selectedProject.parcel.city.charAt(0).toUpperCase() + selectedProject.parcel.city.slice(1)}</span>}
              </div>

              {/* Action Buttons - Row at bottom, all same size */}
              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/projects/${selectedProject.id}/edit`)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-all duration-200"
                >
                  Edit
                </button>
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
                        className="flex-1 px-6 py-3 bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {assessorLoading ? 'Loading...' : 'Assessor Report'}
                      </button>
                    <button
                      onClick={() => setShowPropertyReport(true)}
                      className="flex-1 px-6 py-3 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      Property Report
                    </button>
                      <button
                        onClick={async () => {
                          if (!selectedProject?.parcel) {
                            toast.error('Parcel data not available');
                            return;
                          }

                          setIsExportingPdf(true);
                          try {
                            console.log('📄 Starting PDF export...');

                            // Fetch drawn shapes from API
                            const shapesRes = await fetch(`/api/projects/${selectedProject.id}/shapes`);
                            const shapesResponse = await shapesRes.json();
                            console.log('📄 Raw API response:', shapesResponse);

                            // Extract shapes array from response (API returns { shapes: [...] })
                            const shapesArray = shapesResponse.shapes || [];
                            console.log('📋 Extracted shapes array:', shapesArray);
                            console.log('📋 Number of shapes:', shapesArray.length);

                            shapesArray.forEach((shape: any, idx: number) => {
                              console.log(`  Shape ${idx}:`, {
                                name: shape.name,
                                area: shape.area,
                                perimeter: shape.perimeter,
                                shapeType: shape.shapeType,
                                properties: shape.properties
                              });
                            });

                            // Prepare requirements from tasks with full details
                            const requirements = [];
                            if (selectedProject.tasks && selectedProject.tasks.length > 0) {
                              selectedProject.tasks.forEach((task: any) => {
                                requirements.push({
                                  name: task.title || task.description || 'Task',
                                  status: task.status || 'To Do',
                                  description: task.description || task.notes || '',
                                  priority: task.priority,
                                });
                              });
                            }
                            if (selectedProject.engineeringReqs && selectedProject.engineeringReqs.length > 0) {
                              selectedProject.engineeringReqs.forEach((req: any) => {
                                requirements.push({
                                  name: req.type || req.name || 'Engineering Requirement',
                                  status: req.status || 'Required',
                                  description: req.description || req.notes || '',
                                  priority: req.priority,
                                });
                              });
                            }

                            // Calculate coverage statistics
                            const lotSize = selectedProject.parcel.lotSizeSqFt || 0;
                            const existingBuildings = selectedProject.parcel.totalBuildingSF || 0;
                            const newStructures = shapesArray.reduce((sum, shape) =>
                              sum + (shape.area || shape.properties?.area || 0), 0
                            );
                            const totalCoverage = existingBuildings + newStructures;
                            const coveragePercent = lotSize > 0 ? (totalCoverage / lotSize) * 100 : 0;

                            // Extract max coverage from zoning (e.g., "R1-10" -> 40% typical)
                            const zoning = selectedProject.parcel.zoning || '';
                            let maxPercent = 40; // Default for R1 zones
                            if (zoning.includes('R1')) maxPercent = 40;
                            else if (zoning.includes('R2')) maxPercent = 50;
                            else if (zoning.includes('R3')) maxPercent = 60;

                            const maxAllowed = (lotSize * maxPercent) / 100;
                            const remainingSpace = maxAllowed - totalCoverage;
                            const underLimit = remainingSpace >= 0;

                            const coverageStats = {
                              lotSize,
                              maxAllowed: Math.round(maxAllowed),
                              maxPercent,
                              zoning,
                              existingBuildings,
                              newStructures: Math.round(newStructures),
                              totalCoverage: Math.round(totalCoverage),
                              coveragePercent: parseFloat(coveragePercent.toFixed(1)),
                              remainingSpace: Math.round(remainingSpace),
                              underLimit,
                            };

                            // Prepare property data for PDF
                            const propertyData = {
                              address: selectedProject.parcel.address || 'Unknown Address',
                              lotSize: selectedProject.parcel.lotSizeSqFt || 0,
                              zoning: selectedProject.parcel.zoning || 'Unknown',
                              setbacks: {
                                front: 20,
                                rear: 20,
                                left: 5,
                                right: 5,
                              },
                              shapes: shapesArray.map((shape: any) => ({
                                name: shape.name || `Unnamed ${shape.shapeType || 'Structure'}`,
                                area: Math.round(shape.area || 0),
                                perimeter: shape.perimeter,
                                coordinates: shape.coordinates,
                              })),
                              apn: selectedProject.parcel.apn,
                              existingSqFt: selectedProject.parcel.totalBuildingSF || 0,
                              centerLat: selectedProject.parcel.latitude,
                              centerLng: selectedProject.parcel.longitude,
                              boundaryCoordinates: selectedProject.parcel.coordinates || selectedProject.parcel.geometry?.coordinates?.[0],
                              requirements: requirements.length > 0 ? requirements : undefined,
                              coverageStats,
                            };

                            console.log('📊 Final shapes for PDF export:', propertyData.shapes);
                            propertyData.shapes.forEach((shape: any, idx: number) => {
                              console.log(`  PDF Shape ${idx}: "${shape.name}" - ${shape.area} sq ft, coords: ${shape.coordinates?.length || 0}`);
                            });
                            console.log('📋 Requirements for PDF:', propertyData.requirements);
                            console.log('📊 Coverage stats:', propertyData.coverageStats);
                            console.log('🗺️ Boundary coordinates for PDF:', propertyData.boundaryCoordinates?.length || 0, 'points');
                            if (propertyData.boundaryCoordinates && propertyData.boundaryCoordinates.length > 0) {
                              console.log('🗺️ First boundary coord:', propertyData.boundaryCoordinates[0]);
                            }

                            // Export PDF with preview option
                            const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
                            console.log('🔑 Mapbox token available:', !!mapboxToken);

                            const result = await exportPropertyPdf(
                              null as any, // mapElement not needed
                              selectedProject.parcel.address || `Project_${selectedProject.id}`,
                              propertyData,
                              {
                                preview: true,
                                mapboxToken: mapboxToken
                              }
                            );

                            // Set PDF preview data and show modal
                            if (result.blobUrl) {
                              setPdfBlobUrl(result.blobUrl);
                              setPdfFileName(result.fileName);
                              setPdfInstance(result.pdf);
                              setShowPdfPreview(true);
                            }
                          } catch (error) {
                            console.error('Failed to export PDF:', error);
                            toast.error('Failed to export PDF');
                          } finally {
                            setIsExportingPdf(false);
                          }
                        }}
                        disabled={isExportingPdf}
                        className={`flex-1 px-6 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                          isExportingPdf
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : 'bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                        }`}
                      >
                        {isExportingPdf ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Exporting...</span>
                          </>
                        ) : (
                          <>
                            <span>Export PDF</span>
                          </>
                        )}
                      </button>
                  </>
                )}
              </div>
            </div>

            {/* Property Visualization Map */}
            {selectedProject.parcel?.boundaryCoordinates && selectedProject.parcel?.latitude && selectedProject.parcel?.longitude && (
              <div className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-3 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#1e3a5f]">Property Map</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Height:</span>
                    <button
                      onClick={() => setMapHeight(Math.max(400, mapHeight - 100))}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                      title="Decrease height"
                    >
                      −
                    </button>
                    <span className="w-16 text-center">{mapHeight}px</span>
                    <button
                      onClick={() => setMapHeight(Math.min(1200, mapHeight + 100))}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                      title="Increase height"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="px-3 py-4" style={{ height: `${mapHeight}px` }}>
                  <MapboxPropertyVisualization
                    parcelId={selectedProject.parcel.id}
                    projectId={selectedProject.id}
                    boundaryCoords={(() => {
                      const coords = typeof selectedProject.parcel.boundaryCoordinates === 'string'
                        ? JSON.parse(selectedProject.parcel.boundaryCoordinates)
                        : selectedProject.parcel.boundaryCoordinates;
                      // boundaryCoordinates is stored as [[[lng, lat], ...]] (rings format)
                      // Extract the first ring to get [[lng, lat], ...]
                      if (Array.isArray(coords) && Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
                        return coords[0];
                      }
                      return coords || [];
                    })()}
                    centerLat={selectedProject.parcel.latitude}
                    centerLng={selectedProject.parcel.longitude}
                    parcel={selectedProject.parcel}
                  />
                </div>
              </div>
            )}

            {/* Vision Board Section */}
            <div className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    <h2 className="text-xl font-bold text-[#1e3a5f]">Vision Board ({visionBoard.length})</h2>
                  </div>
                  <button
                    onClick={() => setShowAIVisualization(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-md transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate New
                  </button>
                </div>
              </div>

              <div className="px-6 py-6">
                {visionBoard.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Sparkles className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                    <p className="text-base font-medium">No visualizations yet</p>
                    <p className="text-sm mt-1">Click "Generate New" to create your first visualization</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-4">
                    {visionBoard.map((viz) => (
                      <div key={viz.id} className="group relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:border-purple-400 transition-colors">
                        <div className="aspect-square relative">
                          <img
                            src={viz.fileUrl}
                            alt={viz.fileName}
                            className="w-full h-full object-cover"
                          />
                          {/* Overlay on hover */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <a
                              href={viz.fileUrl}
                              download={viz.fileName}
                              className="p-2 bg-white rounded-full hover:bg-gray-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </a>
                            <button
                              onClick={() => setSelectedVisionImage({
                                fileUrl: viz.fileUrl,
                                fileName: viz.fileName,
                                prompt: viz.metadata?.prompt
                              })}
                              className="p-2 bg-white rounded-full hover:bg-gray-100"
                            >
                              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="p-3">
                          {editingVisionId === viz.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editingVisionName}
                                onChange={(e) => setEditingVisionName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleRenameVisualization(viz.id, editingVisionName);
                                  } else if (e.key === 'Escape') {
                                    setEditingVisionId(null);
                                    setEditingVisionName('');
                                  }
                                }}
                                className="flex-1 px-2 py-1 text-xs border border-purple-400 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                                autoFocus
                              />
                              <button
                                onClick={() => handleRenameVisualization(viz.id, editingVisionName)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingVisionId(null);
                                  setEditingVisionName('');
                                }}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">{viz.fileName}</p>
                                {viz.metadata?.prompt && (
                                  <p className="text-xs text-gray-500 truncate mt-0.5" title={viz.metadata.prompt}>
                                    {viz.metadata.prompt}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  setEditingVisionId(viz.id);
                                  setEditingVisionName(viz.fileName);
                                }}
                                className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-1">{new Date(viz.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

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
                    {/* Roadmap Timeline Section */}
                    {roadmap ? (
                      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-semibold text-gray-900">Project Roadmap</h4>
                          <span className="text-xs text-gray-600">
                            {roadmap.phases.filter(p => p.status === 'completed').length} / {roadmap.phases.length} phases complete
                          </span>
                        </div>
                        <CompactTimeline
                          roadmap={roadmap}
                          onPhaseClick={(phase) => console.log('Phase clicked:', phase)}
                        />
                      </div>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/projects/${selectedProjectId}/roadmap`, { method: 'POST' });
                            if (response.ok) {
                              const data = await response.json();
                              setRoadmap(data);
                            }
                          } catch (err) {
                            console.error('Error generating roadmap:', err);
                          }
                        }}
                        className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Generate Roadmap
                      </button>
                    )}

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

                      {/* Phase Assignment Dropdown */}
                      {roadmap && roadmap.phases && roadmap.phases.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assign to Phase (Optional)
                          </label>
                          <select
                            value={selectedPhaseId}
                            onChange={(e) => setSelectedPhaseId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            <option value="">No phase (general task)</option>
                            {roadmap.phases.map((phase) => (
                              <option key={phase.id} value={phase.id}>
                                {phase.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

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

        {/* Edit Project Modal */}
        <EditProjectModal
          project={editingProject}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingProject(null)
          }}
          onSave={handleSaveProject}
        />

        {/* PDF Preview Modal */}
        <PDFPreviewModal
          isOpen={showPdfPreview}
          onClose={() => {
            setShowPdfPreview(false);
            if (pdfBlobUrl) {
              URL.revokeObjectURL(pdfBlobUrl);
            }
            setPdfBlobUrl(null);
            setPdfFileName('');
            setPdfInstance(null);
          }}
          pdfBlobUrl={pdfBlobUrl}
          fileName={pdfFileName}
          onDownload={handlePdfDownload}
        />

        {/* AI Visualization Panel */}
        {selectedProject && (
          <AIVisualizationPanel
            isOpen={showAIVisualization}
            onClose={() => setShowAIVisualization(false)}
            projectId={selectedProject.id}
            onVisualizationSaved={refreshVisualizations}
          />
        )}

        {/* Vision Image Lightbox */}
        {selectedVisionImage && (
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedVisionImage(null)}
          >
            <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center p-8">
              {/* Close button */}
              <button
                onClick={() => setSelectedVisionImage(null)}
                className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              {/* Image */}
              <img
                src={selectedVisionImage.fileUrl}
                alt={selectedVisionImage.fileName}
                className="max-w-full max-h-[calc(100%-120px)] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Image info */}
              <div className="mt-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl max-w-3xl">
                <p className="text-white text-sm font-medium mb-1">{selectedVisionImage.fileName}</p>
                {selectedVisionImage.prompt && (
                  <p className="text-white/80 text-xs leading-relaxed">
                    <span className="font-semibold">Prompt: </span>
                    {selectedVisionImage.prompt}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
