/**
 * Project Migration/Repair Script
 *
 * Fixes and syncs all existing projects to ensure consistent, complete data.
 *
 * Usage:
 *   npx tsx scripts/fix-projects.ts              # Dry run (no changes)
 *   npx tsx scripts/fix-projects.ts --commit     # Actually save changes
 *   npx tsx scripts/fix-projects.ts --project-id=abc123  # Fix specific project
 */

import { PrismaClient } from '@prisma/client'
import { searchRegridParcel } from '../lib/regrid'
import { getRequirementsForProject, parseProjectDataToDetails } from '../lib/requirements'

const prisma = new PrismaClient()

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = !args.includes('--commit')
const specificProjectId = args.find(arg => arg.startsWith('--project-id='))?.split('=')[1]

interface FixLog {
  projectId: string
  projectName: string
  changes: string[]
  warnings: string[]
  errors: string[]
}

const allLogs: FixLog[] = []

function createLog(projectId: string, projectName: string): FixLog {
  const log: FixLog = {
    projectId,
    projectName,
    changes: [],
    warnings: [],
    errors: []
  }
  allLogs.push(log)
  return log
}

async function fixProject(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      parcel: true,
      tasks: true
    }
  })

  if (!project) {
    console.error(`❌ Project ${projectId} not found`)
    return
  }

  const log = createLog(project.id, project.name)
  console.log(`\n🔧 Processing: ${project.name} (${project.id})`)

  // Track updates for this project
  const updates: any = {}
  let parcelUpdates: any = null
  let shouldCreateParcel = false

  // ======================
  // 1. RE-FETCH PARCEL DATA
  // ======================
  if (project.fullAddress) {
    try {
      console.log(`  📍 Fetching fresh parcel data for: ${project.fullAddress}`)
      const parcelData = await searchRegridParcel(project.fullAddress)

      if (parcelData) {
        console.log(`  ✅ Regrid returned data (APN: ${parcelData.apn})`)

        // Check if we need to update or create parcel
        if (project.parcel) {
          // Update existing parcel
          parcelUpdates = {
            apn: parcelData.apn,
            address: parcelData.address,
            city: parcelData.city,
            state: parcelData.state,
            zipCode: parcelData.zip,
            zoning: parcelData.zoning,
            lotSizeSqFt: parcelData.lotSizeSqFt,
            latitude: parcelData.latitude,
            longitude: parcelData.longitude,
            boundaryCoordinates: parcelData.boundaryCoordinates as any,
          }

          // Log specific changes
          if (project.parcel.lotSizeSqFt !== parcelData.lotSizeSqFt) {
            log.changes.push(`Lot size: ${project.parcel.lotSizeSqFt || 'null'} → ${parcelData.lotSizeSqFt}`)
          }
          if (project.parcel.apn !== parcelData.apn) {
            log.changes.push(`APN: ${project.parcel.apn || 'null'} → ${parcelData.apn}`)
          }
          if (project.parcel.zoning !== parcelData.zoning) {
            log.changes.push(`Zoning: ${project.parcel.zoning || 'null'} → ${parcelData.zoning}`)
          }
        } else {
          // Need to create new parcel
          shouldCreateParcel = true
          parcelUpdates = {
            apn: parcelData.apn,
            address: parcelData.address,
            city: parcelData.city,
            state: parcelData.state,
            zipCode: parcelData.zip,
            zoning: parcelData.zoning,
            lotSizeSqFt: parcelData.lotSizeSqFt,
            latitude: parcelData.latitude,
            longitude: parcelData.longitude,
            boundaryCoordinates: parcelData.boundaryCoordinates as any,
          }
          log.changes.push(`Creating new parcel (APN: ${parcelData.apn})`)
        }

        // Note: jurisdiction is stored on the Parcel model, not Project
        // The parcel update above already includes the city/jurisdiction
      } else {
        log.warnings.push('Regrid returned no results for this address')
      }
    } catch (error) {
      log.errors.push(`Regrid API error: ${error instanceof Error ? error.message : String(error)}`)
    }
  } else {
    log.warnings.push('No address available to fetch parcel data')
  }

  // ======================
  // 2. CHECK MISSING FIELDS & SET DEFAULTS
  // ======================

  // Property Type
  if (!project.propertyType) {
    updates.propertyType = 'Residential'
    log.changes.push('Property Type: null → Residential (default)')
  }

  // Building Footprint
  if (project.buildingFootprintSqFt === null) {
    updates.buildingFootprintSqFt = 0
    log.changes.push('Building Footprint: null → 0 (default)')
  }

  // Total SF Modified
  if (project.totalSfModified === null) {
    updates.totalSfModified = 0
    log.changes.push('Total SF Modified: null → 0 (default)')
  }

  // Project Type (set from description if missing)
  if (!project.projectType && project.description) {
    const description = project.description.toLowerCase()
    if (description.includes('adu')) {
      updates.projectType = 'adu'
      log.changes.push('Project Type: null → adu (inferred from description)')
    } else if (description.includes('addition')) {
      updates.projectType = 'addition'
      log.changes.push('Project Type: null → addition (inferred from description)')
    } else if (description.includes('remodel')) {
      updates.projectType = 'remodel'
      log.changes.push('Project Type: null → remodel (inferred from description)')
    } else {
      updates.projectType = 'other'
      log.changes.push('Project Type: null → other (default)')
    }
  }

  // ======================
  // 3. VALIDATE REQUIREMENTS
  // ======================

  const activeTasks = project.tasks.filter(t => t.isActive !== false)
  if (activeTasks.length === 0 && project.description) {
    log.warnings.push(`No active requirements found (has ${project.tasks.length} total tasks, 0 active)`)
    // Note: We could regenerate here, but that's more dangerous
    // For now, just flag it
  }

  // Check for scope/requirement mismatches
  if (project.description) {
    const description = project.description.toLowerCase()
    const scopeTypes = ['pool', 'adu', 'garage', 'kitchen', 'bathroom']

    for (const scopeType of scopeTypes) {
      if (description.includes(scopeType)) {
        const hasMatchingTasks = activeTasks.some(task =>
          task.category?.toLowerCase().includes(scopeType) ||
          task.title.toLowerCase().includes(scopeType)
        )
        if (!hasMatchingTasks) {
          log.warnings.push(`Scope mentions '${scopeType}' but no matching requirements found`)
        }
      }
    }
  }

  // ======================
  // 4. APPLY CHANGES
  // ======================

  if (isDryRun) {
    console.log(`  🔍 DRY RUN - Would make ${log.changes.length} changes`)
  } else {
    try {
      // Update parcel
      if (shouldCreateParcel && parcelUpdates) {
        const newParcel = await prisma.parcel.create({
          data: parcelUpdates
        })
        updates.parcelId = newParcel.id
        console.log(`  ✅ Created parcel: ${newParcel.id}`)
      } else if (project.parcelId && parcelUpdates) {
        await prisma.parcel.update({
          where: { id: project.parcelId },
          data: parcelUpdates
        })
        console.log(`  ✅ Updated parcel: ${project.parcelId}`)
      }

      // Update project
      if (Object.keys(updates).length > 0) {
        await prisma.project.update({
          where: { id: project.id },
          data: updates
        })
        console.log(`  ✅ Updated project with ${Object.keys(updates).length} field changes`)
      }
    } catch (error) {
      log.errors.push(`Database update failed: ${error instanceof Error ? error.message : String(error)}`)
      console.error(`  ❌ Failed to save changes: ${error}`)
    }
  }

  // Print summary for this project
  if (log.changes.length > 0) {
    console.log(`  📝 Changes (${log.changes.length}):`)
    log.changes.forEach(change => console.log(`     - ${change}`))
  }
  if (log.warnings.length > 0) {
    console.log(`  ⚠️  Warnings (${log.warnings.length}):`)
    log.warnings.forEach(warning => console.log(`     - ${warning}`))
  }
  if (log.errors.length > 0) {
    console.log(`  ❌ Errors (${log.errors.length}):`)
    log.errors.forEach(error => console.log(`     - ${error}`))
  }
  if (log.changes.length === 0 && log.warnings.length === 0 && log.errors.length === 0) {
    console.log(`  ✨ No changes needed`)
  }
}

async function main() {
  console.log('🚀 Project Migration/Repair Script\n')
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no changes will be saved)' : '💾 COMMIT (changes will be saved)'}`)
  console.log(`${isDryRun ? '   Use --commit flag to actually save changes' : ''}`)
  console.log('')

  try {
    // Get projects to fix
    let projects
    if (specificProjectId) {
      console.log(`📌 Fixing specific project: ${specificProjectId}\n`)
      projects = await prisma.project.findMany({
        where: { id: specificProjectId },
        select: { id: true, name: true }
      })
      if (projects.length === 0) {
        console.error(`❌ Project ${specificProjectId} not found`)
        process.exit(1)
      }
    } else {
      console.log('📊 Fetching all projects...\n')
      projects = await prisma.project.findMany({
        select: { id: true, name: true },
        orderBy: { createdAt: 'desc' }
      })
      console.log(`Found ${projects.length} projects to process\n`)
    }

    // Process each project
    for (const project of projects) {
      await fixProject(project.id)
    }

    // ======================
    // FINAL SUMMARY
    // ======================
    console.log('\n' + '='.repeat(80))
    console.log('📊 FINAL SUMMARY')
    console.log('='.repeat(80))

    const totalProjects = allLogs.length
    const projectsWithChanges = allLogs.filter(log => log.changes.length > 0).length
    const projectsWithWarnings = allLogs.filter(log => log.warnings.length > 0).length
    const projectsWithErrors = allLogs.filter(log => log.errors.length > 0).length
    const totalChanges = allLogs.reduce((sum, log) => sum + log.changes.length, 0)
    const totalWarnings = allLogs.reduce((sum, log) => sum + log.warnings.length, 0)
    const totalErrors = allLogs.reduce((sum, log) => sum + log.errors.length, 0)

    console.log(`\nProcessed: ${totalProjects} projects`)
    console.log(`  ✅ ${projectsWithChanges} projects with changes (${totalChanges} total changes)`)
    console.log(`  ⚠️  ${projectsWithWarnings} projects with warnings (${totalWarnings} total warnings)`)
    console.log(`  ❌ ${projectsWithErrors} projects with errors (${totalErrors} total errors)`)

    if (projectsWithErrors > 0) {
      console.log('\n❌ Projects with errors:')
      allLogs.filter(log => log.errors.length > 0).forEach(log => {
        console.log(`  - ${log.projectName} (${log.projectId})`)
        log.errors.forEach(error => console.log(`    • ${error}`))
      })
    }

    if (projectsWithWarnings > 0 && projectsWithWarnings <= 10) {
      console.log('\n⚠️  Projects with warnings:')
      allLogs.filter(log => log.warnings.length > 0).forEach(log => {
        console.log(`  - ${log.projectName} (${log.projectId})`)
        log.warnings.forEach(warning => console.log(`    • ${warning}`))
      })
    } else if (projectsWithWarnings > 10) {
      console.log(`\n⚠️  ${projectsWithWarnings} projects have warnings (too many to list)`)
    }

    if (isDryRun && totalChanges > 0) {
      console.log('\n🔍 This was a DRY RUN - no changes were saved')
      console.log('   Run with --commit flag to actually save these changes:')
      console.log('   npx tsx scripts/fix-projects.ts --commit')
    } else if (!isDryRun && totalChanges > 0) {
      console.log('\n✅ All changes have been saved to the database')
    }

    console.log('')

  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
