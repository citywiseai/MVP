'use client'

import { useEffect, useRef } from 'react'
import { loadGoogleMapsAPI } from '@/lib/googleMapsLoader'

interface SimpleStreetViewProps {
  address?: string
  latitude?: number
  longitude?: number
  className?: string
}

export default function SimpleStreetView({ 
  address, 
  latitude, 
  longitude, 
  className = "w-full h-64" 
}: SimpleStreetViewProps) {
  const streetViewRef = useRef<HTMLDivElement>(null)
  const panoramaRef = useRef<any>(null)

  useEffect(() => {
    const loadStreetView = async () => {
      try {
        await loadGoogleMapsAPI()
        initializeStreetView()
      } catch (error) {
        console.error('Failed to load Google Maps:', error)
      }
    }

    const initializeStreetView = () => {
      if (!streetViewRef.current || !(window as any).google) return

      try {
        // Default to Phoenix, AZ if no coordinates provided
        const defaultLat = 33.4484
        const defaultLng = -112.0740
        
        const streetViewOptions = {
          position: { lat: latitude || defaultLat, lng: longitude || defaultLng },
          pov: { heading: 34, pitch: 10 },
          zoom: 1,
          visible: true
        }

        const panorama = new (window as any).google.maps.StreetViewPanorama(
          streetViewRef.current,
          streetViewOptions
        )
        panoramaRef.current = panorama

        // If we have an address but no coordinates, geocode it
        if (address && address !== 'Address not available' && (!latitude || !longitude)) {
          console.log('Geocoding address for street view:', address)
          const geocoder = new (window as any).google.maps.Geocoder()
          geocoder.geocode({ address }, (results: any, status: any) => {
            console.log('Street view geocoding status:', status, 'Results:', results)
            if (status === 'OK' && results[0]) {
              const location = results[0].geometry.location
              panorama.setPosition(location)
            } else {
              console.error('Street view geocoding failed:', status)
            }
          })
        }
      } catch (error) {
        console.error('Error initializing street view:', error)
      }
    }

    loadStreetView()

    return () => {
      if (panoramaRef.current) {
        panoramaRef.current = null
      }
    }
  }, [address, latitude, longitude])

  return (
    <div className={className}>
      <div ref={streetViewRef} className="w-full h-full rounded-lg" />
    </div>
  )
}