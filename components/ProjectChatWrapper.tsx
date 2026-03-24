'use client'

import { ProjectChat } from './ProjectChat'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface EngineeringRequirement {
  discipline: string
  required: boolean
  notes: string
}

interface ChatMessage {
  id: string
  message: string
  response: string
  role: string
  createdAt: string
  user?: {
    name?: string | null
    email: string
  }
}

interface ProjectChatWrapperProps {
  projectId: string
}

export default function ProjectChatWrapper({ projectId }: ProjectChatWrapperProps) {
  const [projectData, setProjectData] = useState<any>(null)
  const [requirements, setRequirements] = useState<EngineeringRequirement[]>([])
  const [permitTimeline, setPermitTimeline] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`)
        if (!res.ok) throw new Error('Failed to fetch project')
        const data = await res.json()

        // Fetch municipal requirements for this jurisdiction and zoning
        let municipalRequirements: any[] = []
        if (data.jurisdiction && data.parcel?.zoning) {
          try {
            const reqRes = await fetch(
              `/api/municipal-requirements?jurisdiction=${encodeURIComponent(data.jurisdiction)}&zoning=${encodeURIComponent(data.parcel.zoning)}&projectType=${encodeURIComponent(data.projectType || '')}`
            )
            if (reqRes.ok) {
              const reqData = await reqRes.json()
              municipalRequirements = reqData.requirements || []
            }
          } catch (err) {
            console.error('Error fetching municipal requirements:', err)
          }
        }

        // Fetch Phoenix zoning rules (setbacks, height, ADU regulations)
        // Now supports multiple jurisdictions (Phoenix, Chandler, Scottsdale, Mesa, Gilbert, Tempe)
        let phoenixZoning: any = null
        if (data.parcel?.zoning) {
          try {
            // Get jurisdiction from parcel, default to phoenix
            const jurisdiction = data.parcel?.jurisdiction?.toLowerCase() || 'phoenix'
            const zoningCode = data.parcel.zoning

            console.log(`🏠 ProjectChatWrapper - Fetching zoning for ${jurisdiction} - ${zoningCode}`)

            const zoningRes = await fetch(
              `/api/phoenix-zoning?code=${encodeURIComponent(zoningCode)}&jurisdiction=${encodeURIComponent(jurisdiction)}`
            )
            console.log('🏠 ProjectChatWrapper - Zoning API status:', zoningRes.status)
            if (zoningRes.ok) {
              const zoningData = await zoningRes.json()
              phoenixZoning = zoningData.zoning
              console.log('🏠 ProjectChatWrapper - Zoning data:', phoenixZoning)
            } else {
              console.log('🏠 ProjectChatWrapper - Zoning API failed:', await zoningRes.text())
            }
          } catch (err) {
            console.error('🏠 ProjectChatWrapper - Error fetching zoning:', err)
          }
        } else {
          console.log('🏠 ProjectChatWrapper - No zoning code, skipping zoning fetch')
        }

        // Derive jurisdiction from parcel city
        const jurisdiction = data.parcel?.city
          ? data.parcel.city.charAt(0).toUpperCase() + data.parcel.city.slice(1)
          : data.jurisdiction || 'Unknown'

        setProjectData({
          name: data.name,
          projectType: data.projectType,
          propertyType: data.propertyType,
          jurisdiction,
          fullAddress: data.fullAddress,
          description: data.description,
          squareFootage: data.squareFootage || 0,
          scopeOfWork: data.scopeOfWork || data.description || '',
          hillsideGrade: data.hillsideGrade || false,
          onSeptic: data.onSeptic || false,
          // Parcel data
          parcel: data.parcel ? {
            zoning: data.parcel.zoning,
            lotSizeSqFt: data.parcel.lotSizeSqFt,
            address: data.parcel.address,
            city: data.parcel.city,
            state: data.parcel.state,
            county: data.parcel.county,
            zoningRules: data.parcel.zoningRules || []
          } : null,
          // Municipal requirements from database
          municipalRequirements,
          // Phoenix zoning regulations (setbacks, height, ADU rules)
          phoenixZoning
        })

        setRequirements(data.engineeringReqs || [])
      } catch (error) {
        console.error('Error fetching project:', error)
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchProjectData()
    }
  }, [projectId])

  // Fetch permit timeline based on jurisdiction and project type
  useEffect(() => {
    const fetchPermitTimeline = async () => {
      if (!projectData?.parcel?.city) return

      const jurisdiction = projectData.parcel.city.toLowerCase()

      // Determine permit type from project details
      const scope = projectData.scopeOfWork?.toLowerCase() || projectData.description?.toLowerCase() || ''
      const projectType = scope.includes('adu') ? 'adu'
        : scope.includes('new construction') || scope.includes('new home') ? 'new_construction'
        : scope.includes('remodel') ? 'remodel'
        : 'residential_addition'

      console.log(`⏱️ Fetching permit timeline: ${jurisdiction} - ${projectType}`)

      try {
        const response = await fetch(
          `/api/permit-timeline?jurisdiction=${jurisdiction}&type=${projectType}`
        )
        if (response.ok) {
          const data = await response.json()
          console.log('⏱️ Permit timeline loaded:', data)
          setPermitTimeline(data)
        } else {
          console.log('⏱️ No permit timeline found for:', jurisdiction, projectType)
        }
      } catch (error) {
        console.error('Failed to fetch permit timeline:', error)
      }
    }

    fetchPermitTimeline()
  }, [projectData?.parcel?.city, projectData?.scopeOfWork, projectData?.description])

  const handleRequirementsUpdate = (newRequirements: EngineeringRequirement[]) => {
    setRequirements(newRequirements)
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]"></div>
      </div>
    )
  }

  if (!projectData) {
    return (
      <div className="p-4 text-center text-gray-500">
        Unable to load project data
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requirements.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-sm text-gray-700">Current Requirements:</h4>
          {requirements.map((req, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm">
              <div className="flex-1">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  req.required ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {req.discipline}
                </span>
                {req.notes && (
                  <p className="text-sm text-gray-600 mt-1">{req.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectChat
        projectData={projectData}
        currentRequirements={requirements}
        onRequirementsUpdate={handleRequirementsUpdate}
        projectId={projectId}
        permitTimeline={permitTimeline}
      />
    </div>
  )
}
