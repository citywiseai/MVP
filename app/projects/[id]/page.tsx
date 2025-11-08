import { PrismaClient } from '@prisma/client'
import Link from 'next/link'

const prisma = new PrismaClient()

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  
  const project = await prisma.project.findUnique({
    where: { id: resolvedParams.id },
    include: {
      parcel: true,
      tasks: { orderBy: { createdAt: 'asc' } }
    }
  })

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2c4f6f] to-[#1e3a5f] py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h1 className="text-2xl font-bold text-[#1e3a5f] mb-4">Project Not Found</h1>
            <Link href="/projects" className="inline-block px-6 py-3 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2c4f6f]">
              Back to Projects
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2c4f6f] to-[#1e3a5f] py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-[#1e3a5f] mb-6">{project.name}</h1>
          
          {project.parcel && (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-4">Property Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Address:</span> {project.parcel.address}</div>
                <div><span className="font-medium">Lot Size:</span> {project.parcel.lotSizeSqFt?.toLocaleString()} sq ft</div>
                <div><span className="font-medium">Jurisdiction:</span> {project.parcel.jurisdiction}</div>
                <div><span className="font-medium">Zoning:</span> {project.parcel.zoningCode}</div>
              </div>
            </div>
          )}

          {project.description && (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-4">Project Summary</h2>
              <div className="whitespace-pre-wrap text-gray-700">{project.description}</div>
            </div>
          )}

          {project.tasks && project.tasks.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-4">Requirements</h2>
              <div className="space-y-2">
                {project.tasks.map((task) => (
                  <div key={task.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#1e3a5f]">{task.title}</h3>
                        {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
                      </div>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <Link href="/projects" className="inline-block px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
              Back to Projects
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
