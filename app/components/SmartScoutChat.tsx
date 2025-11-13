'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Loader2, Send } from 'lucide-react'
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
}

export default function SmartScoutChat() {
  const router = useRouter()
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

  const handleAddressSelect = (address: string) => {
    const cleanAddress = address.replace(/, USA$/, '')
    setAddressInput(cleanAddress)
  }

  const handleAddressSubmit = async () => {
    if (!addressInput.trim()) return

    setLoadingAddress(true)
    try {
      const cleanAddress = addressInput.replace(/, USA$/, '')
      
      // Use real-address-lookup API which includes boundary data
      const response = await fetch('/api/real-address-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: cleanAddress })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Full parcel data from API:', data)
        console.log('Building SF from API:', data.buildingSqFt)
        console.log('Geometry from API:', data.geometry)
        
        const parcel = {
          apn: data.apn || 'Unknown',
          address: data.address,
          lotSize: data.lotSizeSqFt || 0,
          buildingSize: data.buildingSqFt || 0,
          zoning: data.zoning || 'Unknown',
          jurisdiction: data.jurisdiction || 'Phoenix',
          latitude: data.latitude,
          longitude: data.longitude,
          boundaryCoordinates: data.geometry?.coordinates ? JSON.stringify(data.geometry.coordinates) : null,
          city: data.jurisdiction || 'Phoenix',
          state: 'AZ',
          zip: data.address.match(/\d{5}$/)?.[0] || ''
        }
        
        console.log('Parcel object being set:', parcel)
        console.log('Building size in parcel:', parcel.buildingSize)
        console.log('Has boundary data:', !!parcel.boundaryCoordinates)
        
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
      
      console.log('Sending create project request with:', {
        fullAddress: parcelData?.address,
        projectType: 'ADDITION',
        conversation: conversation.substring(0, 200) + '...'
      })
      
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
      console.log('Create project response:', result)
      
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

  console.log('Current parcelData:', parcelData)
  console.log('Building size from state:', parcelData?.buildingSize)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2c4f6f] to-[#1e3a5f] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AI Scope Capture</h1>
          <p className="text-white/80">Let Scout guide you through your project setup</p>
        </div>

        {!parcelData && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
            <label className="block text-sm font-medium text-[#1e3a5f] mb-2">
              Property Address
            </label>
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <AddressAutocomplete
                  placeholder="e.g. 123 Main St, Phoenix, AZ 85001"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88]"
                  onAddressSelect={handleAddressSelect}
                  required={false}
                />
              </div>
              <button
                onClick={handleAddressSubmit}
                disabled={loadingAddress}
                className="px-6 py-3 bg-[#9caf88] text-white rounded-lg font-medium hover:bg-[#8a9d78] transition-colors disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
              >
                {loadingAddress ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5" />
                    Find Property
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {parcelData && (
          <>
            <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#9caf88] mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-[#1e3a5f] text-lg mb-2">{parcelData.address}</h3>
                  <div className="grid grid-cols-3 gap-3 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Lot Size:</span> {parcelData.lotSize.toLocaleString()} sq ft
                    </div>
                    <div>
                      <span className="font-medium">Building SF:</span> {parcelData.buildingSize > 0 ? parcelData.buildingSize.toLocaleString() : 'N/A'} sq ft
                    </div>
                    <div>
                      <span className="font-medium">Jurisdiction:</span> {parcelData.jurisdiction}
                    </div>
                    <div>
                      <span className="font-medium">Zoning:</span> {parcelData.zoning}
                    </div>
                    <div>
                      <span className="font-medium">APN:</span> {parcelData.apn}
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
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded hover:bg-gray-100"
                >
                  Change Address
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="h-[400px] overflow-y-auto p-6 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-[#9caf88] text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-3 rounded-lg flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-gray-600">Thinking...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {currentButtons.length > 0 && !isLoading && !isCreating && (
                <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-3">
                  <div className="flex flex-wrap gap-3">
                    {currentButtons.map((button, index) => (
                      <button
                        key={index}
                        onClick={() => handleButtonClick(button.value, button.label)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          selectedButtons.includes(button.value)
                            ? 'bg-[#9caf88] text-white shadow-md'
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-[#9caf88]'
                        }`}
                      >
                        {button.label}
                      </button>
                    ))}
                  </div>

                  {selectedButtons.length > 0 && (
                    <button
                      onClick={handleContinueMultiSelect}
                      className="w-full px-4 py-3 bg-[#1e3a5f] text-white rounded-lg font-medium hover:bg-[#2c4f6f] transition-colors"
                    >
                      Continue with: {selectedButtons.map(val => currentButtons.find(b => b.value === val)?.label).filter(Boolean).join(', ')}
                    </button>
                  )}
                </div>
              )}

              <div className="border-t border-gray-200 p-4 bg-white">
                <form onSubmit={handleTextSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type a message or ask a question..."
                    disabled={isLoading || isCreating}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88] disabled:bg-gray-100"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || isCreating || !textInput.trim()}
                    className="px-4 py-3 bg-[#9caf88] text-white rounded-lg hover:bg-[#8a9d78] transition-colors disabled:opacity-50"
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
