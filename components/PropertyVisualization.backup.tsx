"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import * as turf from '@turf/turf';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Maximize2, Minimize2, Map, Building2, Grid3x3, MapPin, Save, Edit, X, AlertTriangle, Check } from 'lucide-react';

interface PropertyVisualizationProps {
  projectId: string;
  parcelData?: any;
  buildingFootprint?: any;
}

export default function PropertyVisualization({ 
  projectId,
  parcelData,
  buildingFootprint 
}: PropertyVisualizationProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const editablePolygon = useRef<L.Polygon | null>(null);
  const displayPolygon = useRef<L.Polygon | null>(null);
  const buildingLayer = useRef<L.GeoJSON | null>(null);
  const setbackLayer = useRef<L.LayerGroup | null>(null);
  const drawLayer = useRef<L.FeatureGroup | null>(null);
  const drawControl = useRef<any>(null);
  const satelliteLayer = useRef<L.TileLayer | null>(null);
  const streetLayer = useRef<L.TileLayer | null>(null);
  const vertexMarkers = useRef<L.Marker[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'satellite' | 'street'>('satellite');
  const [showParcel, setShowParcel] = useState(true);
  const [showSetbacks, setShowSetbacks] = useState(true);
  const [isEditingBoundary, setIsEditingBoundary] = useState(false);
  const [isEditingSetbacks, setIsEditingSetbacks] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [boundaryCoords, setBoundaryCoords] = useState<[number, number][]>([]);
  
  const [setbacks, setSetbacks] = useState({
    front: 20,
    rear: 15,
    sideLeft: 5,
    sideRight: 5
  });
  
  const [buildableArea, setBuildableArea] = useState<number | null>(null);
  const [violations, setViolations] = useState<string[]>([]);

  const vertexIcon = L.divIcon({
    className: 'vertex-marker',
    html: '<div style="width: 16px; height: 16px; background: #4A90E2; border: 2px solid #fff; border-radius: 50%; cursor: move;"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  // Helper to ensure polygon is closed
  const ensureClosedPolygon = (coords: [number, number][]) => {
    if (coords.length === 0) return coords;
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      return [...coords, first];
    }
    return coords;
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    let centerLat = 33.4484;
    let centerLng = -111.8910;
    
    if (parcelData?.latitude && parcelData?.longitude) {
      centerLat = parcelData.latitude;
      centerLng = parcelData.longitude;
    }

    map.current = L.map(mapContainer.current, {
      center: [centerLat, centerLng],
      zoom: 19,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map.current);

    satelliteLayer.current = L.tileLayer(
      'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      {
        attribution: '© Google',
        maxZoom: 22,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      }
    );

    streetLayer.current = L.tileLayer(
      'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      {
        attribution: '© Google',
        maxZoom: 22,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      }
    );

    satelliteLayer.current.addTo(map.current);

    setbackLayer.current = L.layerGroup().addTo(map.current);
    drawLayer.current = L.featureGroup().addTo(map.current);

    drawControl.current = new (L.Control as any).Draw({
      draw: {
        polygon: true,
        rectangle: true,
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false
      },
      edit: {
        featureGroup: drawLayer.current,
        remove: true
      }
    });

    let geometryToUse = null;

    if (parcelData?.geometry) {
      geometryToUse = parcelData.geometry;
    }
    else if (parcelData?.boundaryCoordinates && Array.isArray(parcelData.boundaryCoordinates)) {
      geometryToUse = {
        type: 'Polygon',
        coordinates: [parcelData.boundaryCoordinates]
      };
    }

    if (geometryToUse) {
      const coords = geometryToUse.coordinates[0].map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
      // Remove last point if it's a duplicate (for editing purposes)
      const coordsWithoutDupe = coords.slice(0, -1);
      setBoundaryCoords(coordsWithoutDupe);
      addParcelLayer(coordsWithoutDupe);
      
      // For setback calculation, use closed polygon
      const closedGeometry = {
        type: 'Polygon',
        coordinates: [ensureClosedPolygon(coordsWithoutDupe.map(c => [c[1], c[0]]))]
      };
      calculateAndDrawSetbacks(closedGeometry);
    }

    if (buildingFootprint) {
      addBuildingLayer(buildingFootprint);
    }

    setIsLoading(false);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [parcelData, buildingFootprint]);

  useEffect(() => {
    if (!map.current || !satelliteLayer.current || !streetLayer.current) return;

    if (activeLayer === 'satellite') {
      map.current.removeLayer(streetLayer.current);
      map.current.addLayer(satelliteLayer.current);
    } else {
      map.current.removeLayer(satelliteLayer.current);
      map.current.addLayer(streetLayer.current);
    }
  }, [activeLayer]);

  const addParcelLayer = (coords: [number, number][]) => {
    if (!map.current) return;

    if (displayPolygon.current) {
      map.current.removeLayer(displayPolygon.current);
    }

    displayPolygon.current = L.polygon(coords, {
      color: '#FFD700',
      weight: 3,
      fillColor: '#FFD700',
      fillOpacity: 0.2,
    }).addTo(map.current);

    const bounds = displayPolygon.current.getBounds();
    map.current.fitBounds(bounds, { padding: [50, 50] });
  };

  const createDraggableVertices = (coords: [number, number][]) => {
    if (!map.current) return;

    vertexMarkers.current.forEach(marker => map.current?.removeLayer(marker));
    vertexMarkers.current = [];

    coords.forEach((coord, index) => {
      const marker = L.marker(coord, {
        icon: vertexIcon,
        draggable: true,
        autoPan: true
      });

      marker.addTo(map.current!);
      vertexMarkers.current.push(marker);

      marker.on('drag', (e: any) => {
        const newLatLng = e.target.getLatLng();
        
        // Update state immediately during drag
        setBoundaryCoords(prevCoords => {
          const newCoords = [...prevCoords];
          newCoords[index] = [newLatLng.lat, newLatLng.lng];
          
          // Update polygon shape in real-time
          if (editablePolygon.current) {
            editablePolygon.current.setLatLngs(newCoords);
          }
          
          return newCoords;
        });
      });

      marker.on('dragend', () => {
        // Recalculate setbacks when drag ends
        const geojson = {
          type: 'Polygon',
          coordinates: [ensureClosedPolygon(boundaryCoords.map(c => [c[1], c[0]]))]
        };
        calculateAndDrawSetbacks(geojson);
      });
    });
  };

  const toggleBoundaryEdit = () => {
    if (!map.current || !displayPolygon.current) return;

    if (isEditingBoundary) {
      vertexMarkers.current.forEach(marker => map.current?.removeLayer(marker));
      vertexMarkers.current = [];
      
      if (editablePolygon.current) {
        map.current.removeLayer(editablePolygon.current);
        editablePolygon.current = null;
      }
      
      map.current.dragging.enable();
      
      if (!map.current.hasLayer(displayPolygon.current)) {
        displayPolygon.current.addTo(map.current);
      }
      
      setIsEditingBoundary(false);
    } else {
      if (displayPolygon.current) {
        map.current.removeLayer(displayPolygon.current);
      }
      
      map.current.dragging.disable();
      
      editablePolygon.current = L.polygon(boundaryCoords, {
        color: '#FFD700',
        weight: 3,
        fillColor: '#FFD700',
        fillOpacity: 0.2,
      }).addTo(map.current);
      
      createDraggableVertices(boundaryCoords);
      setIsEditingBoundary(true);
    }
  };

  const saveBoundary = async () => {
    console.log('🔍 DEBUG - parcelData:', parcelData);
    console.log('🔍 DEBUG - parcelData.id:', parcelData?.id);
    console.log('🔍 DEBUG - coordinates to save:', boundaryCoords);
    
    if (!parcelData?.id) {
      alert('❌ No parcel ID found - cannot save boundary');
      console.error('❌ parcelData:', parcelData);
      return;
    }
    
    try {
      // Close the polygon for saving (add first point as last point)
      const closedCoords = ensureClosedPolygon(boundaryCoords.map(c => [c[1], c[0]]));
      
      console.log('📤 Sending to API:', {
        parcelId: parcelData.id,
        coordinates: closedCoords
      });

      const response = await fetch('/api/parcels/update-boundary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcelId: parcelData.id,
          coordinates: closedCoords
        })
      });

      const result = await response.json();
      console.log('📥 API Response:', result);

      if (response.ok) {
        alert('✅ Property boundary saved successfully!');
        
        vertexMarkers.current.forEach(marker => map.current?.removeLayer(marker));
        vertexMarkers.current = [];
        
        if (editablePolygon.current && map.current) {
          map.current.removeLayer(editablePolygon.current);
          editablePolygon.current = null;
        }
        
        if (map.current) {
          map.current.dragging.enable();
        }
        
        addParcelLayer(boundaryCoords);
        const geojson = {
          type: 'Polygon',
          coordinates: [ensureClosedPolygon(boundaryCoords.map(c => [c[1], c[0]]))]
        };
        calculateAndDrawSetbacks(geojson);        
        
        setIsEditingBoundary(false);
      } else {
        alert('❌ Failed to save boundary: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error saving boundary:', error);
      alert('❌ Error saving boundary: ' + error);
    }
  };

  const addBuildingLayer = (footprint: any) => {
    if (!map.current) return;

    if (buildingLayer.current) {
      map.current.removeLayer(buildingLayer.current);
    }

    buildingLayer.current = L.geoJSON(footprint, {
      style: {
        color: '#FF6B6B',
        weight: 2,
        fillColor: '#FF6B6B',
        fillOpacity: 0.6,
      },
    });

    buildingLayer.current.addTo(map.current);
  };

  const calculateAndDrawSetbacks = useCallback((geometry: any) => {
    if (!map.current || !setbackLayer.current) return;

    setbackLayer.current.clearLayers();

    if (!showSetbacks) return;

    try {
      const polygon = turf.polygon(geometry.coordinates);
      
      const avgSetbackFeet = (setbacks.front + setbacks.rear + setbacks.sideLeft + setbacks.sideRight) / 4;
      const avgSetbackMeters = avgSetbackFeet * 0.3048;
      
      const buffered = turf.buffer(polygon, -avgSetbackMeters / 1000, { units: 'kilometers' });
      
      if (buffered) {
        const setbackLine = L.geoJSON(buffered, {
          style: {
            color: '#FF0000',
            weight: 2,
            fillColor: '#90EE90',
            fillOpacity: 0.3,
            dashArray: '10, 10'
          }
        });

        setbackLayer.current.addLayer(setbackLine);

        const buildableAreaSqMeters = turf.area(buffered);
        const buildableAreaSqFt = buildableAreaSqMeters * 10.764;
        
        setBuildableArea(Math.round(buildableAreaSqFt));
      }

    } catch (error) {
      console.error('❌ Error calculating setbacks:', error);
    }
  }, [setbacks, showSetbacks]);

  useEffect(() => {
    if (!boundaryCoords || boundaryCoords.length === 0) return;

    const geojson = {
      type: 'Polygon',
      coordinates: [ensureClosedPolygon(boundaryCoords.map(c => [c[1], c[0]]))]
    };
    calculateAndDrawSetbacks(geojson);
  }, [setbacks, calculateAndDrawSetbacks, boundaryCoords]);

  const handleSetbackChange = (side: keyof typeof setbacks, value: string) => {
    const numValue = parseInt(value) || 0;
    setSetbacks(prev => ({
      ...prev,
      [side]: numValue
    }));
  };

  const saveSetbacks = async () => {
    try {
      const response = await fetch('/api/projects/update-setbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          setbacks
        })
      });

      if (response.ok) {
        alert('✅ Setbacks saved successfully!');
        setIsEditingSetbacks(false);
      } else {
        alert('❌ Failed to save setbacks');
      }
    } catch (error) {
      console.error('Error saving setbacks:', error);
      alert('❌ Error saving setbacks');
    }
  };

  const toggleDrawing = () => {
    if (!map.current || !drawControl.current) return;

    if (isDrawing) {
      map.current.removeControl(drawControl.current);
      setIsDrawing(false);
    } else {
      map.current.addControl(drawControl.current);
      setIsDrawing(true);

      map.current.on(L.Draw.Event.CREATED, (e: any) => {
        const layer = e.layer;
        drawLayer.current?.addLayer(layer);
        checkViolations(layer.toGeoJSON());
      });
    }
  };

  const checkViolations = (drawnShape: any) => {
    if (!boundaryCoords || boundaryCoords.length === 0) return;

    try {
      const geojson = {
        type: 'Polygon',
        coordinates: [ensureClosedPolygon(boundaryCoords.map(c => [c[1], c[0]]))]
      };

      const parcelPolygon = turf.polygon(geojson.coordinates);
      
      const avgSetbackFeet = (setbacks.front + setbacks.rear + setbacks.sideLeft + setbacks.sideRight) / 4;
      const avgSetbackMeters = avgSetbackFeet * 0.3048;
      const setbackPolygon = turf.buffer(parcelPolygon, -avgSetbackMeters / 1000, { units: 'kilometers' });

      if (!setbackPolygon) {
        setViolations(['⚠️ Cannot calculate setback area']);
        return;
      }

      const drawnPolygon = turf.polygon(drawnShape.geometry.coordinates);
      const isWithin = turf.booleanWithin(drawnPolygon, setbackPolygon);

      if (!isWithin) {
        setViolations(prev => [...prev, '❌ Building footprint violates setback requirements!']);
      } else {
        setViolations(prev => [...prev, '✅ Building footprint complies with setbacks']);
      }

    } catch (error) {
      console.error('Error checking violations:', error);
    }
  };

  const clearDrawings = () => {
    drawLayer.current?.clearLayers();
    setViolations([]);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Card className={`relative ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      <div className="relative w-full h-[600px]">
        <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-[1000]">
          <Button
            size="sm"
            variant={activeLayer === 'satellite' ? 'default' : 'secondary'}
            onClick={() => setActiveLayer('satellite')}
            className="shadow-lg"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Satellite
          </Button>
          <Button
            size="sm"
            variant={activeLayer === 'street' ? 'default' : 'secondary'}
            onClick={() => setActiveLayer('street')}
            className="shadow-lg"
          >
            <Map className="h-4 w-4 mr-2" />
            Street
          </Button>
        </div>

        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[1000]">
          <Button
            size="sm"
            variant={showParcel ? 'default' : 'secondary'}
            onClick={() => setShowParcel(!showParcel)}
            className="shadow-lg"
          >
            <Grid3x3 className="h-4 w-4 mr-2" />
            Parcel
          </Button>
          <Button
            size="sm"
            variant={showSetbacks ? 'default' : 'secondary'}
            onClick={() => setShowSetbacks(!showSetbacks)}
            className="shadow-lg"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Setbacks
          </Button>
          <Button
            size="sm"
            variant={isEditingBoundary ? 'default' : 'secondary'}
            onClick={toggleBoundaryEdit}
            className="shadow-lg"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Boundary
          </Button>
          {isEditingBoundary && (
            <Button
              size="sm"
              variant="default"
              onClick={saveBoundary}
              className="shadow-lg bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Save Boundary
            </Button>
          )}
          <Button
            size="sm"
            variant={isDrawing ? 'default' : 'secondary'}
            onClick={toggleDrawing}
            className="shadow-lg"
          >
            <Edit className="h-4 w-4 mr-2" />
            Draw
          </Button>
          {isDrawing && (
            <Button
              size="sm"
              variant="destructive"
              onClick={clearDrawings}
              className="shadow-lg"
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={toggleFullscreen}
            className="shadow-lg"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Card className="absolute top-4 left-4 p-4 shadow-lg z-[1000] max-w-xs bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Setbacks (feet)</h3>
            <Button
              size="sm"
              variant={isEditingSetbacks ? 'default' : 'secondary'}
              onClick={() => setIsEditingSetbacks(!isEditingSetbacks)}
            >
              {isEditingSetbacks ? 'Cancel' : 'Edit'}
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="front" className="text-xs text-orange-600 font-semibold">
                Front Street
              </Label>
              <Input
                id="front"
                type="number"
                value={setbacks.front}
                onChange={(e) => handleSetbackChange('front', e.target.value)}
                disabled={!isEditingSetbacks}
                className="h-8 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="rear" className="text-xs text-blue-600 font-semibold">
                Rear (Back)
              </Label>
              <Input
                id="rear"
                type="number"
                value={setbacks.rear}
                onChange={(e) => handleSetbackChange('rear', e.target.value)}
                disabled={!isEditingSetbacks}
                className="h-8 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="sideLeft" className="text-xs text-yellow-600 font-semibold">
                Side Left
              </Label>
              <Input
                id="sideLeft"
                type="number"
                value={setbacks.sideLeft}
                onChange={(e) => handleSetbackChange('sideLeft', e.target.value)}
                disabled={!isEditingSetbacks}
                className="h-8 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="sideRight" className="text-xs text-yellow-600 font-semibold">
                Side Right
              </Label>
              <Input
                id="sideRight"
                type="number"
                value={setbacks.sideRight}
                onChange={(e) => handleSetbackChange('sideRight', e.target.value)}
                disabled={!isEditingSetbacks}
                className="h-8 text-sm"
              />
            </div>

            {isEditingSetbacks && (
              <Button
                size="sm"
                onClick={saveSetbacks}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Setbacks
              </Button>
            )}

            {buildableArea !== null && (
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-600">Buildable Area</p>
                <p className="text-sm font-semibold text-green-600">
                  {buildableArea.toLocaleString()} sq ft
                </p>
              </div>
            )}
          </div>
        </Card>

        {parcelData && (
          <Card className="absolute top-4 right-4 p-3 shadow-lg z-[1000] max-w-xs bg-white">
            <div className="space-y-1">
              {parcelData.apn && (
                <div className="text-xs">
                  <span className="font-semibold">APN:</span> {parcelData.apn}
                </div>
              )}
              {parcelData.lotSizeSqFt && (
                <div className="text-xs">
                  <span className="font-semibold">Lot Size:</span> {parcelData.lotSizeSqFt.toLocaleString()} sq ft
                </div>
              )}
              {parcelData.zoning && (
                <div className="text-xs">
                  <span className="font-semibold">Zoning:</span> {parcelData.zoning}
                </div>
              )}
            </div>
          </Card>
        )}

        {violations.length > 0 && (
          <Card className="absolute top-24 right-4 p-3 shadow-lg z-[1000] max-w-xs bg-white">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
              <div className="space-y-1">
                {violations.map((violation, idx) => (
                  <p key={idx} className="text-xs">{violation}</p>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </Card>
  );
}
