"use client";



import React, { useEffect, useRef, useState, useCallback } from 'react';

import { toast } from 'sonner';

import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

import 'leaflet-draw';

import 'leaflet-draw/dist/leaflet.draw.css';

import * as turf from '@turf/turf';

import { Card } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { Loader2, Maximize2, Minimize2, Map as MapIcon, Building2, Grid3x3, MapPin, Save, Edit, X, AlertTriangle, Check, Tag, Trash2, Pencil, Move, HelpCircle, Ruler, Square, Circle, Pentagon } from 'lucide-react';

import MapToolbar from './MapToolbar';

import InspectorPanel from './InspectorPanel';

import {

  Dialog,

  DialogContent,

  DialogDescription,

  DialogHeader,

  DialogTitle,

  DialogTrigger,

} from '@/components/ui/dialog';



interface PropertyVisualizationProps {

  projectId: string;

  parcelData?: any;

  buildingFootprint?: any;

}



interface EdgeLabel {

  edgeIndex: number;

  side: 'front' | 'rear' | 'left' | 'right';

}



interface DrawnShape {

  id: string;

  name: string;

  area: number;

  perimeter: number;

  layer: any;

  dimensionLabels: any[];

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

  const editControl = useRef<any>(null);

  const satelliteLayer = useRef<L.TileLayer | null>(null);

  const streetLayer = useRef<L.TileLayer | null>(null);

  const vertexMarkers = useRef<L.Marker[]>([]);

  const edgeMarkers = useRef<L.Marker[]>([]);

  

  const setbackHandles = useRef<L.Marker[]>([]);

  const setbackDimensionLabels = useRef<L.Marker[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const [activeLayer, setActiveLayer] = useState<'satellite' | 'street'>('satellite');

  const [showParcel, setShowParcel] = useState(true);

  const [showSetbacks, setShowSetbacks] = useState(true);

  const [showMeasurements, setShowMeasurements] = useState(true);

  const [showDrawnShapes, setShowDrawnShapes] = useState(true);

  const [isEditingBoundary, setIsEditingBoundary] = useState(false);

  const [isEditingSetbacks, setIsEditingSetbacks] = useState(false);

  const [isLabelingEdges, setIsLabelingEdges] = useState(false);

  const [isDrawing, setIsDrawing] = useState(false);

  const [drawingTool, setDrawingTool] = useState<'rectangle' | 'polygon' | 'circle' | null>(null);

  const [isEditingShapesVertices, setIsEditingShapesVertices] = useState(false);

  const [isEditingShapes, setIsEditingShapes] = useState(false);

  const [boundaryCoords, setBoundaryCoords] = useState<[number, number][]>([]);

  const [edgeLabels, setEdgeLabels] = useState<EdgeLabel[]>([]);

  const [drawnShapes, setDrawnShapes] = useState<DrawnShape[]>([]);

  const [editingShapeId, setEditingShapeId] = useState<string | null>(null);

  const [draggingSetback, setDraggingSetback] = useState<{ side: string; startValue: number } | null>(null);

  

  const [setbacks, setSetbacks] = useState({

    front: 20,

    rear: 15,

    left: 5,

    right: 5

  });

  const [setbacksSaved, setSetbacksSaved] = useState(true);

  

  const [mode, setMode] = useState<'view' | 'edit' | 'draw' | 'measure'>('view');

  const [measurementPoints, setMeasurementPoints] = useState<L.LatLng[]>([]);

  const [savedMeasurements, setSavedMeasurements] = useState<Array<{

    id: string;

    name: string;

    distance: number;

    points: [L.LatLng, L.LatLng];

  }>>([]);

  const [editingMeasurementId, setEditingMeasurementId] = useState<string | null>(null);

  const measurementMarkers = useRef<L.Marker[]>([]);

  const measurementLines = useRef<L.Polyline[]>([]);

  const measurementLabels = useRef<L.Marker[]>([]);

  const savedMeasurementLayers = useRef<Map<string, { line: L.Polyline; label: L.Marker }>>(new Map());

  const [isDraggingVertex, setIsDraggingVertex] = useState(false);

  const [draggedVertexIndex, setDraggedVertexIndex] = useState<number | null>(null);

  const [isShiftPressed, setIsShiftPressed] = useState(false);

  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const [originalVertexPosition, setOriginalVertexPosition] = useState<L.LatLng | null>(null);



  // Keyboard shortcuts for mode switching

  useEffect(() => {

    const handleKeyDown = (e: KeyboardEvent) => {

      // Don't trigger if user is typing in an input

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {

        return;

      }



      if (e.key === ' ') {

        e.preventDefault();

        setIsSpacePressed(true);

        if (map.current) {

          map.current.dragging.enable();

          map.current.getContainer().style.cursor = 'grab';

        }

        return;

      }



      if (e.key === 'Shift') setIsShiftPressed(true);

      

      if (e.key === 'Escape' && isDraggingVertex) {

        if (originalVertexPosition && draggedVertexIndex !== null) {

          // Restore marker position

          if (vertexMarkers.current[draggedVertexIndex]) {

            vertexMarkers.current[draggedVertexIndex].setLatLng(originalVertexPosition);

          }

          

          // Restore boundary coords and redraw polygon

          setBoundaryCoords(prevCoords => {

            const newCoords = [...prevCoords];

            newCoords[draggedVertexIndex] = [originalVertexPosition.lat, originalVertexPosition.lng];

            

            // Update editable polygon

            if (editablePolygon.current) {

              editablePolygon.current.setLatLngs(newCoords);

            }

            

            return newCoords;

          });

        }

        setIsDraggingVertex(false);

        setDraggedVertexIndex(null);

        setOriginalVertexPosition(null);

        toast.info('Edit cancelled');

        return;

      }



      switch(e.key.toLowerCase()) {

        case '1':

        case 'v':

          setMode('view');

          break;

        case '2':

        case 'e':

          setMode('edit');

          toast.info('Edit mode active. Hold Space to pan, Shift to snap', { duration: 3000 });

          break;

        case '3':

        case 'd':

          setMode('draw');

          break;

        case '4':

        case 'm':

          setMode('measure');

          break;

        case 'escape':

          setMode('view');

          break;

      }

    };



    const handleKeyUp = (e: KeyboardEvent) => {

      if (e.key === ' ') {

        setIsSpacePressed(false);

        if (map.current) {

          map.current.getContainer().style.cursor = '';

        }

      }

      if (e.key === 'Shift') setIsShiftPressed(false);

    };



    window.addEventListener('keydown', handleKeyDown);

    window.addEventListener('keyup', handleKeyUp);

    return () => {

      window.removeEventListener('keydown', handleKeyDown);

      window.removeEventListener('keyup', handleKeyUp);

    };

  }, [isDraggingVertex]);

  

  const [buildableArea, setBuildableArea] = useState<number | null>(null);

  const [violations, setViolations] = useState<string[]>([]);



  const snapToGrid = (value: number, gridSize: number = 0.00001) => {

    return Math.round(value / gridSize) * gridSize;

  };



  const vertexIcon = (index: number) => L.divIcon({

    className: 'custom-vertex-marker',

    html: `

      <div class="vertex-wrapper ${draggedVertexIndex === index ? 'dragging' : ''}">

        <div class="vertex-dot"></div>

        <div class="vertex-ring"></div>

        ${isShiftPressed && isDraggingVertex ? '<div class="snap-indicator">SNAP</div>' : ''}

      </div>

    `,

    iconSize: [24, 24],

    iconAnchor: [12, 12]

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



  const createDimensionLabels = (coords: [number, number][]) => {

    const dimensionLabels: any[] = [];



    for (let i = 0; i < coords.length; i++) {

      const nextIndex = (i + 1) % coords.length;

      const coord1 = coords[i];

      const coord2 = coords[nextIndex];



      const point1 = turf.point([coord1[1], coord1[0]]);

      const point2 = turf.point([coord2[1], coord2[0]]);

      const distanceMeters = turf.distance(point1, point2, { units: 'meters' });

      const distanceFeet = Math.round(distanceMeters * 3.28084);



      const midLat = (coord1[0] + coord2[0]) / 2;

      const midLng = (coord1[1] + coord2[1]) / 2;



      const dimensionLabel = L.marker([midLat, midLng], {

        icon: L.divIcon({

          className: 'dimension-label',

          html: `

            <div style="

              background-color: rgba(255, 255, 255, 0.95);

              border: 2px solid #2563eb;

              border-radius: 4px;

              padding: 2px 6px;

              font-size: 11px;

              font-weight: 600;

              color: #2563eb;

              box-shadow: 0 1px 3px rgba(0,0,0,0.3);

              white-space: nowrap;

            ">${distanceFeet}'</div>

          `,

          iconSize: [40, 20],

          iconAnchor: [20, 10]

        })

      });



      dimensionLabels.push(dimensionLabel);

    }



    return dimensionLabels;

  };



  const ensureClosedPolygon = (coords: [number, number][]) => {

    if (coords.length === 0) return coords;

    const first = coords[0];

    const last = coords[coords.length - 1];

    if (first[0] !== last[0] || first[1] !== last[1]) {

      return [...coords, first];

    }

    return coords;

  };



  const layerToShapeData = (layer: any, name: string, shapeType: string) => {

    const geoJSON = layer.toGeoJSON();

    const polygon = turf.polygon(geoJSON.geometry.coordinates);

    const areaMeters = turf.area(polygon);

    const areaSqFt = areaMeters * 10.764;

    const perimeterMeters = turf.length(turf.polygonToLine(polygon), { units: 'meters' });

    const perimeterFeet = perimeterMeters * 3.28084;

    

    return {

      name,

      shapeType,

      coordinates: geoJSON.geometry.coordinates,

      area: Math.round(areaSqFt),

      perimeter: Math.round(perimeterFeet)

    };

  };



  const loadShapesFromDatabase = useCallback(async () => {

    if (!projectId || !map.current || !drawLayer.current) return;

    

    try {

      const response = await fetch('/api/projects/' + projectId + '/shapes');

      if (!response.ok) return;

      

      const data = await response.json();

      const shapes_data = data.shapes;

      
      if (!shapes_data || shapes_data.length === 0) return;
      
      const loadedShapes = [];
      
      shapes_data.forEach((shape) => {
      
        try {
          let layer, coords, dimensionLabels;
          
          // Handle circles differently from polygons
          // Handle circles differently from polygons
          if (shape.shapeType === 'circle') {
            // For circles, coordinates might be stored as [lng, lat] or [[lng, lat]]
            const center = Array.isArray(shape.coordinates[0]) ? shape.coordinates[0] : shape.coordinates;
            
            // Validate center coordinates
            if (!center || center.length < 2 || center[0] === undefined || center[1] === undefined) {
              console.error('Invalid circle coordinates:', shape);
              return; // Skip this shape
            }
            
            const radius = shape.perimeter / (2 * Math.PI) / 3.28084; // Convert perimeter back to radius in meters
            
            layer = L.circle([center[1], center[0]], {
              radius: radius,
              color: '#4A90E2',
              fillColor: '#4A90E2',
              fillOpacity: 0.3
            });
            
            // Create diameter label for circle
            const diameterFeet = (radius * 2) * 3.28084;
            dimensionLabels = [L.marker([center[1], center[0]], {
              icon: L.divIcon({
                className: 'dimension-label',
                html: `<div style="background: white; border: 2px solid #4A90E2; border-radius: 4px; padding: 3px 8px; font-size: 13px; font-weight: 600; color: #4A90E2; box-shadow: 0 2px 4px rgba(0,0,0,0.2); white-space: nowrap;">⌀ ${Math.round(diameterFeet)}'</div>`,
                iconSize: [60, 24],
                iconAnchor: [30, 12]
              }),
              interactive: false
            })];
          }
          
          drawLayer.current.addLayer(layer);
          dimensionLabels.forEach(label => drawLayer.current.addLayer(label));
          
          loadedShapes.push({
            id: shape.id,
            name: shape.name,
            area: shape.area,
            perimeter: shape.perimeter,
            layer: layer,
            dimensionLabels: dimensionLabels
          });


        } catch (error) {

          console.error('Error loading shape:', error);

        }

      });

      

      setDrawnShapes(loadedShapes);

      console.log('Loaded ' + loadedShapes.length + ' shapes from database');

    } catch (error) {

      console.error('Error loading shapes:', error);

    }

  }, [projectId]);



  const checkViolations = useCallback((drawnShape: any) => {

    if (!boundaryCoords || boundaryCoords.length === 0) {

      return;

    }



    try {

      const geojson = {

        type: 'Polygon',

        coordinates: [ensureClosedPolygon(boundaryCoords.map(c => [c[1], c[0]]))]

      };



      const parcelPolygon = turf.polygon(geojson.coordinates);

      

      const minSetbackFeet = Math.min(setbacks.front, setbacks.rear, setbacks.left, setbacks.right);

      const minSetbackMeters = minSetbackFeet * 0.3048;

      const setbackPolygon = turf.buffer(parcelPolygon, -minSetbackMeters / 1000, { units: 'kilometers' });



      if (!setbackPolygon) {

        setViolations(['⚠️ Cannot calculate setback area']);

        return;

      }



      const drawnPolygon = turf.polygon(drawnShape.geometry.coordinates);

      const isWithin = turf.booleanWithin(drawnPolygon, setbackPolygon);



      console.log('Violation check:', { isWithin, minSetbackFeet });



      if (!isWithin) {

        setViolations(['❌ Building footprint violates setback requirements!']);

      } else {

        setViolations(['✅ Building footprint complies with setbacks']);

      }



    } catch (error) {

      console.error('Error checking violations:', error);

      setViolations(['⚠️ Error checking setback compliance']);

    }

  }, [boundaryCoords, setbacks]);



  useEffect(() => {

    console.log('🚀 Map useEffect running', { hasContainer: !!mapContainer.current, hasMap: !!map.current, hasParcelData: !!parcelData });

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



    // Force map to recalculate size BEFORE adding tiles

    setTimeout(() => {

      if (map.current) {

        map.current.invalidateSize();

        satelliteLayer.current?.addTo(map.current);

      }

    }, 100);



    setbackLayer.current = L.layerGroup().addTo(map.current);

    drawLayer.current = L.featureGroup().addTo(map.current);

    drawControl.current = new (L.Control as any).Draw({
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: {
            color: '#4A90E2',
            fillColor: '#4A90E2',
            fillOpacity: 0.3
          }
        },
        rectangle: {
          shapeOptions: {
            color: '#4A90E2',
            fillColor: '#4A90E2',
            fillOpacity: 0.3
          }
        },
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false
      },
      edit: {
        featureGroup: drawLayer.current,
        remove: false
      }
    });

    try {
      editControl.current = new (L.Control as any).Draw({
        draw: false,
        edit: {
          featureGroup: drawLayer.current,
          edit: {
            selectedPathOptions: {
              maintainColor: true,
              opacity: 0.6
            }
          },
          remove: false
        }
      });
    } catch (error) {
      console.error('Error initializing edit control:', error);
    }

    let boundaryCoords = parcelData?.boundaryCoordinates;
    
    if (typeof boundaryCoords === 'string') {
      try {
        boundaryCoords = JSON.parse(boundaryCoords);
      } catch (e) {
        console.error('Failed to parse boundaryCoordinates');
      }
    }

    if (boundaryCoords && Array.isArray(boundaryCoords) && boundaryCoords.length > 0) {
      // Handle both GeoJSON Polygon format and flat array format
      let ring = boundaryCoords;
      
      // If it's nested (GeoJSON Polygon with rings), extract first ring
      if (Array.isArray(boundaryCoords[0]) && Array.isArray(boundaryCoords[0][0])) {
        ring = boundaryCoords[0];
      }
      // If first element is a coordinate pair [lng, lat], it's already the ring
      else if (Array.isArray(boundaryCoords[0]) && typeof boundaryCoords[0][0] === 'number') {
        ring = boundaryCoords;
      }
      
      const coords = ring.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
      const coordsWithoutDupe = coords.slice(0, -1);
      setBoundaryCoords(coordsWithoutDupe);
      addParcelLayer(coordsWithoutDupe);
      
      if (parcelData?.edgeLabels) {
        setEdgeLabels(parcelData.edgeLabels);
      }
      
      // Load saved setbacks if available
      if (parcelData?.setbacks && typeof parcelData.setbacks === 'object') {
        const savedSetbacks = parcelData.setbacks as any;
        if (savedSetbacks.front && savedSetbacks.rear && savedSetbacks.left && savedSetbacks.right) {
          setSetbacks({
            front: savedSetbacks.front,
            rear: savedSetbacks.rear,
            left: savedSetbacks.left,
            right: savedSetbacks.right
          });
        }
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
      // Clean up tile layers first
      if (satelliteLayer.current) {
        satelliteLayer.current.remove();
        satelliteLayer.current = null;
      }
      if (streetLayer.current) {
        streetLayer.current.remove();
        streetLayer.current = null;
      }
      // Then remove the map
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [parcelData, buildingFootprint]);

  // Auto-label sides if not already labeled
  useEffect(() => {
    const autoLabelSides = async () => {
      // Only auto-label if we have boundary coords but no edge labels
      if (boundaryCoords.length > 0 && edgeLabels.length === 0 && projectId) {
        try {
          console.log('🏷️ Auto-labeling sides...');
          const response = await fetch(`/api/projects/${projectId}/auto-label-sides`, {
            method: 'POST'
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Auto-labeled sides:', data.edgeLabels);
            setEdgeLabels(data.edgeLabels);
          } else {
            console.log('⚠️ Auto-labeling failed, manual labeling required');
          }
        } catch (error) {
          console.error('Error auto-labeling:', error);
        }
      }
    };
    
    autoLabelSides();
  }, [boundaryCoords, edgeLabels.length, projectId]);


  useEffect(() => {
    if (map.current && drawLayer.current && projectId) {
      loadShapesFromDatabase();
    }
  }, [loadShapesFromDatabase]);
  // Measurement mode effect
  useEffect(() => {
    if (!map.current) return;
    
    if (mode === 'measure') {
      // Enable measurement mode
      map.current.getContainer().style.cursor = 'crosshair';
      
      const handleMapClick = (e: L.LeafletMouseEvent) => {
        // Only allow 2 points at a time
        if (measurementPoints.length >= 2) return;
        
        const newPoint = e.latlng;
        setMeasurementPoints(prev => [...prev, newPoint]);
        
        // Add marker
        const marker = L.circleMarker([newPoint.lat, newPoint.lng], {
          radius: 6,
          fillColor: '#4A90E2',
          fillOpacity: 1,
          color: 'white',
          weight: 2
        }).addTo(map.current!);
        
        measurementMarkers.current.push(marker);
        
        // If we have at least 2 points, draw line and show distance
        setMeasurementPoints(points => {
          if (points.length >= 2) {
            const lastTwo = points.slice(-2);
            const line = L.polyline(lastTwo, {
              color: '#4A90E2',
              weight: 3,
              dashArray: '5, 10'
            }).addTo(map.current!);
            
            measurementLines.current.push(line);
            
            // Calculate distance
            const distance = map.current!.distance(lastTwo[0], lastTwo[1]);
            const distanceFeet = distance * 3.28084;
            const midLat = (lastTwo[0].lat + lastTwo[1].lat) / 2;
            const midLng = (lastTwo[0].lng + lastTwo[1].lng) / 2;
            
            // Add distance label
            const label = L.marker([midLat, midLng], {
              icon: L.divIcon({
                className: 'measurement-label',
                html: '<div style="background: white; border: 2px solid #4A90E2; border-radius: 4px; padding: 4px 8px; font-size: 12px; font-weight: 600; color: #4A90E2; box-shadow: 0 2px 4px rgba(0,0,0,0.2); white-space: nowrap;">' + distanceFeet.toFixed(1) + '\'</div>',
                iconSize: [60, 24],
                iconAnchor: [30, 12]
              })
            }).addTo(map.current!);
            
            measurementLabels.current.push(label);
          }
          return points;
        });
      };
      
      map.current.on('click', handleMapClick);
      
      return () => {
        map.current?.off('click', handleMapClick);
        map.current!.getContainer().style.cursor = '';
      };
    } else {
      // Clear measurements when leaving measure mode
      clearMeasurements();
    }
  }, [mode]);

  // Control measurement visibility
  useEffect(() => {
    if (!map.current) return;
    
    savedMeasurementLayers.current.forEach((layers) => {
      if (showMeasurements) {
        if (!map.current!.hasLayer(layers.line)) {
          map.current!.addLayer(layers.line);
        }
        if (!map.current!.hasLayer(layers.label)) {
          map.current!.addLayer(layers.label);
        }
      } else {
        layers.line.remove();
        layers.label.remove();
      }
    });
  }, [showMeasurements]);

  // Control drawn shapes visibility
  useEffect(() => {
    if (!map.current || !drawLayer.current) return;
    
    drawnShapes.forEach((shape) => {
      if (showDrawnShapes) {
        // Add shape layer if not on map
        if (!drawLayer.current!.hasLayer(shape.layer)) {
          drawLayer.current!.addLayer(shape.layer);
        }
        // Add dimension labels if not on map
        shape.dimensionLabels.forEach((label: any) => {
          if (!drawLayer.current!.hasLayer(label)) {
            drawLayer.current!.addLayer(label);
          }
        });
      } else {
        // Remove from drawLayer instead of calling remove()
        if (drawLayer.current!.hasLayer(shape.layer)) {
          drawLayer.current!.removeLayer(shape.layer);
        }
        // Remove dimension labels
        shape.dimensionLabels.forEach((label: any) => {
          if (drawLayer.current!.hasLayer(label)) {
            drawLayer.current!.removeLayer(label);
          }
        });
      }
    });
  }, [showDrawnShapes, drawnShapes]);

  // Save setbacks when they change (with debounce)
  useEffect(() => {
    if (!projectId) return;
    
    setSetbacksSaved(false);
    
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/save-setbacks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ setbacks })
        });
        
        if (response.ok) {
          console.log('✅ Setbacks saved');
          setSetbacksSaved(true);
        }
      } catch (error) {
        console.error('Error saving setbacks:', error);
      }
    }, 1000); // Save 1 second after user stops adjusting
    
    return () => clearTimeout(timeoutId);
  }, [setbacks, projectId]);

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
    console.log('🗺️ addParcelLayer called with', coords.length, 'coords');
    if (!map.current) {
      console.log('❌ No map');
      return;
    }

    // Validate coordinates
    if (!coords || coords.length < 3) {
      console.error('Invalid coordinates for parcel layer:', coords);
      return;
    }

    // Check for invalid lat/lng values
    const validCoords = coords.filter(coord => {
      const [lat, lng] = coord;
      return !isNaN(lat) && !isNaN(lng) &&
             lat >= -90 && lat <= 90 &&
             lng >= -180 && lng <= 180;
    });

    if (validCoords.length < 3) {
      console.error('Not enough valid coordinates:', validCoords);
      return;
    }

    if (displayPolygon.current) {
      map.current.removeLayer(displayPolygon.current);
    }

    try {
      displayPolygon.current = L.polygon(validCoords, {
        color: '#FFD700',
        weight: 3,
        fillColor: '#FFD700',
        fillOpacity: 0.2,
      }).addTo(map.current);

      const bounds = displayPolygon.current.getBounds();
      
      if (bounds.isValid()) {
        map.current.fitBounds(bounds, { padding: [50, 50] });
        setTimeout(() => map.current?.invalidateSize(), 100);
      } else {
        // Fallback to center if bounds invalid
        console.warn('Bounds invalid, using center point');
        if (parcelData?.latitude && parcelData?.longitude) {
          map.current.setView([parcelData.latitude, parcelData.longitude], 19);
          setTimeout(() => map.current?.invalidateSize(), 100);
        }
      }
    } catch (error) {
      console.error('Error creating parcel layer:', error);
      // Fallback to center point
        setTimeout(() => map.current?.invalidateSize(), 100);
      if (parcelData?.latitude && parcelData?.longitude) {
        map.current.setView([parcelData.latitude, parcelData.longitude], 19);
      }
    }
  };

  const createDraggableVertices = (coords: [number, number][]) => {
    if (!map.current) return;

    vertexMarkers.current.forEach(marker => map.current?.removeLayer(marker));
    vertexMarkers.current = [];

    coords.forEach((coord, index) => {
      const marker = L.marker(coord, {
        icon: vertexIcon(index),
        draggable: true,
        autoPan: true
      });

      marker.addTo(map.current!);
      vertexMarkers.current.push(marker);

      marker.on('dragstart', (e: any) => {
        setIsDraggingVertex(true);
        setDraggedVertexIndex(index);
        setOriginalVertexPosition(e.target.getLatLng());
        toast.info('Dragging vertex... Hold Shift to snap', { duration: 2000 });
      });

      marker.on('drag', (e: any) => {
        let newLatLng = e.target.getLatLng();
        
        if (isShiftPressed) {
          const snappedLat = snapToGrid(newLatLng.lat, 0.0001);
          const snappedLng = snapToGrid(newLatLng.lng, 0.0001);
          newLatLng = L.latLng(snappedLat, snappedLng);
          e.target.setLatLng(newLatLng);
        }
        
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
        setIsDraggingVertex(false);
        setDraggedVertexIndex(null);
        toast.success('Vertex updated');
        
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
      
      const midLat = (coord[0] + nextCoord[0]) / 2;
      const midLng = (coord[1] + nextCoord[1]) / 2;
      
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
      setEdgeLabels(prev => [...prev, { edgeIndex, side: 'front' }]);
    } else {
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
      
      try {
        if (map.current.dragging) {
          map.current.dragging.enable();
        }
      } catch (e) {
        console.log('Could not enable dragging');
      }
      
      if (!map.current.hasLayer(displayPolygon.current)) {
        displayPolygon.current.addTo(map.current);
      }
      
      setIsEditingBoundary(false);
    } else {
      if (displayPolygon.current) {
        map.current.removeLayer(displayPolygon.current);
      }
      
      try {
        if (map.current.dragging) {
          map.current.dragging.disable();
        }
      } catch (e) {
        console.log('Could not disable dragging');
      }
      
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
        
        try {
          if (map.current && map.current.dragging) {
            map.current.dragging.enable();
          }
        } catch (e) {
          console.log('Could not enable dragging');
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

  // Calculate bounded setback area with proper corners
  const calculateBoundedSetbackArea = useCallback((
    boundaryCoords: [number, number][],
    edgeLabels: EdgeLabel[],
    setbacks: { front: number; rear: number; left: number; right: number }
  ) => {
    try {
      const offsetLines: any[] = [];
      
      // Create offset line for each edge with its specific setback
      boundaryCoords.forEach((coord, index) => {
        const nextIndex = (index + 1) % boundaryCoords.length;
        const nextCoord = boundaryCoords[nextIndex];
        
        const edgeLabel = edgeLabels.find(el => el.edgeIndex === index);
        if (!edgeLabel) return;
        
        const setbackFeet = setbacks[edgeLabel.side];
        const setbackMeters = setbackFeet * 0.3048;
        
        const edgeLine = turf.lineString([
          [coord[1], coord[0]],
          [nextCoord[1], nextCoord[0]]
        ]);
        
        try {
          const offsetLine = turf.lineOffset(edgeLine, -setbackMeters / 1000, { units: 'kilometers' });
          offsetLines.push({
            line: offsetLine,
            edgeIndex: index,
            side: edgeLabel.side
          });
        } catch (error) {
          console.error('Error offsetting edge:', index, error);
        }
      });
      
      if (offsetLines.length < 3) return null;
      
      // Find intersections between consecutive offset lines to create corners
      const corners: number[][] = [];
      
      for (let i = 0; i < offsetLines.length; i++) {
        const currentLine = offsetLines[i].line;
        const nextLine = offsetLines[(i + 1) % offsetLines.length].line;
        
        try {
          const intersections = turf.lineIntersect(currentLine, nextLine);
          
          if (intersections.features.length > 0) {
            // Use the first intersection point
            corners.push(intersections.features[0].geometry.coordinates);
          } else {
            // If no intersection, use the endpoint of current line
            const coords = currentLine.geometry.coordinates;
            corners.push(coords[coords.length - 1]);
          }
        } catch (error) {
          console.error('Error finding intersection:', error);
          // Fallback: use endpoint
          const coords = currentLine.geometry.coordinates;
          corners.push(coords[coords.length - 1]);
        }
      }
      
      if (corners.length < 3) return null;
      
      // Create polygon from corners
      const closedCorners = [...corners, corners[0]];
      const boundedArea = turf.polygon([closedCorners]);
      
      return boundedArea;
    } catch (error) {
      console.error('Error calculating bounded setback area:', error);
      return null;
    }
  }, []);

  const calculateAndDrawSetbacks = useCallback((geometry: any) => {
        if (!map.current || !setbackLayer.current) return;

    setbackLayer.current.clearLayers();
    setbackHandles.current.forEach(marker => map.current?.removeLayer(marker));
    setbackDimensionLabels.current.forEach(marker => map.current?.removeLayer(marker));
    setbackDimensionLabels.current = [];
    setbackHandles.current = [];

    if (!showSetbacks) return;

    try {
      const polygon = turf.polygon(geometry.coordinates);
      
      if (edgeLabels.length === boundaryCoords.length) {
        // Group edges by side
        const sideGroups: { [key: string]: number[] } = {
          front: [],
          rear: [],
          left: [],
          right: []
        };
        
        edgeLabels.forEach(el => {
          sideGroups[el.side].push(el.edgeIndex);
        });
        
        const colors = {
          front: '#ef4444',
          rear: '#3b82f6',
          left: '#10b981',
          right: '#f59e0b'
        };
        
        // Calculate offset lines and their intersections first
        const offsetLinesData: any[] = [];
        
        boundaryCoords.forEach((coord, index) => {
          const nextIndex = (index + 1) % boundaryCoords.length;
          const nextCoord = boundaryCoords[nextIndex];
          
          const edgeLabel = edgeLabels.find(el => el.edgeIndex === index);
          if (!edgeLabel) return;
          
          const setbackFeet = setbacks[edgeLabel.side];
          const setbackMeters = setbackFeet * 0.3048;
          
          const edgeLine = turf.lineString([
            [coord[1], coord[0]],
            [nextCoord[1], nextCoord[0]]
          ]);
          
          try {
            const offsetLine = turf.lineOffset(edgeLine, -setbackMeters / 1000, { units: 'kilometers' });
            offsetLinesData.push({
              line: offsetLine,
              edgeIndex: index,
              side: edgeLabel.side
            });
          } catch (error) {
            console.error('Error calculating offset for edge:', index, error);
          }
        });
        
        // Find intersections and draw trimmed lines
        offsetLinesData.forEach((lineData, i) => {
          const prevLine = offsetLinesData[(i - 1 + offsetLinesData.length) % offsetLinesData.length];
          const nextLine = offsetLinesData[(i + 1) % offsetLinesData.length];
          
          const lineCoords = lineData.line.geometry.coordinates;
          let startPoint = lineCoords[0];
          let endPoint = lineCoords[lineCoords.length - 1];
          
          // Find intersection with previous line for start point
          try {
            const startIntersections = turf.lineIntersect(lineData.line, prevLine.line);
            if (startIntersections.features.length > 0) {
              startPoint = startIntersections.features[0].geometry.coordinates;
            }
          } catch (e) {}
          
          // Find intersection with next line for end point
          try {
            const endIntersections = turf.lineIntersect(lineData.line, nextLine.line);
            if (endIntersections.features.length > 0) {
              endPoint = endIntersections.features[0].geometry.coordinates;
            }
          } catch (e) {}
          
          // Draw trimmed line
          L.polyline(
            [[startPoint[1], startPoint[0]], [endPoint[1], endPoint[0]]],
            {
              color: colors[lineData.side],
              weight: 2,
              dashArray: '5, 5',
              opacity: 0.8
            }
          ).addTo(setbackLayer.current!);
        });
        
        // Create ONE handle per side (not per edge)
        Object.entries(sideGroups).forEach(([side, edgeIndices]) => {
          if (edgeIndices.length === 0) return;
          
          // Calculate center point of all edges on this side
          let avgLat = 0;
          let avgLng = 0;
          let totalPoints = 0;
          
          edgeIndices.forEach(edgeIndex => {
            const coord = boundaryCoords[edgeIndex];
            const nextIndex = (edgeIndex + 1) % boundaryCoords.length;
            const nextCoord = boundaryCoords[nextIndex];
            
            const setbackFeet = setbacks[side as keyof typeof setbacks];
            const setbackMeters = setbackFeet * 0.3048;
            
            const edgeLine = turf.lineString([
              [coord[1], coord[0]],
              [nextCoord[1], nextCoord[0]]
            ]);
            
            try {
              const offsetLine = turf.lineOffset(edgeLine, -setbackMeters / 1000, { units: 'kilometers' });
              const offsetCoords = offsetLine.geometry.coordinates;
              
              offsetCoords.forEach(c => {
                avgLng += c[0];
                avgLat += c[1];
                totalPoints++;
              });
            } catch (error) {
              console.error('Error calculating offset for handle:', error);
            }
          });
          
          if (totalPoints === 0) return;
          
          avgLat /= totalPoints;
          avgLng /= totalPoints;
          
          const setbackFeet = setbacks[side as keyof typeof setbacks];
          
          const handleIcon = L.divIcon({
            className: 'setback-handle',
            html: `
              <div style="
                width: 24px;
                height: 24px;
                background: white;
                border: 3px solid ${colors[side as keyof typeof colors]};
                border-radius: 6px;
                cursor: move;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                font-weight: bold;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                transition: all 0.15s ease;
              ">↔</div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          
          const handle = L.marker([avgLat, avgLng], {
            icon: handleIcon,
            draggable: true
          });
          
          // Create dimension label
          const dimensionIcon = L.divIcon({
            className: 'setback-dimension',
            html: `
              <div style="
                background: white;
                border: 2px solid ${colors[side as keyof typeof colors]};
                border-radius: 4px;
                padding: 3px 8px;
                font-size: 13px;
                font-weight: 600;
                color: ${colors[side as keyof typeof colors]};
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                white-space: nowrap;
                pointer-events: none;
              ">${setbackFeet}'</div>
            `,
            iconSize: [50, 24],
            iconAnchor: [25, -20]
          });
          
          const dimensionLabel = L.marker([avgLat, avgLng], {
            icon: dimensionIcon,
            interactive: false
          });
          
          // Store original edges for this side for distance calculation
          const originalEdges = edgeIndices.map(edgeIndex => {
            const coord = boundaryCoords[edgeIndex];
            const nextIndex = (edgeIndex + 1) % boundaryCoords.length;
            const nextCoord = boundaryCoords[nextIndex];
            return turf.lineString([[coord[1], coord[0]], [nextCoord[1], nextCoord[0]]]);
          });
          
          // Update visual only during drag (smooth)
          handle.on('drag', (e: any) => {
            const marker = e.target;
            const newPos = marker.getLatLng();
            const point = turf.point([newPos.lng, newPos.lat]);
            
            let totalDistance = 0;
            originalEdges.forEach(edge => {
              const distance = turf.pointToLineDistance(point, edge, { units: 'meters' });
              totalDistance += distance;
            });
            const avgDistance = totalDistance / originalEdges.length;
            const distanceFeet = Math.round(avgDistance * 3.28084 * 10) / 10;
            
            const updatedIcon = L.divIcon({
              className: 'setback-dimension',
              html: `
                <div style="
                  background: white;
                  border: 2px solid ${colors[side as keyof typeof colors]};
                  border-radius: 4px;
                  padding: 3px 8px;
                  font-size: 13px;
                  font-weight: 600;
                  color: ${colors[side as keyof typeof colors]};
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                  white-space: nowrap;
                  pointer-events: none;
                ">${distanceFeet}'</div>
              `,
              iconSize: [50, 24],
              iconAnchor: [25, -20]
            });
            dimensionLabel.setIcon(updatedIcon);
            dimensionLabel.setLatLng(newPos);
          });
          
          // Update state only on dragend (triggers re-render)
          handle.on('dragend', (e: any) => {
            const marker = e.target;
            const newPos = marker.getLatLng();
            const point = turf.point([newPos.lng, newPos.lat]);
            
            let totalDistance = 0;
            originalEdges.forEach(edge => {
              const distance = turf.pointToLineDistance(point, edge, { units: 'meters' });
              totalDistance += distance;
            });
            const avgDistance = totalDistance / originalEdges.length;
            const distanceFeet = Math.round(avgDistance * 3.28084 * 10) / 10;
            
            setSetbacks(prev => ({
              ...prev,
              [side]: distanceFeet
            }));
          });
          
          handle.addTo(map.current!);
          dimensionLabel.addTo(map.current!);
          setbackHandles.current.push(handle);
          setbackDimensionLabels.current.push(dimensionLabel);
        });
        
        // Use bounded setback area calculation for proper corners
        const boundedArea = calculateBoundedSetbackArea(boundaryCoords, edgeLabels, setbacks);
        
        if (boundedArea) {
          L.geoJSON(boundedArea, {
            style: {
              color: 'transparent',
              fillColor: '#90EE90',
              fillOpacity: 0.3
            }
          }).addTo(setbackLayer.current!);
          
          const buildableAreaSqMeters = turf.area(boundedArea);
          const buildableAreaSqFt = buildableAreaSqMeters * 10.764;
          setBuildableArea(Math.round(buildableAreaSqFt));
        }
      } else {
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
  }, [setbacks, showSetbacks, boundaryCoords, edgeLabels, calculateBoundedSetbackArea]);

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

  const saveMeasurement = () => {
    if (measurementPoints.length !== 2) return;
    
    const distance = map.current!.distance(measurementPoints[0], measurementPoints[1]);
    const distanceFeet = distance * 3.28084;
    
    const newMeasurement = {
      id: Date.now().toString(),
      name: `Measurement ${savedMeasurements.length + 1}`,
      distance: distanceFeet,
      points: [measurementPoints[0], measurementPoints[1]] as [L.LatLng, L.LatLng]
    };
    
    // Save to state
    setSavedMeasurements(prev => [...prev, newMeasurement]);
    
    // Create new permanent layers (don't reuse temporary ones)
    if (map.current) {
      // Create permanent line
      const permanentLine = L.polyline(newMeasurement.points, {
        color: '#4A90E2',
        weight: 3,
        dashArray: '5, 10'
      }).addTo(map.current);
      
      // Create permanent label
      const midLat = (newMeasurement.points[0].lat + newMeasurement.points[1].lat) / 2;
      const midLng = (newMeasurement.points[0].lng + newMeasurement.points[1].lng) / 2;
      
      const permanentLabel = L.marker([midLat, midLng], {
        icon: L.divIcon({
          className: 'measurement-label',
          html: '<div style="background: white; border: 2px solid #4A90E2; border-radius: 4px; padding: 4px 8px; font-size: 12px; font-weight: 600; color: #4A90E2; box-shadow: 0 2px 4px rgba(0,0,0,0.2); white-space: nowrap;">' + distanceFeet.toFixed(1) + '\'</div>',
          iconSize: [60, 24],
          iconAnchor: [30, 12]
        })
      }).addTo(map.current);
      
      // Store permanent layers
      savedMeasurementLayers.current.set(newMeasurement.id, { 
        line: permanentLine, 
        label: permanentLabel 
      });
      
      // Remove ALL temporary layers
      measurementMarkers.current.forEach(marker => marker.remove());
      measurementLines.current.forEach(line => line.remove());
      measurementLabels.current.forEach(label => label.remove());
      
      measurementMarkers.current = [];
      measurementLines.current = [];
      measurementLabels.current = [];
    }
    
    // Clear current measurement
    setMeasurementPoints([]);
  };

  const clearMeasurements = () => {
    // Remove all markers
    measurementMarkers.current.forEach(marker => {
      if (map.current) {
        map.current.removeLayer(marker);
      }
    });
    measurementMarkers.current = [];
    
    // Remove all lines
    measurementLines.current.forEach(line => {
      if (map.current) {
        map.current.removeLayer(line);
      }
    });
    measurementLines.current = [];
    
    // Remove all labels
    measurementLabels.current.forEach(label => {
      if (map.current) {
        map.current.removeLayer(label);
      }
    });
    measurementLabels.current = [];
    
    // Clear state
    setMeasurementPoints([]);
  };

  const deleteMeasurement = (id: string) => {
    // Remove from saved measurements
    setSavedMeasurements(prev => prev.filter(m => m.id !== id));
    
    // Remove from map
    const layers = savedMeasurementLayers.current.get(id);
    if (layers && map.current) {
      map.current.removeLayer(layers.line);
      map.current.removeLayer(layers.label);
    }
    savedMeasurementLayers.current.delete(id);
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


  // Start drawing with specific tool
  const startDrawing = (tool: 'rectangle' | 'polygon' | 'circle') => {
    if (!map.current || !drawLayer.current) return;

    // Stop any existing drawing
    if (isDrawing) {
      stopDrawing();
    }

    // Create a new draw control for the specific tool
    const drawOptions: any = {
      draw: {
        polygon: tool === 'polygon' ? {
          allowIntersection: false,
          showArea: true,
          shapeOptions: {
            color: '#4A90E2',
            fillColor: '#4A90E2',
            fillOpacity: 0.3
          }
        } : false,
        rectangle: tool === 'rectangle' ? {
          shapeOptions: {
            color: '#4A90E2',
            fillColor: '#4A90E2',
            fillOpacity: 0.3
          }
        } : false,
        circle: tool === 'circle' ? {
          metric: false,
          showRadius: false,
          shapeOptions: {
            color: '#4A90E2',
            fillColor: '#4A90E2',
            fillOpacity: 0.3
          }
        } : false,
        circlemarker: false,
        marker: false,
        polyline: false
      },
      edit: {
        featureGroup: drawLayer.current,
        remove: false
      }
    };

    // Create the specific draw handler (no toolbar UI)
    const handler = tool === "rectangle"
      ? new (L.Draw as any).Rectangle(map.current, drawOptions.draw.rectangle)
      : tool === "polygon"
      ? new (L.Draw as any).Polygon(map.current, drawOptions.draw.polygon)
      : new (L.Draw as any).Circle(map.current, drawOptions.draw.circle);
    
    // Enable drawing immediately (no toolbar)
    handler.enable();
    drawControl.current = handler;
    
    // For circles, create custom diameter tooltip
    if (tool === 'circle') {
      let customTooltip: any = null;
      let mouseMoveHandler: any = null;
      
      const showDiameterTooltip = (e: L.LeafletMouseEvent) => {
        if ((handler as any)._shape) {
          const radiusMeters = (handler as any)._shape.getRadius();
          const diameterFeet = (radiusMeters * 2) * 3.28084;
          const feet = Math.floor(diameterFeet);
          const inches = Math.round((diameterFeet - feet) * 12);
          const text = inches > 0 ? `Diameter: ${feet}' ${inches}"` : `Diameter: ${feet}'`;
          
          if (!customTooltip) {
            customTooltip = L.tooltip({
              permanent: false,
              direction: 'top',
              offset: [0, -10]
            }).setLatLng(e.latlng).setContent(text).addTo(map.current!);
          } else {
            customTooltip.setLatLng(e.latlng).setContent(text);
          }
        }
      };
      
      mouseMoveHandler = (e: L.LeafletMouseEvent) => {
        if ((handler as any)._shape) {
          showDiameterTooltip(e);
        }
      };
      
      map.current.on('mousemove', mouseMoveHandler);
      
      // Cleanup when drawing stops
      const originalDisable = handler.disable.bind(handler);
      handler.disable = function() {
        if (customTooltip && map.current) {
          map.current.removeLayer(customTooltip);
          customTooltip = null;
        }
        if (mouseMoveHandler && map.current) {
          map.current.off('mousemove', mouseMoveHandler);
        }
        return originalDisable();
      };
    }
    
    
    setIsDrawing(true);
    map.current.off(L.Draw.Event.CREATED);
    map.current.on(L.Draw.Event.CREATED, async (e: any) => {
      const layer = e.layer;
      const geoJSON = layer.toGeoJSON();
      
      try {
        let areaSqFt, perimeterFeet, coords, dimensionLabels;
        
        // Handle circles differently
        if (e.layerType === 'circle') {
          const radius = layer.getRadius(); // meters
          const radiusFeet = radius * 3.28084;
          const diameterFeet = radiusFeet * 2;
          areaSqFt = Math.PI * radiusFeet * radiusFeet;
          perimeterFeet = 2 * Math.PI * radiusFeet;
          
          // For circles, create a diameter label instead of edge labels
          const center = layer.getLatLng();
          dimensionLabels = [L.marker([center.lat, center.lng], {
            icon: L.divIcon({
              className: 'dimension-label',
              html: `<div style="background: white; border: 2px solid #4A90E2; border-radius: 4px; padding: 3px 8px; font-size: 13px; font-weight: 600; color: #4A90E2; box-shadow: 0 2px 4px rgba(0,0,0,0.2); white-space: nowrap;">⌀ ${Math.round(diameterFeet)}'</div>`,
              iconSize: [60, 24],
              iconAnchor: [30, 12]
            }),
            interactive: false
          })];
          coords = [[center.lat, center.lng]];
        } else {
          // Handle polygons/rectangles
          const polygon = turf.polygon(geoJSON.geometry.coordinates);
          const areaMeters = turf.area(polygon);
          areaSqFt = areaMeters * 10.764;
          
          const perimeterMeters = turf.length(turf.polygonToLine(polygon), { units: 'meters' });
          perimeterFeet = perimeterMeters * 3.28084;
          
          coords = layer.getLatLngs()[0].map((ll: any) => [ll.lat, ll.lng]);
          dimensionLabels = createDimensionLabels(coords);
        }
        
        const shapeCount = drawnShapes.length + 1;
        const defaultName = 'Shape ' + shapeCount;
        
        // Create a new permanent layer instead of reusing the temporary drawing layer
        const permanentLayer = e.layerType === 'circle' 
          ? L.circle(layer.getLatLng(), { radius: layer.getRadius(), ...layer.options })
          : L.polygon(coords, layer.options);
        
        dimensionLabels.forEach(label => drawLayer.current?.addLayer(label));
        
        drawLayer.current?.addLayer(permanentLayer);
        
        const shapeType = e.layerType === 'rectangle' ? 'rectangle' : e.layerType === 'circle' ? 'circle' : 'polygon';
        
        try {
          const response = await fetch('/api/projects/' + projectId + '/shapes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: defaultName,
              shapeType: shapeType,
              coordinates: geoJSON.geometry.coordinates,
              area: Math.round(areaSqFt),
              perimeter: Math.round(perimeterFeet)
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            setDrawnShapes(prev => [...prev, {
              id: data.shape.id,
              name: defaultName,
              area: Math.round(areaSqFt),
              perimeter: Math.round(perimeterFeet),
              layer: permanentLayer,
              dimensionLabels: dimensionLabels
            }]);
            toast.success('Shape saved!');
          } else {
            throw new Error('Failed to save shape');
          }
        } catch (saveError) {
          console.error('Error saving shape:', saveError);
          const tempId = 'shape-' + Date.now();
          setDrawnShapes(prev => [...prev, {
            id: tempId,
            name: defaultName,
            area: Math.round(areaSqFt),
            perimeter: Math.round(perimeterFeet),
            layer: permanentLayer,
            dimensionLabels: dimensionLabels
          }]);
          toast.error('Could not save shape to database');
        }
        
      } catch (error) {
        console.error('Error calculating shape measurements:', error);
      }
    });
  };

  // Stop drawing
  const stopDrawing = () => {
    if (!map.current || !drawControl.current) return;
    
    drawControl.current.disable();
    map.current.off(L.Draw.Event.CREATED);
    setIsDrawing(false);
    setDrawingTool(null);
  };

  // Toggle edit vertices mode
  const toggleEditShapesVertices = () => {
    if (!map.current || !editControl.current || !drawLayer.current) return;

    if (isEditingShapesVertices) {
      map.current.removeControl(editControl.current);
      map.current.off(L.Draw.Event.EDITED);
      setIsEditingShapesVertices(false);
    } else {
      map.current.addControl(editControl.current);
      setIsEditingShapesVertices(true);

      map.current.off(L.Draw.Event.EDITED);
      map.current.on(L.Draw.Event.EDITED, async (e: any) => {
        const layers = e.layers;
        layers.eachLayer(async (layer: any) => {
          const shape = drawnShapes.find(s => s.layer === layer);
          if (!shape) return;

          const geoJSON = layer.toGeoJSON();
          const polygon = turf.polygon(geoJSON.geometry.coordinates);
          const areaMeters = turf.area(polygon);
          const areaSqFt = areaMeters * 10.764;
          const perimeterMeters = turf.length(turf.polygonToLine(polygon), { units: 'meters' });
          const perimeterFeet = perimeterMeters * 3.28084;

          try {
            await fetch('/api/projects/' + projectId + '/shapes/' + shape.id, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                coordinates: geoJSON.geometry.coordinates,
                area: Math.round(areaSqFt),
                perimeter: Math.round(perimeterFeet)
              })
            });

            setDrawnShapes(prev => prev.map(s => 
              s.id === shape.id 
                ? { ...s, area: Math.round(areaSqFt), perimeter: Math.round(perimeterFeet) }
                : s
            ));
          } catch (error) {
            console.error('Error updating shape:', error);
          }
        });
      });
    }
  };
  // Real-time distance display while drawing polygons
  useEffect(() => {
    if (!map.current || !isDrawing) return;
    
    let liveDistanceLabel: L.Marker | null = null;
    let allVertices: L.LatLng[] = [];
    let isDrawingPolygon = false;
    let guideLines: L.Polyline[] = [];
    
    const updateLiveDistance = (e: L.LeafletMouseEvent) => {
      if (!isDrawingPolygon || allVertices.length === 0 || !map.current) return;
      
      let currentPos = e.latlng;
      const lastVertex = allVertices[allVertices.length - 1];
      
      // Calculate angle from last vertex
      const dx = currentPos.lng - lastVertex.lng;
      const dy = currentPos.lat - lastVertex.lat;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const normalizedAngle = ((angle + 360) % 360);
      
      // Check if close to cardinal directions (within 3 degrees for precision)
      const snapTolerance = 3;
      let snappedAngle = null;
      const cardinalAngles = [0, 90, 180, 270];
      
      for (const cardinal of cardinalAngles) {
        const diff = Math.abs(normalizedAngle - cardinal);
        if (diff < snapTolerance || diff > (360 - snapTolerance)) {
          snappedAngle = cardinal;
          break;
        }
      }
      
      // If snapping, adjust the position
      if (snappedAngle !== null) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        const radians = snappedAngle * (Math.PI / 180);
        currentPos = L.latLng(
          lastVertex.lat + distance * Math.sin(radians),
          lastVertex.lng + distance * Math.cos(radians)
        );
      }
      
      // Clear old guide lines
      guideLines.forEach(line => {
        if (map.current) map.current.removeLayer(line);
      });
      guideLines = [];
      
      const bounds = map.current.getBounds();
      const extendDistance = 0.001;
      
      // When snapped, make guide lines SOLID and BRIGHT
      const guideStyle = snappedAngle !== null ? {
        color: '#FF00FF',
        weight: 2,
        opacity: 0.8,
        interactive: false
      } : {
        color: '#FF00FF',
        weight: 1,
        dashArray: '8, 4',
        opacity: 0.5,
        interactive: false
      };
      
      // Style for midpoint perpendicular guides (lighter)
      const midpointGuideStyle = {
        color: '#FF00FF', // Magenta for consistency
        weight: 1,
        dashArray: '4, 8',
        opacity: 0.4,
        interactive: false
      };
      
      // Draw horizontal and vertical lines from EACH previous vertex
      allVertices.forEach((vertex) => {
        // Horizontal line through this vertex
        const hLine = L.polyline([
          [vertex.lat, bounds.getWest() - extendDistance],
          [vertex.lat, bounds.getEast() + extendDistance]
        ], guideStyle).addTo(map.current!);
        guideLines.push(hLine);
        
        // Vertical line through this vertex
        const vLine = L.polyline([
          [bounds.getSouth() - extendDistance, vertex.lng],
          [bounds.getNorth() + extendDistance, vertex.lng]
        ], guideStyle).addTo(map.current!);
        guideLines.push(vLine);
      });
      
      // Draw perpendicular lines from MIDPOINT of each segment
      for (let i = 0; i < allVertices.length - 1; i++) {
        const v1 = allVertices[i];
        const v2 = allVertices[i + 1];
        
        // Calculate midpoint
        const midLat = (v1.lat + v2.lat) / 2;
        const midLng = (v1.lng + v2.lng) / 2;
        
        // Calculate angle of the segment
        const segmentAngle = Math.atan2(v2.lat - v1.lat, v2.lng - v1.lng);
        
        // Perpendicular angle (add 90 degrees)
        const perpAngle = segmentAngle + (Math.PI / 2);
        
        // Create a long perpendicular line through the midpoint
        const lineLength = 0.01; // Long enough to cross viewport
        const p1Lat = midLat + lineLength * Math.sin(perpAngle);
        const p1Lng = midLng + lineLength * Math.cos(perpAngle);
        const p2Lat = midLat - lineLength * Math.sin(perpAngle);
        const p2Lng = midLng - lineLength * Math.cos(perpAngle);
        
        const perpLine = L.polyline([
          [p1Lat, p1Lng],
          [p2Lat, p2Lng]
        ], midpointGuideStyle).addTo(map.current!);
        guideLines.push(perpLine);
      }
      
      const distance = map.current.distance(lastVertex, currentPos);
      const distanceFeet = distance * 3.28084;
      const displayAngle = snappedAngle !== null ? snappedAngle : Math.round(normalizedAngle);
      
      // Update or create distance label - BRIGHT GREEN when locked, BLUE when free
      const labelHtml = snappedAngle !== null 
        ? `<div style="
            background: rgba(34, 197, 94, 0.98);
            color: white;
            border: 3px solid white;
            border-radius: 6px;
            padding: 6px 12px;
            font-size: 14px;
            font-weight: 700;
            box-shadow: 0 3px 12px rgba(0,0,0,0.4);
            white-space: nowrap;
            pointer-events: none;
          ">${distanceFeet.toFixed(1)}' 🔒 ${displayAngle}°</div>`
        : `<div style="
            background: rgba(74, 144, 226, 0.95);
            color: white;
            border: 2px solid white;
            border-radius: 4px;
            padding: 4px 10px;
            font-size: 13px;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            white-space: nowrap;
            pointer-events: none;
          ">${distanceFeet.toFixed(1)}' @ ${displayAngle}°</div>`;
      
      if (liveDistanceLabel) {
        liveDistanceLabel.setLatLng(currentPos);
        liveDistanceLabel.setIcon(L.divIcon({
          className: 'live-distance-label',
          html: labelHtml,
          iconSize: [120, 30],
          iconAnchor: [120, -10]
        }));
      } else {
        liveDistanceLabel = L.marker(currentPos, {
          icon: L.divIcon({
            className: 'live-distance-label',
            html: labelHtml,
            iconSize: [120, 30],
            iconAnchor: [120, -10]
          }),
          interactive: false
        }).addTo(map.current);
      }
    };
    
    const handleDrawStart = (e: any) => {
      if (e.layerType === 'polygon') {
        isDrawingPolygon = true;
        allVertices = [];
      }
    };
    
    const handleDrawVertex = (e: any) => {
      if (isDrawingPolygon) {
        const layers = e.layers.getLayers();
        allVertices = layers.map((layer: any) => layer.getLatLng());
      }
    };
    
    const handleDrawStop = () => {
      isDrawingPolygon = false;
      allVertices = [];
      
      if (liveDistanceLabel && map.current) {
        map.current.removeLayer(liveDistanceLabel);
        liveDistanceLabel = null;
      }
      
      guideLines.forEach(line => {
        if (map.current) map.current.removeLayer(line);
      });
      guideLines = [];
    };
    
    // Attach event listeners
    map.current.on('draw:drawstart', handleDrawStart);
    map.current.on('draw:drawvertex', handleDrawVertex);
    map.current.on('draw:drawstop', handleDrawStop);
    map.current.on('mousemove', updateLiveDistance);
    
    return () => {
      if (map.current) {
        map.current.off('draw:drawstart', handleDrawStart);
        map.current.off('draw:drawvertex', handleDrawVertex);
        map.current.off('draw:drawstop', handleDrawStop);
        map.current.off('mousemove', updateLiveDistance);
      }
      if (liveDistanceLabel && map.current) {
        map.current.removeLayer(liveDistanceLabel);
      }
      guideLines.forEach(line => {
        if (map.current) map.current.removeLayer(line);
      });
    };
  }, [isDrawing]);
  const toggleShapeEditing = () => {
    if (!map.current || !editControl.current || !drawLayer.current) return;

    if (isEditingShapes) {
      try {
        map.current.removeControl(editControl.current);
        map.current.off(L.Draw.Event.EDITED);
      } catch (error) {
        console.error('Error disabling shape editing:', error);
      }
      setIsEditingShapes(false);
    } else {
      try {
        map.current.addControl(editControl.current);
      } catch (error) {
        console.error('Error enabling shape editing:', error);
        alert('Unable to enable shape editing mode. Please refresh the page.');
        return;
      }
      
      setIsEditingShapes(true);

      map.current.on(L.Draw.Event.EDITED, async (e: any) => {
        try {
          const layers = e.layers;
          const updatePromises = [];
          
          layers.eachLayer((layer: any) => {
            const shape = drawnShapes.find(s => s.layer === layer);
            if (shape && drawLayer.current) {
              try {
                const geoJSON = layer.toGeoJSON();
                const polygon = turf.polygon(geoJSON.geometry.coordinates);
                const areaMeters = turf.area(polygon);
                const areaSqFt = areaMeters * 10.764;
                
                const perimeterMeters = turf.length(turf.polygonToLine(polygon), { units: 'meters' });
                const perimeterFeet = perimeterMeters * 3.28084;
                
                shape.dimensionLabels.forEach((dimLabel: any) => {
                  try {
                    drawLayer.current?.removeLayer(dimLabel);
                  } catch (e) {}
                });
                
                const coords = layer.getLatLngs()[0].map((ll: any) => [ll.lat, ll.lng]);
                const newDimensionLabels = createDimensionLabels(coords);
                
                newDimensionLabels.forEach(label => drawLayer.current?.addLayer(label));
                
                setDrawnShapes(prev => prev.map(s =>
                  s.id === shape.id
                    ? {
                        ...s,
                        area: Math.round(areaSqFt),
                        perimeter: Math.round(perimeterFeet),
                        dimensionLabels: newDimensionLabels
                      }
                    : s
                ));
                
                const updatePromise = fetch('/api/projects/' + projectId + '/shapes/' + shape.id, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    coordinates: geoJSON.geometry.coordinates,
                    area: Math.round(areaSqFt),
                    perimeter: Math.round(perimeterFeet)
                  })
                });
                
                updatePromises.push(updatePromise);
                
              } catch (error) {
                console.error('Error updating shape measurements:', error);
              }
            }
          });
          
          await Promise.all(updatePromises);
          toast.success('Shape updated!');
          
        } catch (error) {
          console.error('Error processing edited layers:', error);
          toast.error('Failed to save shape changes');
        }
      });
    }
  };

  const updateShapeName = async (shapeId: string, newName: string) => {
    setDrawnShapes(prev => prev.map(shape =>
      shape.id === shapeId ? { ...shape, name: newName } : shape
    ));
    setEditingShapeId(null);
    
    try {
      await fetch('/api/projects/' + projectId + '/shapes/' + shapeId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
    } catch (error) {
      console.error('Error updating shape name:', error);
      toast.error('Failed to save shape name');
    }
  };

  const deleteShape = async (shapeId: string) => {
    const shapeToDelete = drawnShapes.find(s => s.id === shapeId);
    if (!shapeToDelete) return;
    
    // Delete from database FIRST
    try {
      const response = await fetch('/api/projects/' + projectId + '/shapes/' + shapeId, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        toast.error('Failed to delete shape');
        return;
      }
      
      // Clear ALL shapes from map
      if (drawLayer.current) {
        drawLayer.current.clearLayers();
      }
      
      // Clear state
      setDrawnShapes([]);
      
      // Reload everything from database to ensure perfect sync
      await loadShapesFromDatabase();
      
      toast.success('Shape deleted');
      
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete shape');
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
    <div className="space-y-4">
      {/* Header with Title and Help Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Property Visualization</h2>
          <p className="text-sm text-gray-500">Interactive map showing property boundaries</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <HelpCircle className="h-4 w-4 mr-2" />
              Help Guide
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto z-[99999]">
            <DialogHeader>
              <DialogTitle>Property Visualization Guide</DialogTitle>
              <DialogDescription>
                Learn how to use all the map features
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">🗺️ Viewing Options</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• <strong>Satellite/Street</strong> - Toggle between map views</li>
                  <li>• <strong>Parcel</strong> - Show/hide property boundary (yellow)</li>
                  <li>• <strong>Setbacks</strong> - Show/hide buildable area (green)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">✏️ Editing Property Boundary</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li>1. Click <strong>"Edit Boundary"</strong></li>
                  <li>2. Drag the blue dots to adjust corners</li>
                  <li>3. Click <strong>"Save Boundary"</strong> when done</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">🏷️ Labeling Property Sides</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li>1. Click <strong>"Label Edges"</strong></li>
                  <li>2. Click markers on each side to cycle: Front → Rear → Left → Right</li>
                  <li>3. Label all sides for accurate setback calculations</li>
                  <li>4. Click <strong>"Done Labeling"</strong></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">📐 Drawing Building Shapes</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li>1. Click <strong>"Draw"</strong></li>
                  <li>2. Use toolbar buttons:
                    <ul className="ml-4 mt-1">
                      <li>- <strong>Draw a polygon</strong> - Click points, double-click to finish</li>
                      <li>- <strong>Draw a rectangle</strong> - Click and drag</li>
                    </ul>
                  </li>
                  <li>3. <strong>Blue dimension labels</strong> show the length of each side in feet</li>
                  <li>4. Name each shape in the "Drawn Shapes" panel (click the pencil icon)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">↔️ Moving & Editing Shapes - IMPORTANT!</h4>
                <ul className="text-sm space-y-1 ml-4 bg-yellow-50 p-3 rounded border border-yellow-200">
                  <li>1. After drawing, click <strong>"Move Shapes"</strong> button</li>
                  <li>2. Click <strong>"Edit layers"</strong> (pencil icon) in the Leaflet toolbar</li>
                  <li>3. Click a shape to select it (turns purple with dots)</li>
                  <li>4. <strong className="text-red-600">To move the ENTIRE shape:</strong>
                    <ul className="ml-4 mt-1">
                      <li>- Click and hold in the CENTER/MIDDLE of the shape</li>
                      <li>- DO NOT click on corners or edges</li>
                      <li>- Drag to new location</li>
                      <li>- Dimension labels will move with the shape</li>
                    </ul>
                  </li>
                  <li>5. <strong>To resize/reshape:</strong> Drag the corner dots - dimensions update automatically</li>
                  <li>6. Click <strong>"Save"</strong> (floppy disk icon) in toolbar when done</li>
                  <li>7. Click <strong>"Done Moving"</strong> button</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">⚠️ Setback Violations</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Shapes are automatically checked against setback rules</li>
                  <li>• ✅ Green checkmark = Complies with setbacks</li>
                  <li>• ❌ Red X = Violates setback requirements</li>
                  <li>• Check happens when drawing AND when moving shapes</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">📊 Measurements & Naming</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• All shapes show area (sq ft) and perimeter (ft) in the panel</li>
                  <li>• <strong>Blue dimension labels</strong> show the length of each side in feet</li>
                  <li>• Click the pencil icon next to a shape name to edit it</li>
                  <li>• Give shapes meaningful names like "Main House", "ADU", "Garage"</li>
                  <li>• Total area of all shapes shown at bottom</li>
                  <li>• Measurements update automatically when editing</li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-600 bg-blue-50 p-3 rounded">
                  <strong>💡 Pro Tip:</strong> When moving shapes, click and drag from the CENTER of the shape (not edges or corners). This moves the whole shape along with all its dimension labels!
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Map Container */}
      <Card className={`relative ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
        <div className="relative w-full h-[600px] overflow-hidden">
          <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
          
          {/* Top Center - Mode Toolbar */}
          <MapToolbar
            mode={mode}
            onModeChange={setMode}
            onZoomIn={() => map.current?.zoomIn()}
            onZoomOut={() => map.current?.zoomOut()}
            onUndo={() => console.log('Undo - coming soon')}
            onRedo={() => console.log('Redo - coming soon')}
            canUndo={false}
            canRedo={false}
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Bottom Left - Layer Controls */}
          <div className="absolute bottom-4 left-4 flex gap-2 z-[1000]">
            <Button
              size="sm"
              variant={activeLayer === 'satellite' ? 'selected' : 'outline'}
              onClick={() => setActiveLayer('satellite')}
              className="shadow-sm"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Satellite
            </Button>
            <Button
              size="sm"
              variant={activeLayer === 'street' ? 'selected' : 'outline'}
              onClick={() => setActiveLayer('street')}
              className="shadow-sm"
            >
              <MapIcon className="h-4 w-4 mr-2" />
              Street
            </Button>
            {savedMeasurements.length > 0 && (
              <Button
                size="sm"
                variant={showMeasurements ? 'selected' : 'outline'}
                onClick={() => setShowMeasurements(!showMeasurements)}
                className="shadow-sm"
              >
                <Ruler className="h-4 w-4 mr-2" />
                Measurements
              </Button>
            )}
            {drawnShapes.length > 0 && (
              <Button
                size="sm"
                variant={showDrawnShapes ? 'selected' : 'outline'}
                onClick={() => setShowDrawnShapes(!showDrawnShapes)}
                className="shadow-sm"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Shapes
              </Button>
            )}
          </div>

          {/* Bottom Right - Map Controls (Edit mode only) */}
          {mode === 'edit' && (
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[1000]">
            <Button
              size="sm"
              variant={showParcel ? 'selected' : 'outline'}
              onClick={() => setShowParcel(!showParcel)}
              className="shadow-sm"
            >
              <Grid3x3 className="h-4 w-4 mr-2" />
              Parcel
            </Button>
            <Button
              size="sm"
              variant={showSetbacks ? 'selected' : 'outline'}
              onClick={() => setShowSetbacks(!showSetbacks)}
              className="shadow-sm"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Setbacks
            </Button>
            <Button
              size="sm"
              variant={isEditingBoundary ? 'selected' : 'outline'}
              onClick={toggleBoundaryEdit}
              className="shadow-sm"
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
              variant={isLabelingEdges ? 'selected' : 'outline'}
              onClick={() => setIsLabelingEdges(!isLabelingEdges)}
              className="shadow-sm"
            >
              <Tag className="h-4 w-4 mr-2" />
              {isLabelingEdges ? 'Done Labeling' : 'Label Edges'}
            </Button>
            <Button
              size="sm"
              variant={isFullscreen ? 'selected' : 'outline'}
              onClick={toggleFullscreen}
              className="shadow-sm"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
          )}


          {/* Draw Mode Controls */}
          {mode === 'draw' && (
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[1000]">
              {/* Drawing Tools */}
              <Button
                size="sm"
                variant={drawingTool === 'rectangle' ? 'selected' : 'outline'}
                onClick={() => drawingTool === 'rectangle' ? stopDrawing() : startDrawing('rectangle')}
                className="shadow-sm"
              >
                <Square className="h-4 w-4 mr-2" />
                Rectangle
              </Button>
              <Button
                size="sm"
                variant={drawingTool === 'polygon' ? 'selected' : 'outline'}
                onClick={() => drawingTool === 'polygon' ? stopDrawing() : startDrawing('polygon')}
                className="shadow-sm"
              >
                <Pentagon className="h-4 w-4 mr-2" />
                Polygon
              </Button>
              <Button
                size="sm"
                variant={drawingTool === 'circle' ? 'selected' : 'outline'}
                onClick={() => drawingTool === 'circle' ? stopDrawing() : startDrawing('circle')}
                className="shadow-sm"
              >
                <Circle className="h-4 w-4 mr-2" />
                Circle
              </Button>
              
              {/* Shape Management - only show when shapes exist */}
              {drawnShapes.length > 0 && (
                <>
                  <div className="border-t border-gray-200 my-1"></div>
                  <Button
                    size="sm"
                    variant={isEditingShapes ? 'selected' : 'outline'}
                    onClick={toggleShapeEditing}
                    className="shadow-sm"
                  >
                    <Move className="h-4 w-4 mr-2" />
                    {isEditingShapes ? 'Done Moving' : 'Move Shapes'}
                  </Button>
                  <Button
                    size="sm"
                    variant={isEditingShapesVertices ? 'selected' : 'outline'}
                    onClick={toggleEditShapesVertices}
                    className="shadow-sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {isEditingShapesVertices ? 'Done Editing' : 'Edit Shapes'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={clearDrawings}
                    className="shadow-lg"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Measure Mode Controls */}
          {mode === 'measure' && (
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[1000]">
              {measurementPoints.length === 2 && (
                <>
                  <Card className="p-3 shadow-lg bg-white">
                    <div className="text-sm font-semibold text-blue-600 mb-2">
                      Distance: {
                        (() => {
                          const distance = map.current!.distance(measurementPoints[0], measurementPoints[1]);
                          return (distance * 3.28084).toFixed(1);
                        })()
                      } ft
                    </div>
                  </Card>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={saveMeasurement}
                      className="shadow-lg flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={clearMeasurements}
                      className="shadow-lg flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </>
              )}
              <Card className="p-3 shadow-lg bg-blue-50 max-w-xs">
                <p className="text-xs text-blue-900 font-semibold mb-1">
                  📏 Measurement Mode
                </p>
                <p className="text-xs text-blue-800">
                  Click two points on the map to measure distance.
                </p>
              </Card>
            </div>
          )}



          {/* Violations Warning */}
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

      {/* Property Info - Below Map */}
      {parcelData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
          {parcelData.apn && (
            <div>
              <div className="text-xs text-gray-500 mb-1">APN</div>
              <div className="text-sm font-semibold">{parcelData.apn}</div>
            </div>
          )}
          {parcelData.lotSizeSqFt && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Lot Size</div>
              <div className="text-sm font-semibold">{parcelData.lotSizeSqFt.toLocaleString()} sq ft</div>
            </div>
          )}
          {parcelData.zoning && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Zoning</div>
              <div className="text-sm font-semibold">{parcelData.zoning}</div>
            </div>
          )}
          {buildableArea !== null && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Buildable Area</div>
              <div className="text-sm font-semibold text-green-600">{buildableArea.toLocaleString()} sq ft</div>
            </div>
          )}
        </div>
      )}

      {/* Setbacks, Drawn Shapes, and Measurements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Setbacks Panel */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Setback Requirements</h3>
              {isLabelingEdges && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Labeled: {edgeLabels.length} of {boundaryCoords.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={isEditingSetbacks ? 'selected' : 'secondary'}
                onClick={() => setIsEditingSetbacks(!isEditingSetbacks)}
              >
                {isEditingSetbacks ? 'Cancel' : 'Edit Setbacks'}
              </Button>
              {!setbacksSaved && (
                <span className="text-xs text-gray-500 italic">Saving...</span>
              )}
            </div>
          </div>

          {isLabelingEdges && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm font-semibold text-blue-900 mb-2">Click edge markers on the map to label sides:</p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded" style={{backgroundColor: '#ef4444'}}></div>
                  <span className="text-sm">Front (Street)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded" style={{backgroundColor: '#3b82f6'}}></div>
                  <span className="text-sm">Rear (Back)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded" style={{backgroundColor: '#10b981'}}></div>
                  <span className="text-sm">Left Side</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded" style={{backgroundColor: '#f59e0b'}}></div>
                  <span className="text-sm">Right Side</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="front" className="text-sm font-semibold flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded" style={{backgroundColor: '#ef4444'}}></div>
                Front Street
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="front"
                  type="number"
                  value={setbacks.front}
                  onChange={(e) => handleSetbackChange('front', e.target.value)}
                  disabled={!isEditingSetbacks}
                  className="h-10"
                />
                <span className="text-sm text-gray-500">ft</span>
              </div>
            </div>

            <div>
              <Label htmlFor="rear" className="text-sm font-semibold flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded" style={{backgroundColor: '#3b82f6'}}></div>
                Rear (Back)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="rear"
                  type="number"
                  value={setbacks.rear}
                  onChange={(e) => handleSetbackChange('rear', e.target.value)}
                  disabled={!isEditingSetbacks}
                  className="h-10"
                />
                <span className="text-sm text-gray-500">ft</span>
              </div>
            </div>

            <div>
              <Label htmlFor="left" className="text-sm font-semibold flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded" style={{backgroundColor: '#10b981'}}></div>
                Side Left
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="left"
                  type="number"
                  value={setbacks.left}
                  onChange={(e) => handleSetbackChange('left', e.target.value)}
                  disabled={!isEditingSetbacks}
                  className="h-10"
                />
                <span className="text-sm text-gray-500">ft</span>
              </div>
            </div>

            <div>
              <Label htmlFor="right" className="text-sm font-semibold flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded" style={{backgroundColor: '#f59e0b'}}></div>
                Side Right
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="right"
                  type="number"
                  value={setbacks.right}
                  onChange={(e) => handleSetbackChange('right', e.target.value)}
                  disabled={!isEditingSetbacks}
                  className="h-10"
                />
                <span className="text-sm text-gray-500">ft</span>
              </div>
            </div>
          </div>

          {isEditingSetbacks && (
            <div className="mt-4 flex justify-end">
              <Button onClick={saveSetbacks}>
                <Save className="h-4 w-4 mr-2" />
                Save Setbacks
              </Button>
            </div>
          )}
        </Card>

        {/* Drawn Shapes Panel */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Drawn Shapes ({drawnShapes.length})
            </h3>
          </div>

          {drawnShapes.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-2">
                No shapes drawn yet.
              </p>
              <p className="text-xs text-gray-400">
                Click "Draw" to add building footprints
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-3 p-2 bg-blue-50 rounded">
                💡 Click the pencil icon to rename shapes (e.g., "Main House", "ADU", "Garage")
              </p>
              <div className="space-y-3 max-h-80 overflow-y-auto mb-3">
                {drawnShapes.map((shape, idx) => (
                  <div key={shape.id} className="p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="flex justify-between items-start mb-2">
                      {editingShapeId === shape.id ? (
                        <Input
                          autoFocus
                          value={shape.name}
                          onChange={(e) => setDrawnShapes(prev => prev.map(s =>
                            s.id === shape.id ? { ...s, name: e.target.value } : s
                          ))}
                          onBlur={() => setEditingShapeId(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setEditingShapeId(null);
                            }
                          }}
                          className="h-8 text-sm font-semibold"
                          placeholder="e.g., Main House, ADU, Garage"
                        />
                      ) : (
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-semibold text-sm text-blue-900">{shape.name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingShapeId(shape.id)}
                            className="h-6 w-6 p-0"
                            title="Click to rename this shape"
                          >
                            <Pencil className="h-3 w-3 text-gray-500" />
                          </Button>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteShape(shape.id)}
                        className="h-6 w-6 p-0"
                        title="Delete this shape"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="text-xs text-gray-700">{shape.area.toLocaleString()} sq ft</div>
                    <div className="text-xs text-gray-600">{shape.perimeter.toLocaleString()} ft perimeter</div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm">Total Area</span>
                  <span className="text-lg font-bold text-blue-600">
                    {drawnShapes.reduce((sum, s) => sum + s.area, 0).toLocaleString()} sq ft
                  </span>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Saved Measurements Panel */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              📏 Measurements ({savedMeasurements.length})
            </h3>
          </div>

          {savedMeasurements.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-2">
                No measurements saved yet.
              </p>
              <p className="text-xs text-gray-400">
                Use "Measure" mode to add measurements
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-80 overflow-y-auto mb-3">
                {savedMeasurements.map((measurement) => (
                  <div key={measurement.id} className="p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="flex justify-between items-start mb-2">
                      {editingMeasurementId === measurement.id ? (
                        <Input
                          autoFocus
                          value={measurement.name}
                          onChange={(e) => setSavedMeasurements(prev => prev.map(m =>
                            m.id === measurement.id ? { ...m, name: e.target.value } : m
                          ))}
                          onBlur={() => setEditingMeasurementId(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setEditingMeasurementId(null);
                            }
                          }}
                          className="h-8 text-sm font-semibold"
                          placeholder="e.g., Front Wall, Driveway"
                        />
                      ) : (
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-semibold text-sm text-blue-900">{measurement.name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingMeasurementId(measurement.id)}
                            className="h-6 w-6 p-0"
                            title="Click to rename this measurement"
                          >
                            <Pencil className="h-3 w-3 text-gray-500" />
                          </Button>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMeasurement(measurement.id)}
                        className="h-6 w-6 p-0"
                        title="Delete this measurement"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="text-xs text-gray-700 font-semibold">{measurement.distance.toFixed(1)} ft</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Inspector Panel - Validation & Analysis */}
      <Card className="p-4">
        <InspectorPanel
          parcelData={parcelData}
          buildableArea={buildableArea}
          setbacks={setbacks}
          drawnShapes={drawnShapes}
          onSetbackChange={(side, value) => handleSetbackChange(side as keyof typeof setbacks, value.toString())}
          isEditingSetbacks={isEditingSetbacks}
        />
      </Card>
    </div>

  );
}
