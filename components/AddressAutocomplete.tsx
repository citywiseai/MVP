'use client'

import { useEffect, useRef, useState } from 'react'
import { loadGoogleMapsAPI } from '@/lib/googleMapsLoader'

interface AddressAutocompleteProps {
  onAddressSelect?: (address: string, placeDetails?: any) => void
  placeholder?: string
  className?: string
  name?: string
  required?: boolean
  id?: string
}

export function AddressAutocomplete({ 
  onAddressSelect, 
  placeholder = "123 Main St, Phoenix, AZ 85001",
  className = "w-full px-3 py-2 border rounded-md",
  name = "fullAddress",
  required = false,
  id = "fullAddress"
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(false) // Start with false so input is immediately usable
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function initializeAutocomplete() {
      try {
        setIsLoading(true)
        console.log('Starting Google Maps API load...')
        await loadGoogleMapsAPI()
        console.log('Google Maps API loaded successfully')
        
        if (!isMounted || !inputRef.current) {
          console.log('Component unmounted or input ref not available')
          setIsLoading(false)
          return
        }

        if (!(window as any).google || !(window as any).google.maps || !(window as any).google.maps.places) {
          throw new Error('Google Maps Places API not available')
        }

        console.log('Initializing Places Autocomplete...')
        // Initialize Google Places Autocomplete
        autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'us' }, // Restrict to US addresses
          fields: [
            'formatted_address',
            'geometry',
            'address_components',
            'place_id',
            'name'
          ]
        })

        // Listen for place selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace()
          
          if (place && place.formatted_address) {
            // Update the input value
            if (inputRef.current) {
              inputRef.current.value = place.formatted_address
            }
            
            // Call the callback with the selected address
            onAddressSelect?.(place.formatted_address, place)
            
            // Show success message
            showSuccessMessage('✓ Address verified and selected')
          }
        })

        console.log('Places Autocomplete initialized successfully')
        setIsLoading(false)
        setError(null)
      } catch (err) {
        console.error('Failed to initialize Google Places:', err)
        setError('Address autocomplete unavailable')
        setIsLoading(false)
      }
    }

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(initializeAutocomplete, 100)

    // Fallback timeout - if it takes more than 10 seconds, give up and allow manual entry
    const fallbackTimer = setTimeout(() => {
      if (isMounted && isLoading) {
        console.warn('Google Maps API loading timeout - enabling manual entry')
        setError('Autocomplete unavailable')
        setIsLoading(false)
      }
    }, 10000)

    return () => {
      isMounted = false
      clearTimeout(timer)
      clearTimeout(fallbackTimer)
      if (autocompleteRef.current) {
        (window as any).google?.maps?.event?.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [onAddressSelect, isLoading])

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
    <div className="relative">
      <input
        ref={inputRef}
        name={name}
        type="text"
        required={required}
        id={id}
        placeholder={placeholder}
        className={`${className} ${isLoading ? 'pr-10' : ''}`}
        disabled={false}
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-orange-600 mt-1 flex items-center gap-1">
          ⚠️ {error} - You can type the address manually
        </p>
      )}
      
      {!isLoading && !error && (
        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
          📍 Start typing for address suggestions
        </p>
      )}
      
      {!isLoading && !error && autocompleteRef.current && (
        <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
          ✅ Address autocomplete ready
        </p>
      )}
    </div>
  )
}