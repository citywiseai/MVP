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
  apn?: string
  address?: string
  lotSizeSqFt?: number
  buildingSqFt?: number
  zoning?: string
  jurisdiction?: string
  jurisdictionType?: 'city' | 'county'
  jurisdictionCode?: string
  latitude?: number
  longitude?: number
  boundaryCoordinates?: number[][]
  boundaryRings?: number[][][]
  city?: string
  zip?: string
  state?: string
}

const ScoutAvatar = () => (
  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-citywise-orange to-citywise-gold flex items-center justify-center shadow-lg glow-orange">
    <svg viewBox="0 0 24 24" className="w-10 h-10 text-citywise-bg" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
    </svg>
  </div>
);

interface SmartScoutChatProps {
  searchParams?: Promise<{ analysisId?: string }>
}

export default function SmartScoutChat({ searchParams }: SmartScoutChatProps) {
  const router = useRouter()

  // Site Analysis integration
  const [siteAnalysis, setSiteAnalysis] = useState<any | null>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [analysisId, setAnalysisId] = useState<string | null>(null)

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

  // Load site analysis if analysisId is present
  useEffect(() => {
    const loadAnalysis = async () => {
      if (!searchParams) return

      const params = await searchParams
      if (!params.analysisId) return

      setAnalysisId(params.analysisId)
      setLoadingAnalysis(true)

      try {
        const response = await fetch(`/api/site-analysis/${params.analysisId}`)
        if (response.ok) {
          const data = await response.json()
          const analysis = data.analysis
          setSiteAnalysis(analysis)

          // Set parcel data from analysis
          const parcel: ParcelData = {
            apn: analysis.apn || 'Unknown',
            address: analysis.address,
            lotSizeSqFt: analysis.lotSizeSqFt || 0,
            buildingSqFt: analysis.existingBuildingSqFt || 0,
            zoning: analysis.zoning || 'Unknown',
            jurisdiction: analysis.address?.includes('Phoenix') ? 'Phoenix' : 'Unknown',
            jurisdictionType: 'city',
            jurisdictionCode: 'phoenix',
            latitude: analysis.latitude || 0,
            longitude: analysis.longitude || 0,
          }
          setParcelData(parcel)

          // Create contextual first message
          const feasibility = analysis.feasibilityReport
          const feasibleProjects = feasibility?.feasibleProjects || []
          const highFeasibility = feasibleProjects.filter((p: any) => p.feasibility === 'high')

          const projectList = highFeasibility.length > 0
            ? highFeasibility.map((p: any) => p.type).join(', ')
            : 'several projects'

          const greeting: Message = {
            role: 'assistant',
            content: `I've reviewed the site analysis for ${analysis.address}. You have ${analysis.remainingArea?.toLocaleString() || 0} sq ft of buildable area remaining with ${analysis.zoning} zoning. ${highFeasibility.length > 0 ? `${projectList} ${highFeasibility.length === 1 ? 'is' : 'are'} highly feasible.` : ''} What would you like to build? (You can select multiple)`
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
        }
      } catch (error) {
        console.error('Error loading site analysis:', error)
      } finally {
        setLoadingAnalysis(false)
      }
    }

    loadAnalysis()
  }, [searchParams])

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

    console.log('🚀🚀🚀 handleAddressSubmit called - CODE IS RUNNING!')
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

        console.log('📍 SmartScoutChat: Received API data, boundaries:', data.boundaryCoordinates?.length, 'rings:', data.boundaryRings?.length)

        const parcel: ParcelData = {
          apn: data.apn || 'Unknown',
          address: data.address || cleanAddress,
          lotSizeSqFt: data.lotSizeSqFt || 0,
          buildingSqFt: data.buildingSqFt || 0,
          zoning: data.zoning || 'Unknown',
          jurisdiction: data.jurisdiction || 'Phoenix',
          jurisdictionType: data.jurisdictionType || 'city',
          jurisdictionCode: data.jurisdictionCode || 'phoenix',
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          boundaryCoordinates: data.boundaryCoordinates || null,
          boundaryRings: data.boundaryRings || null,
          city: data.jurisdiction || 'Phoenix',
          state: data.state || 'AZ',
          zip: data.address?.match(/\d{5}$/)?.[0] || ''
        }

        console.log('📍 SmartScoutChat: Created parcel object, boundaries:', parcel.boundaryCoordinates?.length, 'rings:', parcel.boundaryRings?.length)

        setParcelData(parcel)

        const greeting: Message = {
          role: 'assistant',
          content: `Great! I found your property at ${data.address || cleanAddress}. Let's figure out what you'll need for permits. What type of work are you planning? (You can select multiple)`
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
            lotSize: parcelData.lotSizeSqFt,
            existingBuilding: parcelData.buildingSqFt,
            jurisdiction: parcelData.jurisdiction,
            jurisdictionType: parcelData.jurisdictionType,
            jurisdictionCode: parcelData.jurisdictionCode,
            zoning: parcelData.zoning,
            // Include site analysis context if available
            ...(siteAnalysis && {
              siteAnalysis: {
                remainingBuildableArea: siteAnalysis.remainingArea,
                maxBuildableArea: siteAnalysis.maxBuildableArea,
                currentCoverage: siteAnalysis.currentCoverage,
                existingStories: siteAnalysis.existingStories,
                feasibilityReport: siteAnalysis.feasibilityReport,
                zoningRules: siteAnalysis.zoningRules,
              }
            })
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
          },
          ...(analysisId && { analysisId })
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
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 bg-white/95 backdrop-blur-sm shadow-sm">
        <CityWiseLogo theme="dark" width={160} />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        {/* Site Analysis Summary Card */}
        {siteAnalysis && (
          <div className="mb-8 bg-white rounded-2xl p-6 shadow-xl border-2 border-blue-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{siteAnalysis.address}</h3>
                    <p className="text-sm text-gray-600">Site Analysis Loaded</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Assessment</div>
                    <div className={`font-semibold text-sm ${
                      siteAnalysis.overallAssessment === 'GO' ? 'text-green-600' :
                      siteAnalysis.overallAssessment === 'PROCEED_WITH_CAUTION' || siteAnalysis.overallAssessment === 'PROCEED WITH CAUTION' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {siteAnalysis.overallAssessment?.replace('_', ' ') || 'N/A'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Remaining Buildable</div>
                    <div className="font-semibold text-sm text-gray-900">
                      {siteAnalysis.remainingArea?.toLocaleString() || 0} sq ft
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Lot Size</div>
                    <div className="font-semibold text-sm text-gray-900">
                      {siteAnalysis.lotSizeSqFt?.toLocaleString() || 0} sq ft
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Zoning</div>
                    <div className="font-semibold text-sm text-gray-900">
                      {siteAnalysis.zoning || 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout - Initial State */}
        {!parcelData && !loadingAnalysis && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 animate-fade-in">

            {/* Left Column - Property Address */}
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-100 p-3 rounded-xl">
                  <MapPin className="w-8 h-8 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Every project starts with an address
                </h2>
              </div>

              <p className="text-gray-600 mb-6">
                Get personalized guidance for your specific property
              </p>

              <div className="space-y-4">
                <AddressAutocomplete
                  placeholder="e.g., 123 Main St, Phoenix, AZ 85001"
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-300"
                  onAddressSelect={handleAddressSelect}
                  required={false}
                />

                {addressInput.length > 0 && !addressReady && (
                  <div className="flex items-start gap-2 text-orange-600 text-sm">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Start typing for address suggestions</span>
                  </div>
                )}

                {addressReady && (
                  <div className="flex items-start gap-2 text-green-600 text-sm">
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
                      ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:scale-[1.02]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-gray-700">
                  🏠 We'll analyze zoning, setbacks, permits, and development potential for your property
                </p>
              </div>
            </div>

            {/* Right Column - Chat with Scout */}
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <ScoutAvatar />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Chat with Scout</h2>
                  <p className="text-gray-600 text-sm">
                    Whether you're exploring possibilities or ready to build, I'm here to help answer any questions.
                  </p>
                </div>
              </div>

              {/* Chat messages */}
              {explorationMessages.length > 0 && (
                <div className="mb-4 max-h-[320px] overflow-y-auto bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="space-y-3">
                    {explorationMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-2.5 rounded-xl ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    ))}
                    {explorationLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <span className="text-sm text-gray-600">Thinking...</span>
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
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-300"
                />
                <button
                  type="submit"
                  disabled={explorationLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 p-3 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-gray-700 italic">
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
            <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 shadow-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-white text-xl mb-4">{parcelData?.address || 'Loading...'}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400 block mb-1">Lot Size</span>
                      <p className="text-white font-semibold">{parcelData?.lotSizeSqFt?.toLocaleString() || 'N/A'} sq ft</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Building SF</span>
                      <p className="text-white font-semibold">{parcelData?.buildingSqFt && parcelData.buildingSqFt > 0 ? parcelData.buildingSqFt.toLocaleString() : 'N/A'} sq ft</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Zoning</span>
                      <p className="text-white font-semibold">{parcelData?.zoning || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Jurisdiction</span>
                      <p className="text-white font-semibold">{parcelData?.jurisdiction || 'N/A'}</p>
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
                  className="text-sm text-slate-300 hover:text-orange-400 px-4 py-2 rounded-lg hover:bg-slate-700/60 transition-colors border border-slate-600/50"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Chat Container */}
            <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
              <div className="h-[420px] overflow-y-auto p-6 space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-xl ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                          : 'bg-slate-700/80 backdrop-blur-sm border border-slate-600/50 text-white'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-700/80 backdrop-blur-sm border border-slate-600/50 px-4 py-2.5 rounded-xl flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                      <span className="text-sm text-slate-300">Thinking...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Buttons */}
              {currentButtons.length > 0 && !isLoading && !isCreating && (
                <div className="border-t border-slate-700/50 p-6 bg-slate-900/30 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {currentButtons.map((button, index) => (
                      <button
                        key={index}
                        onClick={() => handleButtonClick(button.value, button.label)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          selectedButtons.includes(button.value)
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                            : 'bg-slate-700/60 backdrop-blur-sm border border-slate-600/50 text-white hover:border-orange-400 hover:bg-slate-700/80'
                        }`}
                      >
                        {button.label}
                      </button>
                    ))}
                  </div>

                  {selectedButtons.length > 0 && (
                    <button
                      onClick={handleContinueMultiSelect}
                      className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      Continue with: {selectedButtons.map(val => currentButtons.find(b => b.value === val)?.label).filter(Boolean).join(', ')}
                    </button>
                  )}
                </div>
              )}

              {/* Input */}
              <div className="border-t border-slate-700/50 p-6 bg-slate-900/30">
                <form onSubmit={handleTextSubmit} className="relative">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type a message or ask a question..."
                    disabled={isLoading || isCreating}
                    className="w-full px-6 py-4 bg-slate-700/60 backdrop-blur-sm border-2 border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-orange-400 transition-all duration-300 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || isCreating || !textInput.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-500 to-amber-500 p-3 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50"
                  >
                    <Send className="w-5 h-5 text-white" />
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
