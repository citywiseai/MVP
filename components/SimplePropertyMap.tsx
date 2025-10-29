'use client'

import { useEffect, useRef } from 'react'
import { loadGoogleMapsAPI } from '@/lib/googleMapsLoader'

interface SimplePropertyMapProps {
  address?: string
  latitude?: number
  longitude?: number
  className?: string
}

export default function SimplePropertyMap({ 
  address, 
  latitude, 
  longitude, 
  className = "w-full h-64" 
}: SimplePropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    const loadMap = async () => {
      try {
        await loadGoogleMapsAPI()
        initializeMap()
      } catch (error) {
        console.error('Failed to load Google Maps:', error)
      }
    }

    const initializeMap = () => {
      if (!mapRef.current || !(window as any).google) return

      try {
        // Default coordinates (Seattle area)
        let lat = latitude || 47.6097
        let lng = longitude || -122.3331

        const mapOptions = {
          zoom: 18,
          center: { lat, lng },
          mapTypeId: (window as any).google.maps.MapTypeId.SATELLITE,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
        }

        const map = new (window as any).google.maps.Map(mapRef.current, mapOptions)
        mapInstanceRef.current = map

        // If we have specific coordinates, add marker
        if (latitude && longitude) {
          new (window as any).google.maps.Marker({
            position: { lat, lng },
            map: map,
            title: address || 'Property Location'
          })
        } else if (address) {
          // Geocode the address to get coordinates
          const geocoder = new (window as any).google.maps.Geocoder()
          geocoder.geocode(
            { address: address },
            (results: any, status: any) => {
              if (status === 'OK' && results[0]) {
                const location = results[0].geometry.location
                map.setCenter(location)
                new (window as any).google.maps.Marker({
                  position: location,
                  map: map,
                  title: address
                })
              }
            }
          )
        }
      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }

    loadMap()
  }, [address, latitude, longitude])

  return (
    <div className={className}>
      <div
        ref={mapRef}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '200px' }}
      />
    </div>
  )
}
