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
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`)
        if (!res.ok) throw new Error('Failed to fetch project')
        const data = await res.json()
        
        setProjectData({
          name: data.name,
          projectType: data.projectType,
          propertyType: data.propertyType,
          jurisdiction: data.jurisdiction,
          fullAddress: data.fullAddress,
          description: data.description
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
      />
    </div>
  )
}
