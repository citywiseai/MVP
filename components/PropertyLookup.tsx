'use client'

import { useState } from 'react'


interface PropertyLookupProps {
  address?: string
}

export function PropertyLookup({ address }: PropertyLookupProps) {
  const [loading, setLoading] = useState(false)
  const [lastLookupAddress, setLastLookupAddress] = useState('')
  const [addressWarning, setAddressWarning] = useState('')

  function validateAddress(addr: string): string {
    if (!addr) return 'Please enter an address first'
    if (addr.length < 10) return 'Please enter a complete address (street, city, state)'
    const hasNumber = /\d/.test(addr)
    const hasState = /\b[A-Z]{2}\b/.test(addr) || /\b(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)\b/i.test(addr)
    const hasCommas = (addr.match(/,/g) || []).length >= 1
    if (!hasNumber) return 'Address should include a street number'
    if (!hasState) return 'Address should include a state (e.g., AZ, Arizona)'
    if (!hasCommas) return 'Address should be formatted like: 123 Main St, City, State ZIP'
    return ''
  }

  async function handleLookup() {
    const addr = address?.trim() || ''
    const warning = validateAddress(addr)
    if (warning) {
      setAddressWarning(warning)
      return
    }
    setAddressWarning('')
    setLoading(true)
    try {
      const response = await fetch(`/api/real-address-lookup?address=${encodeURIComponent(addr)}`)
      const data = await response.json()
      if (response.ok) {
        setLastLookupAddress(addr)
        // Populate property details
        const updates = [
          { id: 'lotSizeSqFt', value: data.lotSizeSqFt },
          { id: 'buildingFootprintSqFt', value: data.buildingSqFt },
          { id: 'jurisdiction', value: data.jurisdiction }
        ]
        updates.forEach(({ id, value }) => {
          const input = document.getElementById(id) as HTMLInputElement
          if (input && value) {
            input.value = value.toString()
          }
        })
        // Auto-select property type if detected
        const propertyTypeSelect = document.getElementById('propertyType') as HTMLSelectElement
        if (propertyTypeSelect && data.propertyType) {
          propertyTypeSelect.value = data.propertyType
        }
        showSuccessMessage(`✓ Found property data for ${data.jurisdiction}`)
      } else {
        throw new Error(data.error || 'Failed to lookup address')
      }
    } catch (error) {
      console.error('Address lookup error:', error)
      alert('Failed to lookup address. Please check the address and try again.')
    } finally {
      setLoading(false)
    }
  }

  function showSuccessMessage(message: string) {
    const successDiv = document.createElement('div')
    successDiv.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50'
    successDiv.textContent = message
    document.body.appendChild(successDiv)
    
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv)
      }
    }, 3000)
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-3">
        <button
          type="button"
          onClick={handleLookup}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Looking up...
            </>
          ) : (
            <>
              🏠 Lookup Property Data
            </>
          )}
        </button>
        <span className="text-sm text-gray-600">
          Auto-populate property details from public records
        </span>
      </div>
      
      {addressWarning && (
        <div className="p-3 bg-orange-50 rounded border border-orange-200 mb-4">
          <p className="text-sm text-orange-700 flex items-center gap-2">
            ⚠️ <span className="font-medium">Address Check:</span> {addressWarning}
          </p>
          <p className="text-xs text-orange-600 mt-1">
            Tip: Use the address autocomplete above to ensure accuracy
          </p>
        </div>
      )}
      
      {lastLookupAddress && (
        <div className="p-3 bg-green-50 rounded border border-green-200 mb-4">
          <p className="text-sm text-green-700">
            ✓ Property data loaded for: <span className="font-medium">{lastLookupAddress}</span>
          </p>
        </div>
      )}
    </div>
  )
}