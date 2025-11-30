import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import Link from "next/link"
import { ParcelMap } from "@/components/ParcelMap"

const prisma = new PrismaClient()

export default async function ParcelsPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const query = searchParams.q || ''
  
  const parcels = query
    ? await prisma.parcel.findMany({
        where: {
          OR: [
            { address: { contains: query, mode: 'insensitive' } },
            { apn: { contains: query, mode: 'insensitive' } },
            { jurisdiction: { contains: query, mode: 'insensitive' } },
          ]
        },
        include: {
          // zoningRules: true
        },
        take: 20
      })
    : []

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

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Parcel Search</h1>

        <form method="get" className="mb-6">
          <div className="flex gap-2">
            <input
              name="q"
              type="text"
              defaultValue={query}
              placeholder="Search by address, APN, or jurisdiction..."
              className="flex-1 px-4 py-2 border rounded-md"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </form>

        {query && parcels.length > 0 && (
          <div className="mb-6">
            {/* <ParcelMap parcels={parcels} /> */}
          </div>
        )}

        {query && (
          <div className="space-y-4">
            {parcels.length === 0 ? (
              <p className="text-gray-500">No parcels found matching "{query}"</p>
            ) : (
              parcels.map((parcel) => (
                <div key={parcel.id} className="bg-white p-6 rounded-lg shadow">
                  <h3 className="font-semibold text-lg mb-2">{parcel.address}</h3>
                  <div className="grid md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-500">APN:</span>
                      <p className="font-medium">{parcel.apn}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Zoning:</span>
                      <p className="font-medium">{parcel.zoningCode}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Lot Size:</span>
                      <p className="font-medium">{parcel.lotSizeSqFt.toLocaleString()} sq ft</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Jurisdiction:</span>
                      <p className="font-medium">{parcel.jurisdiction}</p>
                    </div>
                  </div>
                  
                  {parcel.zoningRules.length > 0 && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-2">Zoning Rules:</p>
                      <div className="grid md:grid-cols-3 gap-2">
                        {parcel.zoningRules.slice(0, 3).map((rule) => (
                          <div key={rule.id} className="text-sm">
                            <span className="text-gray-600">{rule.field.replace(/_/g, ' ')}:</span>
                            <span className="ml-1 font-medium">{rule.value} {rule.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <Link
                      href={`/parcels/${parcel.id}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!query && (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-2">Enter an address, APN, or jurisdiction to search for parcels</p>
            <p className="text-sm">Try searching for "Redfield" or "Phoenix"</p>
          </div>
        )}
      </main>
    </div>
  )
}