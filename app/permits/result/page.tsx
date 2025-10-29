import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PrintButton } from "@/components/PrintButton"
import { PermitChecklist } from "@/components/PermitChecklist"

export default async function PermitResultPage({
  searchParams,
}: {
  searchParams: { data?: string }
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  if (!searchParams.data) {
    redirect('/permits')
  }

  const permitData = JSON.parse(decodeURIComponent(searchParams.data))

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

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">✅</div>
            <h1 className="text-2xl font-bold mb-2">Permit Application Generated</h1>
            <p className="text-gray-600">Your building permit application is ready</p>
          </div>

          <div className="border-t border-b py-6 my-6">
            <h2 className="font-bold text-xl mb-4">BUILDING PERMIT APPLICATION</h2>
            <div className="text-sm text-gray-500 mb-4">Generated: {permitData.generatedAt}</div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Project Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Project Name:</span>
                    <p className="font-medium">{permitData.projectName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Property Address:</span>
                    <p className="font-medium">{permitData.address}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">APN:</span>
                    <p className="font-medium">{permitData.apn}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Zoning:</span>
                    <p className="font-medium">{permitData.zoning}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Project Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Project Type:</span>
                    <p className="font-medium">{permitData.projectType.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Square Footage:</span>
                    <p className="font-medium">{permitData.squareFootage} sq ft</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Stories:</span>
                    <p className="font-medium">{permitData.stories}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Applicant Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-medium">{permitData.applicant.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="font-medium">{permitData.applicant.phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium">{permitData.applicant.email}</p>
                  </div>
                </div>
              </div>

              {permitData.zoningRules.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Applicable Zoning Requirements</h3>
                  <div className="space-y-2 text-sm">
                    {permitData.zoningRules.map((rule: any, i: number) => (
                      <div key={i} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>{rule.field.replace(/_/g, ' ')}</span>
                        <span className="font-medium">{rule.value} {rule.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {permitData.engineeringReqs && permitData.engineeringReqs.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Engineering Requirements Generated</h3>
                  <div className="space-y-2 text-sm">
                    {permitData.engineeringReqs.map((req: any, i: number) => (
                      <div key={i} className="p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{req.discipline}</span>
                          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                            Auto-Generated
                          </span>
                        </div>
                        <p className="text-gray-600">{req.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <PermitChecklist 
              projectType={permitData.projectType}
              squareFootage={parseInt(permitData.squareFootage)}
              stories={parseInt(permitData.stories)}
            />
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Next Steps</h3>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Review the application details above</li>
                <li>Print this page or save as PDF</li>
                <li>Gather required documents (site plan, elevations, etc.)</li>
                <li>Submit to {permitData.address.includes('Phoenix') ? 'City of Phoenix' : 'your local'} Building Department</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <PrintButton />
              <Link
                href="/permits"
                className="px-6 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Create Another
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-2 border rounded-md hover:bg-gray-50"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}