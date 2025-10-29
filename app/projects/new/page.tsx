import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import Link from "next/link"
import NewProjectClientForm from './NewProjectClientForm'
import { analyzeProjectScope } from "@/lib/ai"

const prisma = new PrismaClient()

export default async function NewProjectPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  async function createProject(formData: FormData) {
    "use server"
    
    const user = await prisma.user.findUnique({
      where: { email: session?.user?.email! },
      include: {
        memberships: true
      }
    })
    
    if (!user) {
      throw new Error('User not found')
    }
    
    let orgId = user.memberships[0]?.orgId
    
    if (!orgId) {
      const userEmail = user.email
      const orgName = userEmail.split('@')[0] + "'s Organization"
      const orgSlug = userEmail.replace('@', '-').replace('.', '-')
      
      const org = await prisma.org.create({
        data: {
          name: orgName,
          slug: orgSlug,
        }
      })
      
      await prisma.membership.create({
        data: {
          userId: user.id,
          orgId: org.id,
          role: 'OWNER',
        }
      })
      
      orgId = org.id
    }

    const fullAddress = formData.get('fullAddress') as string
    let parcelId: string | null = null
    
    if (fullAddress && (fullAddress.toLowerCase().includes('phoenix') || fullAddress.toLowerCase().includes('az'))) {
      try {
        console.log('🔍 Attempting to fetch parcel data for:', fullAddress)
        const { getMaricopaParcelByAddress } = await import('@/lib/regrid')
        const streetAddress = fullAddress.split(',')[0].trim()
        console.log('🔍 Street address:', streetAddress)
        
        const parcelData = await getMaricopaParcelByAddress(streetAddress)
        console.log('📦 Parcel data received:', parcelData)
        
        if (parcelData) {
          console.log('✅ Creating/updating parcel with APN:', parcelData.apn)
          
          // Fetch subdivision/plat info
          const { getSubdivisionPlat } = await import('@/lib/regrid')
          const subdivisionInfo = await getSubdivisionPlat(parcelData.apn)
          console.log('📋 Subdivision/Plat info:', subdivisionInfo)
          
          const parcel = await prisma.parcel.upsert({
            where: { apn: parcelData.apn },
            create: {
              apn: parcelData.apn,
              address: `${parcelData.address}, ${parcelData.city}, AZ ${parcelData.zip}`,
              jurisdiction: parcelData.city,
              zoningCode: '',
              lotSizeSqFt: Math.round(parcelData.lotSizeSqFt),
              latitude: parcelData.latitude,
              longitude: parcelData.longitude,
              boundaryCoordinates: parcelData.boundaryRings,
              zoningRules: subdivisionInfo ? [{
                type: 'subdivision',
                name: subdivisionInfo.subdivision,
                platBook: subdivisionInfo.platBook,
                platPage: subdivisionInfo.platPage
              }] : []
            },
            update: {
              address: `${parcelData.address}, ${parcelData.city}, AZ ${parcelData.zip}`,
              jurisdiction: parcelData.city,
              lotSizeSqFt: Math.round(parcelData.lotSizeSqFt),
              latitude: parcelData.latitude,
              longitude: parcelData.longitude,
              boundaryCoordinates: parcelData.boundaryRings,
              zoningRules: subdivisionInfo ? [{
                type: 'subdivision',
                name: subdivisionInfo.subdivision,
                platBook: subdivisionInfo.platBook,
                platPage: subdivisionInfo.platPage
              }] : []
            }
          })
          
          parcelId = parcel.id
        }
      } catch (error) {
        console.error('Error fetching parcel data:', error)
      }
    }
    
    const projectData = {
      name: formData.get('name') as string || `Project at ${fullAddress.split(",")[0]}`,
      fullAddress: fullAddress,
      propertyType: formData.get('propertyType') as string,
      jurisdiction: formData.get('jurisdiction') as string || null,
      projectType: formData.get('projectType') as string,
      lotSizeSqFt: formData.get('lotSizeSqFt') ? parseInt(formData.get('lotSizeSqFt') as string) : null,
      buildingFootprintSqFt: formData.get('buildingFootprintSqFt') ? parseInt(formData.get('buildingFootprintSqFt') as string) : null,
      totalSfModified: formData.get('totalSfModified') ? parseInt(formData.get('totalSfModified') as string) : null,
      description: formData.get('scopeOfWork') as string || null,
      scopeOfWork: formData.get('scopeOfWork') as string || null,
    }
    
    const project = await prisma.project.create({
      data: {
        ...projectData,
        org: {
          connect: { id: orgId }
        },
        owner: {
          connect: { id: user.id }
        },
        parcel: parcelId ? {
          connect: { id: parcelId }
        } : undefined
      }
    })
    
    try {
      const requirements = await analyzeProjectScope({
        projectType: projectData.projectType,
        squareFootage: projectData.buildingFootprintSqFt || projectData.totalSfModified || 1000,
        scopeOfWork: projectData.description || `${projectData.projectType} project`,
        propertyType: projectData.propertyType,
        hillsideGrade: false,
        onSeptic: false
      })
      
      if (requirements.length > 0) {
        await prisma.engineeringRequirement.createMany({
          data: requirements.map((req: any, index: number) => ({
            id: `eng_req_${project.id}_${index}`,
            projectId: project.id,
            requirement: req.notes || req.discipline || 'Engineering requirement',
            discipline: req.discipline,
            required: req.required,
            notes: req.notes
          }))
        })
      }
    } catch (error) {
      console.error('Error generating engineering requirements:', error)
    }
    
    redirect(`/dashboard?project=${project.id}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800">
          ← Back to Dashboard
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-8">Create New Project</h1>
      
      <form action={createProject} className="max-w-2xl space-y-6">
        <NewProjectClientForm />
        
        <button 
          type="submit" 
          className="w-full bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 font-medium"
        >
          Create Project
        </button>
      </form>
    </div>
  )
}