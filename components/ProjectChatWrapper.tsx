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
  projectData: {
    name: string
    projectType: string
    propertyType: string
    jurisdiction: string
    squareFootage: number
    scopeOfWork: string
    hillsideGrade: boolean
    onSeptic: boolean
  }
  initialRequirements: EngineeringRequirement[]
  projectId: string
}

export function ProjectChatWrapper({ projectData, initialRequirements, projectId }: ProjectChatWrapperProps) {
  const [requirements, setRequirements] = useState(initialRequirements)
  const [updateMessage, setUpdateMessage] = useState<string | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const router = useRouter()

  // Load chat history
  const loadChatHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/chat-history`)
      if (response.ok) {
        const data = await response.json()
        setChatHistory(data.chatMessages || [])
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  // Load chat history when component mounts or when history is shown
  useEffect(() => {
    if (showHistory && chatHistory.length === 0) {
      loadChatHistory()
    }
  }, [showHistory, projectId])

  const handleRequirementsUpdate = async (newRequirements: EngineeringRequirement[], explanation?: string) => {
    console.log('handleRequirementsUpdate called with:', { newRequirements, explanation })
    setRequirements(newRequirements)
    
    if (explanation) {
      setUpdateMessage(explanation)
      // Clear the message after 5 seconds
      setTimeout(() => setUpdateMessage(null), 5000)
    }

    // Update requirements in the database
    try {
      console.log('Calling update-requirements API with:', { projectId, requirements: newRequirements })
      
      const response = await fetch('/api/update-requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          requirements: newRequirements
        }),
      })
      
      const result = await response.json()
      console.log('API response:', result)
      
      if (!response.ok) {
        throw new Error(`API error: ${result.error}`)
      }

      // Use Next.js router to refresh the page data
      router.refresh()
      
      // Reload chat history to include the new message
      if (showHistory) {
        loadChatHistory()
      }
      
    } catch (error) {
      console.error('Failed to update requirements:', error)
    }
  }

  return (
    <div className="space-y-4">
      {updateMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{updateMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chat History Toggle */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">AI Project Assistant</h3>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          {showHistory ? 'Hide History' : 'Show Chat History'}
        </button>
      </div>

      {/* Chat History Display */}
      {showHistory && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-96 overflow-y-auto">
          <h4 className="font-medium text-gray-700 mb-3">Chat History</h4>
          {loadingHistory ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading chat history...</p>
            </div>
          ) : chatHistory.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No previous conversations</p>
          ) : (
            <div className="space-y-4">
              {chatHistory.map((chat) => (
                <div key={chat.id} className="space-y-2">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-blue-800">You</span>
                      <span className="text-xs text-blue-600">
                        {new Date(chat.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-blue-700">{chat.message}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-gray-800">AI Assistant</span>
                    </div>
                    <p className="text-sm text-gray-700">{chat.response}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Updated Requirements Display */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Current Engineering Requirements</h3>
        <div className="space-y-3">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{req.discipline}</span>
                  {req.required && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                      Required
                    </span>
                  )}
                </div>
                {req.notes && (
                  <p className="text-sm text-gray-600">{req.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ProjectChat
        projectData={projectData}
        currentRequirements={requirements}
        onRequirementsUpdate={handleRequirementsUpdate}
        projectId={projectId}
      />
    </div>
  )
}
