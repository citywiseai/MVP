import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function updateProject(formData: FormData) {
  "use server"
  
  const session = await auth()
  if (!session?.user) return

  const projectId = formData.get('projectId') as string
  
  await prisma.project.update({
    where: { id: projectId },
    data: {
      name: formData.get('name') as string,
      projectType: formData.get('projectType') as string,
      propertyType: formData.get('propertyType') as string,
      jurisdiction: formData.get('jurisdiction') as string,
      description: formData.get('scopeOfWork') as string,
      buildingFootprintSqFt: formData.get('squareFootage') ? parseInt(formData.get('squareFootage') as string) : null,
      totalSfModified: formData.get('totalSfModified') ? parseInt(formData.get('totalSfModified') as string) : null,
      lotSizeSqFt: formData.get('lotSizeSqFt') ? parseInt(formData.get('lotSizeSqFt') as string) : null,
      updatedAt: new Date()
    }
  })
  
  redirect(`/projects/${projectId}`)
}

export default async function EditProjectPage({
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
    where: { id }
  })

  if (!project) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Edit Project</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit Project Details</h2>
            <p className="text-gray-600 mt-2">Update your project information below.</p>
          </div>

          <form action={updateProject} className="space-y-6">
            <input type="hidden" name="projectId" value={project.id} />
            
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={project.name}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My Development Project"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Type *
                </label>
                <select
                  name="projectType"
                  defaultValue={project.projectType || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select project type...</option>
                  <option value="new_construction">New Construction</option>
                  <option value="addition">Addition</option>
                  <option value="remodel">Remodel</option>
                  <option value="adu">ADU (Accessory Dwelling Unit)</option>
                  <option value="deck">Deck/Patio</option>
                  <option value="other">Other</option>
                </select>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jurisdiction *
                </label>
                <input
                  type="text"
                  name="jurisdiction"
                  defaultValue={project.jurisdiction || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City, County, or Municipality"
                />
              </div>
            </div>

            {/* Project Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scope of Work *
              </label>
              <textarea
                name="scopeOfWork"
                defaultValue={project.description || ''}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what you're planning to build or modify..."
              />
            </div>

            {/* Building Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lot Size (Sq Ft)
                </label>
                <input
                  type="number"
                  name="lotSizeSqFt"
                  defaultValue={project.lotSizeSqFt || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="8000"
                />
              </div>
            </div>

            {/* Property Characteristics */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Property Characteristics</h3>
              
              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="hillsideGrade"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Hillside Property (&gt;10% grade)</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="onSeptic"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">On Septic System</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-6 border-t">
              <a
                href={`/projects/${project.id}`}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </a>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}