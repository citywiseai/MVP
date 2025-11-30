import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import Link from "next/link"
import { generateEngineeringRequirements } from "@/lib/engineering"
import { checkMunicipalRequirements } from "@/lib/ai"

const prisma = new PrismaClient()

async function verifyRequirements(formData: FormData) {
  "use server"
  
  const projectId = formData.get('projectId') as string
  
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      Parcel: true,
      engineeringReqs: true
    }
  })
  
  if (!project || !project.Parcel) {
    redirect(`/permits/wizard?projectId=${projectId}&error=missing-data`)
    return
  }
  
  // Extract project details from description or use defaults
  const descParts = project.description?.split('-') || []
  const projectType = descParts[0]?.trim() || 'unknown'
  const sqftMatch = descParts[1]?.match(/(\d+)/)
  const squareFootage = sqftMatch ? parseInt(sqftMatch[1]) : 2000
  
  const verification = await checkMunicipalRequirements({
    jurisdiction: project.Parcel.jurisdiction,
    projectType,
    squareFootage,
    zoningCode: project.Parcel.zoningCode
  })
  
  redirect(`/permits/wizard?projectId=${projectId}&verification=${encodeURIComponent(verification)}`)
}

async function generatePermit(formData: FormData) {
  "use server"
  
  const projectId = formData.get('projectId') as string
  const projectType = formData.get('projectType') as string
  const squareFootage = parseInt(formData.get('squareFootage') as string)
  const stories = parseInt(formData.get('stories') as string)
  const applicantName = formData.get('applicantName') as string
  const applicantPhone = formData.get('applicantPhone') as string
  const applicantEmail = formData.get('applicantEmail') as string
  
  // Generate engineering requirements
  const engReqs = generateEngineeringRequirements({
    projectType,
    squareFootage,
    stories
  })
  
  // Save engineering requirements to database
  for (const req of engReqs) {
    await prisma.engineeringRequirement.create({
      data: {
        projectId,
        discipline: req.discipline,
        required: req.required,
        notes: req.notes,
        status: 'pending'
      }
    })
  }
  
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      Parcel: {
        include: {
          zoningRules: true
        }
      }
    }
  })
  
  if (!project) return
  
  const permitData = {
    projectName: project.name,
    address: project.Parcel?.address || 'N/A',
    apn: project.Parcel?.apn || 'N/A',
    zoning: project.Parcel?.zoningCode || 'N/A',
    projectType,
    squareFootage: squareFootage.toString(),
    stories: stories.toString(),
    applicant: {
      name: applicantName,
      phone: applicantPhone,
      email: applicantEmail
    },
    zoningRules: project.Parcel?.zoningRules || [],
    engineeringReqs: engReqs,
    generatedAt: new Date().toLocaleDateString()
  }
  
  redirect(`/permits/result?data=${encodeURIComponent(JSON.stringify(permitData))}`)
}

export default async function PermitWizardPage({
  searchParams,
}: {
  searchParams: { projectId?: string; verification?: string }
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  if (!searchParams.projectId) {
    redirect('/permits')
  }

  const project = await prisma.project.findUnique({
    where: { id: searchParams.projectId },
    include: {
      Parcel: true
    }
  })

  if (!project) {
    notFound()
  }

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

      <main className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/permits" className="text-blue-600 text-sm mb-4 inline-block">
          ← Back to Permits
        </Link>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Building Permit Application</h1>
          <p className="text-gray-600 mb-6">for {project.name}</p>

          {searchParams.verification && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <h3 className="font-semibold text-yellow-800 mb-2">Municipal Requirements Verification</h3>
              <div className="text-sm text-yellow-700 whitespace-pre-wrap">
                {decodeURIComponent(searchParams.verification)}
              </div>
              <p className="text-sm text-yellow-800 mt-3 font-medium">
                Review these requirements. Ensure all engineering documentation is complete before proceeding.
              </p>
            </div>
          )}

          {!searchParams.verification && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-700 mb-3">
                Before filling out the permit application, verify all municipal requirements are met.
              </p>
              <form action={verifyRequirements}>
                <input type="hidden" name="projectId" value={project.id} />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Verify Municipal Requirements with AI
                </button>
              </form>
            </div>
          )}

          <form action={generatePermit} className="space-y-6">
            <input type="hidden" name="projectId" value={project.id} />

            <div>
              <h3 className="font-semibold mb-4">Project Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Project Type</label>
                  <select name="projectType" required className="w-full px-3 py-2 border rounded-md">
                    <option value="">Select type...</option>
                    <option value="new_construction">New Construction</option>
                    <option value="addition">Addition</option>
                    <option value="remodel">Remodel</option>
                    <option value="adu">Accessory Dwelling Unit (ADU)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Square Footage</label>
                  <input
                    name="squareFootage"
                    type="number"
                    required
                    placeholder="e.g., 2400"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Number of Stories</label>
                  <select name="stories" required className="w-full px-3 py-2 border rounded-md">
                    <option value="1">1 Story</option>
                    <option value="2">2 Stories</option>
                    <option value="3">3 Stories</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Applicant Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    name="applicantName"
                    type="text"
                    required
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    name="applicantPhone"
                    type="tel"
                    required
                    placeholder="(555) 123-4567"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    name="applicantEmail"
                    type="email"
                    required
                    defaultValue={session.user.email || ''}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Generate Permit Application
              </button>
              <Link
                href="/permits"
                className="px-6 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}