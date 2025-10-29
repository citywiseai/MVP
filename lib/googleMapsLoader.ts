// Global Google Maps API loader utility

// Type definitions
type GoogleMapsCallback = () => void;

let isLoaded = false
let isLoading = false
const callbacks: Array<GoogleMapsCallback> = []

export const loadGoogleMapsAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // If already loaded, resolve immediately
    if (isLoaded && (window as any).google && (window as any).google.maps) {
      resolve()
      return
    }

    // Add to callback queue
    callbacks.push(() => resolve())

    // If already loading, just wait
    if (isLoading) {
      return
    }

    // Check if script already exists in DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      isLoading = true
      
      // If script exists but not loaded yet, wait for it
      if (!(window as any).google || !(window as any).google.maps) {
        existingScript.addEventListener('load', () => {
          isLoaded = true
          isLoading = false
          callbacks.forEach(callback => callback())
          callbacks.length = 0
        })
        existingScript.addEventListener('error', () => {
          isLoading = false
          reject(new Error('Failed to load Google Maps API'))
        })
      } else {
        // Script exists and Google Maps is loaded
        isLoaded = true
        isLoading = false
        callbacks.forEach(callback => callback())
        callbacks.length = 0
      }
      return
    }

    // Load the script
    isLoading = true
    
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    
    script.onload = () => {
      isLoaded = true
      isLoading = false
      callbacks.forEach(callback => callback())
      callbacks.length = 0
    }
    
    script.onerror = () => {
      isLoading = false
      reject(new Error('Failed to load Google Maps API'))
    }
    
    document.head.appendChild(script)
  })
}

// Check if Google Maps API is available
export const isGoogleMapsLoaded = (): boolean => {
  return !!((window as any).google && (window as any).google.maps)
}