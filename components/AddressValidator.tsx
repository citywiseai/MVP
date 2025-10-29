'use client'

import { useState, useEffect } from 'react'


interface AddressValidatorProps {
  address?: string
  onValidationComplete?: (isValid: boolean, suggestions?: string[]) => void
}

export function AddressValidator({ address, onValidationComplete }: AddressValidatorProps) {
  const [currentAddress, setCurrentAddress] = useState(address || '')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isValid, setIsValid] = useState(true)

  useEffect(() => {
    if (address !== undefined) {
      setCurrentAddress(address)
      if (address.length > 5) {
        validateAndSuggest(address)
      } else {
        setSuggestions([])
        setIsValid(true)
      }
      return
    }
    // Fallback: Monitor the address input for changes if no address prop is provided
    const addressInput = document.getElementById('fullAddress') as HTMLInputElement
    if (!addressInput) return
    const handleAddressChange = () => {
      const addr = addressInput.value.trim()
      setCurrentAddress(addr)
      if (addr.length > 5) {
        validateAndSuggest(addr)
      } else {
        setSuggestions([])
        setIsValid(true)
      }
    }
    addressInput.addEventListener('input', handleAddressChange)
    handleAddressChange()
    return () => {
      addressInput.removeEventListener('input', handleAddressChange)
    }
  }, [address])

  function validateAndSuggest(address: string) {
    const issues: string[] = []
    const validationResult = {
      hasNumber: /\d/.test(address),
      hasStreetType: /\b(st|street|ave|avenue|rd|road|dr|drive|blvd|boulevard|ln|lane|ct|court|pl|place|way|cir|circle)\b/i.test(address),
      hasCity: /,\s*[a-z\s]+,/i.test(address) || /,\s*[a-z\s]+\s+\d{5}/i.test(address),
      hasState: /\b[A-Z]{2}\b/.test(address) || /\b(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)\b/i.test(address),
      hasZip: /\b\d{5}(?:-\d{4})?\b/.test(address),
      hasCommas: (address.match(/,/g) || []).length >= 1
    }

    // Check for common issues and provide suggestions
    if (!validationResult.hasNumber) {
      issues.push("Add a street number (e.g., '123' Main St)")
    }
    
    if (!validationResult.hasStreetType) {
      issues.push("Include street type (St, Ave, Rd, Dr, etc.)")
    }
    
    if (!validationResult.hasCommas) {
      issues.push("Use commas to separate address parts: '123 Main St, City, State ZIP'")
    }
    
    if (!validationResult.hasCity && validationResult.hasCommas) {
      issues.push("Include the city name")
    }
    
    if (!validationResult.hasState) {
      issues.push("Include the state (AZ, Arizona, etc.)")
    }
    
    if (!validationResult.hasZip) {
      issues.push("Consider adding ZIP code for better accuracy")
    }

    // Check for common typos and abbreviations
    const commonFixes: { [key: string]: string } = {
      'phx': 'Phoenix',
      'pheonix': 'Phoenix', 
      'phenix': 'Phoenix',
      'tuscon': 'Tucson',
      'st.': 'St',
      'ave.': 'Ave',
      'rd.': 'Rd',
      'dr.': 'Dr',
      'blvd.': 'Blvd'
    }

    Object.entries(commonFixes).forEach(([typo, correction]) => {
      if (address.toLowerCase().includes(typo)) {
        issues.push(`Consider changing "${typo}" to "${correction}"`)
      }
    })

    const valid = issues.length === 0 && validationResult.hasNumber && validationResult.hasCommas
    setIsValid(valid)
    setSuggestions(issues)
    onValidationComplete?.(valid, issues)
  }

  if (!currentAddress || currentAddress.length < 6) {
    return null
  }

  if (isValid && suggestions.length === 0) {
    return (
      <div className="p-3 bg-green-50 rounded border border-green-200 mb-4">
        <p className="text-sm text-green-700 flex items-center gap-2">
          ✅ Address format looks good!
        </p>
      </div>
    )
  }

  if (suggestions.length > 0) {
    return (
      <div className="p-3 bg-yellow-50 rounded border border-yellow-200 mb-4">
        <p className="text-sm text-yellow-800 font-medium mb-2 flex items-center gap-2">
          💡 Address suggestions to improve accuracy:
        </p>
        <ul className="text-sm text-yellow-700 space-y-1">
          {suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              {suggestion}
            </li>
          ))}
        </ul>
        <p className="text-xs text-yellow-600 mt-2">
          These suggestions help ensure accurate property data lookup
        </p>
      </div>
    )
  }

  return null
}