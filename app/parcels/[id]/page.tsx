import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import { analyzeZoning } from "@/lib/ai"
import Link from "next/link"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

async function runAnalysis(formData: FormData) {
  "use server"
  
  const parcelId = formData.get('parcelId') as string
  
  const parcel = await prisma.parcel.findUnique({
    where: { id: parcelId },
    include: { zoningRules: true }
  })
  
  if (!parcel) return

  const analysis = await analyzeZoning({
    address: parcel.address,
    zoningCode: parcel.zoningCode,
    lotSizeSqFt: parcel.lotSizeSqFt,
    zoningRules: parcel.zoningRules
  })
  
  // Still need to use redirect for now since server actions in forms must return void
  redirect(`/parcels/${parcelId}?analysis=${encodeURIComponent(analysis)}`)
}

export default async function ParcelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ analysis?: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params
  const { analysis: analysisParam } = await searchParams
  const analysis = analysisParam ? decodeURIComponent(analysisParam) : null

  const parcel = await prisma.parcel.findUnique({
    where: { id },
    include: {
      zoningRules: true,
      projects: {
        include: {
          org: true
        }
      }
    }
  })

  if (!parcel) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-xl font-bold">CityWise AI</Link>
            <span className="text-sm">{session.user.email}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/parcels" className="text-blue-600 text-sm mb-4 inline-block">
          ← Back to Parcel Search
        </Link>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">{parcel.address}</h1>
          
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">APN</p>
              <p className="font-medium">{parcel.apn}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Zoning</p>
              <p className="font-medium">{parcel.zoningCode}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Lot Size</p>
              <p className="font-medium">{parcel.lotSizeSqFt.toLocaleString()} sq ft</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Jurisdiction</p>
              <p className="font-medium">{parcel.jurisdiction}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/projects/new?parcelId=${parcel.id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Project
            </Link>
          </div>

          <div>
            <h3 className="font-semibold mb-3">AI Zoning Analysis</h3>
            {analysis ? (
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{analysis}</p>
                <form action={runAnalysis} className="mt-3">
                  <input type="hidden" name="parcelId" value={parcel.id} />
                  <button
                    type="submit"
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Run New Analysis
                  </button>
                </form>
              </div>
            ) : (
              <form action={runAnalysis}>
                <input type="hidden" name="parcelId" value={parcel.id} />
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Analyze Development Potential
                </button>
              </form>
            )}
          </div>
        </div>

        {parcel.zoningRules.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Zoning Rules</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {parcel.zoningRules.map((rule) => (
                <div key={rule.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {rule.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="font-bold">
                      {rule.value} {rule.unit}
                    </span>
                  </div>
                  {rule.notes && (
                    <p className="text-xs text-gray-600 mt-1">{rule.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {parcel.projects.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Related Projects</h2>
            <div className="space-y-3">
              {parcel.projects.map((project) => (
                <div key={project.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-gray-600">{project.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {project.org.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        {project.status}
                      </span>
                      <Link
                        href={`/projects/${project.id}`}
                        className="block text-xs text-blue-600 mt-1"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}