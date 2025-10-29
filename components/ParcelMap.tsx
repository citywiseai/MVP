'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface ParcelMapProps {
  parcels: Array<{
    id: string
    address: string
    apn: string
    zoningCode: string
    lotSizeSqFt: number
  }>
}

export function ParcelMap({ parcels }: ParcelMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Phoenix coordinates
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-112.0740, 33.4484], // Phoenix
      zoom: 10
    })

    // Add markers for parcels
    parcels.forEach(parcel => {
      // For demo, use approximate Phoenix coordinates
      // In production, you'd geocode the addresses
      const coords: [number, number] = [-112.0740 + Math.random() * 0.1, 33.4484 + Math.random() * 0.1]
      
      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <strong>${parcel.address}</strong><br>
        APN: ${parcel.apn}<br>
        Zoning: ${parcel.zoningCode}<br>
        Size: ${parcel.lotSizeSqFt.toLocaleString()} sq ft
      `)

      new maplibregl.Marker({ color: '#3B82F6' })
        .setLngLat(coords)
        .setPopup(popup)
        .addTo(map.current!)
    })

    return () => {
      map.current?.remove()
    }
  }, [parcels])

  return (
    <div 
      ref={mapContainer} 
      style={{ width: '100%', height: '500px' }}
      className="rounded-lg overflow-hidden shadow"
    />
  )
}