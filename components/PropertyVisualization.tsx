'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

interface PropertyVisualizationProps {
  parcelData: {
    latitude: number
    longitude: number
    boundaryCoordinates: number[][]
    zoningRules?: Array<{
      type: string
      name?: string
      code?: string
      platBook?: string
      platPage?: string
    }>
  }
  platMapUrl?: string
  subdivisionName?: string
  platReference?: string
}

export default function PropertyVisualization({ 
  parcelData,
  platMapUrl,
  subdivisionName,
  platReference
}: PropertyVisualizationProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const draw = useRef<MapboxDraw | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [showLabels, setShowLabels] = useState(false)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [parcelData.longitude, parcelData.latitude],
      zoom: 18,
    })

    // Initialize drawing controls
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: 'simple_select'
    })

    map.current.on('load', () => {
      if (!map.current) return

      // Add property boundary
      if (parcelData.boundaryCoordinates && parcelData.boundaryCoordinates.length > 0) {
        map.current.addSource('parcel', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [parcelData.boundaryCoordinates]
            }
          }
        })

        // Property line
        map.current.addLayer({
          id: 'parcel-outline',
          type: 'line',
          source: 'parcel',
          paint: {
            'line-color': '#ff0000',
            'line-width': 3
          }
        })

        // Property fill
        map.current.addLayer({
          id: 'parcel-fill',
          type: 'fill',
          source: 'parcel',
          paint: {
            'fill-color': '#ff0000',
            'fill-opacity': 0.1
          }
        })
      }

      // Add marker
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([parcelData.longitude, parcelData.latitude])
        .addTo(map.current!)
    })

    return () => {
      map.current?.remove()
    }
  }, [parcelData])

  const toggleEditMode = () => {
    if (!map.current || !draw.current) return

    if (isEditMode) {
      // Disable edit mode
      map.current.removeControl(draw.current)
      setIsEditMode(false)
    } else {
      // Enable edit mode
      map.current.addControl(draw.current)
      setIsEditMode(true)
    }
  }

  const toggleLabels = () => {
    setShowLabels(!showLabels)
    // TODO: Add label markers for setbacks
  }

  // Extract setback info from zoning rules
  const getSetbacks = () => {
    const defaultSetbacks = {
      front: '20ft',
      rear: '15ft', 
      side: '5ft'
    }
    // TODO: Parse actual setbacks from zoningRules if available
    return defaultSetbacks
  }

  const setbacks = getSetbacks()

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Property Setback Visualization</h2>
        {platMapUrl && (
          <a
            href={platMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm inline-flex items-center gap-2"
          >
            📋 View Plat Map Info
          </a>
        )}
      </div>

      {subdivisionName && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm font-semibold text-blue-900">
            Subdivision: {subdivisionName}
          </p>
          {platReference && (
            <p className="text-xs text-blue-700">
              Plat Reference: {platReference}
            </p>
          )}
        </div>
      )}

      <p className="text-sm text-gray-600 mb-4">
        Interactive map showing property boundaries and buildable area
      </p>

      <div className="relative">
        {/* Map Container */}
        <div ref={mapContainer} className="w-full h-[500px] rounded-lg" />

        {/* Map Controls */}
        <div className="absolute top-4 right-4 space-y-2">
          <button
            onClick={toggleEditMode}
            className={`block w-full px-4 py-2 rounded-md text-sm font-medium shadow-lg ${
              isEditMode
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isEditMode ? '✓ Save Property Lines' : '✏️ Edit Property Lines'}
          </button>

          <button
            onClick={toggleLabels}
            className="block w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium shadow-lg"
          >
            🏷️ Label Edges
          </button>
        </div>

        {/* Setbacks Legend */}
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 space-y-2">
          <h3 className="font-semibold text-sm mb-2">Actual Setbacks:</h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="font-medium">Front Stream:</span>
              <span>{setbacks.front}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="font-medium">Rear (Back):</span>
              <span>{setbacks.rear}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="font-medium">Side Left/Right:</span>
              <span>{setbacks.side}</span>
            </div>
          </div>
        </div>

        {/* Design Tool Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
          <h4 className="font-semibold text-xs mb-2">Design Tool</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-black"></div>
              <span>Property Line</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-red-500" style={{borderTop: '2px dashed'}}></div>
              <span>Setback Lines</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Front</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Rear</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Side</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span>Developable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}