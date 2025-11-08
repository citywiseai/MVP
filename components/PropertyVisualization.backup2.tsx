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
import { Loader2, Maximize2, Minimize2, Map, Building2, Grid3x3, MapPin, Save, Edit, X, AlertTriangle, Check, Tag } from 'lucide-react';

interface PropertyVisualizationProps {
  projectId: string;
  parcelData?: any;
  buildingFootprint?: any;
}

interface EdgeLabel {
  edgeIndex: number;
  side: 'front' | 'rear' | 'left' | 'right';
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
  const edgeMarkers = useRef<L.Marker[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'satellite' | 'street'>('satellite');
  const [showParcel, setShowParcel] = useState(true);
  const [showSetbacks, setShowSetbacks] = useState(true);
  const [isEditingBoundary, setIsEditingBoundary] = useState(false);
  const [isEditingSetbacks, setIsEditingSetbacks] = useState(false);
  const [isLabelingEdges, setIsLabelingEdges] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [boundaryCoords, setBoundaryCoords] = useState<[number, number][]>([]);
  const [edgeLabels, setEdgeLabels] = useState<EdgeLabel[]>([]);
  
  const [setbacks, setSetbacks] = useState({
    front: 20,
    rear: 15,
    left: 5,
    right: 5
  });
  
  const [buildableArea, setBuildableArea] = useState<number | null>(null);
  const [violations, setViolations] = useState<string[]>([]);

  const [drawnShapes, setDrawnShapes] = useState<Array<{
    id: string;
    area: number;
    perimeter: number;
    layer: any;
   }>>([]);4

  const vertexIcon = L.divIcon({
    className: 'vertex-marker',
    html: '<div style="width: 16px; height: 16px; background: #4A90E2; border: 2px solid #fff; border-radius: 50%; cursor: move;"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  const getEdgeIcon = (side: 'front' | 'rear' | 'left' | 'right' | null) => {
    const colors = {
      front: '#ef4444',
      rear: '#3b82f6',
      left: '#10b981',
      right: '#f59e0b'
    };
    
    const labels = {
      front: 'Front',
      rear: 'Rear',
      left: 'Left',
      right: 'Right'
    };
    
    const color = side ? colors[side] : '#9ca3af';
    const label = side ? labels[side] : 'Click';
    
    return L.divIcon({
      className: 'edge-marker',
      html: `<div style="
        background-color: ${color};
        color: white;
        border: 2px solid white;
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        white-space: nowrap;
      ">${label}</div>`,
      iconSize: [50, 24],
      iconAnchor: [25, 12]
    });
  };

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
      const coordsWithoutDupe = coords.slice(0, -1);
      setBoundaryCoords(coordsWithoutDupe);
      addParcelLayer(coordsWithoutDupe);
      
      // Load edge labels if they exist
      if (parcelData?.edgeLabels) {
        setEdgeLabels(parcelData.edgeLabels);
      }
      
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
        
        setBoundaryCoords(prevCoords => {
          const newCoords = [...prevCoords];
          newCoords[index] = [newLatLng.lat, newLatLng.lng];
          
          if (editablePolygon.current) {
            editablePolygon.current.setLatLngs(newCoords);
          }
          
          return newCoords;
        });
      });

      marker.on('dragend', () => {
        const geojson = {
          type: 'Polygon',
          coordinates: [ensureClosedPolygon(boundaryCoords.map(c => [c[1], c[0]]))]
        };
        calculateAndDrawSetbacks(geojson);
      });
    });
  };

  const createEdgeMarkers = (coords: [number, number][]) => {
    if (!map.current) return;

    edgeMarkers.current.forEach(marker => map.current?.removeLayer(marker));
    edgeMarkers.current = [];

    coords.forEach((coord, index) => {
      const nextIndex = (index + 1) % coords.length;
      const nextCoord = coords[nextIndex];
      
      // Calculate midpoint
      const midLat = (coord[0] + nextCoord[0]) / 2;
      const midLng = (coord[1] + nextCoord[1]) / 2;
      
      // Find existing label for this edge
      const existingLabel = edgeLabels.find(el => el.edgeIndex === index);
      const side = existingLabel?.side || null;
      
      const marker = L.marker([midLat, midLng], {
        icon: getEdgeIcon(side),
        draggable: false
      });

      marker.addTo(map.current!);
      edgeMarkers.current.push(marker);

      marker.on('click', () => {
        cycleSideLabel(index);
      });
    });
  };

  const cycleSideLabel = (edgeIndex: number) => {
    const sides: Array<'front' | 'rear' | 'left' | 'right'> = ['front', 'rear', 'left', 'right'];
    const existingLabel = edgeLabels.find(el => el.edgeIndex === edgeIndex);
    
    if (!existingLabel) {
      // Add new label
      setEdgeLabels(prev => [...prev, { edgeIndex, side: 'front' }]);
    } else {
      // Cycle to next side
      const currentIndex = sides.indexOf(existingLabel.side);
      const nextIndex = (currentIndex + 1) % sides.length;
      const newSide = sides[nextIndex];
      
      setEdgeLabels(prev => prev.map(el => 
        el.edgeIndex === edgeIndex 
          ? { ...el, side: newSide }
          : el
      ));
    }
  };

  useEffect(() => {
    if (isLabelingEdges && boundaryCoords.length > 0) {
      createEdgeMarkers(boundaryCoords);
    } else {
      edgeMarkers.current.forEach(marker => map.current?.removeLayer(marker));
      edgeMarkers.current = [];
    }
  }, [isLabelingEdges, boundaryCoords, edgeLabels]);

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
    console.log('🔍 Saving boundary and edge labels');
    
    if (!parcelData?.id) {
      alert('❌ No parcel ID found - cannot save boundary');
      return;
    }
    
    try {
      const closedCoords = ensureClosedPolygon(boundaryCoords.map(c => [c[1], c[0]]));

      const response = await fetch('/api/parcels/update-boundary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcelId: parcelData.id,
          coordinates: closedCoords,
          edgeLabels: edgeLabels
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert('✅ Property boundary and edge labels saved successfully!');
        
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
      
      // If edges are labeled, use per-side setbacks
      if (edgeLabels.length === boundaryCoords.length) {
        console.log('✅ Using per-side setbacks');
        
        // Create offset lines for each labeled edge
        boundaryCoords.forEach((coord, index) => {
          const nextIndex = (index + 1) % boundaryCoords.length;
          const nextCoord = boundaryCoords[nextIndex];
          
          const edgeLabel = edgeLabels.find(el => el.edgeIndex === index);
          if (!edgeLabel) return;
          
          const setbackFeet = setbacks[edgeLabel.side];
          const setbackMeters = setbackFeet * 0.3048;
          
          // Create line for this edge
          const edgeLine = turf.lineString([
            [coord[1], coord[0]],
            [nextCoord[1], nextCoord[0]]
          ]);
          
          try {
            // Calculate offset line
            const offsetLine = turf.lineOffset(edgeLine, -setbackMeters / 1000, { units: 'kilometers' });
            
            // Draw setback line
            const colors = {
              front: '#ef4444',
              rear: '#3b82f6',
              left: '#10b981',
              right: '#f59e0b'
            };
            
            L.geoJSON(offsetLine, {
              style: {
                color: colors[edgeLabel.side],
                weight: 2,
                dashArray: '5, 5',
                opacity: 0.8
              }
            }).addTo(setbackLayer.current!);
            
          } catch (error) {
            console.error('Error calculating offset for edge:', index, error);
          }
        });
        
        // Calculate buildable area (simplified - using minimum setback for now)
        const minSetback = Math.min(setbacks.front, setbacks.rear, setbacks.left, setbacks.right);
        const minSetbackMeters = minSetback * 0.3048;
        const buffered = turf.buffer(polygon, -minSetbackMeters / 1000, { units: 'kilometers' });
        
        if (buffered) {
          L.geoJSON(buffered, {
            style: {
              color: 'transparent',
              fillColor: '#90EE90',
              fillOpacity: 0.3
            }
          }).addTo(setbackLayer.current!);
          
          const buildableAreaSqMeters = turf.area(buffered);
          const buildableAreaSqFt = buildableAreaSqMeters * 10.764;
          setBuildableArea(Math.round(buildableAreaSqFt));
        }
      } else {
        // Fall back to averaged setback
        console.log('⚠️ Using averaged setback (label all edges for per-side setbacks)');
        const avgSetbackFeet = (setbacks.front + setbacks.rear + setbacks.left + setbacks.right) / 4;
        const avgSetbackMeters = avgSetbackFeet * 0.3048;
        
        const buffered = turf.buffer(polygon, -avgSetbackMeters / 1000, { units: 'kilometers' });
        
        if (buffered) {
          L.geoJSON(buffered, {
            style: {
              color: '#FF0000',
              weight: 2,
              fillColor: '#90EE90',
              fillOpacity: 0.3,
              dashArray: '10, 10'
            }
          }).addTo(setbackLayer.current!);

          const buildableAreaSqMeters = turf.area(buffered);
          const buildableAreaSqFt = buildableAreaSqMeters * 10.764;
          setBuildableArea(Math.round(buildableAreaSqFt));
        }
      }

    } catch (error) {
      console.error('❌ Error calculating setbacks:', error);
    }
  }, [setbacks, showSetbacks, boundaryCoords, edgeLabels]);

  useEffect(() => {
    if (!boundaryCoords || boundaryCoords.length === 0) return;

    const geojson = {
      type: 'Polygon',
      coordinates: [ensureClosedPolygon(boundaryCoords.map(c => [c[1], c[0]]))]
    };
    calculateAndDrawSetbacks(geojson);
  }, [setbacks, calculateAndDrawSetbacks, boundaryCoords, edgeLabels]);

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
    if (!map.current || !drawControl.current || !drawLayer.current) return;

    if (isDrawing) {
      map.current.removeControl(drawControl.current);
      map.current.off(L.Draw.Event.CREATED);
      setIsDrawing(false);
    } else {
      map.current.addControl(drawControl.current);
      setIsDrawing(true);

      map.current.on(L.Draw.Event.CREATED, (e: any) => {
        const layer = e.layer;
        const geoJSON = layer.toGeoJSON();
        
        try {
          // Calculate area and perimeter using Turf.js
          const polygon = turf.polygon(geoJSON.geometry.coordinates);
          const areaMeters = turf.area(polygon);
          const areaSqFt = areaMeters * 10.764;
          
          const perimeterMeters = turf.length(turf.polygonToLine(polygon), { units: 'meters' });
          const perimeterFeet = perimeterMeters * 3.28084;
          
          // Add measurement label to the shape
          const center = turf.centroid(polygon);
          const centerLatLng: [number, number] = [center.geometry.coordinates[1], center.geometry.coordinates[0]];
          
          const label = L.marker(centerLatLng, {
            icon: L.divIcon({
              className: 'shape-label',
              html: `
                <div style="
                  background-color: rgba(255, 255, 255, 0.95);
                  border: 2px solid #4A90E2;
                  border-radius: 8px;
                  padding: 8px 12px;
                  font-size: 12px;
                  font-weight: 600;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                  white-space: nowrap;
                ">
                  <div style="color: #2c3e50; margin-bottom: 4px;">
                    📐 ${Math.round(areaSqFt).toLocaleString()} sq ft
                  </div>
                  <div style="color: #7f8c8d; font-size: 10px;">
                    Perimeter: ${Math.round(perimeterFeet)} ft
                  </div>
                </div>
              `,
              iconSize: [120, 50],
              iconAnchor: [60, 25]
            })
          });
          
          // Add shape and label to map
          drawLayer.current?.addLayer(layer);
          drawLayer.current?.addLayer(label);
          
          // Store shape data
          const shapeId = `shape-${Date.now()}`;
          setDrawnShapes(prev => [...prev, {
            id: shapeId,
            area: Math.round(areaSqFt),
            perimeter: Math.round(perimeterFeet),
            layer: layer
          }]);
          
          // Check violations
          checkViolations(geoJSON);
          
        } catch (error) {
          console.error('Error calculating shape measurements:', error);
          drawLayer.current?.addLayer(layer);
        }
      });
    }
  };

  const clearDrawings = () => {
    drawLayer.current?.clearLayers();
    setViolations([]);
    setDrawnShapes([]);
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
            variant={isLabelingEdges ? 'default' : 'secondary'}
            onClick={() => setIsLabelingEdges(!isLabelingEdges)}
            className="shadow-lg"
          >
            <Tag className="h-4 w-4 mr-2" />
            {isLabelingEdges ? 'Done Labeling' : 'Label Edges'}
          </Button>
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

          {isLabelingEdges && (
            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
              <p className="font-semibold text-blue-900 mb-1">Click edge markers to label:</p>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{backgroundColor: '#ef4444'}}></div>
                  <span>Front (Street)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{backgroundColor: '#3b82f6'}}></div>
                  <span>Rear (Back)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{backgroundColor: '#10b981'}}></div>
                  <span>Left Side</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{backgroundColor: '#f59e0b'}}></div>
                  <span>Right Side</span>
                </div>
              </div>
              <p className="mt-2 text-blue-700">
                Labeled: {edgeLabels.length} of {boundaryCoords.length}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <Label htmlFor="front" className="text-xs font-semibold flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{backgroundColor: '#ef4444'}}></div>
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
              <Label htmlFor="rear" className="text-xs font-semibold flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{backgroundColor: '#3b82f6'}}></div>
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
              <Label htmlFor="left" className="text-xs font-semibold flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{backgroundColor: '#10b981'}}></div>
                Side Left
              </Label>
              <Input
                id="left"
                type="number"
                value={setbacks.left}
                onChange={(e) => handleSetbackChange('left', e.target.value)}
                disabled={!isEditingSetbacks}
                className="h-8 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="right" className="text-xs font-semibold flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{backgroundColor: '#f59e0b'}}></div>
                Side Right
              </Label>
              <Input
                id="right"
                type="number"
                value={setbacks.right}
                onChange={(e) => handleSetbackChange('right', e.target.value)}
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
           {drawnShapes.length > 0 && (
          <Card className="absolute top-24 left-4 p-3 shadow-lg z-[1000] max-w-xs bg-white">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Drawn Shapes ({drawnShapes.length})
              </h4>
              {drawnShapes.map((shape, idx) => (
                <div key={shape.id} className="text-xs p-2 bg-blue-50 rounded">
                  <div className="font-semibold text-blue-900">Shape {idx + 1}</div>
                  <div className="text-gray-700">Area: {shape.area.toLocaleString()} sq ft</div>
                  <div className="text-gray-600">Perimeter: {shape.perimeter.toLocaleString()} ft</div>
                </div>
              ))}
              <div className="pt-2 border-t">
                <div className="font-semibold text-sm">Total Area</div>
                <div className="text-lg font-bold text-blue-600">
                  {drawnShapes.reduce((sum, s) => sum + s.area, 0).toLocaleString()} sq ft
                </div>
              </div>
            </div>
          </Card>
        )}
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
