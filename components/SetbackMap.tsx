'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import * as turf from '@turf/turf'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'

// Convert Web Mercator (EPSG:3857) to WGS84 (EPSG:4326)
function webMercatorToWGS84(x: number, y: number): [number, number] {
  const lng = (x / 20037508.34) * 180
  let lat = (y / 20037508.34) * 180
  lat = (180 / Math.PI) * (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2)
  return [lng, lat]
}

// Convert WGS84 back to Web Mercator
function wgs84ToWebMercator(lng: number, lat: number): [number, number] {
  const x = (lng * 20037508.34) / 180
  let y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180)
  y = (y * 20037508.34) / 180
  return [x, y]
}

type EdgeType = 'front' | 'rear' | 'side'

interface SetbackMapProps {
  parcelData: {
    id?: string
    latitude: number
    longitude: number
    boundaryCoordinates?: any
    address: string
  }
  zoningRules: any[]
  lotSizeSqFt: number
}

export function SetbackMap({ parcelData, zoningRules, lotSizeSqFt }: SetbackMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const draw = useRef<MapboxDraw | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [measurements, setMeasurements] = useState<{area: number, perimeter: number, violatesSetback: boolean}[]>([])
  const labelMarkers = useRef<mapboxgl.Marker[]>([])
  const [isEditingBoundary, setIsEditingBoundary] = useState(false)
  const [boundaryCoordinates, setBoundaryCoordinates] = useState<number[][]>([])
  const boundaryMarkers = useRef<mapboxgl.Marker[]>([])
  const distanceLabels = useRef<mapboxgl.Marker[]>([])
  const [showPlatInfo, setShowPlatInfo] = useState(false)
  const platMapUrl = zoningRules.find((r: any) => r.type === 'subdivision')
  
  const [isLabelingEdges, setIsLabelingEdges] = useState(false)
  const [edgeTypes, setEdgeTypes] = useState<{[key: number]: EdgeType}>({})

  const [frontSetback, setFrontSetback] = useState(20)
  const [rearSetback, setRearSetback] = useState(15)
  const [sideSetback, setSideSetback] = useState(5)

  const buildableAreaPolygon = useRef<any>(null)

  // Create offset line for a specific edge with its setback distance
  const offsetEdge = (start: number[], end: number[], distance: number): [number[], number[]] => {
    const dx = end[0] - start[0]
    const dy = end[1] - start[1]
    const length = Math.sqrt(dx * dx + dy * dy)
    
    const perpX = -dy / length
    const perpY = dx / length
    
    const distanceDegrees = distance * 0.3048 / 111320
    
    const offsetStart = [
      start[0] + perpX * distanceDegrees,
      start[1] + perpY * distanceDegrees
    ]
    const offsetEnd = [
      end[0] + perpX * distanceDegrees,
      end[1] + perpY * distanceDegrees
    ]
    
    return [offsetStart, offsetEnd]
  }

  const checkSetbackViolation = (drawnPolygon: any): boolean => {
    if (!buildableAreaPolygon.current) {
      return false
    }
    
    try {
      if (!drawnPolygon?.geometry?.coordinates?.[0]) {
        return false
      }
      
      const drawnTurfPolygon = turf.polygon(drawnPolygon.geometry.coordinates)
      const isWithin = turf.booleanWithin(drawnTurfPolygon, buildableAreaPolygon.current)
      
      return !isWithin
      
    } catch (e) {
      console.error('Error checking violation:', e)
      return false
    }
  }

  const updateMeasurements = () => {
    if (!draw.current || !map.current) return
    
    try {
      const data = draw.current.getAll()
      
      // Clear existing label markers
      labelMarkers.current.forEach(marker => marker.remove())
      labelMarkers.current = []
      
      if (data.features.length > 0) {
        const newMeasurements: {area: number, perimeter: number, violatesSetback: boolean}[] = []
        
        // Process each drawn polygon
        data.features.forEach((drawnPolygon) => {
          if (drawnPolygon.geometry.type !== 'Polygon') return
          
          if (!drawnPolygon?.geometry?.coordinates?.[0]) {
            return
          }

          const coords = drawnPolygon.geometry.coordinates[0]
          
          // Validate coordinates
          let valid = true
          for (let i = 0; i < coords.length; i++) {
            if (!Array.isArray(coords[i]) || coords[i].length < 2) {
              valid = false
              break
            }
            if (typeof coords[i][0] !== 'number' || typeof coords[i][1] !== 'number') {
              valid = false
              break
            }
          }
          
          if (!valid) return
          
          let area = 0
          let perimeter = 0
          
          try {
            area = turf.area(drawnPolygon) * 10.764
            perimeter = turf.length(drawnPolygon, { units: 'feet' })
          } catch (calcError) {
            console.error('Error calculating area/perimeter:', calcError)
            return
          }
          
          const violatesSetback = checkSetbackViolation(drawnPolygon)
          
          newMeasurements.push({
            area: Math.round(area),
            perimeter: Math.round(perimeter),
            violatesSetback
          })

          // Create label for this polygon
          const center = turf.centroid(drawnPolygon)
          const [lng, lat] = center.geometry.coordinates
          
          const el = document.createElement('div')
          el.className = 'bg-white px-3 py-2 rounded-lg shadow-lg border-2 font-bold text-sm'
          el.style.borderColor = violatesSetback ? '#ef4444' : '#22c55e'
          el.style.color = violatesSetback ? '#ef4444' : '#22c55e'
          el.innerHTML = `${Math.round(area).toLocaleString()} ft²`
          
          const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat([lng, lat])
            .addTo(map.current!)
          
          labelMarkers.current.push(marker)
        })
        
        setMeasurements(newMeasurements)
      } else {
        setMeasurements([])
      }
    } catch (error) {
      console.error('Error in updateMeasurements:', error)
    }
  }

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    
    if (!mapboxToken) {
      console.error('Mapbox token not found')
      return
    }

    mapboxgl.accessToken = mapboxToken

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [parcelData.longitude, parcelData.latitude],
      zoom: 19
    })

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      },
      defaultMode: 'draw_polygon',
      styles: [
        {
          'id': 'gl-draw-polygon-fill',
          'type': 'fill',
          'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          'paint': {
            'fill-color': '#22c55e',
            'fill-opacity': 0.4
          }
        },
        {
          'id': 'gl-draw-polygon-stroke-active',
          'type': 'line',
          'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          'paint': {
            'line-color': '#22c55e',
            'line-width': 3
          }
        },
        {
          'id': 'gl-draw-line-active',
          'type': 'line',
          'filter': ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
          'paint': {
            'line-color': '#22c55e',
            'line-width': 3
          }
        },
        {
          'id': 'gl-draw-polygon-and-line-vertex-active',
          'type': 'circle',
          'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
          'paint': {
            'circle-radius': 6,
            'circle-color': '#22c55e'
          }
        }
      ]
    })

    map.current.addControl(draw.current as any, 'top-left')
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    new mapboxgl.Marker({ color: '#ef4444' })
      .setLngLat([parcelData.longitude, parcelData.latitude])
      .addTo(map.current)

    map.current.on('load', () => {
      setMapLoaded(true)
      
      if (map.current && parcelData.boundaryCoordinates && parcelData.boundaryCoordinates[0]) {
        const rings = parcelData.boundaryCoordinates[0]
        const wgs84Coordinates = rings.map((point: number[]) => webMercatorToWGS84(point[0], point[1]))
        
        setBoundaryCoordinates(wgs84Coordinates)
        updateBoundaryLayers(wgs84Coordinates)
      }
    })

    map.current.on('draw.create', () => {
      setTimeout(updateMeasurements, 100)
    })
    map.current.on('draw.update', () => {
      setTimeout(updateMeasurements, 100)
    })
    map.current.on('draw.selectionchange', () => {
      setTimeout(updateMeasurements, 100)
    })
    map.current.on('draw.delete', () => {
      setTimeout(updateMeasurements, 100)
    })

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [parcelData])

  useEffect(() => {
    if (boundaryCoordinates.length > 0) {
      updateBoundaryLayers(boundaryCoordinates)
    }
  }, [frontSetback, rearSetback, sideSetback, edgeTypes, isLabelingEdges])

  useEffect(() => {
    updateMeasurements()
  }, [frontSetback, rearSetback, sideSetback, edgeTypes])

  const cycleEdgeType = (edgeIndex: number) => {
    const currentType = edgeTypes[edgeIndex] || 'side'
    const types: EdgeType[] = ['side', 'front', 'rear']
    const currentIndex = types.indexOf(currentType)
    const nextType = types[(currentIndex + 1) % types.length]
    
    setEdgeTypes(prev => ({
      ...prev,
      [edgeIndex]: nextType
    }))
  }

  const updateBoundaryLayers = (coordinates: number[][]) => {
    if (!map.current) return

    distanceLabels.current.forEach(marker => marker.remove())
    distanceLabels.current = []

    const parcelSource = map.current.getSource('parcel') as mapboxgl.GeoJSONSource
    const boundaryData = {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [coordinates]
      },
      properties: {}
    }

    if (parcelSource) {
      parcelSource.setData(boundaryData)
    } else {
      map.current.addSource('parcel', {
        type: 'geojson',
        data: boundaryData
      })

      map.current.addLayer({
        id: 'parcel-fill',
        type: 'fill',
        source: 'parcel',
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.05
        }
      })

      map.current.addLayer({
        id: 'parcel-line',
        type: 'line',
        source: 'parcel',
        paint: {
          'line-color': '#3b82f6',
          'line-width': 3
        }
      })
    }

    const parcelPolygon = turf.polygon([coordinates])
    const centroid = turf.centroid(parcelPolygon).geometry.coordinates
    
    const setbacksByEdge: { [key in EdgeType]: number } = {
      front: frontSetback,
      rear: rearSetback,
      side: sideSetback
    }
    
    try {
      const setbackPoints: number[][] = []
      
      for (let i = 0; i < coordinates.length - 1; i++) {
        const boundaryStart = coordinates[i]
        const boundaryEnd = coordinates[i + 1]
        const edgeType = edgeTypes[i] || 'side'
        const edgeSetback = setbacksByEdge[edgeType]
        
        const [offsetStart, offsetEnd] = offsetEdge(boundaryStart, boundaryEnd, edgeSetback)
        
        const edgeMid = [(boundaryStart[0] + boundaryEnd[0]) / 2, (boundaryStart[1] + boundaryEnd[1]) / 2]
        const offsetMid = [(offsetStart[0] + offsetEnd[0]) / 2, (offsetStart[1] + offsetEnd[1]) / 2]
        
        const distOriginal = turf.distance(turf.point(edgeMid), turf.point(centroid))
        const distOffset = turf.distance(turf.point(offsetMid), turf.point(centroid))
        
        let finalStart = offsetStart
        let finalEnd = offsetEnd
        if (distOffset > distOriginal) {
          const [flippedStart, flippedEnd] = offsetEdge(boundaryStart, boundaryEnd, -edgeSetback)
          finalStart = flippedStart
          finalEnd = flippedEnd
        }
        
        if (i === 0) {
          setbackPoints.push(finalStart)
        }
        setbackPoints.push(finalEnd)
        
        const setbackLineData = {
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: [finalStart, finalEnd]
          },
          properties: {}
        }
        
        const lineSourceId = `setback-edge-${i}`
        const existingLineSource = map.current.getSource(lineSourceId) as mapboxgl.GeoJSONSource
        
        if (existingLineSource) {
          existingLineSource.setData(setbackLineData)
        } else {
          map.current.addSource(lineSourceId, {
            type: 'geojson',
            data: setbackLineData
          })

          map.current.addLayer({
            id: lineSourceId,
            type: 'line',
            source: lineSourceId,
            paint: {
              'line-color': '#ef4444',
              'line-width': 2,
              'line-dasharray': [2, 2]
            }
          })
        }
        
        const boundaryMid = [(boundaryStart[0] + boundaryEnd[0]) / 2, (boundaryStart[1] + boundaryEnd[1]) / 2]
        const setbackMid = [(finalStart[0] + finalEnd[0]) / 2, (finalStart[1] + finalEnd[1]) / 2]
        
        const dimensionLineData = {
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: [boundaryMid, setbackMid]
          },
          properties: {}
        }
        
        const dimSourceId = `dimension-line-${i}`
        const existingDimSource = map.current.getSource(dimSourceId) as mapboxgl.GeoJSONSource
        
        if (existingDimSource) {
          existingDimSource.setData(dimensionLineData)
        } else {
          map.current.addSource(dimSourceId, {
            type: 'geojson',
            data: dimensionLineData
          })

          map.current.addLayer({
            id: dimSourceId,
            type: 'line',
            source: dimSourceId,
            paint: {
              'line-color': '#fbbf24',
              'line-width': 2,
              'line-dasharray': [4, 4]
            }
          })
        }
        
        const labelMid = [
          (boundaryMid[0] + setbackMid[0]) / 2,
          (boundaryMid[1] + setbackMid[1]) / 2
        ]
        
        const el = document.createElement('div')
        const bgColor = edgeType === 'front' ? 'bg-orange-400' :
                       edgeType === 'rear' ? 'bg-purple-400' : 'bg-yellow-400'
        const textColor = edgeType === 'side' ? 'text-black' : 'text-white'
        
        el.className = `${bgColor} ${textColor} px-3 py-2 rounded-full text-sm font-bold shadow-lg border-3 border-white ${
          isLabelingEdges ? 'cursor-pointer hover:scale-125' : ''
        } transition-transform`
        el.innerHTML = `${edgeSetback}ft`
        el.title = isLabelingEdges ? 
          `${edgeType.toUpperCase()} - Click to change` : 
          `${edgeType.charAt(0).toUpperCase() + edgeType.slice(1)} setback`
        el.style.pointerEvents = 'auto'
        el.style.zIndex = '1000'
        
        if (isLabelingEdges) {
          el.addEventListener('click', (e) => {
            e.stopPropagation()
            e.preventDefault()
            cycleEdgeType(i)
          })
        }
        
        const marker = new mapboxgl.Marker({ 
          element: el, 
          anchor: 'center'
        })
          .setLngLat([labelMid[0], labelMid[1]])
          .addTo(map.current!)
        
        distanceLabels.current.push(marker)
      }
      
      if (setbackPoints.length > 0) {
        setbackPoints.push([...setbackPoints[0]])
        buildableAreaPolygon.current = turf.polygon([setbackPoints])
      }
      
    } catch (e) {
      console.error('Error creating setback:', e)
    }
  }

  const saveToDatabase = async (coordinates: number[][]) => {
    if (!parcelData.id) {
      alert('⚠️ Cannot save: No parcel ID found')
      return
    }
    
    const webMercatorCoords = coordinates.map(point => wgs84ToWebMercator(point[0], point[1]))
    
    try {
      const response = await fetch(`/api/parcels/${parcelData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boundaryCoordinates: [webMercatorCoords]
        })
      })
      
      if (response.ok) {
        alert('✅ Property boundary saved! Reloading...')
        window.location.reload()
      } else {
        alert('❌ Failed to save boundary')
      }
    } catch (error) {
      console.error('Error saving boundary:', error)
      alert('❌ Error saving boundary')
    }
  }

  const toggleBoundaryEdit = () => {
    if (!map.current) return

    if (isEditingBoundary) {
      boundaryMarkers.current.forEach((marker, index) => {
        const lngLat = marker.getLngLat()
        boundaryCoordinates[index] = [lngLat.lng, lngLat.lat]
      })
      
      if (boundaryCoordinates.length > 0) {
        boundaryCoordinates[boundaryCoordinates.length - 1] = [...boundaryCoordinates[0]]
      }
      
      const updatedCoords = [...boundaryCoordinates]
      setBoundaryCoordinates(updatedCoords)
      updateBoundaryLayers(updatedCoords)
      
      boundaryMarkers.current.forEach(marker => marker.remove())
      boundaryMarkers.current = []
      setIsEditingBoundary(false)
      
      saveToDatabase(updatedCoords)
    } else {
      setIsEditingBoundary(true)
      
      boundaryCoordinates.slice(0, -1).forEach((coord, index) => {
        const el = document.createElement('div')
        el.className = 'w-5 h-5 bg-blue-500 border-3 border-white rounded-full cursor-move shadow-xl hover:scale-125 transition-transform'
        el.style.boxShadow = '0 0 0 2px white, 0 4px 6px rgba(0,0,0,0.3)'
        
        const marker = new mapboxgl.Marker({
          element: el,
          draggable: true
        })
          .setLngLat([coord[0], coord[1]])
          .addTo(map.current!)

        boundaryMarkers.current.push(marker)
      })
    }
  }

  // Calculate totals
  const totalArea = measurements.reduce((sum, m) => sum + m.area, 0)
  const hasViolations = measurements.some(m => m.violatesSetback)

  return (
    <div className="relative">
      <div id="map-container" ref={mapContainer} className="w-full h-[600px] rounded-lg" />
      
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 space-y-3 max-w-xs">
        <button
          onClick={toggleBoundaryEdit}
          disabled={isLabelingEdges}
          className={`w-full px-4 py-2 rounded-lg font-semibold text-sm ${
            isEditingBoundary 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : isLabelingEdges
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isEditingBoundary ? '✓ Save Property Line' : '✏️ Edit Property Line'}
        </button>
        
        <button
          onClick={() => setIsLabelingEdges(!isLabelingEdges)}
          disabled={isEditingBoundary}
          className={`w-full px-4 py-2 rounded-lg font-semibold text-sm ${
            isLabelingEdges 
              ? 'bg-orange-500 text-white hover:bg-orange-600' 
              : isEditingBoundary
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          {isLabelingEdges ? '✓ Done Labeling' : '🏷️ Label Edges'}
        </button>

        {isLabelingEdges && (
          <div className="p-3 bg-orange-50 rounded-lg border-2 border-orange-400">
            <p className="text-xs font-semibold text-orange-800 mb-1">
              Click the colored circles to change edge type:
            </p>
            <p className="text-xs text-orange-700">
              Yellow → Orange (Front) → Purple (Rear) → Yellow (Side)
            </p>
          </div>
        )}
        
        {platMapUrl && (
          <>
            <button
              onClick={() => setShowPlatInfo(!showPlatInfo)}
              className="w-full px-4 py-2 rounded-lg font-semibold text-sm bg-purple-500 text-white hover:bg-purple-600"
            >
              📋 {showPlatInfo ? 'Hide' : 'View'} Plat Map Info
            </button>
            
            {showPlatInfo && (
              <div className="p-3 bg-purple-50 rounded-lg text-xs space-y-1">
                <div><strong>Subdivision:</strong> {platMapUrl.name}</div>
                {platMapUrl.platBook && <div><strong>Plat Book:</strong> {platMapUrl.platBook}</div>}
                {platMapUrl.platPage && <div><strong>Page:</strong> {platMapUrl.platPage}</div>}
                <a 
                  href={`https://recorder.maricopa.gov/recdocdata/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-2 text-purple-600 hover:text-purple-800 underline"
                >
                  View on Maricopa Recorder →
                </a>
              </div>
            )}
          </>
        )}
        
        <div className="pt-3 border-t space-y-2">
          <h4 className="font-semibold text-xs text-gray-700">Adjust Setbacks:</h4>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-600 flex justify-between">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-orange-400 rounded"></span>
                  Front (Street):
                </span>
                <span className="font-semibold">{frontSetback}ft</span>
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={frontSetback}
                onChange={(e) => setFrontSetback(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 flex justify-between">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-purple-400 rounded"></span>
                  Rear (Back):
                </span>
                <span className="font-semibold">{rearSetback}ft</span>
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={rearSetback}
                onChange={(e) => setRearSetback(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 flex justify-between">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-yellow-400 rounded"></span>
                  Side (Left/Right):
                </span>
                <span className="font-semibold">{sideSetback}ft</span>
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={sideSetback}
                onChange={(e) => setSideSetback(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {measurements.length > 0 && (
        <div className={`absolute top-4 left-4 rounded-lg shadow-lg p-4 max-w-xs border-2 ${
          hasViolations ? 'bg-red-50 border-red-500' : 'bg-white border-green-500'
        }`}>
          {hasViolations && (
            <div className="flex items-center gap-2 mb-2 text-red-600">
              <span className="text-lg">⚠️</span>
              <span className="font-semibold text-sm">Setback Violation!</span>
            </div>
          )}
          <h3 className="font-semibold text-sm mb-2">📐 Design Summary</h3>
          
          {measurements.length > 1 && (
            <div className="text-xs mb-3 pb-2 border-b">
              <div className="flex justify-between font-semibold">
                <span className="text-gray-700">Total Area:</span>
                <span>{totalArea.toLocaleString()} ft²</span>
              </div>
              <div className="text-gray-500 mt-1">
                {measurements.length} structure{measurements.length > 1 ? 's' : ''}
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            {measurements.map((m, index) => (
              <div key={index} className={`text-xs p-2 rounded ${m.violatesSetback ? 'bg-red-100' : 'bg-gray-50'}`}>
                <div className="font-semibold mb-1 flex items-center gap-1">
                  {m.violatesSetback && <span className="text-red-600">⚠️</span>}
                  Structure {index + 1}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Area:</span>
                  <span className="font-semibold">{m.area.toLocaleString()} ft²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Perimeter:</span>
                  <span className="font-semibold">{m.perimeter.toLocaleString()} ft</span>
                </div>
              </div>
            ))}
          </div>
          
          {hasViolations && (
            <p className="text-xs text-red-600 mt-2">
              One or more structures extend into the setback area.
            </p>
          )}
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4">
        <h3 className="font-semibold text-sm mb-2">🏗️ Design Tool</h3>
        {isEditingBoundary && (
          <p className="text-xs text-blue-600 mb-2 font-semibold">
            Drag blue circles to adjust property line
          </p>
        )}
        <div className="text-xs space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500"></div>
            <span>Property Line</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500" style={{borderTop: '2px dashed'}}></div>
            <span>Setback Lines</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-400 rounded"></div>
            <span>Front</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-400 rounded"></div>
            <span>Rear</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
            <span>Side</span>
          </div>
        </div>
      </div>
    </div>
  )
}