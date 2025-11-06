import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import Link from "next/link"

import PropertyVisualization from '@/components/PropertyVisualization'

const prisma = new PrismaClient()

// Server action to create a new task
async function createTask(formData: FormData) {
  "use server"
  
  const session = await auth()
  if (!session?.user) return
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! }
  })
  
  if (!user) return
  
  const projectId = formData.get('projectId') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string || null
  
  if (!projectId || !title) return
  
  await prisma.task.create({
    data: {
      projectId,
      title,
      description,
      createdBy: { connect: { id: user.id } },
      status: 'TODO',
    }
  })
  
  revalidatePath(`/projects/${projectId}`)
}

// Server action to mark a task as complete
async function completeTask(formData: FormData) {
  "use server"
  
  const session = await auth()
  if (!session?.user) return
  
  const taskId = formData.get('taskId') as string
  const projectId = formData.get('projectId') as string
  
  if (!taskId) return
  
  await prisma.task.update({
    where: { id: taskId },
    data: { status: 'COMPLETED' },
  })
  
  revalidatePath(`/projects/${projectId}`)
}

// Server action to delete a task
async function deleteTask(formData: FormData) {
  "use server"
  
  const session = await auth()
  if (!session?.user) return
  
  const taskId = formData.get('taskId') as string
  const projectId = formData.get('projectId') as string
  
  if (!taskId) return
  
  await prisma.task.delete({
    where: { id: taskId }
  })
  
  revalidatePath(`/projects/${projectId}`)
}

// Server action to create a note
async function createNote(formData: FormData) {
  "use server"
  
  const session = await auth()
  if (!session?.user) return
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! }
  })
  
  if (!user) return
  
  const projectId = formData.get('projectId') as string
  const content = formData.get('content') as string
  
  if (!projectId || !content) return
  
  await prisma.note.create({
    data: {
      projectId,
      content,
      author: { connect: { id: user.id } },
    }
  })
  
  revalidatePath(`/projects/${projectId}`)
}

// Server action to delete a note
async function deleteNote(formData: FormData) {
  "use server"
  
  const session = await auth()
  if (!session?.user) return
  
  const noteId = formData.get('noteId') as string
  const projectId = formData.get('projectId') as string
  
  if (!noteId) return
  
  await prisma.note.delete({
    where: { id: noteId }
  })
  
  revalidatePath(`/projects/${projectId}`)
}

// Server action to convert engineering requirements to tasks
async function convertRequirementsToTasks(formData: FormData) {
  "use server"
  
  const session = await auth()
  if (!session?.user) return
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! }
  })
  
  if (!user) return
  
  const projectId = formData.get('projectId') as string
  
  const requirements = await prisma.engineeringRequirement.findMany({
    where: { 
      projectId,
      required: true 
    }
  })
  
  // Create a task for each required engineering item
  for (const req of requirements) {
    // Check if task already exists
    const existingTask = await prisma.task.findFirst({
      where: {
        projectId,
        title: req.discipline || undefined
      }
    })
    
    if (!existingTask) {
      await prisma.task.create({
        data: {
      {/* DEBUG - Remove after testing */}
      {/* Debug log moved to useEffect or handler, not in JSX */}

      {/* Property Visualization - NEW INTERACTIVE MAP */}
      {(project as any).parcel && (() => {
        // Parse boundaryCoordinates properly
        let boundaryCoords: number[][] = []
        const rawBoundary = (project as any).parcel.boundaryCoordinates
        
        if (typeof rawBoundary === 'string') {
          try {
            boundaryCoords = JSON.parse(rawBoundary)
          } catch (e) {
            console.error('Failed to parse boundaryCoordinates:', e)
          }
        } else if (Array.isArray(rawBoundary)) {
          boundaryCoords = rawBoundary
        }

        // Debug log moved here
        console.log('✅ Final boundary coordinates:', {
          count: boundaryCoords.length,
          first: boundaryCoords[0],
          last: boundaryCoords[boundaryCoords.length - 1]
        })

        return (
          <PropertyVisualization
            parcelData={{
              latitude: (project as any).parcel.latitude,
              longitude: (project as any).parcel.longitude,
              boundaryCoordinates: boundaryCoords,
              zoningRules: zoningRules
            }}
            platMapUrl={
              zoningRules?.find((rule) => rule.type === 'subdivision')?.mcrweblink || undefined
            }
            subdivisionName={
              zoningRules?.find((rule) => rule.type === 'subdivision')?.name
            }
            platReference={
              zoningRules?.find((rule) => rule.type === 'subdivision')?.platBook
                ? `MCR ${zoningRules.find((rule) => rule.type === 'subdivision')?.platBook}-${
                    zoningRules.find((rule) => rule.type === 'subdivision')?.platPage
                  }`
                : undefined
            }
          />
        )
      })()}
export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      status: true,
      jurisdiction: true,
      lotSizeSqFt: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
      orgId: true,
      fullAddress: true,
      scopeOfWork: true,
      projectType: true,
      propertyType: true,
      buildingFootprintSqFt: true,
      parcelId: true,
      setbackFront: true,
      setbackRear: true,
      setbackSideLeft: true,
      setbackSideRight: true,
      parcel: true,
      notes: {
        orderBy: { createdAt: 'desc' }
      },
      projectFiles: {
        orderBy: { createdAt: 'desc' }
      },
      tasks: {
        orderBy: { createdAt: 'desc' }
      },
      engineeringRequirements: {
        orderBy: { createdAt: 'desc' }
      }
    },
  }) as {
    id: string
    status: string
    jurisdiction: string | null
    lotSizeSqFt: number | null
    createdAt: Date
    updatedAt: Date
    name: string
    userId: string | null
    orgId: string
    fullAddress: string | null
    scopeOfWork?: string | null
    projectType?: string | null
    propertyType?: string | null
    buildingFootprintSqFt?: number | null
    parcelId?: string | null
    parcel?: any
    notes?: any[]
    projectFiles?: any[]
    tasks?: any[]
    engineeringRequirements?: any[]
  }
  
  if (!project) {
    notFound()
  }

  // Encode address for Google Maps
  const encodedAddress = encodeURIComponent(project.fullAddress || '')

  // Extract zoningRules with mcrweblink type
  const zoningRules = (project as any).parcel?.zoningRules as Array<{
    type: string
    name?: string
    code?: string
    platBook?: string
    platPage?: string
    mcrweblink?: string
  }> | undefined

  return (
    <div className="min-h-screen bg-gray-50">
      {/* DEBUG */}
      <div className="bg-yellow-200 p-4 text-xs">
        <p>Project ID: {project.id}</p>
        <p>Has Parcel: {(project as any).parcel ? 'YES' : 'NO'}</p>
        <p>Parcel ID: {(project as any).parcelId || 'null'}</p>
        {(project as any).parcel && (
          <>
            <p>Parcel APN: {(project as any).parcel.apn}</p>
            <p>Lat/Lng: {(project as any).parcel.latitude}, {(project as any).parcel.longitude}</p>
            <p>Boundary Coords: {JSON.stringify((project as any).parcel.boundaryCoordinates).substring(0, 100)}...</p>
            <p>Zoning Rules: {JSON.stringify((project as any).parcel.zoningRules).substring(0, 200)}...</p>
          </>
        )}
      </div>
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-xl font-bold">CityWise AI</Link>
            <span className="text-sm">{session.user.email}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/projects" className="text-blue-600 text-sm mb-4 inline-block">
          ← Back to Projects
        </Link>

        {/* Project Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
          {project.scopeOfWork && (
            <p className="text-gray-600 mb-4">{project.scopeOfWork}</p>
          )}
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            {project.status}
          </span>
        </div>

        {/* Property Details */}
        {project.fullAddress && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Property Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{project.fullAddress}</p>
              </div>
              {project.jurisdiction && (
                <div>
                  <p className="text-sm text-gray-500">Jurisdiction</p>
                  <p className="font-medium">{project.jurisdiction}</p>
                </div>
              )}
              {project.propertyType && (
                <div>
                  <p className="text-sm text-gray-500">Property Type</p>
                  <p className="font-medium capitalize">{project.propertyType}</p>
                </div>
              )}
              {project.projectType && (
                <div>
                  <p className="text-sm text-gray-500">Project Type</p>
                  <p className="font-medium capitalize">{project.projectType.replace(/_/g, ' ')}</p>
                </div>
              )}
              {project.lotSizeSqFt && (
                <div>
                  <p className="text-sm text-gray-500">Lot Size</p>
                  <p className="font-medium">{project.lotSizeSqFt.toLocaleString()} sq ft</p>
                </div>
              )}
              {project.buildingFootprintSqFt && (
                <div>
                  <p className="text-sm text-gray-500">Building Footprint</p>
                  <p className="font-medium">{project.buildingFootprintSqFt.toLocaleString()} sq ft</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Property Visualization - NEW INTERACTIVE MAP */}
        {(project as any).parcel && (() => {
          // Extract zoningRules
          const zoningRules = (project as any).parcel?.zoningRules as Array<{
            type: string
            name?: string
            code?: string
            platBook?: string
            platPage?: string
            mcrweblink?: string
          }> | undefined

          // Parse boundaryCoordinates properly
          let boundaryCoords: number[][] = []
          const rawBoundary = (project as any).parcel.boundaryCoordinates
          
          if (typeof rawBoundary === 'string') {
            try {
              boundaryCoords = JSON.parse(rawBoundary)
            } catch (e) {
              console.error('Failed to parse boundaryCoordinates:', e)
            }
          } else if (Array.isArray(rawBoundary)) {
            boundaryCoords = rawBoundary
          }

          // Debug log
          console.log('✅ Final boundary coordinates:', {
            count: boundaryCoords.length,
            first: boundaryCoords[0],
            last: boundaryCoords[boundaryCoords.length - 1]
          })

          return (
            <PropertyVisualization
              projectId={project.id}
              parcelData={{
                latitude: (project as any).parcel.latitude,
                longitude: (project as any).parcel.longitude,
                boundaryCoordinates: boundaryCoords,
                zoningRules: zoningRules
              }}
              initialSetbacks={{
                front: project.setbackFront ?? 25,
                rear: project.setbackRear ?? 20,
                sideLeft: project.setbackSideLeft ?? 10,
                sideRight: project.setbackSideRight ?? 10,
              }}
              platMapUrl={
                zoningRules?.find((rule) => rule.type === 'subdivision')?.mcrweblink || undefined
              }
              subdivisionName={
                zoningRules?.find((rule) => rule.type === 'subdivision')?.name
              }
              platReference={
                zoningRules?.find((rule) => rule.type === 'subdivision')?.platBook
                  ? `MCR ${zoningRules.find((rule) => rule.type === 'subdivision')?.platBook}-$
                      {zoningRules.find((rule) => rule.type === 'subdivision')?.platPage}
                    `
                  : undefined
              }
            />
          )
        })()}

        {/* Maps Section */}
        {project.fullAddress && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Additional Maps</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Satellite View */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Satellite View</h3>
                <iframe
                  width="100%"
                  height="300"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodedAddress}&maptype=satellite`}
                  allowFullScreen
                  className="rounded-lg"
                />
              </div>

              {/* Street View */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Street View</h3>
                <iframe
                  width="100%"
                  height="300"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://www.google.com/maps/embed/v1/streetview?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&location=${encodedAddress}`}
                  allowFullScreen
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

  {/* Engineering Requirements */}
  {project.engineeringRequirements && project.engineeringRequirements.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Engineering Requirements</h2>
              <form action={convertRequirementsToTasks}>
                <input type="hidden" name="projectId" value={project.id} />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Convert to Tasks
                </button>
              </form>
            </div>
            <div className="space-y-3">
              {project.engineeringRequirements.map((req: {
                id: string;
                discipline: string;
                status: string;
                required: boolean;
                notes?: string;
              }) => (
                <div key={req.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{req.discipline}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        req.status === 'completed' ? 'bg-green-100 text-green-800' :
                        req.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {req.status}
                      </span>
                      {req.required && (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    {req.notes && (
                      <p className="text-sm text-gray-600">{req.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Click "Convert to Tasks" to automatically create tasks for each required engineering item
            </p>
          </div>
        )}

        {/* Tasks and Notes Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Tasks */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Tasks</h2>
            <div className="space-y-3 mb-4">
              {project.tasks && project.tasks.length > 0 ? (
                project.tasks.map((task: {
                  id: string;
                  title: string;
                  description?: string;
                  status: string;
                }) => (
                  <div key={task.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className={`font-medium ${task.status === 'COMPLETED' ? 'line-through text-gray-500' : ''}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                        <span className={`text-xs inline-block mt-1 px-2 py-1 rounded ${
                          task.status === 'COMPLETED' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <form action={completeTask}>
                          <input type="hidden" name="taskId" value={task.id} />
                          <input type="hidden" name="projectId" value={project.id} />
                          <button
                            type="submit"
                            disabled={task.status === 'COMPLETED'}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Mark complete"
                          >
                            ✓
                          </button>
                        </form>
                        <form action={deleteTask}>
                          <input type="hidden" name="taskId" value={task.id} />
                          <input type="hidden" name="projectId" value={project.id} />
                          <button
                            type="submit"
                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                            title="Delete task"
                          >
                            ×
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No tasks yet. Add one below or convert engineering requirements to tasks.</p>
              )}
            </div>
            
            {/* Add Task Form */}
            <form action={createTask} className="space-y-2 pt-4 border-t">
              <input type="hidden" name="projectId" value={project.id} />
              <input
                name="title"
                placeholder="Task title..."
                required
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
              <textarea
                name="description"
                placeholder="Description (optional)..."
                rows={2}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                + Add Task
              </button>
            </form>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Notes</h2>
            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
              {project.notes && project.notes.length > 0 ? (
                project.notes.map((note: {
                  id: string;
                  content: string;
                  user?: { name?: string; email?: string };
                  createdAt: string | Date;
                }) => (
                  <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm flex-1">{note.content}</p>
                      <form action={deleteNote}>
                        <input type="hidden" name="noteId" value={note.id} />
                        <input type="hidden" name="projectId" value={project.id} />
                        <button
                          type="submit"
                          className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete note"
                        >
                          ×
                        </button>
                      </form>
                    </div>
                    <p className="text-xs text-gray-500">
                      {note.user?.name || note.user?.email} • {new Date(note.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No notes yet.</p>
              )}
            </div>
            
            {/* Add Note Form */}
            <form action={createNote} className="space-y-2 pt-4 border-t">
              <input type="hidden" name="projectId" value={project.id} />
              <textarea
                name="content"
                placeholder="Add a note..."
                required
                rows={3}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Add Note
              </button>
            </form>
          </div>
        </div>

        {/* Files */}
        {project.projectFiles && project.projectFiles.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Files</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.projectFiles.map((file: {
                id: string;
                filename: string;
                filepath: string;
                fileSize: number;
                createdAt: string | Date;
              }) => (
                <div key={file.id} className="p-4 border rounded-lg hover:border-blue-300 transition">
                  <a 
                    href={file.filepath}
                    target="_blank"
                    className="text-blue-600 hover:text-blue-700 font-medium block mb-1"
                  >
                    📄 {file.filename}
                  </a>
                  <p className="text-xs text-gray-500">
                    {(file.fileSize / 1024).toFixed(1)} KB • {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}