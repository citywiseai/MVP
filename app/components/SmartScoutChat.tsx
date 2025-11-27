'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Loader2, Send, MessageCircle, ChevronDown } from 'lucide-react'
import { AddressAutocomplete } from '@/components/AddressAutocomplete'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ButtonOption {
  label: string
  value: string
}

interface ParcelData {
  apn: string
  address: string
  lotSize: number
  buildingSize: number
  zoning: string
  jurisdiction: string
  jurisdictionType?: 'city' | 'county'
  jurisdictionCode?: string
}

export default function SmartScoutChat() {
  const router = useRouter()

  // Exploration mode state (general Q&A)
  const [explorationMessages, setExplorationMessages] = useState<Message[]>([])
  const [explorationInput, setExplorationInput] = useState('')
  const [explorationLoading, setExplorationLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const explorationEndRef = useRef<HTMLDivElement>(null)

  // Project mode state (existing flow)
  const [addressInput, setAddressInput] = useState('')
  const [parcelData, setParcelData] = useState<ParcelData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentButtons, setCurrentButtons] = useState<ButtonOption[]>([])
  const [selectedButtons, setSelectedButtons] = useState<string[]>([])
  const [textInput, setTextInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [loadingAddress, setLoadingAddress] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    explorationEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [explorationMessages])

  // Exploration mode Q&A handlers
  const handleExplorationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!explorationInput.trim() || explorationLoading) return

    const userMessage: Message = {
      role: 'user',
      content: explorationInput
    }
    setExplorationMessages(prev => [...prev, userMessage])
    const input = explorationInput
    setExplorationInput('')
    setExplorationLoading(true)

    try {
      const response = await fetch('/api/ai-scope/explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: explorationMessages,
          userInput: input,
          conversationId
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message
        }
        setExplorationMessages(prev => [...prev, assistantMessage])
        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId)
        }
      }
    } catch (error) {
      console.error('Error in exploration mode:', error)
    } finally {
      setExplorationLoading(false)
    }
  }

  const handleAddressSelect = (address: string) => {
    const cleanAddress = address.replace(/, USA$/, '')
    setAddressInput(cleanAddress)
  }

  const handleAddressSubmit = async () => {
    if (!addressInput.trim()) return

    setLoadingAddress(true)
    try {
      const cleanAddress = addressInput.replace(/, USA$/, '')

      const response = await fetch('/api/real-address-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: cleanAddress })
      })

      if (response.ok) {
        const data = await response.json()

        const parcel = {
          apn: data.apn || 'Unknown',
          address: data.address,
          lotSize: data.lotSizeSqFt || 0,
          buildingSize: data.buildingSqFt || 0,
          zoning: data.zoning || 'Unknown',
          jurisdiction: data.jurisdiction || 'Phoenix',
          jurisdictionType: data.jurisdictionType || 'city',
          jurisdictionCode: data.jurisdictionCode || 'phoenix',
          latitude: data.latitude,
          longitude: data.longitude,
          boundaryCoordinates: data.geometry?.coordinates ? JSON.stringify(data.geometry.coordinates) : null,
          city: data.jurisdiction || 'Phoenix',
          state: 'AZ',
          zip: data.address.match(/\d{5}$/)?.[0] || ''
        }

        setParcelData(parcel)

        const greeting: Message = {
          role: 'assistant',
          content: `Great! I found your property at ${data.address}. Let's figure out what you'll need for permits. What type of work are you planning? (You can select multiple)`
        }
        setMessages([greeting])
        setCurrentButtons([
          { label: 'Addition', value: 'addition' },
          { label: 'Remodel', value: 'remodel' },
          { label: 'ADU', value: 'adu' },
          { label: 'New Build', value: 'new_build' },
          { label: 'Pool/Spa', value: 'pool' },
          { label: 'Patio Cover', value: 'patio' },
          { label: 'Fence', value: 'fence' },
          { label: 'Outdoor Kitchen', value: 'outdoor_kitchen' }
        ])
      } else {
        alert('Property not found. Please check the address.')
      }
    } catch (error) {
      console.error('Error looking up address:', error)
      alert('Failed to find property. Please try again.')
    } finally {
      setLoadingAddress(false)
    }
  }

  const sendMessage = async (userInput: string) => {
    if (!parcelData) return

    setIsLoading(true)
    setCurrentButtons([])
    setSelectedButtons([])

    try {
      const response = await fetch('/api/ai-scope/smart-scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          userInput,
          context: {
            address: parcelData.address,
            lotSize: parcelData.lotSize,
            existingBuilding: parcelData.buildingSize,
            jurisdiction: parcelData.jurisdiction,
            jurisdictionType: parcelData.jurisdictionType,
            jurisdictionCode: parcelData.jurisdictionCode,
            zoning: parcelData.zoning
          }
        }),
      })

      if (response.ok) {
        const data = await response.json()

        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message
        }
        setMessages(prev => [...prev, assistantMessage])

        if (data.buttons && data.buttons.length > 0) {
          setCurrentButtons(data.buttons)
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleButtonClick = async (value: string, label: string) => {
    if (isLoading || isCreating) return

    const isMultiSelect = currentButtons.length > 2 &&
      (currentButtons.some(b => b.label.includes('multiple')) ||
       messages[messages.length - 1]?.content.includes('select multiple'))

    if (value === 'create') {
      await handleCreateProject()
      return
    }

    if (isMultiSelect) {
      setSelectedButtons(prev =>
        prev.includes(value)
          ? prev.filter(v => v !== value)
          : [...prev, value]
      )
      return
    }

    const userMessage: Message = {
      role: 'user',
      content: label
    }
    setMessages(prev => [...prev, userMessage])

    await sendMessage(value)
  }

  const handleContinueMultiSelect = async () => {
    if (selectedButtons.length === 0) return

    const labels = selectedButtons
      .map(val => currentButtons.find(b => b.value === val)?.label)
      .filter(Boolean)
      .join(', ')

    const userMessage: Message = {
      role: 'user',
      content: labels
    }
    setMessages(prev => [...prev, userMessage])

    await sendMessage(selectedButtons.join(','))
  }

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!textInput.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: textInput
    }
    setMessages(prev => [...prev, userMessage])
    const message = textInput
    setTextInput('')

    await sendMessage(message)
  }

  const handleCreateProject = async () => {
    setIsCreating(true)

    const creatingMessage: Message = {
      role: 'assistant',
      content: `🚀 Your project is now being created! I'm setting up all the required permits and plans. You'll be redirected to your dashboard in a moment...`
    }
    setMessages(prev => [...prev, creatingMessage])

    try {
      const conversation = messages.map(m => `${m.role}: ${m.content}`).join('\n')

      const response = await fetch('/api/ai-scope/create-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectData: {
            fullAddress: parcelData?.address,
            projectType: 'ADDITION',
            conversation,
            parcelData: parcelData
          }
        }),
      })

      const result = await response.json()

      if (response.ok && result.projectId) {
        setTimeout(() => {
          router.push(`/dashboard?project=${result.projectId}`)
        }, 500)
      } else {
        console.error('Create project failed:', result)
        alert(`Failed to create project: ${result.error || 'Unknown error'}`)
        setIsCreating(false)
      }
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project')
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-white mb-3">AI Scope Capture</h1>
          <p className="text-lg text-blue-100">Let Scout guide you through your project setup</p>
        </div>

        {/* Exploration Mode - General Q&A Chat */}
        {!parcelData && (
          <>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-12">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Chat with Scout</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Whether you're exploring possibilities or ready to build, I'm here to help answer any questions.
                </p>
              </div>

              {/* Exploration chat messages */}
              {explorationMessages.length > 0 && (
                <div className="border border-gray-100 rounded-2xl p-6 mb-6 max-h-[320px] overflow-y-auto bg-gray-50/50">
                  <div className="space-y-4">
                    {explorationMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-5 py-3 rounded-2xl ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    ))}
                    {explorationLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 px-5 py-3 rounded-2xl flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          <span className="text-sm text-gray-600">Thinking...</span>
                        </div>
                      </div>
                    )}
                    <div ref={explorationEndRef} />
                  </div>
                </div>
              )}

              {/* Exploration input */}
              <form onSubmit={handleExplorationSubmit} className="flex gap-3">
                <input
                  type="text"
                  value={explorationInput}
                  onChange={(e) => setExplorationInput(e.target.value)}
                  placeholder="Ask about permits, costs, zoning, ADUs..."
                  disabled={explorationLoading}
                  className="flex-1 h-12 px-5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  disabled={explorationLoading || !explorationInput.trim()}
                  className="h-12 px-6 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* Divider - Elegant Glow */}
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              {/* Dots */}
              <div className="flex space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
              </div>

              {/* Text with glow */}
              <p
                className="text-white text-lg font-medium text-center px-8"
                style={{
                  textShadow: '0 0 20px rgba(255, 255, 255, 0.3), 0 0 10px rgba(255, 255, 255, 0.2)'
                }}
              >
                When you're ready, let's look at your specific property
              </p>

              {/* Optional subtle line */}
              <div className="w-32 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            </div>

            {/* Project Start - Address Input */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <div className="mb-6">
                <label className="block text-base font-medium text-gray-900 mb-2">
                  Property Address
                </label>
                <p className="text-sm text-gray-600">
                  Get personalized guidance for your specific property
                </p>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <AddressAutocomplete
                    placeholder="e.g., 123 Main St, Phoenix, AZ 85001"
                    className="w-full h-14 px-5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    onAddressSelect={handleAddressSelect}
                    required={false}
                  />
                </div>
                <button
                  onClick={handleAddressSubmit}
                  disabled={loadingAddress}
                  className="h-14 px-8 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
                >
                  {loadingAddress ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <span>Find Property</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Project Mode - Existing Conversation Flow */}
        {parcelData && (
          <>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-3">{parcelData.address}</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium text-gray-500">Lot Size</span>
                      <p className="text-gray-900 mt-0.5">{parcelData.lotSize.toLocaleString()} sq ft</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Building SF</span>
                      <p className="text-gray-900 mt-0.5">{parcelData.buildingSize > 0 ? parcelData.buildingSize.toLocaleString() : 'N/A'} sq ft</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Zoning</span>
                      <p className="text-gray-900 mt-0.5">{parcelData.zoning}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setParcelData(null)
                    setMessages([])
                    setCurrentButtons([])
                    setAddressInput('')
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Change
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-[420px] overflow-y-auto p-8 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-5 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-5 py-3 rounded-2xl flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {currentButtons.length > 0 && !isLoading && !isCreating && (
                <div className="border-t border-gray-100 p-6 bg-gray-50/50 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {currentButtons.map((button, index) => (
                      <button
                        key={index}
                        onClick={() => handleButtonClick(button.value, button.label)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          selectedButtons.includes(button.value)
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {button.label}
                      </button>
                    ))}
                  </div>

                  {selectedButtons.length > 0 && (
                    <button
                      onClick={handleContinueMultiSelect}
                      className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                    >
                      Continue with: {selectedButtons.map(val => currentButtons.find(b => b.value === val)?.label).filter(Boolean).join(', ')}
                    </button>
                  )}
                </div>
              )}

              <div className="border-t border-gray-100 p-6 bg-white">
                <form onSubmit={handleTextSubmit} className="flex gap-3">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type a message or ask a question..."
                    disabled={isLoading || isCreating}
                    className="flex-1 h-12 px-5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm placeholder:text-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || isCreating || !textInput.trim()}
                    className="h-12 px-6 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
