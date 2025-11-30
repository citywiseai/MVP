import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import Link from "next/link"

const prisma = new PrismaClient()

export default async function PermitsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      memberships: {
        include: {
          org: {
            include: {
              projects: true
            }
          }
        }
      }
    }
  })

  const projects = user?.memberships[0]?.org?.projects || []

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-xl font-bold">CityWise</Link>
            <span className="text-sm">{session.user.email}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Permit Wizard</h1>
        <p className="text-gray-600 mb-6">Generate permit applications for your projects</p>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Select a Project</h2>
          
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No projects available</p>
              <Link href="/projects/new" className="text-blue-600 hover:text-blue-700">
                Create a project first →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/permits/wizard?projectId=${project.id}`}
                  className="block p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <h3 className="font-semibold">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-gray-600">{project.description}</p>
                  )}
                  {/* {project.Parcel && (
                    <p className="text-sm text-gray-500 mt-1">{project.Parcel.address}</p>
                  )} */}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}