'use client'

import { useState, useRef, useEffect } from 'react'

interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface EngineeringRequirement {
  discipline: string
  required: boolean
  notes: string
}

interface ProjectChatProps {
  projectData: {
    name: string
    projectType: string
    propertyType: string
    jurisdiction: string
    fullAddress?: string
    description?: string
    squareFootage: number
    scopeOfWork: string
    hillsideGrade: boolean
    onSeptic: boolean
    parcel?: {
      zoning?: string
      lotSizeSqFt?: number
      address?: string
      city?: string
      state?: string
      county?: string
      zoningRules?: any[]
    } | null
    municipalRequirements?: any[]
    phoenixZoning?: any | null
  }
  currentRequirements: EngineeringRequirement[]
  onRequirementsUpdate: (requirements: EngineeringRequirement[], explanation?: string) => void
  projectId: string
  permitTimeline?: {
    jurisdiction: string
    permitType: string
    planReviewDays: number
    revisionDays: number
    typicalRevisions: number
    approvalDays: number
    inspectionDays: number
    baseFee: number
    feePerSqFt: number
    expeditedAvailable: boolean
    expeditedFee: number | null
    notes: string
  } | null
}

export function ProjectChat({ projectData, currentRequirements, onRequirementsUpdate, projectId, permitTimeline }: ProjectChatProps) {
  console.log('💬 ProjectChat - Component rendered with props:')
  console.log('💬 ProjectChat - phoenixZoning:', projectData.phoenixZoning)
  console.log('💬 ProjectChat - permitTimeline:', permitTimeline)
  console.log('💬 ProjectChat - parcel:', projectData.parcel)
  console.log('💬 ProjectChat - jurisdiction:', projectData.jurisdiction)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/chat-history`)
        if (response.ok) {
          const data = await response.json()
          const loadedMessages = data.chatMessages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.createdAt)
          }))

          // If no history, add welcome message
          if (loadedMessages.length === 0) {
            setMessages([{
              role: 'assistant',
              content: `Hello! I'm here to help with your ${projectData.projectType} project in ${projectData.jurisdiction}. Ask me about building codes, permit requirements, engineering needs, or any other questions about your project. I can also update your engineering requirements based on new information you provide.`,
              timestamp: new Date()
            }])
          } else {
            setMessages(loadedMessages)
          }
        }
      } catch (error) {
        console.error('Error loading chat history:', error)
        // On error, show welcome message
        setMessages([{
          role: 'assistant',
          content: `Hello! I'm here to help with your ${projectData.projectType} project in ${projectData.jurisdiction}. Ask me about building codes, permit requirements, engineering needs, or any other questions about your project. I can also update your engineering requirements based on new information you provide.`,
          timestamp: new Date()
        }])
      } finally {
        setLoadingHistory(false)
      }
    }

    loadChatHistory()
  }, [projectId, projectData.projectType, projectData.jurisdiction])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    // Add user message to chat
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newUserMessage])

    try {
      // Prepare conversation history for API
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const response = await fetch('/api/project-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectData,
          currentRequirements,
          userMessage,
          conversationHistory,
          projectId,
          permitTimeline
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()

      // Update messages with IDs from database
      if (data.savedMessages) {
        setMessages(prev => {
          const updated = [...prev]
          // Update user message with ID
          if (data.savedMessages.user && updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              id: data.savedMessages.user.id
            }
          }
          return updated
        })
      }

      // Add AI response to chat with ID
      const aiMessage: ChatMessage = {
        id: data.savedMessages?.assistant?.id,
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])

      // Update requirements if they changed
      if (data.requirementsChanged && data.updatedRequirements) {
        onRequirementsUpdate(data.updatedRequirements, data.explanation)
        
        // Add explanation message if provided
        if (data.explanation) {
          const explanationMessage: ChatMessage = {
            role: 'assistant',
            content: `📋 **Requirements Updated:** ${data.explanation}`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, explanationMessage])
        }
      }

    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/chat-history/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      })

      if (!response.ok) throw new Error('Failed to edit message')

      // Update local state
      setMessages(prev =>
        prev.map(msg => (msg.id === messageId ? { ...msg, content: newContent } : msg))
      )
      setEditingMessageId(null)
      setEditContent('')
    } catch (error) {
      console.error('Error editing message:', error)
      alert('Failed to edit message. Please try again.')
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      const response = await fetch(`/api/projects/${projectId}/chat-history/${messageId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete message')

      // Update local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('Failed to delete message. Please try again.')
    }
  }

  const handleClearChat = async () => {
    if (!confirm('Are you sure you want to clear all chat history? This cannot be undone.')) return

    try {
      const response = await fetch(`/api/projects/${projectId}/chat-history`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to clear chat history')

      // Reset to welcome message only
      setMessages([{
        role: 'assistant',
        content: `Hello! I'm here to help with your ${projectData.projectType} project in ${projectData.jurisdiction}. Ask me about building codes, permit requirements, engineering needs, or any other questions about your project. I can also update your engineering requirements based on new information you provide.`,
        timestamp: new Date()
      }])
    } catch (error) {
      console.error('Error clearing chat:', error)
      alert('Failed to clear chat history. Please try again.')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-200 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Your Project Guide</h3>
          <p className="text-sm text-gray-600">Ask questions about permits, building codes, or zoning...</p>
        </div>
        <button
          onClick={handleClearChat}
          className="px-3 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Clear chat history"
        >
          Clear Chat
        </button>
      </div>

      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
        {messages.map((message, index) => {
          console.log('💬 Message:', message.id, message.role, message.content.substring(0, 30))

          return (
            <div
              key={message.id || index}
              className={`group flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="relative flex items-start gap-2">
                {/* Edit/Delete buttons (left side for user, right side for assistant) */}
                {message.id && message.role === 'user' && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingMessageId(message.id!)
                        setEditContent(message.content)
                      }}
                      className="p-1 hover:bg-gray-200 rounded text-gray-600 text-sm"
                      title="Edit message"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(message.id!)}
                      className="p-1 hover:bg-gray-200 rounded text-gray-600 text-sm"
                      title="Delete message"
                    >
                      🗑️
                    </button>
                  </div>
                )}

                {/* Message bubble */}
                {editingMessageId === message.id ? (
                  <div className="max-w-[80%] rounded-lg border border-gray-300 bg-white p-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full min-h-[80px] p-2 border border-gray-300 rounded text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleEditMessage(message.id!, editContent)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingMessageId(null)
                          setEditContent('')
                        }}
                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div
                      className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                )}

                {/* Edit/Delete buttons (right side for assistant) */}
                {message.id && message.role === 'assistant' && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingMessageId(message.id!)
                        setEditContent(message.content)
                      }}
                      className="p-1 hover:bg-gray-200 rounded text-gray-600 text-sm"
                      title="Edit message"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(message.id!)}
                      className="p-1 hover:bg-gray-200 rounded text-gray-600 text-sm"
                      title="Delete message"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask questions about permits, building codes, or zoning..."
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}