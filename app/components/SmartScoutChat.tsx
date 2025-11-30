'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Loader2, MapPin, Home } from 'lucide-react'
import { AddressAutocomplete } from '@/components/AddressAutocomplete'
import CityWiseLogo from '@/components/CityWiseLogo'

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

const ScoutAvatar = () => (
  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-citywise-orange to-citywise-gold flex items-center justify-center shadow-lg glow-orange">
    <svg viewBox="0 0 24 24" className="w-10 h-10 text-citywise-bg" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
    </svg>
  </div>
);

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
  const [addressReady, setAddressReady] = useState(false)

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
    setAddressReady(cleanAddress.length > 5)
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
    <div className="min-h-screen bg-citywise-bg text-citywise-text">
      {/* Header */}
      <div className="border-b border-citywise-border px-6 py-4 bg-citywise-surface/50 backdrop-blur-sm">
        <CityWiseLogo theme="light" width={160} />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        {/* Two Column Layout - Initial State */}
        {!parcelData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 animate-fade-in">

            {/* Left Column - Property Address */}
            <div className="bg-citywise-surface rounded-2xl p-8 border border-citywise-border hover:border-citywise-orange transition-all duration-300 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-citywise-orange to-citywise-gold p-3 rounded-xl">
                  <MapPin className="w-8 h-8 text-citywise-bg" />
                </div>
                <h2 className="text-2xl font-bold text-citywise-text">
                  Enter your address...
                </h2>
              </div>

              <p className="text-citywise-text-muted mb-6">
                Get personalized guidance for your specific property
              </p>

              <div className="space-y-4">
                <AddressAutocomplete
                  placeholder="e.g., 123 Main St, Phoenix, AZ 85001"
                  className="w-full px-6 py-4 bg-citywise-bg border-2 border-citywise-border rounded-xl text-citywise-text placeholder-gray-500 focus:outline-none focus:border-citywise-orange transition-all duration-300"
                  onAddressSelect={handleAddressSelect}
                  required={false}
                />

                {addressInput.length > 0 && !addressReady && (
                  <div className="flex items-start gap-2 text-citywise-orange text-sm">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Start typing for address suggestions</span>
                  </div>
                )}

                {addressReady && (
                  <div className="flex items-start gap-2 text-green-400 text-sm">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span>Address autocomplete ready</span>
                  </div>
                )}

                <button
                  onClick={handleAddressSubmit}
                  disabled={loadingAddress || !addressReady}
                  className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    addressReady && !loadingAddress
                      ? 'bg-gradient-to-r from-citywise-orange to-citywise-gold text-citywise-bg hover:shadow-lg hover:scale-[1.02] glow-orange'
                      : 'bg-citywise-border text-gray-500 cursor-not-allowed'
                  }`}
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

              <div className="mt-6 p-4 bg-citywise-bg rounded-lg border border-citywise-border">
                <p className="text-sm text-citywise-text-muted">
                  🏠 We'll analyze zoning, setbacks, permits, and development potential for your property
                </p>
              </div>
            </div>

            {/* Right Column - Chat with Scout */}
            <div className="bg-citywise-surface rounded-2xl p-8 border border-citywise-border hover:border-citywise-orange transition-all duration-300 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <ScoutAvatar />
                <div>
                  <h2 className="text-2xl font-bold text-citywise-text mb-1">Chat with Scout</h2>
                  <p className="text-citywise-text-muted text-sm">
                    Whether you're exploring possibilities or ready to build, I'm here to help answer any questions.
                  </p>
                </div>
              </div>

              {/* Chat messages */}
              {explorationMessages.length > 0 && (
                <div className="mb-4 max-h-[320px] overflow-y-auto bg-citywise-bg rounded-xl p-4 border border-citywise-border">
                  <div className="space-y-3">
                    {explorationMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-2.5 rounded-xl ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-citywise-orange to-citywise-gold text-citywise-bg'
                              : 'bg-citywise-surface border border-citywise-border text-citywise-text'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    ))}
                    {explorationLoading && (
                      <div className="flex justify-start">
                        <div className="bg-citywise-surface border border-citywise-border px-4 py-2.5 rounded-xl flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-citywise-orange" />
                          <span className="text-sm text-citywise-text-muted">Thinking...</span>
                        </div>
                      </div>
                    )}
                    <div ref={explorationEndRef} />
                  </div>
                </div>
              )}

              <form onSubmit={handleExplorationSubmit} className="relative">
                <input
                  type="text"
                  value={explorationInput}
                  onChange={(e) => setExplorationInput(e.target.value)}
                  placeholder="Ask about permits, costs, zoning, ADUs..."
                  disabled={explorationLoading}
                  className="w-full px-6 py-4 bg-citywise-bg border-2 border-citywise-border rounded-xl text-citywise-text placeholder-gray-500 focus:outline-none focus:border-citywise-orange transition-all duration-300"
                />
                <button
                  type="submit"
                  disabled={explorationLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-citywise-orange to-citywise-gold p-3 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50"
                >
                  <Send className="w-5 h-5 text-citywise-bg" />
                </button>
              </form>

              <div className="mt-6 p-4 bg-citywise-bg rounded-lg border border-citywise-border">
                <p className="text-sm text-citywise-text-muted italic">
                  💡 Try asking: "What permits do I need for an ADU?" or "How long does the approval process take?"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Project Mode - After Address Selected */}
        {parcelData && (
          <div className="space-y-6 animate-fade-in">
            {/* Property Info Card */}
            <div className="bg-citywise-surface rounded-2xl p-6 border border-citywise-border shadow-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-citywise-text text-xl mb-4">{parcelData.address}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-citywise-text-muted block mb-1">Lot Size</span>
                      <p className="text-citywise-text font-semibold">{parcelData.lotSize.toLocaleString()} sq ft</p>
                    </div>
                    <div>
                      <span className="text-citywise-text-muted block mb-1">Building SF</span>
                      <p className="text-citywise-text font-semibold">{parcelData.buildingSize > 0 ? parcelData.buildingSize.toLocaleString() : 'N/A'} sq ft</p>
                    </div>
                    <div>
                      <span className="text-citywise-text-muted block mb-1">Zoning</span>
                      <p className="text-citywise-text font-semibold">{parcelData.zoning}</p>
                    </div>
                    <div>
                      <span className="text-citywise-text-muted block mb-1">Jurisdiction</span>
                      <p className="text-citywise-text font-semibold">{parcelData.jurisdiction}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setParcelData(null)
                    setMessages([])
                    setCurrentButtons([])
                    setAddressInput('')
                    setAddressReady(false)
                  }}
                  className="text-sm text-citywise-text-muted hover:text-citywise-orange px-4 py-2 rounded-lg hover:bg-citywise-bg transition-colors border border-citywise-border"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Chat Container */}
            <div className="bg-citywise-surface rounded-2xl border border-citywise-border overflow-hidden shadow-xl">
              <div className="h-[420px] overflow-y-auto p-6 space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-xl ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-citywise-orange to-citywise-gold text-citywise-bg'
                          : 'bg-citywise-bg border border-citywise-border text-citywise-text'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-citywise-bg border border-citywise-border px-4 py-2.5 rounded-xl flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-citywise-orange" />
                      <span className="text-sm text-citywise-text-muted">Thinking...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Buttons */}
              {currentButtons.length > 0 && !isLoading && !isCreating && (
                <div className="border-t border-citywise-border p-6 bg-citywise-bg/50 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {currentButtons.map((button, index) => (
                      <button
                        key={index}
                        onClick={() => handleButtonClick(button.value, button.label)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          selectedButtons.includes(button.value)
                            ? 'bg-gradient-to-r from-citywise-orange to-citywise-gold text-citywise-bg shadow-lg glow-orange'
                            : 'bg-citywise-surface border border-citywise-border text-citywise-text hover:border-citywise-orange hover:bg-citywise-bg'
                        }`}
                      >
                        {button.label}
                      </button>
                    ))}
                  </div>

                  {selectedButtons.length > 0 && (
                    <button
                      onClick={handleContinueMultiSelect}
                      className="w-full px-6 py-3 bg-gradient-to-r from-citywise-orange to-citywise-gold text-citywise-bg rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      Continue with: {selectedButtons.map(val => currentButtons.find(b => b.value === val)?.label).filter(Boolean).join(', ')}
                    </button>
                  )}
                </div>
              )}

              {/* Input */}
              <div className="border-t border-citywise-border p-6 bg-citywise-surface">
                <form onSubmit={handleTextSubmit} className="relative">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type a message or ask a question..."
                    disabled={isLoading || isCreating}
                    className="w-full px-6 py-4 bg-citywise-bg border-2 border-citywise-border rounded-xl text-citywise-text placeholder-gray-500 focus:outline-none focus:border-citywise-orange transition-all duration-300 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || isCreating || !textInput.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-citywise-orange to-citywise-gold p-3 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50"
                  >
                    <Send className="w-5 h-5 text-citywise-bg" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA - Only show initially */}
        {!parcelData && (
          <div className="mt-12 text-center animate-fade-in">
            <p className="text-citywise-text-muted text-lg">
              Not sure where to start? <span className="text-citywise-orange font-semibold cursor-pointer hover:underline">Take our quick assessment</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
