'use client';

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo } from "react";
import { ProjectChatWrapper } from "@/components/ProjectChatWrapper";
import PropertyVisualization from "@/components/PropertyVisualization";

interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  fullAddress?: string | null;
  propertyType?: string | null;
  projectType?: string | null;
  createdAt?: Date | string;
  parcel?: {
    id?: string;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    boundaryCoordinates?: any;
    zoningRules?: { field: string; value: string; unit: string }[];
    lotSizeSqFt?: number | null;
  } | null;
  engineeringReqs?: {
    id: string;
    requirement: string;
    discipline?: string | null;
    required: boolean;
    notes?: string | null;
  }[];
  tasks?: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
  }[];
  notes?: {
    id: string;
    content: string;
    createdAt: Date;
  }[];
}

interface ProjectsDashboardProps {
  projects: Project[];
  selectedProject: Project | null;
  userEmail: string;
}

export function ProjectsDashboard({ projects, selectedProject, userEmail }: ProjectsDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status' | 'address'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deletingProject, setDeletingProject] = useState<string | null>(null);

  const sortedProjects = useMemo(() => {
    const sorted = [...projects].sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'address':
          aValue = (a.fullAddress || a.parcel?.address || '').toLowerCase();
          bValue = (b.fullAddress || b.parcel?.address || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [projects, sortBy, sortOrder]);

  const handleProjectSelect = (projectId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('project', projectId);
    router.push(`/dashboard?${params.toString()}`);
  };

  const toggleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingProject(projectId);
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (selectedProject?.id === projectId) {
          router.push('/dashboard');
        } else {
          router.refresh();
        }
      } else {
        alert('Failed to delete project. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    } finally {
      setDeletingProject(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">CityWise AI</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{userEmail}</span>
              <form action="/api/auth/signout" method="post">
                <button className="text-sm text-gray-500 hover:text-gray-700">
                  Sign out
                </button>
              </form>
            </div>
          </div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Projects</h2>
            <Link
              href="/projects/new"
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              New
            </Link>
          </div>
          
          <div className="flex gap-1 text-xs">
            <span className="text-gray-500 mr-2">Sort by:</span>
            <button
              onClick={() => toggleSort('name')}
              className={`px-2 py-1 rounded ${
                sortBy === 'name' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('address')}
              className={`px-2 py-1 rounded ${
                sortBy === 'address' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Address {sortBy === 'address' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('date')}
              className={`px-2 py-1 rounded ${
                sortBy === 'date' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('status')}
              className={`px-2 py-1 rounded ${
                sortBy === 'status' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sortedProjects.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <div className="text-4xl mb-2">🏗️</div>
              <p className="text-sm">No projects yet</p>
              <p className="text-xs text-gray-400 mt-1">Create your first project to get started</p>
            </div>
          ) : (
            <div className="p-2">
              {sortedProjects.map((project) => {
                const displayAddress = project.fullAddress || project.parcel?.address;
                const isDeleting = deletingProject === project.id;
                return (
                  <div
                    key={project.id}
                    className={`relative group mb-2 rounded-lg transition-colors ${
                      selectedProject?.id === project.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <button
                      onClick={() => handleProjectSelect(project.id)}
                      disabled={isDeleting}
                      className="w-full text-left p-3 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="font-medium text-sm truncate">{project.name}</h3>
                          {displayAddress && (
                            <p className="text-xs text-gray-600 mt-1 truncate">
                              📍 {displayAddress}
                            </p>
                          )}
                          {project.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{project.description}</p>
                          )}
                        </div>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs flex-shrink-0 ${
                          project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                    </button>
                    
                    <button
                      onClick={(e) => handleDeleteProject(project.id, project.name, e)}
                      disabled={isDeleting}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-700 disabled:opacity-50"
                      title={`Delete ${project.name}`}
                    >
                      {isDeleting ? (
                        <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedProject ? (
          <ProjectDetailPanel project={selectedProject} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a Project</h3>
              <p className="text-gray-500">Choose a project from the sidebar to view its details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectDetailPanel({ project }: { project: Project }) {
  const router = useRouter();
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    
    setLoading(true);
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          title: taskTitle,
          description: taskDescription || null
        })
      });
      setTaskTitle('');
      setTaskDescription('');
      router.refresh();
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status: 'COMPLETED' })
      });
      router.refresh();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    
    try {
      await fetch(`/api/tasks?taskId=${taskId}`, {
        method: 'DELETE'
      });
      router.refresh();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    
    setLoading(true);
    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          content: noteContent
        })
      });
      setNoteContent('');
      router.refresh();
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;
    
    try {
      await fetch(`/api/notes?noteId=${noteId}`, {
        method: 'DELETE'
      });
      router.refresh();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleConvertToTasks = async () => {
    if (!confirm('Convert all required engineering items to tasks?')) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/requirements-to-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id })
      });
      const data = await response.json();
      alert(`Created ${data.created} new tasks`);
      router.refresh();
    } catch (error) {
      console.error('Error converting requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h1>
            {project.description && (
              <p className="text-gray-600 text-sm mb-3">{project.description}</p>
            )}
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                {project.status}
              </span>
              {project.fullAddress && (
                <span className="text-gray-600">📍 {project.fullAddress}</span>
              )}
              {project.propertyType && (
                <span className="text-gray-600">🏠 {project.propertyType}</span>
              )}
            </div>
          </div>
          <Link
            href={`/projects/${project.id}/edit`}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Edit Project
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {project.parcel && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Property Visualization</h2>
              <p className="text-sm text-gray-600 mt-1">
                Interactive map showing property boundaries
              </p>
            </div>
            <div className="p-6">
              <PropertyVisualization
                parcelData={{
                  latitude: project.parcel?.latitude ?? 0,
                  longitude: project.parcel?.longitude ?? 0,
                  boundaryCoordinates: (() => {
                    const rawBoundary = project.parcel?.boundaryCoordinates;
                    if (!rawBoundary) return [];
                    let coords = rawBoundary;
                    if (typeof coords === 'string') {
                      try {
                        coords = JSON.parse(coords);
                      } catch (e) {
                        console.error('Failed to parse boundaryCoordinates:', e);
                        return [];
                      }
                    }
                    if (Array.isArray(coords) && coords.length > 0 && Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
                      return coords[0];
                    }
                    return Array.isArray(coords) ? coords : [];
                  })(),
                  zoningRules: (() => {
                    const rules = project.parcel?.zoningRules;
                    if (!rules) return [];
                    if (typeof rules === 'string') {
                      try {
                        return JSON.parse(rules);
                      } catch (e) {
                        return [];
                      }
                    }
                    return Array.isArray(rules) ? rules : [];
                  })()
                }}
                parcelId={project.parcel?.id}
              />
            </div>
          </div>
        )}

        {project.engineeringReqs && project.engineeringReqs.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Engineering Requirements</h2>
              <button
                onClick={handleConvertToTasks}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
              >
                Convert to Tasks
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {project.engineeringReqs
                  .filter(req => req.required)
                  .map((req) => (
                    <div key={req.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {req.discipline || req.requirement}
                            </span>
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                              Required
                            </span>
                          </div>
                          {req.notes && (
                            <p className="text-sm text-gray-600 mt-1">{req.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                {project.engineeringReqs
                  .filter(req => !req.required)
                  .map((req) => (
                    <div key={req.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-700">
                              {req.discipline || req.requirement}
                            </span>
                            <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                              Optional
                            </span>
                          </div>
                          {req.notes && (
                            <p className="text-sm text-gray-600 mt-1">{req.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3 mb-6">
                {project.tasks && project.tasks.length > 0 ? (
                  project.tasks.map((task) => (
                    <div key={task.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className={`font-medium ${
                            task.status === 'COMPLETED' ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                          <span className={`text-xs inline-block mt-2 px-2 py-1 rounded ${
                            task.status === 'COMPLETED' 
                              ? 'bg-green-100 text-green-700'
                              : task.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            disabled={task.status === 'COMPLETED'}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Mark complete"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                            title="Delete task"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No tasks yet.</p>
                )}
              </div>

              <form onSubmit={handleAddTask} className="space-y-3 pt-4 border-t border-gray-200">
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Description (optional)..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={loading || !taskTitle.trim()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
                >
                  + Add Task
                </button>
              </form>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                {project.notes && project.notes.length > 0 ? (
                  project.notes.map((note) => (
                    <div key={note.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm text-gray-900 flex-1">{note.content}</p>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded ml-2"
                          title="Delete note"
                        >
                          ×
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No notes yet.</p>
                )}
              </div>

              <form onSubmit={handleAddNote} className="space-y-3 pt-4 border-t border-gray-200">
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Add a note..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="submit"
                  disabled={loading || !noteContent.trim()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
                >
                  Add Note
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">AI Project Assistant</h2>
          </div>
          <ProjectChatWrapper 
            projectId={project.id}
            projectData={{
              name: project.name,
              projectType: project.projectType || '',
              propertyType: project.propertyType || '',
              jurisdiction: project.parcel?.address?.split(',').slice(-2).join(',') || '',
              squareFootage: 0,
              scopeOfWork: '',
              hillsideGrade: false,
              onSeptic: false
            }}
            initialRequirements={(project.engineeringReqs || []).map(req => ({
              discipline: req.discipline || '',
              required: req.required,
              notes: req.notes || ''
            }))}
          />
        </div>
      </div>
    </div>
  );
}