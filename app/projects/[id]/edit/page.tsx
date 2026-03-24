import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import EditProjectForm from "./EditProjectForm"
import { getCategoriesForScopes, taskMatchesScope } from "@/lib/scope-mapping"
import { logScopeRemoval, logScopeAddition, logFieldUpdate } from "@/lib/audit-logger"
import { searchRegridParcel } from "@/lib/regrid"

const prisma = new PrismaClient()

async function updateProject(formData: FormData) {
  "use server"

  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  const projectId = formData.get('projectId') as string
  const projectTypes = formData.get('projectTypes') as string
  const userEmail = session.user.email || undefined

  // Convert project types to description
  const typesArray = projectTypes.split(',').filter(Boolean)
  const description = typesArray.map(type =>
    type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  ).join(', ')

  // Get the current project to compare scope changes and validate address
  const currentProject = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      description: true,
      projectType: true,
      name: true,
      fullAddress: true,
      propertyType: true,
      buildingFootprintSqFt: true,
      totalSfModified: true,
      parcelId: true,
      parcel: {
        select: {
          id: true,
          apn: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          zoning: true,
          lotSizeSqFt: true,
          latitude: true,
          longitude: true,
          boundaryCoordinates: true
        }
      }
    }
  })

  if (!currentProject) {
    return { error: 'Project not found' }
  }

  // Get the new address from formData
  const newAddress = formData.get('address') as string

  // ADDRESS VALIDATION: Check if address has changed and validate via Regrid
  if (newAddress && currentProject.fullAddress && newAddress !== currentProject.fullAddress) {
    console.log('🔍 Address changed, validating via Regrid...')
    console.log('  Old:', currentProject.fullAddress)
    console.log('  New:', newAddress)

    try {
      // Call Regrid API to validate the new address
      const regridResult = await searchRegridParcel(newAddress)

      if (!regridResult) {
        // No results from Regrid
        console.log('❌ Regrid returned no results for address:', newAddress)
        return {
          error: "We couldn't verify this address. Please check the spelling and try again."
        }
      }

      console.log('✅ Regrid found parcel:', regridResult.apn)

      // Compare APNs
      const currentApn = currentProject.parcel?.apn
      const newApn = regridResult.apn

      if (!currentApn) {
        console.log('⚠️ Current project has no APN, allowing address update')
        // No existing APN, allow the change and create/update parcel
      } else if (currentApn !== newApn) {
        // Different property - block the change
        console.log('❌ Different APN detected')
        console.log('  Current APN:', currentApn)
        console.log('  New APN:', newApn)
        return {
          error: "This address is a different property (different parcel ID). Please create a new project instead."
        }
      } else {
        // Same APN - it's a typo correction, allow it
        console.log('✅ Same APN, this is a typo correction')
      }

      // If we got here, the address change is valid
      // Update or create the parcel with fresh Regrid data
      if (currentProject.parcelId) {
        // Update existing parcel with fresh data
        await prisma.parcel.update({
          where: { id: currentProject.parcelId },
          data: {
            apn: regridResult.apn,
            address: regridResult.address,
            city: regridResult.city,
            state: regridResult.state,
            zipCode: regridResult.zip, // Map 'zip' from regrid to 'zipCode' in schema
            zoning: regridResult.zoning,
            lotSizeSqFt: regridResult.lotSizeSqFt,
            latitude: regridResult.latitude,
            longitude: regridResult.longitude,
            boundaryCoordinates: regridResult.boundaryCoordinates as any,
          }
        })
        console.log('✅ Updated parcel with fresh Regrid data')
      } else {
        // Create new parcel and link to project
        const newParcel = await prisma.parcel.create({
          data: {
            apn: regridResult.apn,
            address: regridResult.address,
            city: regridResult.city,
            state: regridResult.state,
            zipCode: regridResult.zip, // Map 'zip' from regrid to 'zipCode' in schema
            zoning: regridResult.zoning,
            lotSizeSqFt: regridResult.lotSizeSqFt,
            latitude: regridResult.latitude,
            longitude: regridResult.longitude,
            boundaryCoordinates: regridResult.boundaryCoordinates as any,
          }
        })
        // Link the new parcel to the project
        await prisma.project.update({
          where: { id: projectId },
          data: { parcelId: newParcel.id }
        })
        console.log('✅ Created new parcel and linked to project')
      }

      // Log address correction in audit trail
      await logFieldUpdate(
        projectId,
        'address',
        currentProject.fullAddress || '',
        newAddress,
        userEmail
      )
    } catch (error) {
      console.error('❌ Error validating address via Regrid:', error)
      return {
        error: "Failed to validate address. Please try again or contact support."
      }
    }
  }

  // Detect removed scope items
  if (currentProject) {
    const currentDescription = currentProject.description?.toLowerCase() || ''
    const currentTypes = currentDescription.split(',').map(t => t.trim())

    const newTypes = typesArray.map(t => t.toLowerCase().replace(/_/g, ' '))
    const removedScopes = currentTypes.filter(type =>
      !newTypes.some(newType => type.includes(newType) || newType.includes(type))
    )

    // If scopes were removed, soft-delete related tasks
    if (removedScopes.length > 0) {
      console.log('🗑️ Soft-deleting tasks for removed scopes:', removedScopes)

      // Get categories for removed scopes
      const categories = getCategoriesForScopes(removedScopes)

      if (categories.length > 0) {
        // Find all tasks that match these categories
        const tasksToDeactivate = await prisma.task.findMany({
          where: {
            projectId,
            isActive: true,
            OR: categories.map(category => ({
              category: {
                contains: category,
                mode: 'insensitive'
              }
            }))
          }
        })

        // Filter to double-check matches
        const taskIdsToDeactivate = tasksToDeactivate
          .filter(task => taskMatchesScope(task.category, removedScopes))
          .map(task => task.id)

        if (taskIdsToDeactivate.length > 0) {
          // Soft delete by setting isActive to false
          await prisma.task.updateMany({
            where: { id: { in: taskIdsToDeactivate } },
            data: { isActive: false }
          })
          console.log(`✅ Soft-deleted ${taskIdsToDeactivate.length} tasks`)

          // Log each scope removal in audit trail
          for (const scope of removedScopes) {
            const scopeTaskCount = tasksToDeactivate.filter(task =>
              taskMatchesScope(task.category, [scope])
            ).length

            await logScopeRemoval(
              projectId,
              scope,
              {
                requirementsAffected: 0, // Can be calculated if we track requirements
                tasksAffected: scopeTaskCount
              },
              userEmail
            )
          }
        }
      }
    }

    // Detect added scopes
    const addedScopes = newTypes.filter(type =>
      !currentTypes.some(currentType => currentType.includes(type) || type.includes(currentType))
    )

    if (addedScopes.length > 0) {
      console.log('➕ Scope items added:', addedScopes)
      // Log each scope addition
      for (const scope of addedScopes) {
        await logScopeAddition(
          projectId,
          scope,
          {
            requirementsAffected: 0,
            tasksAffected: 0
          },
          userEmail
        )
      }
    }
  }

  // Track field changes for audit logging (excluding address, which is logged above)
  const fieldChanges: Array<{ field: string; oldValue: string; newValue: string }> = []

  const newPropertyType = formData.get('propertyType') as string
  const newSquareFootage = formData.get('squareFootage')
    ? parseInt(formData.get('squareFootage') as string)
    : null
  const newTotalSfModified = formData.get('totalSfModified')
    ? parseInt(formData.get('totalSfModified') as string)
    : null

  // Compare and track changes (address changes are already logged above)
  if (currentProject) {

    if (currentProject.propertyType !== newPropertyType) {
      fieldChanges.push({
        field: 'propertyType',
        oldValue: currentProject.propertyType || '',
        newValue: newPropertyType
      })
    }

    const oldSquareFootage = currentProject.buildingFootprintSqFt
    if (oldSquareFootage !== newSquareFootage) {
      fieldChanges.push({
        field: 'buildingFootprintSqFt',
        oldValue: oldSquareFootage?.toString() || '',
        newValue: newSquareFootage?.toString() || ''
      })
    }

    const oldTotalSfModified = currentProject.totalSfModified
    if (oldTotalSfModified !== newTotalSfModified) {
      fieldChanges.push({
        field: 'totalSfModified',
        oldValue: oldTotalSfModified?.toString() || '',
        newValue: newTotalSfModified?.toString() || ''
      })
    }
  }

  // Update the project
  await prisma.project.update({
    where: { id: projectId },
    data: {
      name: newAddress ? `Project at ${newAddress}` : currentProject.name, // Generate name from address
      fullAddress: newAddress || currentProject.fullAddress,
      propertyType: newPropertyType,
      projectType: typesArray[0] || 'other', // Store first type as primary
      description: description || null, // Store formatted types as description
      buildingFootprintSqFt: newSquareFootage,
      totalSfModified: newTotalSfModified,
      // Don't update jurisdiction or lotSizeSqFt - they're read-only from parcel data
      updatedAt: new Date()
    }
  })

  console.log('✅ Project updated successfully')

  // Log field changes
  for (const change of fieldChanges) {
    await logFieldUpdate(
      projectId,
      change.field,
      change.oldValue,
      change.newValue,
      userEmail
    )
  }

  return { success: true, projectId }
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
    where: { id },
    include: {
      parcel: true
    }
  })

  if (!project) {
    notFound()
  }

  // If parcel data is available, use it for lot size and jurisdiction
  const enrichedProject = {
    ...project,
    lotSizeSqFt: project.parcel?.lotSizeSqFt || project.lotSizeSqFt,
    jurisdiction: project.parcel?.city || project.jurisdiction
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900">
      <nav className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Edit Project</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Edit Project Details</h2>
            <p className="text-gray-600 mt-2">Update your project information below.</p>
          </div>

          <EditProjectForm project={enrichedProject} onSubmit={updateProject} />
        </div>
      </main>
    </div>
  )
}