"use client";



import React, { useEffect, useRef, useState, useCallback } from 'react';

import { toast } from 'sonner';

import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

import 'leaflet-draw';

import 'leaflet-draw/dist/leaflet.draw.css';

import 'leaflet-editable';

import * as turf from '@turf/turf';

import { Card } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { Loader2, Maximize2, Minimize2, Map as MapIcon, Building2, Grid3x3, MapPin, Save, Edit, X, AlertTriangle, Check, Tag, Trash2, Pencil, Move, HelpCircle, Ruler, Square, Circle, Pentagon, Copy, Clipboard, FileText, RotateCw } from 'lucide-react';

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
  existingBuildingSqFt?: number;

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

  nameLabel?: L.Marker | null;

  shapeType?: string;

  rotationAngle?: number; // Rotation in degrees (0-360)

}



export default function PropertyVisualization({

  projectId,

  parcelData: initialParcelData,

  buildingFootprint,

  existingBuildingSqFt

}: PropertyVisualizationProps) {

  const mapContainer = useRef<HTMLDivElement>(null);

  const map = useRef<L.Map | null>(null);
  const deleteShapeRef = useRef<((shapeId: string) => Promise<void>) | null>(null);

  // Local state for parcel data (allows us to update it when we fetch complete data)
  const [parcelData, setParcelData] = useState(initialParcelData);

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

  const boundaryDimensionLabels = useRef<L.Marker[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const [activeLayer, setActiveLayer] = useState<'satellite' | 'street'>('satellite');

  const [showParcel, setShowParcel] = useState(true);

  const [showSetbacks, setShowSetbacks] = useState(true);

  const [showDrawnShapes, setShowDrawnShapes] = useState(true);

  const [showDimensionLabels, setShowDimensionLabels] = useState(true);

  const [isEditingBoundary, setIsEditingBoundary] = useState(false);

  const [isEditingSetbacks, setIsEditingSetbacks] = useState(false);

  const [isLabelingEdges, setIsLabelingEdges] = useState(false);

  const [isDrawing, setIsDrawing] = useState(false);

  const [drawingTool, setDrawingTool] = useState<'rectangle' | 'polygon' | 'circle' | null>(null);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  
  // Global callback map for delete buttons (accessed by inline onclick)
  const deleteCallbacks = useRef<Map<string, () => void>>(new Map());

  const [isEditingShapesVertices, setIsEditingShapesVertices] = useState(false);

  const [isEditingShapes, setIsEditingShapes] = useState(false);

  const [boundaryCoords, setBoundaryCoords] = useState<[number, number][]>([]);

  const [edgeLabels, setEdgeLabels] = useState<EdgeLabel[]>([]);

  const [drawnShapes, setDrawnShapes] = useState<DrawnShape[]>([]);

  const [editingShapeId, setEditingShapeId] = useState<string | null>(null);

  const [draggingSetback, setDraggingSetback] = useState<{ side: string; startValue: number } | null>(null);

  // Building sketches overlay state
  const [showBuildingSketches, setShowBuildingSketches] = useState(false);
  const [sketchesOverlay, setSketchesOverlay] = useState<L.ImageOverlay | null>(null);
  const [sketchesOpacity, setSketchesOpacity] = useState(0.7);
  const [autoCreatedBuildingSections, setAutoCreatedBuildingSections] = useState(false);

  // Precision mode state (zoom-lock for accurate measurements)
  const [precisionMode, setPrecisionMode] = useState(false);
  const [lockedZoom, setLockedZoom] = useState<number | null>(null);
  const [pixelsToFeet, setPixelsToFeet] = useState<number | null>(null);

  // View mode state (satellite, hybrid, clean slate)
  const [viewMode, setViewMode] = useState<'satellite' | 'hybrid' | 'clean'>('satellite');

  // Edit Shapes mode state
  const [isEditShapesMode, setIsEditShapesMode] = useState(false);



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

  // Polyline measurement state
  const [measurementType, setMeasurementType] = useState<'line' | 'polyline'>('line');
  const [polylinePoints, setPolylinePoints] = useState<L.LatLng[]>([]);
  const [polylinePreviewPoint, setPolylinePreviewPoint] = useState<L.LatLng | null>(null);
  const polylineMarkers = useRef<L.CircleMarker[]>([]);
  const polylineLines = useRef<L.Polyline[]>([]);
  const polylineLabels = useRef<L.Marker[]>([]);
  const polylinePreviewLine = useRef<L.Polyline | null>(null);

  // Saved polyline measurements from database
  const [savedPolylines, setSavedPolylines] = useState<Array<{
    id: string;
    points: Array<{ lat: number; lng: number }>;
    totalDistance: number;
    segmentDistances: number[];
  }>>([]);
  const savedPolylineLayers = useRef<Map<string, {
    markers: L.CircleMarker[];
    lines: L.Polyline[];
    labels: L.Marker[]
  }>>(new Map());

  const measurementMarkers = useRef<L.Marker[]>([]);

  const measurementLines = useRef<L.Polyline[]>([]);

  const measurementLabels = useRef<L.Marker[]>([]);

  const savedMeasurementLayers = useRef<Map<string, { line: L.Polyline; label: L.Marker }>>(new Map());
  const shapesLoadedRef = useRef(false);

  const [isDraggingVertex, setIsDraggingVertex] = useState(false);

  const [draggedVertexIndex, setDraggedVertexIndex] = useState<number | null>(null);

  const [isShiftPressed, setIsShiftPressed] = useState(false);

  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const isSpacePressedRef = useRef(false);
  const [previousDraggingState, setPreviousDraggingState] = useState<boolean>(true);

  // Smart Shape Panel state
  const [showShapePanel, setShowShapePanel] = useState(false);
  const [shapeWidth, setShapeWidth] = useState('');
  const [shapeLength, setShapeLength] = useState('');
  const [shapeLabel, setShapeLabel] = useState('');
  const [selectedShapeType, setSelectedShapeType] = useState<'rectangle' | 'l-shape' | 'u-shape' | 't-shape'>('rectangle');
  const [quickInput, setQuickInput] = useState('');
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [isSpaceDragging, setIsSpaceDragging] = useState(false);
  const isSpaceDraggingRef = useRef(false);

  const [originalVertexPosition, setOriginalVertexPosition] = useState<L.LatLng | null>(null);

  // Copy/paste state
  const [copiedShape, setCopiedShape] = useState<{
    name: string;
    shapeType: string;
    coordinates: any;
    area: number;
    perimeter: number;
  } | null>(null);

  // Move/drag state
  const [isDraggingShape, setIsDraggingShape] = useState(false);
  const [draggedShapeId, setDraggedShapeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ lat: number; lng: number } | null>(null);
  const [originalShapePosition, setOriginalShapePosition] = useState<any>(null);

  // Edit vertices state
  const [editingVertices, setEditingVertices] = useState(false);
  const [vertexHandles, setVertexHandles] = useState<L.CircleMarker[]>([]);
  const [isDraggingVertexHandle, setIsDraggingVertexHandle] = useState(false);
  const [draggedVertexHandleIndex, setDraggedVertexHandleIndex] = useState<number | null>(null);

  // Handle-based editing state
  const [moveHandles, setMoveHandles] = useState<L.Marker[]>([]);
  const [editHandles, setEditHandles] = useState<L.Marker[]>([]);
  const [rotationHandle, setRotationHandle] = useState<L.Marker | null>(null);
  const [rotationLine, setRotationLine] = useState<L.Polyline | null>(null);
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const [draggedHandleType, setDraggedHandleType] = useState<'move' | 'vertex' | 'corner' | 'radius' | 'rotation' | null>(null);
  const [draggedHandleIndex, setDraggedHandleIndex] = useState<number | null>(null);
  const [rotationStartAngle, setRotationStartAngle] = useState<number>(0);
  const [currentRotationAngle, setCurrentRotationAngle] = useState<number>(0);

  // DEBUG: Intercept coordinate errors
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const errorMsg = args.join(' ');
      if (errorMsg.includes('coord must be GeoJSON') || errorMsg.includes('Invalid LatLng')) {
        console.log('🚨 COORDINATE ERROR CAUGHT!');
        console.log('Error arguments:', args);
        console.log('Stack trace:', new Error().stack);
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  // DEBUG: Intercept L.marker calls
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).L) {
      const L = (window as any).L;
      const originalMarker = L.marker;
      L.marker = function(latlng: any, options?: any) {
        console.log('🗺️ L.marker called with:', latlng, 'Type:', typeof latlng, 'IsArray:', Array.isArray(latlng));
        if (!Array.isArray(latlng) && (!latlng || !latlng.lat || !latlng.lng)) {
          console.error('❌ Invalid latlng passed to L.marker:', latlng);
          console.trace('Call stack:');
        }
        return originalMarker.call(this, latlng, options);
      };

      return () => {
        L.marker = originalMarker;
      };
    }
  }, []);

  // Sync prop changes to local state
  useEffect(() => {
    if (initialParcelData) {
      setParcelData(initialParcelData);
    }
  }, [initialParcelData]);

  // Auto-fetch complete Regrid data if propertyMetadata is missing
  useEffect(() => {
    const fetchCompleteParcelData = async () => {
      // Only fetch if we have parcel data but missing propertyMetadata
      if (!parcelData || !parcelData.address) return;

      // Check if propertyMetadata is null, undefined, or empty object
      const hasMetadata = parcelData.propertyMetadata &&
                         Object.keys(parcelData.propertyMetadata).length > 0;

      if (hasMetadata) {
        console.log('✅ Property metadata already exists, skipping fetch');
        return;
      }

      console.log('🔄 Property metadata missing, fetching complete Regrid data...');

      try {
        const response = await fetch('/api/parcels/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: parcelData.address }),
        });

        if (!response.ok) {
          console.error('Failed to fetch complete parcel data:', response.statusText);
          return;
        }

        const result = await response.json();

        if (result.success && result.parcel) {
          console.log('✅ Complete parcel data fetched, updating local state');
          // Update local state with the complete data including propertyMetadata
          setParcelData(result.parcel);
        }
      } catch (error) {
        console.error('Error fetching complete parcel data:', error);
      }
    };

    fetchCompleteParcelData();
  }, [parcelData?.id, parcelData?.address]); // Only run when parcel ID or address changes

  // Load saved measurements from database
  useEffect(() => {
    const loadMeasurements = async () => {
      if (!projectId) return;

      try {
        const response = await fetch(`/api/projects/${projectId}/measurements`);

        if (!response.ok) {
          console.error('Failed to load measurements');
          return;
        }

        const { measurements } = await response.json();

        // Filter and set polyline measurements
        const polylines = measurements
          .filter((m: any) => m.measurementType === 'polyline')
          .map((m: any) => ({
            id: m.id,
            points: m.points,
            totalDistance: m.totalDistance,
            segmentDistances: m.segmentDistances || [],
          }));

        setSavedPolylines(polylines);
      } catch (error) {
        console.error('Error loading measurements:', error);
      }
    };

    loadMeasurements();
  }, [projectId]);

  // Render saved polylines on the map
  useEffect(() => {
    if (!map.current || savedPolylines.length === 0) return;

    // Clear existing saved polyline layers
    savedPolylineLayers.current.forEach(({ markers, lines, labels }) => {
      markers.forEach(m => map.current?.removeLayer(m));
      lines.forEach(l => map.current?.removeLayer(l));
      labels.forEach(lb => map.current?.removeLayer(lb));
    });
    savedPolylineLayers.current.clear();

    // Render each saved polyline
    savedPolylines.forEach((polyline) => {
      const markers: L.CircleMarker[] = [];
      const lines: L.Polyline[] = [];
      const labels: L.Marker[] = [];

      // Add markers for each point
      polyline.points.forEach((point, i) => {
        const marker = L.circleMarker([point.lat, point.lng], {
          radius: 5,
          fillColor: 'white',
          fillOpacity: 1,
          color: '#00BCD4',
          weight: 2,
        }).addTo(map.current!);
        markers.push(marker);

        // Draw line segments
        if (i > 0) {
          const prevPoint = polyline.points[i - 1];
          const line = L.polyline(
            [[prevPoint.lat, prevPoint.lng], [point.lat, point.lng]],
            {
              color: '#00BCD4',
              weight: 2,
              dashArray: '3, 6',
            }
          ).addTo(map.current!);
          lines.push(line);

          // Add segment label
          const segmentDistance = polyline.segmentDistances[i - 1];
          const feet = Math.floor(segmentDistance);
          const inches = Math.round((segmentDistance - feet) * 12);
          const distanceText = inches > 0 ? `${feet}' ${inches}"` : `${feet}'`;

          const midLat = (prevPoint.lat + point.lat) / 2;
          const midLng = (prevPoint.lng + point.lng) / 2;

          // Validate coordinates before creating marker
          if (!isFinite(midLat) || !isFinite(midLng)) {
            console.error('❌ Invalid ruler measurement label coordinates:', {
              midLat, midLng, prevPoint, point
            });
            return;
          }

          const label = L.marker([midLat, midLng], {
            icon: L.divIcon({
              className: 'custom-div-icon',
              html: `
                <div style="
                  background: linear-gradient(135deg, #00BCD4 0%, #00ACC1 100%);
                  color: white;
                  padding: 4px 8px;
                  border-radius: 8px;
                  font-size: 11px;
                  font-weight: 600;
                  white-space: nowrap;
                  box-shadow: 0 2px 8px rgba(0,188,212,0.3);
                  pointer-events: none;
                  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
                  letter-spacing: 0.3px;
                ">
                  ${distanceText}
                </div>
              `,
              iconSize: [60, 22],
              iconAnchor: [30, 11],
            }),
          }).addTo(map.current!);
          labels.push(label);
        }
      });

      // Store layers for this polyline
      savedPolylineLayers.current.set(polyline.id, { markers, lines, labels });
    });
  }, [savedPolylines]);

  // Keyboard shortcuts for mode switching

  useEffect(() => {

    const handleKeyDown = (e: KeyboardEvent) => {

      // Don't trigger if user is typing in an input

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {

        return;

      }



      if (e.key === ' ') {

        e.preventDefault();

        // Prevent repeated keydown events when holding space
        if (isSpacePressed) return;

        setIsSpacePressed(true);
        isSpacePressedRef.current = true;

        if (map.current) {

          // Save current dragging state before enabling
          const wasDraggingEnabled = map.current.dragging.enabled();
          setPreviousDraggingState(wasDraggingEnabled);

          // Enable dragging for panning
          map.current.dragging.enable();

          // Set grab cursor
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

          // Exit precision mode when leaving draw/measure
          if (mode === 'draw' || mode === 'measure') {
            exitPrecisionMode();
          }
          setMode('view');

          break;

        case '2':

        case 'e':

          // Exit precision mode when leaving draw/measure
          if (mode === 'draw' || mode === 'measure') {
            exitPrecisionMode();
          }
          setMode('edit');

          toast.info('Edit mode active. Hold Space to pan, Shift to snap', { duration: 3000 });

          break;

        case '3':

        case 'd':

          // Enter precision mode for drawing
          enterPrecisionMode();
          setMode('draw');

          break;

        case '4':

        case 'm':

          // Enter precision mode for measuring
          enterPrecisionMode();
          setMode('measure');

          break;

        case 'escape':

          // Exit precision mode when leaving draw/measure
          if (mode === 'draw' || mode === 'measure') {
            exitPrecisionMode();
          }
          setMode('view');

          break;

      }

    };



    const handleKeyUp = (e: KeyboardEvent) => {

      if (e.key === ' ') {

        setIsSpacePressed(false);
        isSpacePressedRef.current = false;
        setIsSpaceDragging(false);
        isSpaceDraggingRef.current = false;

        if (map.current) {

          // Restore cursor
          map.current.getContainer().style.cursor = '';

          // Restore previous dragging state
          if (previousDraggingState) {
            map.current.dragging.enable();
          } else {
            map.current.dragging.disable();
          }

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
  const [buildingArea, setBuildingArea] = useState<number>(existingBuildingSqFt || 0);

  const [violations, setViolations] = useState<string[]>([]);



  const snapToGrid = (value: number, gridSize: number = 0.00001) => {

    return Math.round(value / gridSize) * gridSize;

  };

  // Helper function to convert decimal feet to feet + inches format
  // Helper function to ensure polygon coordinates are closed (first point === last point)
  // Required by turf.js for polygon operations
  const ensureClosedPolygon = (coords: any[]): any[] => {
    if (!coords || coords.length < 3) return coords;

    // Check if already closed
    const first = coords[0];
    const last = coords[coords.length - 1];

    // Handle both [lat, lng] and [lng, lat] coordinate formats
    const isEqual = Array.isArray(first) && Array.isArray(last)
      ? (first[0] === last[0] && first[1] === last[1])
      : false;

    if (!isEqual) {
      // Clone the array and add first point at the end to close it
      return [...coords, Array.isArray(first) ? [...first] : first];
    }

    return coords;
  };

  const formatFeetInches = (totalFeet: number): string => {
    const feet = Math.floor(totalFeet);
    const inches = Math.round((totalFeet - feet) * 12);
    if (inches === 0) {
      return `${feet}'`;
    } else if (inches === 12) {
      return `${feet + 1}'`;
    } else {
      return `${feet}' ${inches}"`;
    }
  };

  // Helper function to create clean dimension icons for property boundary labels
  const createDimensionIcon = (text: string, orientation: 'horizontal' | 'vertical', side: 'north' | 'south' | 'east' | 'west', viewMode: string) => {
    let rotation = 0;
    if (side === 'east') rotation = 90;
    if (side === 'west') rotation = -90;

    // Adapt styling based on view mode
    const isSatellite = viewMode === 'satellite';
    const textColor = isSatellite ? '#ffffff' : '#000000';
    const textShadow = isSatellite
      ? `-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 3px rgba(0,0,0,0.8)`
      : 'none';

    return L.divIcon({
      html: `
        <div style="
          font-weight: 700;
          font-size: 13px;
          white-space: nowrap;
          color: ${textColor};
          text-shadow: ${textShadow};
          transform: rotate(${rotation}deg);
          transform-origin: center center;
        ">
          ${text}
        </div>
      `,
      className: 'boundary-dimension-label',
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });
  };

  // Helper function to create buildable area dimension icons
  const createBuildableIcon = (text: string, orientation: 'horizontal' | 'vertical', side: 'north' | 'south' | 'east' | 'west', viewMode: string) => {
    let rotation = 0;
    if (side === 'east') rotation = 90;
    if (side === 'west') rotation = -90;

    // Adapt styling based on view mode
    const isSatellite = viewMode === 'satellite';
    const textColor = isSatellite ? '#ffffff' : '#000000';
    const textShadow = isSatellite
      ? `-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 3px rgba(0,0,0,0.8)`
      : 'none';

    return L.divIcon({
      html: `
        <div style="
          font-weight: 600;
          font-size: 11px;
          white-space: nowrap;
          color: ${textColor};
          text-shadow: ${textShadow};
          transform: rotate(${rotation}deg);
          transform-origin: center center;
        ">
          ${text}
        </div>
      `,
      className: 'buildable-dimension-label',
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });
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

        background: linear-gradient(to bottom, ${color}, ${color}dd);

        color: white;

        border: 1.5px solid rgba(255, 255, 255, 0.9);

        border-radius: 6px;

        padding: 3px 8px;

        font-size: 11px;

        font-weight: 500;

        cursor: pointer;

        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);

        white-space: nowrap;

        display: flex;

        align-items: center;

        justify-content: center;

        backdrop-filter: blur(8px);

        -webkit-backdrop-filter: blur(8px);

      ">${label}</div>`,

      iconSize: [50, 22],

      iconAnchor: [25, 11]

    });

  };



  // Helper: Determine which side of the shape an edge is on (for CSS positioning)
  const getEdgeSide = (
    edgeMidLat: number,
    edgeMidLng: number,
    coord1: [number, number],
    coord2: [number, number],
    centroidLat: number,
    centroidLng: number
  ): 'top' | 'bottom' | 'left' | 'right' => {
    // Calculate perpendicular vector to the edge
    const edgeDx = coord2[1] - coord1[1];
    const edgeDy = coord2[0] - coord1[0];
    const edgeLength = Math.sqrt(edgeDx * edgeDx + edgeDy * edgeDy);

    // Perpendicular vector (rotate 90 degrees)
    let perpX = -edgeDy / edgeLength;
    let perpY = edgeDx / edgeLength;

    // Determine which direction points outward (away from centroid)
    const toCentroidX = centroidLng - edgeMidLng;
    const toCentroidY = centroidLat - edgeMidLat;

    // If perpendicular points toward centroid, flip it
    const dotProduct = perpX * toCentroidX + perpY * toCentroidY;
    if (dotProduct > 0) {
      perpX = -perpX;
      perpY = -perpY;
    }

    // Determine side based on perpendicular direction
    const absX = Math.abs(perpX);
    const absY = Math.abs(perpY);

    if (absY > absX) {
      // Vertical direction (top or bottom)
      return perpY < 0 ? 'top' : 'bottom';
    } else {
      // Horizontal direction (left or right)
      return perpX < 0 ? 'left' : 'right';
    }
  };

  const createDimensionLabels = (coords: [number, number][]) => {

    const dimensionLabels: any[] = [];

    // Remove duplicate last point if polygon is closed
    let cleanCoords = coords;
    if (coords.length > 1) {
      const first = coords[0];
      const last = coords[coords.length - 1];
      if (first[0] === last[0] && first[1] === last[1]) {
        cleanCoords = coords.slice(0, -1);
      }
    }

    // Calculate area to determine if shape is too small for labels
    // Ensure polygon is closed for turf.js (first point must equal last point)
    const polygonCoords = cleanCoords.map(coord => [coord[1], coord[0]]);
    // Close the polygon if not already closed
    const firstCoord = polygonCoords[0];
    const lastCoord = polygonCoords[polygonCoords.length - 1];
    if (firstCoord[0] !== lastCoord[0] || firstCoord[1] !== lastCoord[1]) {
      polygonCoords.push([...firstCoord]);
    }
    const polygon = turf.polygon([polygonCoords]);
    const areaMeters = turf.area(polygon);
    const areaSqFt = areaMeters * 10.764;

    // Don't show labels on shapes smaller than 100 sq ft to prevent overlap
    if (areaSqFt < 100) {
      return {
        labels: [],
        isSmallShape: true,
        totalPerimeter: 0
      };
    }

    // Calculate centroid for offset direction calculation
    const centroidLat = cleanCoords.reduce((sum, coord) => sum + coord[0], 0) / cleanCoords.length;
    const centroidLng = cleanCoords.reduce((sum, coord) => sum + coord[1], 0) / cleanCoords.length;

    // Calculate total perimeter for metadata
    let totalPerimeterFeet = 0;
    for (let i = 0; i < cleanCoords.length; i++) {
      const nextIndex = (i + 1) % cleanCoords.length;
      const coord1 = cleanCoords[i];
      const coord2 = cleanCoords[nextIndex];
      const point1 = turf.point([coord1[1], coord1[0]]);
      const point2 = turf.point([coord2[1], coord2[0]]);
      const distanceMeters = turf.distance(point1, point2, { units: 'meters' });
      const distanceFeet = distanceMeters * 3.28084;
      totalPerimeterFeet += distanceFeet;
    }

    for (let i = 0; i < cleanCoords.length; i++) {

      const nextIndex = (i + 1) % cleanCoords.length;

      const coord1 = cleanCoords[i];

      const coord2 = cleanCoords[nextIndex];



      const point1 = turf.point([coord1[1], coord1[0]]);

      const point2 = turf.point([coord2[1], coord2[0]]);

      const distanceMeters = turf.distance(point1, point2, { units: 'meters' });

      const distanceFeet = distanceMeters * 3.28084;

      // Skip zero-length edges
      if (distanceFeet < 0.1) continue;

      const formattedDistance = formatFeetInches(distanceFeet);



      const midLat = (coord1[0] + coord2[0]) / 2;

      const midLng = (coord1[1] + coord2[1]) / 2;

      // Validate coordinates before creating marker
      if (!isFinite(midLat) || !isFinite(midLng)) {
        console.error('❌ Invalid shape dimension label coordinates:', {
          midLat, midLng, coord1, coord2, edgeIndex: i
        });
        continue;
      }

      // Determine which side of the shape this edge is on
      const side = getEdgeSide(
        midLat,
        midLng,
        coord1,
        coord2,
        centroidLat,
        centroidLng
      );

      // CSS transforms for 5px offset based on side
      const transforms = {
        top: 'translate(-50%, calc(-100% - 5px))',
        bottom: 'translate(-50%, 5px)',
        left: 'translate(calc(-100% - 5px), -50%)',
        right: 'translate(5px, -50%)'
      };

      const dimensionLabel = L.marker([midLat, midLng], {

        icon: L.divIcon({

          className: 'dimension-label',

          html: `

            <div style="

              background: linear-gradient(to bottom, #ffffff, #f8fafc);

              border: 1.5px solid rgba(59, 130, 246, 0.5);

              border-radius: 6px;

              padding: 3px 8px;

              font-size: 11px;

              font-weight: 500;

              color: #1e40af;

              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);

              white-space: nowrap;

              display: flex;

              align-items: center;

              justify-content: center;

              backdrop-filter: blur(8px);

              -webkit-backdrop-filter: blur(8px);

              transform: ${transforms[side]};

            ">${formattedDistance}</div>

          `,

          iconSize: [60, 22],

          iconAnchor: [0, 0]

        }),
        interactive: false

      });



      dimensionLabels.push(dimensionLabel);

    }

    // Return labels and metadata
    return {
      labels: dimensionLabels,
      isSmallShape: false, // Not a small shape if we got here (area >= 100 sq ft)
      totalPerimeter: totalPerimeterFeet
    };

  };
  const layerToShapeData = (layer: any, name: string, shapeType: string) => {

    const geoJSON = layer.toGeoJSON();

    // Ensure polygon coordinates are closed
    const closedCoords = geoJSON.geometry.coordinates.map((ring: any[]) => ensureClosedPolygon(ring));
    const polygon = turf.polygon(closedCoords);

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
          if (shape.shapeType === 'circle') {
            // Log raw coordinates for debugging
            console.log('Loading circle shape:', {
              id: shape.id,
              rawCoordinates: shape.coordinates,
              coordinatesType: typeof shape.coordinates
            });

            // Parse coordinates if it's a JSON string
            let coords = shape.coordinates;
            if (typeof shape.coordinates === 'string') {
              // Check if it looks like a corrupted shape ID (contains colons or wrong format)
              if (shape.coordinates.includes(':') ||
                  shape.coordinates.length < 10 ||
                  !shape.coordinates.includes('[')) {
                console.error('❌ Circle has corrupted string ID as coordinates, skipping:', shape.id, shape.coordinates);
                return; // Skip this corrupted circle
              }

              try {
                coords = JSON.parse(shape.coordinates);
                console.log('Parsed circle coordinates from JSON string:', coords);

                // Check if parsed result is still a string (corrupted data)
                if (typeof coords === 'string') {
                  console.error('❌ Circle coordinates is corrupted string, skipping:', shape.id, coords);
                  return; // Skip this corrupted circle
                }
              } catch (e) {
                console.error('❌ Failed to parse circle coordinates JSON:', shape.id, shape.coordinates);
                return; // Skip this shape
              }
            }

            // Validate that coordinates is an array
            if (!Array.isArray(coords) || coords.length === 0) {
              console.error('❌ Invalid circle coordinates - not an array or empty:', shape.id, coords);
              return; // Skip this shape
            }

            // Get center point - should be [[lng, lat]] or [lng, lat]
            const center = Array.isArray(coords[0]) ? coords[0] : coords;

            // Validate center has valid numbers
            if (!center || center.length < 2 ||
                typeof center[0] !== 'number' || typeof center[1] !== 'number' ||
                isNaN(center[0]) || isNaN(center[1])) {
              console.error('❌ Invalid circle center coordinates:', shape.id, center);
              return; // Skip this shape
            }

            // Validate perimeter to calculate radius
            if (!shape.perimeter || shape.perimeter <= 0 || isNaN(shape.perimeter)) {
              console.error('❌ Invalid circle perimeter:', shape.id, shape.perimeter);
              return; // Skip this shape
            }

            // Calculate radius from perimeter (perimeter is in feet, convert to meters)
            const radius = shape.perimeter / (2 * Math.PI) / 3.28084;

            // Validate calculated radius
            if (!radius || radius <= 0 || isNaN(radius)) {
              console.error('❌ Invalid circle radius calculated:', shape.id, 'perimeter:', shape.perimeter, 'radius:', radius);
              return; // Skip this shape
            }

            // Center is stored as [lng, lat], Leaflet expects [lat, lng]
            const [lng, lat] = center;

            console.log('✅ Circle loaded successfully:', { lat, lng, radius });

            layer = L.circle([lat, lng], {
              radius: radius,
              color: '#ef4444',
              fillColor: '#ef4444',
              fillOpacity: 0.3,
              interactive: true
            });

            // Create diameter label for circle
            const diameterFeet = (radius * 2) * 3.28084;

            // Validate coordinates before creating marker
            if (!isFinite(lat) || !isFinite(lng)) {
              console.error('❌ Invalid loaded circle diameter label coordinates:', { lat, lng, radius });
              dimensionLabels = [];
            } else {
              dimensionLabels = [L.marker([lat, lng], {
                icon: L.divIcon({
                  className: 'dimension-label',
                  html: `<div style="background: linear-gradient(to bottom, #ffffff, #f8fafc); border: 1.5px solid rgba(59, 130, 246, 0.5); border-radius: 6px; padding: 3px 8px; font-size: 11px; font-weight: 500; color: #1e40af; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06); white-space: nowrap; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);">⌀ ${formatFeetInches(diameterFeet)}</div>`,
                  iconSize: [60, 22],
                  iconAnchor: [30, 11]
                }),
                interactive: false
              })];
            }
        } else {
            // Handle polygons and rectangles
            console.log('Loading polygon/rectangle:', {
              id: shape.id,
              name: shape.name,
              coordinatesType: typeof shape.coordinates,
              isArray: Array.isArray(shape.coordinates),
              firstElement: shape.coordinates[0],
              coordinates: shape.coordinates
            });

            // Validate coordinates structure
            if (!shape.coordinates || !Array.isArray(shape.coordinates)) {
              console.error('Invalid polygon coordinates - not an array:', shape);
              return; // Skip this shape
            }

            if (shape.coordinates.length === 0) {
              console.error('Invalid polygon coordinates - empty array:', shape);
              return; // Skip this shape
            }

            // Handle different coordinate formats from database
            const firstCoord = shape.coordinates[0];

            if (typeof firstCoord === 'object' && firstCoord !== null && 'lat' in firstCoord && 'lng' in firstCoord) {
              // Format: [{lat, lng}, {lat, lng}, ...] (database format)
              console.log('  ✓ Using {lat, lng} object format');
              coords = shape.coordinates.map((coord: any) => [coord.lat, coord.lng]);
            } else if (Array.isArray(firstCoord)) {
              // Check if it's double-nested [[lng, lat], ...] or triple-nested [[[lng, lat], ...]]
              if (typeof firstCoord[0] === 'number') {
                // Double-nested: [[lng, lat], [lng, lat], ...] - from createShapeAtCenter
                console.log('  ✓ Using double-nested array format (createShapeAtCenter)');
                coords = shape.coordinates.map((coord: any) => [coord[1], coord[0]]);
              } else if (Array.isArray(firstCoord[0])) {
                // Triple-nested: [[[lng, lat], [lng, lat], ...]] - legacy format
                console.log('  ✓ Using triple-nested array format (legacy)');
                coords = shape.coordinates[0].map((coord: any) => [coord[1], coord[0]]);
              } else {
                console.error('Unknown nested array format:', { firstCoord, shape });
                return; // Skip this shape
              }
            } else {
              console.error('Unknown coordinate format:', { firstCoord, shape });
              return; // Skip this shape
            }

            // Ensure polygon coordinates are closed for Leaflet
            const closedCoords = ensureClosedPolygon(coords);

            layer = L.polygon(closedCoords, {
              color: '#ef4444',
              fillColor: '#ef4444',
              fillOpacity: 0.3,
              interactive: true
            });

            const labelResult = createDimensionLabels(coords);
            dimensionLabels = labelResult.labels;
            const isSmallShape = labelResult.isSmallShape;

            // For small shapes, initially hide labels (they'll show on hover)
            if (!isSmallShape) {
              dimensionLabels.forEach(label => drawLayer.current.addLayer(label));
            }

            // Add hover handlers for small shapes
            if (isSmallShape) {
              layer.on('mouseover', () => {
                dimensionLabels.forEach(label => {
                  if (drawLayer.current && !drawLayer.current.hasLayer(label)) {
                    drawLayer.current.addLayer(label);
                  }
                });
              });

              layer.on('mouseout', () => {
                dimensionLabels.forEach(label => {
                  if (drawLayer.current && drawLayer.current.hasLayer(label)) {
                    drawLayer.current.removeLayer(label);
                  }
                });
              });
            }
          }

          if (!layer) {
            console.error('Failed to create layer for shape:', shape);
            return;
          }

          // CRITICAL: Store shape ID in layer options so we can find it later
          layer.options.shapeId = shape.id;
          layer.options.bubblingMouseEvents = false;

          // Store dimension labels on layer to avoid stale state issues
          layer._dimensionLabels = dimensionLabels;

          // Apply rotation if the shape has a rotation angle
          if (shape.rotationAngle && shape.rotationAngle !== 0 && shape.shapeType !== 'circle') {
            applyRotationToLayer(layer, shape.rotationAngle);
            console.log(`  🔄 Applied ${shape.rotationAngle}° rotation to ${shape.name}`);
          }

          drawLayer.current.addLayer(layer);

          // NO enableEdit() - shapes only draggable when Edit Shapes mode is active
          // Click handler will be attached when Edit Shapes mode is enabled

          // NOTE: Shape click handlers now handled by Edit Shapes mode

          // Create delete button for loaded shape
          const bounds = layer.getBounds();
          const topLeft = bounds.getNorthWest();

          // Validate coordinates before creating delete button marker
          if (!topLeft || !isFinite(topLeft.lat) || !isFinite(topLeft.lng)) {
            console.error('❌ Invalid topLeft coordinates for delete button:', topLeft);
            return;
          }

          const deleteBtn = L.marker([topLeft.lat, topLeft.lng], {
            icon: L.divIcon({
              className: 'shape-delete-button',
              html: '<div style="color: #dc2626; cursor: pointer; font-weight: 900; font-size: 24px; text-shadow: 0 0 3px white, 0 0 5px white; pointer-events: auto; z-index: 10000; line-height: 1;">×</div>',
              iconSize: [32, 32],
              iconAnchor: [24, 24]
            }),
            zIndexOffset: 1000
          }, {
            interactive: true
          }).addTo(drawLayer.current);
          
          // Store shape ID on button element
          const buttonElement = deleteBtn.getElement();
          if (buttonElement) {
            buttonElement.setAttribute('data-shape-id', shape.id);
          }
          
          // Add click handler
          deleteBtn.on('click', (e: any) => {
            L.DomEvent.stopPropagation(e);
            const shapeId = deleteBtn.getElement()?.getAttribute('data-shape-id');
            if (shapeId) {
              deleteShapeRef.current?.(shapeId);
            }
          });

          // Create and add name label
          const nameLabel = createShapeNameLabel(layer, shape.name);
          if (nameLabel && drawLayer.current) {
            nameLabel.addTo(drawLayer.current);
          }

          loadedShapes.push({
            id: shape.id,
            name: shape.name,
            area: shape.area,
            perimeter: shape.perimeter,
            layer: layer,
            dimensionLabels: dimensionLabels,
            nameLabel: nameLabel,
            deleteButton: deleteBtn,
            shapeType: shape.shapeType,
            rotationAngle: shape.rotationAngle || 0
          });


        } catch (error) {

          console.error('Error loading shape:', error);

        }

      });

      

      setDrawnShapes(loadedShapes);

      console.log('📦 Loaded shapes from database:', loadedShapes.length, 'shapes');
      console.log('Shape details:', loadedShapes.map(s => ({ id: s.id, name: s.name, type: s.shapeType })));

    } catch (error) {

      console.error('Error loading shapes:', error);

    }

  }, [projectId]);

  // Auto-create shapes from building sections data (from assessor)
  const autoCreateBuildingShapes = useCallback(() => {
    if (!parcelData?.buildingSections || !Array.isArray(parcelData.buildingSections) || parcelData.buildingSections.length === 0) {
      console.log('⚠️ No building sections to create shapes from');
      toast.info('No building sections data available');
      return;
    }

    if (!map.current || !drawLayer.current) {
      console.error('❌ Map or draw layer not initialized');
      return;
    }

    if (!boundaryCoords || boundaryCoords.length === 0) {
      console.error('❌ No property boundary to use as reference');
      toast.error('Property boundary must be loaded first');
      return;
    }

    const sections = parcelData.buildingSections as Array<{
      name: string;
      sqft: number;
      dimensions?: string;
      width?: number;
      length?: number;
      type: string;
    }>;

    console.log(`🏗️ Creating ${sections.length} building shapes from assessor data...`);

    // Calculate property center
    const latSum = boundaryCoords.reduce((sum, coord) => sum + coord[0], 0);
    const lngSum = boundaryCoords.reduce((sum, coord) => sum + coord[1], 0);
    const centerLat = latSum / boundaryCoords.length;
    const centerLng = lngSum / boundaryCoords.length;

    const newShapes: DrawnShape[] = [];

    sections.forEach((section, index) => {
      let width, height;

      // Try to parse dimensions if provided
      if (section.dimensions) {
        const match = section.dimensions.match(/(\d+\.?\d*)\s*[x×]\s*(\d+\.?\d*)/i);
        if (match) {
          width = parseFloat(match[1]);
          height = parseFloat(match[2]);
        }
      }

      // Use explicit width/length if available
      if (section.width && section.length) {
        width = section.width;
        height = section.length;
      }

      // Default to square based on sqft if no dimensions
      if (!width || !height) {
        const side = Math.sqrt(section.sqft);
        width = height = side;
      }

      // Convert feet to approximate lat/lng offset (rough conversion)
      const feetToLatLng = 0.00000274;
      const latOffset = (height * feetToLatLng) / 2;
      const lngOffset = (width * feetToLatLng) / 2;

      // Offset each shape slightly so they're not all stacked
      const offsetMultiplier = index * 0.00002;

      const bounds: L.LatLngBoundsExpression = [
        [centerLat - latOffset + offsetMultiplier, centerLng - lngOffset + offsetMultiplier],
        [centerLat + latOffset + offsetMultiplier, centerLng + lngOffset + offsetMultiplier]
      ];

      const rectangle = L.rectangle(bounds, {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.2,
        weight: 2,
        interactive: true
      });

      rectangle.addTo(drawLayer.current!);

      // Create dimension labels
      const coords: [number, number][] = rectangle.getLatLngs()[0] as any;
      const labelResult = createDimensionLabels(coords);
      const dimensionLabels = labelResult.labels;

      // Add labels to map
      dimensionLabels.forEach(label => drawLayer.current!.addLayer(label));

      // Calculate area and perimeter for the shape
      const geoJSON = rectangle.toGeoJSON();
      const closedCoords = geoJSON.geometry.coordinates.map((ring: any[]) => ensureClosedPolygon(ring));
      const polygon = turf.polygon(closedCoords);
      const areaMeters = turf.area(polygon);
      const areaSqFt = Math.round(areaMeters * 10.764);
      const perimeterMeters = turf.length(turf.polygonToLine(polygon), { units: 'meters' });
      const perimeterFeet = Math.round(perimeterMeters * 3.28084);

      const shapeData = {
        id: `temp-${Date.now()}-${index}`,
        name: `${section.name}: ${section.sqft.toLocaleString()} sf`,
        area: areaSqFt,
        perimeter: perimeterFeet,
        layer: rectangle,
        dimensionLabels: dimensionLabels,
        shapeType: 'rectangle',
        rotationAngle: 0
      };

      newShapes.push(shapeData);

      console.log(`✅ Created shape: ${shapeData.name} (${width.toFixed(1)}' x ${height.toFixed(1)}')`);
    });

    // Update state with new shapes
    setDrawnShapes(prev => [...prev, ...newShapes]);
    setAutoCreatedBuildingSections(true);

    toast.success(`Created ${newShapes.length} building shapes from assessor data`);
    console.log(`✅ Auto-created ${newShapes.length} building shapes`);
  }, [parcelData, map.current, drawLayer.current, boundaryCoords]);


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

      editable: true,

    });



    L.control.zoom({ position: 'topright' }).addTo(map.current);

    // Add click handler to deselect shapes when clicking on map background
    map.current.on('click', (e: L.LeafletMouseEvent) => {
      // Only deselect if clicking directly on the map (not on a shape)
      // The shape click handlers will handle selection
      setSelectedShapeId(null);
    });

    // Add mouse handlers for space+drag panning cursor feedback
    map.current.on('mousedown', () => {
      if (isSpacePressedRef.current) {
        setIsSpaceDragging(true);
        isSpaceDraggingRef.current = true;
        if (map.current) {
          map.current.getContainer().style.cursor = 'grabbing';
        }
      }
    });

    map.current.on('mouseup', () => {
      if (isSpacePressedRef.current && isSpaceDraggingRef.current) {
        setIsSpaceDragging(false);
        isSpaceDraggingRef.current = false;
        if (map.current) {
          map.current.getContainer().style.cursor = 'grab';
        }
      }
    });

    // Handle cursor when dragging actually starts/ends
    map.current.on('dragstart', () => {
      if (isSpacePressedRef.current && map.current) {
        map.current.getContainer().style.cursor = 'grabbing';
      }
    });

    map.current.on('dragend', () => {
      if (isSpacePressedRef.current && map.current) {
        map.current.getContainer().style.cursor = 'grab';
      }
    });


    satelliteLayer.current = L.tileLayer(

      'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',

      {

        attribution: '© Google',

        maxZoom: 22,

        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']

      }

    );



    streetLayer.current = L.tileLayer(

      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

      {

        attribution: '© OpenStreetMap contributors',

        maxZoom: 19,

        subdomains: ['a', 'b', 'c']

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
            fillOpacity: 0.3,
            interactive: true
          }
        },
        rectangle: {
          shapeOptions: {
            color: '#4A90E2',
            fillColor: '#4A90E2',
            fillOpacity: 0.3,
            interactive: true
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
      console.log('🗺️ Processing parcel boundary coordinates:', {
        rawData: boundaryCoords,
        isNested: Array.isArray(boundaryCoords[0]) && Array.isArray(boundaryCoords[0][0])
      });

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

      // Validate all coordinates
      const invalidCoords = coordsWithoutDupe.filter(coord =>
        !isFinite(coord[0]) || !isFinite(coord[1])
      );

      if (invalidCoords.length > 0) {
        console.error('❌ Found invalid parcel coordinates:', invalidCoords);
      } else {
        console.log('✅ All parcel coordinates valid:', {
          count: coordsWithoutDupe.length,
          sample: coordsWithoutDupe[0]
        });
      }

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
    // Only load shapes ONCE per page load - prevent multiple loads
    if (map.current && drawLayer.current && projectId && !shapesLoadedRef.current) {
      shapesLoadedRef.current = true;
      console.log('🔵 Loading shapes from database - ONCE');
      loadShapesFromDatabase();
    }
  }, [projectId, map.current, drawLayer.current]); // Load when dependencies are ready

  // Selection handles effect - create handles when shape is selected
  useEffect(() => {
    if (!selectedShapeId || !isEditShapesMode) {
      // Clear any existing handles
      if (map.current) {
        map.current.eachLayer((layer: any) => {
          if (layer._isSelectionHandle) {
            map.current!.removeLayer(layer);
          }
        });
      }
      return;
    }

    // Find the selected shape
    const selectedShape = drawnShapes.find(s => s.id === selectedShapeId);
    if (!selectedShape || !map.current) return;

    const bounds = selectedShape.layer.getBounds();

    // Calculate handle positions (slightly outside bounds)
    const handleOffset = 0.00003; // About 10 feet offset

    // Delete handle - top-left corner, offset outside
    const deletePos: L.LatLngExpression = [
      bounds.getNorth() + handleOffset,
      bounds.getWest() - handleOffset
    ];
    const deleteIcon = L.divIcon({
      className: 'delete-handle',
      html: `<div style="
        width: 24px;
        height: 24px;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const deleteHandle = L.marker(deletePos, { icon: deleteIcon, interactive: true });
    deleteHandle.on('click', () => {
      deleteShape(selectedShapeId);
    });
    (deleteHandle as any)._isSelectionHandle = true;
    deleteHandle.addTo(map.current);

    // Rotation handle - top-right corner, offset outside
    const rotatePos: L.LatLngExpression = [
      bounds.getNorth() + handleOffset,
      bounds.getEast() + handleOffset
    ];
    const rotateIcon = L.divIcon({
      className: 'rotation-handle',
      html: `<div style="
        width: 24px;
        height: 24px;
        background: #3b82f6;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: grab;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const rotateHandle = L.marker(rotatePos, {
      icon: rotateIcon,
      draggable: false  // NOT draggable!
    });

    // Implement rotation by dragging
    let isRotating = false;
    let startAngle = 0;
    let currentRotation = (selectedShape as any).properties?.rotation || 0;

    rotateHandle.on('mousedown', (e: L.LeafletMouseEvent) => {
      isRotating = true;
      const center = selectedShape.layer.getBounds().getCenter();
      startAngle = Math.atan2(
        e.latlng.lng - center.lng,
        e.latlng.lat - center.lat
      ) * (180 / Math.PI);

      // Disable map dragging
      if (map.current) {
        map.current.dragging.disable();
      }

      L.DomEvent.stopPropagation(e);
    });

    // Add map-level handlers for rotation
    if (map.current) {
      const handleRotate = (e: L.LeafletMouseEvent) => {
        if (!isRotating) return;

        const center = selectedShape.layer.getBounds().getCenter();
        const currentAngle = Math.atan2(
          e.latlng.lng - center.lng,
          e.latlng.lat - center.lat
        ) * (180 / Math.PI);

        const rotation = currentRotation + (currentAngle - startAngle);

        // Apply rotation via CSS transform
        const element = (selectedShape.layer as any)._path;
        if (element) {
          const centerPixel = map.current!.latLngToContainerPoint(center);
          element.style.transformOrigin = `${centerPixel.x}px ${centerPixel.y}px`;
          element.style.transform = `rotate(${rotation}deg)`;
        }

        // Update handle position to follow rotation
        const handleRadius = 0.00004;
        const angleRad = (rotation + 45) * (Math.PI / 180); // 45deg offset for top-right
        const newHandlePos: L.LatLngExpression = [
          center.lat + handleRadius * Math.cos(angleRad),
          center.lng + handleRadius * Math.sin(angleRad)
        ];
        rotateHandle.setLatLng(newHandlePos);
      };

      const handleRotateEnd = async () => {
        if (!isRotating) return;

        isRotating = false;

        // Re-enable map dragging
        if (map.current) {
          map.current.dragging.enable();
        }

        // Calculate final rotation
        const center = selectedShape.layer.getBounds().getCenter();
        const finalHandlePos = rotateHandle.getLatLng();
        const finalAngle = Math.atan2(
          finalHandlePos.lng - center.lng,
          finalHandlePos.lat - center.lat
        ) * (180 / Math.PI);
        const finalRotation = currentRotation + (finalAngle - startAngle);

        // Save to database
        try {
          await fetch(`/api/projects/${projectId}/shapes/${selectedShapeId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              properties: {
                ...(selectedShape as any).properties,
                rotation: finalRotation
              }
            })
          });
          console.log('✅ Rotation saved:', finalRotation);
        } catch (error) {
          console.error('❌ Error saving rotation:', error);
        }
      };

      map.current.on('mousemove', handleRotate);
      map.current.on('mouseup', handleRotateEnd);

      // Store for cleanup
      (rotateHandle as any)._rotateHandlers = { handleRotate, handleRotateEnd };
    }

    (rotateHandle as any)._isSelectionHandle = true;
    rotateHandle.addTo(map.current);

    // Cleanup function
    return () => {
      if (map.current) {
        // Remove selection handles
        map.current.eachLayer((layer: any) => {
          if (layer._isSelectionHandle) {
            // Clean up rotation handlers if they exist
            if (layer._rotateHandlers) {
              const { handleRotate, handleRotateEnd } = layer._rotateHandlers;
              map.current!.off('mousemove', handleRotate);
              map.current!.off('mouseup', handleRotateEnd);
            }
            map.current!.removeLayer(layer);
          }
        });
      }
    };

  }, [selectedShapeId, isEditShapesMode, drawnShapes, projectId, map.current]);

  // Measurement mode effect
  useEffect(() => {
    if (!map.current) return;

    if (mode === 'measure') {
      // Enable measurement mode
      map.current.getContainer().style.cursor = 'crosshair';

      if (measurementType === 'line') {
        // Line measurement - only allow 2 points
        const handleMapClick = (e: L.LeafletMouseEvent) => {
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
        // Polyline measurement - allow multiple points
        const handleMapClick = (e: L.LeafletMouseEvent) => {
          const newPoint = e.latlng;
          setPolylinePoints(prev => [...prev, newPoint]);

          // Add marker
          const marker = L.circleMarker([newPoint.lat, newPoint.lng], {
            radius: 5,
            fillColor: 'white',
            fillOpacity: 1,
            color: '#00BCD4',
            weight: 2
          }).addTo(map.current!);

          polylineMarkers.current.push(marker);

          // If we have at least 2 points, draw line segment and show distance
          setPolylinePoints(points => {
            if (points.length >= 2) {
              const lastTwo = points.slice(-2);
              const line = L.polyline(lastTwo, {
                color: '#00BCD4',
                weight: 3,
                dashArray: '5, 10'
              }).addTo(map.current!);

              polylineLines.current.push(line);

              // Calculate distance for this segment
              const distance = map.current!.distance(lastTwo[0], lastTwo[1]);
              const distanceFeet = distance * 3.28084;
              const midLat = (lastTwo[0].lat + lastTwo[1].lat) / 2;
              const midLng = (lastTwo[0].lng + lastTwo[1].lng) / 2;

              // Format distance in feet/inches
              const feet = Math.floor(distanceFeet);
              const inches = Math.round((distanceFeet - feet) * 12);
              const formattedDistance = inches > 0 ? `${feet}' ${inches}"` : `${feet}'`;

              // Add segment distance label
              const label = L.marker([midLat, midLng], {
                icon: L.divIcon({
                  className: 'polyline-segment-label',
                  html: `<div style="
                    background: linear-gradient(to bottom, #ffffff, #f8fafc);
                    border: 1.5px solid rgba(0, 188, 212, 0.5);
                    border-radius: 6px;
                    padding: 3px 8px;
                    font-size: 11px;
                    font-weight: 500;
                    color: #00838F;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                  ">${formattedDistance}</div>`,
                  iconSize: [60, 22],
                  iconAnchor: [30, 11]
                })
              }).addTo(map.current!);

              polylineLabels.current.push(label);
            }
            return points;
          });
        };

        const handleMapDoubleClick = (e: L.LeafletMouseEvent) => {
          e.originalEvent.preventDefault();
          // Double-click finishes the polyline
          // The finish function will be called from the button
        };

        const handleMouseMove = (e: L.LeafletMouseEvent) => {
          setPolylinePreviewPoint(e.latlng);

          // Update preview line
          if (polylinePoints.length > 0) {
            const lastPoint = polylinePoints[polylinePoints.length - 1];

            if (polylinePreviewLine.current) {
              polylinePreviewLine.current.remove();
            }

            polylinePreviewLine.current = L.polyline([lastPoint, e.latlng], {
              color: '#00BCD4',
              weight: 2,
              dashArray: '3, 6',
              opacity: 0.5
            }).addTo(map.current!);
          }
        };

        map.current.on('click', handleMapClick);
        map.current.on('dblclick', handleMapDoubleClick);
        map.current.on('mousemove', handleMouseMove);

        return () => {
          map.current?.off('click', handleMapClick);
          map.current?.off('dblclick', handleMapDoubleClick);
          map.current?.off('mousemove', handleMouseMove);
          map.current!.getContainer().style.cursor = '';

          if (polylinePreviewLine.current) {
            polylinePreviewLine.current.remove();
            polylinePreviewLine.current = null;
          }
        };
      }
    } else {
      // Clear measurements when leaving measure mode
      clearMeasurements();
    }
  }, [mode, measurementType]);

  // Polyline keyboard shortcuts
  useEffect(() => {
    if (mode !== 'measure' || measurementType !== 'polyline') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && polylinePoints.length >= 2) {
        e.preventDefault();
        finishPolyline();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        clearMeasurements();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mode, measurementType, polylinePoints]);

  // DEBUG: Track Move Shapes mode state changes
  useEffect(() => {
    console.log('🔄 STATE CHANGE: isEditingShapes =', isEditingShapes);
  }, [isEditingShapes]);

  // DEBUG: Track Edit Shapes mode state changes
  useEffect(() => {
    console.log('🔄 STATE CHANGE: isEditingShapesVertices =', isEditingShapesVertices);
  }, [isEditingShapesVertices]);

  // Control measurement visibility (controlled by Labels toggle)
  useEffect(() => {
    if (!map.current) return;

    // Handle simple line measurements
    savedMeasurementLayers.current.forEach((layers) => {
      if (showDimensionLabels) {
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

    // Handle polyline measurements (markers, lines, labels)
    savedPolylineLayers.current.forEach(({ markers, lines, labels }) => {
      if (showDimensionLabels) {
        markers.forEach(marker => {
          if (!map.current!.hasLayer(marker)) {
            map.current!.addLayer(marker);
          }
        });
        lines.forEach(line => {
          if (!map.current!.hasLayer(line)) {
            map.current!.addLayer(line);
          }
        });
        labels.forEach(label => {
          if (!map.current!.hasLayer(label)) {
            map.current!.addLayer(label);
          }
        });
      } else {
        markers.forEach(marker => marker.remove());
        lines.forEach(line => line.remove());
        labels.forEach(label => label.remove());
      }
    });
  }, [showDimensionLabels]);

  // Control drawn shapes visibility
  useEffect(() => {
    if (!map.current || !drawLayer.current) return;

    drawnShapes.forEach((shape) => {
      if (showDrawnShapes) {
        // Add shape layer if not on map
        if (!drawLayer.current!.hasLayer(shape.layer)) {
          drawLayer.current!.addLayer(shape.layer);
        }
        // Add dimension labels if both shapes and labels are enabled
        if (showDimensionLabels) {
          shape.dimensionLabels.forEach((label: any) => {
            if (!drawLayer.current!.hasLayer(label)) {
              drawLayer.current!.addLayer(label);
            }
          });
        }
      } else {
        // Remove from drawLayer instead of calling remove()
        if (drawLayer.current!.hasLayer(shape.layer)) {
          drawLayer.current!.removeLayer(shape.layer);
        }
        // Remove dimension labels when shapes are hidden
        shape.dimensionLabels.forEach((label: any) => {
          if (drawLayer.current!.hasLayer(label)) {
            drawLayer.current!.removeLayer(label);
          }
        });
      }
    });
  }, [showDrawnShapes, showDimensionLabels, drawnShapes]);

  // Control dimension labels visibility (independent of shapes)
  useEffect(() => {
    if (!map.current || !drawLayer.current) return;

    drawnShapes.forEach((shape) => {
      // Only control labels if shapes are visible
      if (showDrawnShapes) {
        if (showDimensionLabels) {
          // Add dimension labels if not on map
          shape.dimensionLabels.forEach((label: any) => {
            if (!drawLayer.current!.hasLayer(label)) {
              drawLayer.current!.addLayer(label);
            }
          });
        } else {
          // Remove dimension labels
          shape.dimensionLabels.forEach((label: any) => {
            if (drawLayer.current!.hasLayer(label)) {
              drawLayer.current!.removeLayer(label);
            }
          });
        }
      }
    });
  }, [showDimensionLabels, showDrawnShapes, drawnShapes]);

  // Apply highlight to selected shape
  useEffect(() => {
    if (!map.current || !drawLayer.current) return;

    // Remove existing rotation handle
    if (rotationHandle) {
      if (map.current?.hasLayer(rotationHandle)) {
        map.current.removeLayer(rotationHandle);
      }
      setRotationHandle(null);
    }
    if (rotationLine) {
      if (map.current?.hasLayer(rotationLine)) {
        map.current.removeLayer(rotationLine);
      }
      setRotationLine(null);
    }

    drawnShapes.forEach((shape) => {
      if (!shape.layer || !shape.layer.setStyle) return;

      if (shape.id === selectedShapeId) {
        // Apply amber/yellow highlight to selected shape
        shape.layer.setStyle({
          color: '#f59e0b', // Amber-500
          weight: 4,
          fillColor: '#fbbf24', // Amber-400
          fillOpacity: 0.35,
          // Add subtle shadow effect using Leaflet's className
          className: 'selected-shape-highlight'
        });

        // Bring to front
        if (shape.layer.bringToFront) {
          shape.layer.bringToFront();
        }

        // Create rotation handle for selected shape (skip circles)
        if (shape.shapeType !== 'circle') {
          console.log('🔄 Creating rotation handle for selected shape:', shape.name);
          createRotationHandle(shape);
        }
      } else {
        // Restore original red style (matching createShapeAtCenter)
        shape.layer.setStyle({
          color: '#ef4444',      // Red (matching creation)
          weight: 2,
          fillColor: '#ef4444',
          fillOpacity: 0.1,      // Matching creation fillOpacity
          className: ''
        });
      }
    });
  }, [selectedShapeId, drawnShapes]);

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

    // Handle view mode changes
    if (viewMode === 'clean') {
      // Remove both layers in clean slate mode
      map.current.removeLayer(satelliteLayer.current);
      map.current.removeLayer(streetLayer.current);
    } else if (viewMode === 'hybrid') {
      // Show OpenStreetMap street layer in hybrid mode
      map.current.removeLayer(satelliteLayer.current);
      if (!map.current.hasLayer(streetLayer.current)) {
        map.current.addLayer(streetLayer.current);
      }
    } else {
      // Normal satellite/street switching in satellite mode
      if (activeLayer === 'satellite') {
        map.current.removeLayer(streetLayer.current);
        if (!map.current.hasLayer(satelliteLayer.current)) {
          map.current.addLayer(satelliteLayer.current);
        }
        satelliteLayer.current.setOpacity(1.0);
      } else {
        map.current.removeLayer(satelliteLayer.current);
        if (!map.current.hasLayer(streetLayer.current)) {
          map.current.addLayer(streetLayer.current);
        }
      }
    }
  }, [activeLayer, viewMode]);

  // Update parcel boundary styling when viewMode changes
  useEffect(() => {
    if (boundaryCoords.length > 0) {
      addParcelLayer(boundaryCoords);
    }
  }, [viewMode]);

  // Create/remove boundary and buildable area dimension labels
  useEffect(() => {
    if (boundaryCoords.length > 0) {
      createBoundaryDimensionLabels();
      createBuildableAreaDimensionLabels();
    } else {
      // Remove labels when no boundary coords
      boundaryDimensionLabels.current.forEach(marker => {
        if (map.current) {
          map.current.removeLayer(marker);
        }
      });
      boundaryDimensionLabels.current = [];
    }

    // Cleanup on unmount
    return () => {
      boundaryDimensionLabels.current.forEach(marker => {
        if (map.current) {
          map.current.removeLayer(marker);
        }
      });
      boundaryDimensionLabels.current = [];
    };
  }, [viewMode, boundaryCoords, setbacks]);

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
      // Blue solid boundary in all modes for professional CAD-like appearance
      displayPolygon.current = L.polygon(validCoords, {
        color: '#3b82f6',  // Blue color
        weight: 3,
        fillOpacity: 0,
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
      const marker = L.marker([coord.lat, coord.lng], {
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

  // Keyboard shortcuts - Delete key to remove selected shape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete or Backspace key
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShapeId) {
        e.preventDefault();
        deleteShape(selectedShapeId);
        setSelectedShapeId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapeId]);

  // Keyboard shortcuts - Copy/Paste shapes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+C / Ctrl+C - Copy selected shape
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && selectedShapeId) {
        e.preventDefault();
        copySelectedShape();
      }

      // Cmd+V / Ctrl+V - Paste copied shape
      if ((e.metaKey || e.ctrlKey) && e.key === 'v' && copiedShape) {
        e.preventDefault();
        pasteShape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapeId, copiedShape]);

  // Clear clipboard when changing modes or projects
  useEffect(() => {
    setCopiedShape(null);
  }, [mode, projectId]);

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

    // Calculate building area
    try {
      const areaMeters = turf.area(footprint);
      const areaSqFt = areaMeters * 10.7639;
      setBuildingArea(areaSqFt);
      console.log('>>> Building area calculated:', areaSqFt.toFixed(0), 'sq ft');
    } catch (error) {
      console.error('Error calculating building area:', error);
      setBuildingArea(0);
    }
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

        // Setback drag handles removed - dimension labels now shown in clean/hybrid modes

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
    // Remove all line measurement markers
    measurementMarkers.current.forEach(marker => {
      if (map.current) {
        map.current.removeLayer(marker);
      }
    });
    measurementMarkers.current = [];

    // Remove all line measurement lines
    measurementLines.current.forEach(line => {
      if (map.current) {
        map.current.removeLayer(line);
      }
    });
    measurementLines.current = [];

    // Remove all line measurement labels
    measurementLabels.current.forEach(label => {
      if (map.current) {
        map.current.removeLayer(label);
      }
    });
    measurementLabels.current = [];

    // Remove all polyline markers
    polylineMarkers.current.forEach(marker => {
      if (map.current) {
        map.current.removeLayer(marker);
      }
    });
    polylineMarkers.current = [];

    // Remove all polyline lines
    polylineLines.current.forEach(line => {
      if (map.current) {
        map.current.removeLayer(line);
      }
    });
    polylineLines.current = [];

    // Remove all polyline labels
    polylineLabels.current.forEach(label => {
      if (map.current) {
        map.current.removeLayer(label);
      }
    });
    polylineLabels.current = [];

    // Remove polyline preview line
    if (polylinePreviewLine.current) {
      polylinePreviewLine.current.remove();
      polylinePreviewLine.current = null;
    }

    // Clear state
    setMeasurementPoints([]);
    setPolylinePoints([]);
    setPolylinePreviewPoint(null);
  };

  const finishPolyline = async () => {
    if (polylinePoints.length < 2) {
      toast.error('Need at least 2 points to finish polyline');
      return;
    }

    try {
      // Calculate total distance and segment distances
      const segmentDistances: number[] = [];
      let totalDistanceInFeet = 0;

      for (let i = 0; i < polylinePoints.length - 1; i++) {
        const point1 = polylinePoints[i];
        const point2 = polylinePoints[i + 1];

        const from = turf.point([point1.lng, point1.lat]);
        const to = turf.point([point2.lng, point2.lat]);
        const distanceInFeet = turf.distance(from, to, { units: 'miles' }) * 5280;

        segmentDistances.push(distanceInFeet);
        totalDistanceInFeet += distanceInFeet;
      }

      // Convert points to plain objects for JSON serialization
      const points = polylinePoints.map(p => ({ lat: p.lat, lng: p.lng }));

      // Save to database
      const response = await fetch(`/api/projects/${projectId}/measurements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          measurementType: 'polyline',
          points,
          totalDistance: totalDistanceInFeet,
          segmentDistances,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save measurement');
      }

      const { measurement } = await response.json();

      // Add to saved polylines state
      setSavedPolylines(prev => [...prev, {
        id: measurement.id,
        points,
        totalDistance: totalDistanceInFeet,
        segmentDistances,
      }]);

      toast.success(`Polyline measurement saved (${polylinePoints.length} points)`);

      // Clear polyline drawing
      clearMeasurements();
    } catch (error) {
      console.error('Error saving polyline:', error);
      toast.error('Failed to save polyline measurement');
    }
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

  const deletePolyline = async (id: string) => {
    try {
      // Delete from database
      const response = await fetch(`/api/projects/${projectId}/measurements/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete polyline');
      }

      // Remove from map
      const layers = savedPolylineLayers.current.get(id);
      if (layers && map.current) {
        layers.markers.forEach(m => map.current?.removeLayer(m));
        layers.lines.forEach(l => map.current?.removeLayer(l));
        layers.labels.forEach(lb => map.current?.removeLayer(lb));
      }
      savedPolylineLayers.current.delete(id);

      // Remove from state
      setSavedPolylines(prev => prev.filter(p => p.id !== id));

      toast.success('Polyline measurement deleted');
    } catch (error) {
      console.error('Error deleting polyline:', error);
      toast.error('Failed to delete polyline measurement');
    }
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
          metric: false,
          feet: true,
          guidelineDistance: 20,
          shapeOptions: {
            color: '#a855f7',
            weight: 3,
            fillColor: '#4A90E2',
            fillOpacity: 0.3
          }
        } : false,
        rectangle: tool === 'rectangle' ? {
          showArea: true,
          metric: false,
          feet: true,
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
          const text = `Diameter: ${formatFeetInches(diameterFeet)}`;

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

    // For rectangles, create custom edge labels and area tooltip
    if (tool === 'rectangle') {
      // Disable the default Leaflet Draw tooltip
      if ((handler as any)._tooltip) {
        (handler as any)._tooltip._container.style.display = 'none';
      }

      let customTooltip: any = null;
      let edgeLabels: L.Marker[] = [];
      let mouseMoveHandler: any = null;

      const showRectangleLabels = (e: L.LeafletMouseEvent) => {
        // Hide default tooltip if it appears
        if ((handler as any)._tooltip && (handler as any)._tooltip._container) {
          (handler as any)._tooltip._container.style.display = 'none';
        }

        if ((handler as any)._shape) {
          const bounds = (handler as any)._shape.getBounds();
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          const nw = bounds.getNorthWest();
          const se = bounds.getSouthEast();
          const center = bounds.getCenter();

          // Remove old edge labels
          edgeLabels.forEach(label => {
            if (map.current) {
              map.current.removeLayer(label);
            }
          });
          edgeLabels = [];

          // Calculate all 4 edges
          const edges = [
            { p1: sw, p2: se, label: 'bottom' },  // Bottom edge
            { p1: se, p2: ne, label: 'right' },   // Right edge
            { p1: ne, p2: nw, label: 'top' },     // Top edge
            { p1: nw, p2: sw, label: 'left' }     // Left edge
          ];

          edges.forEach(edge => {
            const point1 = turf.point([edge.p1.lng, edge.p1.lat]);
            const point2 = turf.point([edge.p2.lng, edge.p2.lat]);
            const distanceMeters = turf.distance(point1, point2, { units: 'meters' });
            const distanceFeet = distanceMeters * 3.28084;

            // Calculate midpoint
            const midLat = (edge.p1.lat + edge.p2.lat) / 2;
            const midLng = (edge.p1.lng + edge.p2.lng) / 2;

            // Create edge label
            const edgeLabel = L.marker([midLat, midLng], {
              icon: L.divIcon({
                className: 'dimension-label',
                html: `
                  <div style="
                    background: linear-gradient(to bottom, #ffffff, #f8fafc);
                    border: 1.5px solid rgba(59, 130, 246, 0.5);
                    border-radius: 6px;
                    padding: 3px 8px;
                    font-size: 11px;
                    font-weight: 500;
                    color: #1e40af;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                  ">${formatFeetInches(distanceFeet)}</div>
                `,
                iconSize: [60, 22],
                iconAnchor: [30, 11]
              }),
              interactive: false
            });

            edgeLabel.addTo(map.current!);
            edgeLabels.push(edgeLabel);
          });

          // Calculate area in square feet
          const widthMeters = turf.distance(
            turf.point([sw.lng, sw.lat]),
            turf.point([se.lng, se.lat]),
            { units: 'meters' }
          );
          const lengthMeters = turf.distance(
            turf.point([sw.lng, sw.lat]),
            turf.point([nw.lng, nw.lat]),
            { units: 'meters' }
          );
          const areaMeters = widthMeters * lengthMeters;
          const areaSqFt = areaMeters * 10.764;

          // Convert to feet for size check
          const widthFeet = widthMeters * 3.28084;
          const lengthFeet = lengthMeters * 3.28084;

          // Detect small rectangles to avoid label overlap
          const isSmallRectangle = areaSqFt < 500 || widthFeet < 20 || lengthFeet < 20;

          // Show only area in center tooltip
          const text = `${Math.round(areaSqFt).toLocaleString()} sq ft`;

          // Position tooltip to avoid overlapping edge labels on small rectangles
          let tooltipPosition = center;
          let tooltipOffset: [number, number] = [0, -10];
          let tooltipDirection: 'top' | 'bottom' | 'left' | 'right' = 'top';

          if (isSmallRectangle) {
            // For small rectangles, position tooltip above the top edge
            // This keeps it away from all edge labels
            tooltipPosition = L.latLng(
              ne.lat + (ne.lat - center.lat) * 0.8,
              center.lng
            );
            tooltipOffset = [0, -5];
            tooltipDirection = 'top';
          }

          if (!customTooltip) {
            customTooltip = L.tooltip({
              permanent: false,
              direction: tooltipDirection,
              offset: tooltipOffset,
              className: 'custom-draw-tooltip'
            }).setLatLng(tooltipPosition).setContent(text).addTo(map.current!);
          } else {
            // Remove old tooltip and create new one with updated position/direction
            map.current!.removeLayer(customTooltip);
            customTooltip = L.tooltip({
              permanent: false,
              direction: tooltipDirection,
              offset: tooltipOffset,
              className: 'custom-draw-tooltip'
            }).setLatLng(tooltipPosition).setContent(text).addTo(map.current!);
          }
        }
      };

      mouseMoveHandler = (e: L.LeafletMouseEvent) => {
        if ((handler as any)._shape) {
          showRectangleLabels(e);
        }
      };

      map.current.on('mousemove', mouseMoveHandler);

      // Also listen to the handler's own events
      const checkForTooltip = setInterval(() => {
        if ((handler as any)._tooltip && (handler as any)._tooltip._container) {
          (handler as any)._tooltip._container.style.display = 'none';
        }
      }, 50);

      // Cleanup when drawing stops
      const originalDisable = handler.disable.bind(handler);
      handler.disable = function() {
        clearInterval(checkForTooltip);

        // Remove edge labels
        edgeLabels.forEach(label => {
          if (map.current) {
            map.current.removeLayer(label);
          }
        });
        edgeLabels = [];

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

    // For polygons, create custom edge labels as vertices are added
    if (tool === 'polygon') {
      let edgeLabels: L.Marker[] = [];
      let liveEdgeLabel: L.Marker | null = null;
      let areaTooltip: any = null;
      let guideLines: L.Polyline[] = [];
      let snappedToGuide = false;
      let activeGuideLine: L.Polyline | null = null;

      // Snapping threshold in pixels
      const SNAP_THRESHOLD = 8;

      // Helper to convert lat/lng distance to pixel distance
      const getPixelDistance = (latlng1: L.LatLng, latlng2: L.LatLng): number => {
        if (!map.current) return Infinity;
        const point1 = map.current.latLngToContainerPoint(latlng1);
        const point2 = map.current.latLngToContainerPoint(latlng2);
        return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
      };

      // Helper to snap point to line
      const snapToLine = (point: L.LatLng, lineStart: L.LatLng, lineEnd: L.LatLng, isHorizontal: boolean, isVertical: boolean): { snapped: L.LatLng; distance: number } | null => {
        if (!map.current) return null;

        if (isHorizontal) {
          // Snap to horizontal line (same latitude)
          const snappedPoint = L.latLng(lineStart.lat, point.lng);
          const distance = getPixelDistance(point, snappedPoint);
          return { snapped: snappedPoint, distance };
        } else if (isVertical) {
          // Snap to vertical line (same longitude)
          const snappedPoint = L.latLng(point.lat, lineStart.lng);
          const distance = getPixelDistance(point, snappedPoint);
          return { snapped: snappedPoint, distance };
        } else {
          // Snap to perpendicular line - calculate closest point on line
          const turfPoint = turf.point([point.lng, point.lat]);
          const turfLine = turf.lineString([[lineStart.lng, lineStart.lat], [lineEnd.lng, lineEnd.lat]]);
          const snappedTurf = turf.nearestPointOnLine(turfLine, turfPoint);
          const snappedPoint = L.latLng(snappedTurf.geometry.coordinates[1], snappedTurf.geometry.coordinates[0]);
          const distance = getPixelDistance(point, snappedPoint);
          return { snapped: snappedPoint, distance };
        }
      };

      const updatePolygonLabels = (mouseLatLng?: L.LatLng) => {
        // Remove old guide lines
        guideLines.forEach(line => {
          if (map.current) {
            map.current.removeLayer(line);
          }
        });
        guideLines = [];
        snappedToGuide = false;
        activeGuideLine = null;

        // Remove old edge labels
        edgeLabels.forEach(label => {
          if (map.current) {
            map.current.removeLayer(label);
          }
        });
        edgeLabels = [];

        // Remove old live edge label
        if (liveEdgeLabel && map.current) {
          map.current.removeLayer(liveEdgeLabel);
          liveEdgeLabel = null;
        }

        // Get current vertices from the polygon being drawn
        const markers = (handler as any)._markers;
        if (!markers || markers.length < 1) return;

        // Get the latlngs of all placed vertices
        const vertices = markers.map((marker: any) => marker.getLatLng());

        // Get map bounds for extending guide lines
        const bounds = map.current!.getBounds();
        const north = bounds.getNorth();
        const south = bounds.getSouth();
        const east = bounds.getEast();
        const west = bounds.getWest();

        // Create horizontal and vertical guide lines through each vertex (CYAN)
        vertices.forEach((vertex: L.LatLng) => {
          // Horizontal line (constant latitude)
          const hLine = L.polyline(
            [[vertex.lat, west], [vertex.lat, east]],
            {
              color: '#06b6d4',
              weight: 1,
              opacity: 0.5,
              dashArray: '5, 5',
              interactive: false
            }
          );
          hLine.addTo(map.current!);
          guideLines.push(hLine);

          // Vertical line (constant longitude)
          const vLine = L.polyline(
            [[north, vertex.lng], [south, vertex.lng]],
            {
              color: '#06b6d4',
              weight: 1,
              opacity: 0.5,
              dashArray: '5, 5',
              interactive: false
            }
          );
          vLine.addTo(map.current!);
          guideLines.push(vLine);
        });

        // Create perpendicular guide lines from midpoints of completed edges (MAGENTA)
        for (let i = 0; i < vertices.length - 1; i++) {
          const v1 = vertices[i];
          const v2 = vertices[i + 1];

          // Calculate midpoint
          const midLat = (v1.lat + v2.lat) / 2;
          const midLng = (v1.lng + v2.lng) / 2;

          // Calculate perpendicular direction
          const dx = v2.lng - v1.lng;
          const dy = v2.lat - v1.lat;

          // Perpendicular vector (rotate 90 degrees)
          const perpDx = -dy;
          const perpDy = dx;

          // Normalize and extend to map bounds
          const length = Math.sqrt(perpDx * perpDx + perpDy * perpDy);
          if (length > 0) {
            const normalizedPerpDx = perpDx / length;
            const normalizedPerpDy = perpDy / length;

            // Extend line far enough to cover viewport
            const extendDistance = Math.max(
              Math.abs(north - south),
              Math.abs(east - west)
            );

            const perpStart = L.latLng(
              midLat - normalizedPerpDy * extendDistance,
              midLng - normalizedPerpDx * extendDistance
            );
            const perpEnd = L.latLng(
              midLat + normalizedPerpDy * extendDistance,
              midLng + normalizedPerpDx * extendDistance
            );

            const perpLine = L.polyline(
              [perpStart, perpEnd],
              {
                color: '#a855f7',
                weight: 1,
                opacity: 0.4,
                dashArray: '3, 6',
                interactive: false
              }
            );
            perpLine.addTo(map.current!);
            guideLines.push(perpLine);
          }
        }

        // Apply cursor snapping if mouse position provided
        let snappedMouseLatLng = mouseLatLng;
        if (mouseLatLng && vertices.length > 0) {
          let closestSnap: { snapped: L.LatLng; distance: number; line: L.Polyline } | null = null;

          // Check horizontal guide lines
          vertices.forEach((vertex: L.LatLng) => {
            const hSnap = snapToLine(mouseLatLng,
              L.latLng(vertex.lat, west),
              L.latLng(vertex.lat, east),
              true, false);
            if (hSnap && hSnap.distance < SNAP_THRESHOLD) {
              if (!closestSnap || hSnap.distance < closestSnap.distance) {
                const lineIndex = vertices.indexOf(vertex) * 2; // Find corresponding guide line
                closestSnap = { ...hSnap, line: guideLines[lineIndex] };
              }
            }
          });

          // Check vertical guide lines
          vertices.forEach((vertex: L.LatLng) => {
            const vSnap = snapToLine(mouseLatLng,
              L.latLng(north, vertex.lng),
              L.latLng(south, vertex.lng),
              false, true);
            if (vSnap && vSnap.distance < SNAP_THRESHOLD) {
              if (!closestSnap || vSnap.distance < closestSnap.distance) {
                const lineIndex = vertices.indexOf(vertex) * 2 + 1; // Find corresponding guide line
                closestSnap = { ...vSnap, line: guideLines[lineIndex] };
              }
            }
          });

          // Check perpendicular guide lines
          for (let i = 0; i < vertices.length - 1; i++) {
            const v1 = vertices[i];
            const v2 = vertices[i + 1];
            const midLat = (v1.lat + v2.lat) / 2;
            const midLng = (v1.lng + v2.lng) / 2;

            const dx = v2.lng - v1.lng;
            const dy = v2.lat - v1.lat;
            const perpDx = -dy;
            const perpDy = dx;
            const length = Math.sqrt(perpDx * perpDx + perpDy * perpDy);

            if (length > 0) {
              const normalizedPerpDx = perpDx / length;
              const normalizedPerpDy = perpDy / length;
              const extendDistance = Math.max(Math.abs(north - south), Math.abs(east - west));

              const perpStart = L.latLng(
                midLat - normalizedPerpDy * extendDistance,
                midLng - normalizedPerpDx * extendDistance
              );
              const perpEnd = L.latLng(
                midLat + normalizedPerpDy * extendDistance,
                midLng + normalizedPerpDx * extendDistance
              );

              const perpSnap = snapToLine(mouseLatLng, perpStart, perpEnd, false, false);
              if (perpSnap && perpSnap.distance < SNAP_THRESHOLD) {
                if (!closestSnap || perpSnap.distance < closestSnap.distance) {
                  const lineIndex = vertices.length * 2 + i; // Perpendicular lines come after h/v lines
                  closestSnap = { ...perpSnap, line: guideLines[lineIndex] };
                }
              }
            }
          }

          // Apply snapping and highlight active guide
          if (closestSnap) {
            snappedMouseLatLng = closestSnap.snapped;
            snappedToGuide = true;
            activeGuideLine = closestSnap.line;

            // Highlight the active guide line
            closestSnap.line.setStyle({
              weight: 2,
              opacity: 0.9
            });
          }
        }

        // Calculate total perimeter so far to detect small shapes
        let totalPerimeterFeet = 0;
        const edgeLengths: number[] = [];
        for (let i = 0; i < vertices.length - 1; i++) {
          const v1 = vertices[i];
          const v2 = vertices[i + 1];
          const point1 = turf.point([v1.lng, v1.lat]);
          const point2 = turf.point([v2.lng, v2.lat]);
          const distanceMeters = turf.distance(point1, point2, { units: 'meters' });
          const distanceFeet = distanceMeters * 3.28084;
          totalPerimeterFeet += distanceFeet;
          edgeLengths.push(distanceFeet);
        }

        // Create edge labels for each completed edge (between placed vertices)
        for (let i = 0; i < vertices.length - 1; i++) {
          const v1 = vertices[i];
          const v2 = vertices[i + 1];

          // Calculate distance
          const point1 = turf.point([v1.lng, v1.lat]);
          const point2 = turf.point([v2.lng, v2.lat]);
          const distanceMeters = turf.distance(point1, point2, { units: 'meters' });
          const distanceFeet = distanceMeters * 3.28084;

          // Skip very short edges
          if (distanceFeet < 0.1) continue;

          // Calculate midpoint
          const midLat = (v1.lat + v2.lat) / 2;
          const midLng = (v1.lng + v2.lng) / 2;

          // Create edge label
          const edgeLabel = L.marker([midLat, midLng], {
            icon: L.divIcon({
              className: 'dimension-label',
              html: `
                <div style="
                  background: linear-gradient(to bottom, #ffffff, #f8fafc);
                  border: 1.5px solid rgba(59, 130, 246, 0.5);
                  border-radius: 6px;
                  padding: 3px 8px;
                  font-size: 11px;
                  font-weight: 500;
                  color: #1e40af;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
                  white-space: nowrap;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  backdrop-filter: blur(8px);
                  -webkit-backdrop-filter: blur(8px);
                ">${formatFeetInches(distanceFeet)}</div>
              `,
              iconSize: [60, 22],
              iconAnchor: [30, 11]
            }),
            interactive: false
          });

          edgeLabel.addTo(map.current!);
          edgeLabels.push(edgeLabel);
        }

        // Create live edge label (from last vertex to current mouse position)
        if (snappedMouseLatLng && vertices.length > 0) {
          const lastVertex = vertices[vertices.length - 1];

          // Calculate distance for live edge
          const point1 = turf.point([lastVertex.lng, lastVertex.lat]);
          const point2 = turf.point([snappedMouseLatLng.lng, snappedMouseLatLng.lat]);
          const distanceMeters = turf.distance(point1, point2, { units: 'meters' });
          const distanceFeet = distanceMeters * 3.28084;

          // Only show if edge is long enough
          if (distanceFeet >= 0.1) {
            // Calculate midpoint
            const midLat = (lastVertex.lat + snappedMouseLatLng.lat) / 2;
            const midLng = (lastVertex.lng + snappedMouseLatLng.lng) / 2;

            // Create live edge label with different styling based on snap state
            const labelColor = snappedToGuide ? '#10b981' : '#fbbf24'; // Green if snapped, amber if not
            const labelBg1 = snappedToGuide ? '#d1fae5' : '#fef3c7';
            const labelBg2 = snappedToGuide ? '#a7f3d0' : '#fde68a';
            const labelBorder = snappedToGuide ? 'rgba(16, 185, 129, 0.6)' : 'rgba(251, 191, 36, 0.6)';
            const labelText = snappedToGuide ? '#065f46' : '#92400e';

            liveEdgeLabel = L.marker([midLat, midLng], {
              icon: L.divIcon({
                className: 'dimension-label-live',
                html: `
                  <div style="
                    background: linear-gradient(to bottom, ${labelBg1}, ${labelBg2});
                    border: 1.5px solid ${labelBorder};
                    border-radius: 6px;
                    padding: 3px 8px;
                    font-size: 11px;
                    font-weight: 500;
                    color: ${labelText};
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                  ">${formatFeetInches(distanceFeet)}</div>
                `,
                iconSize: [60, 22],
                iconAnchor: [30, 11]
              }),
              interactive: false
            });

            liveEdgeLabel.addTo(map.current!);
          }
        }

        // Show area tooltip if we have at least 3 vertices (forming a polygon)
        if (vertices.length >= 3 && (handler as any)._poly) {
          try {
            const poly = (handler as any)._poly;
            const latlngs = poly.getLatLngs()[0];

            // Calculate area
            const coords = latlngs.map((ll: any) => [ll.lng, ll.lat]);
            coords.push(coords[0]); // Close the polygon
            const polygon = turf.polygon([coords]);
            const areaMeters = turf.area(polygon);
            const areaSqFt = areaMeters * 10.764;

            // Get center of polygon for tooltip
            const bounds = poly.getBounds();
            const center = bounds.getCenter();

            const text = `${Math.round(areaSqFt).toLocaleString()} sq ft`;

            if (!areaTooltip) {
              areaTooltip = L.tooltip({
                permanent: false,
                direction: 'top',
                offset: [0, -10],
                className: 'custom-draw-tooltip'
              }).setLatLng(center).setContent(text).addTo(map.current!);
            } else {
              areaTooltip.setLatLng(center).setContent(text);
            }
          } catch (err) {
            // Ignore errors during area calculation
          }
        }
      };

      // Update labels when a vertex is added
      map.current.on('draw:drawvertex', () => updatePolygonLabels());

      // Update labels on mouse move (for the live edge to cursor)
      const mouseMoveHandler = (e: L.LeafletMouseEvent) => {
        updatePolygonLabels(e.latlng);
      };
      map.current.on('mousemove', mouseMoveHandler);

      // Cleanup when drawing stops
      const originalDisable = handler.disable.bind(handler);
      handler.disable = function() {
        // Remove edge labels
        edgeLabels.forEach(label => {
          if (map.current) {
            map.current.removeLayer(label);
          }
        });
        edgeLabels = [];

        // Remove live edge label
        if (liveEdgeLabel && map.current) {
          map.current.removeLayer(liveEdgeLabel);
          liveEdgeLabel = null;
        }

        // Remove area tooltip
        if (areaTooltip && map.current) {
          map.current.removeLayer(areaTooltip);
          areaTooltip = null;
        }

        // Remove event listeners
        if (map.current) {
          map.current.off('draw:drawvertex');
          map.current.off('mousemove', mouseMoveHandler);
        }

        return originalDisable();
      };
    }


    setDrawingTool(tool);
    setIsDrawing(true);
    map.current.off(L.Draw.Event.CREATED);
    map.current.on(L.Draw.Event.CREATED, async (e: any) => {
      const layer = e.layer;
      const geoJSON = layer.toGeoJSON();
      
      try {
        let areaSqFt, perimeterFeet, coords, dimensionLabels;
        let isSmallShape = false;

        // Handle circles differently
        if (e.layerType === 'circle') {
          const radius = layer.getRadius(); // meters
          const radiusFeet = radius * 3.28084;
          const diameterFeet = radiusFeet * 2;
          areaSqFt = Math.PI * radiusFeet * radiusFeet;
          perimeterFeet = 2 * Math.PI * radiusFeet;

          // For circles, create a diameter label instead of edge labels
          const center = layer.getLatLng();

          // Validate center coordinates before creating marker
          if (!center || !isFinite(center.lat) || !isFinite(center.lng)) {
            console.error('❌ Invalid center coordinates for circle diameter label:', center);
            dimensionLabels = [];
          } else {
            dimensionLabels = [L.marker([center.lat, center.lng], {
            icon: L.divIcon({
              className: 'dimension-label',
              html: `<div style="background: linear-gradient(to bottom, #ffffff, #f8fafc); border: 1.5px solid rgba(59, 130, 246, 0.5); border-radius: 6px; padding: 3px 8px; font-size: 11px; font-weight: 500; color: #1e40af; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06); white-space: nowrap; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);">⌀ ${formatFeetInches(diameterFeet)}</div>`,
              iconSize: [60, 22],
              iconAnchor: [30, 11]
            }),
            interactive: false
          })];
          }
          // CRITICAL: Store circle as nested array [[lng, lat]]
          coords = [[center.lng, center.lat]];
          // Check if circle is small (diameter < 20 feet)
          isSmallShape = diameterFeet < 20;
        } else {
          // Handle polygons/rectangles
          // Ensure polygon coordinates are closed for turf.js
          const closedCoords = geoJSON.geometry.coordinates.map((ring: any[]) => ensureClosedPolygon(ring));
          const polygon = turf.polygon(closedCoords);
          const areaMeters = turf.area(polygon);
          areaSqFt = areaMeters * 10.764;

          const perimeterMeters = turf.length(turf.polygonToLine(polygon), { units: 'meters' });
          perimeterFeet = perimeterMeters * 3.28084;

          coords = layer.getLatLngs()[0].map((ll: any) => [ll.lat, ll.lng]);
          const labelResult = createDimensionLabels(coords);
          dimensionLabels = labelResult.labels;
          isSmallShape = labelResult.isSmallShape;
        }

        const shapeCount = drawnShapes.length + 1;
        const defaultName = 'Shape ' + shapeCount;

        // Keep the temporary drawing layer (don't create a new one)
        const shapeLayer = layer;  // Reuse the existing drawn layer
        drawLayer.current?.addLayer(shapeLayer);

        // Add dimension labels to the draw layer
        // For small shapes, initially hide labels (they'll show on hover)
        if (!isSmallShape) {
          dimensionLabels.forEach(label => drawLayer.current?.addLayer(label));
        }

        // Add hover handlers for small shapes
        if (isSmallShape) {
          shapeLayer.on('mouseover', () => {
            dimensionLabels.forEach(label => {
              if (drawLayer.current && !drawLayer.current.hasLayer(label)) {
                drawLayer.current.addLayer(label);
              }
            });
          });

          shapeLayer.on('mouseout', () => {
            dimensionLabels.forEach(label => {
              if (drawLayer.current && drawLayer.current.hasLayer(label)) {
                drawLayer.current.removeLayer(label);
              }
            });
          });
        }

        // NOTE: Shape click handlers removed - now handled by map-level geometric hit testing
        let savedShapeId: string | null = null;

        const shapeType = e.layerType === 'rectangle' ? 'rectangle' : e.layerType === 'circle' ? 'circle' : 'polygon';

        try {
          // Prepare coordinates for database
          let coordinatesToSave;
          if (shapeType === 'circle') {
            // Validate circle coordinates (should be [[lng, lat]])
            if (!Array.isArray(coords) || coords.length === 0) {
              console.error('❌ Invalid circle coordinates - not an array or empty:', coords);
              toast.error('Failed to save circle - invalid coordinates');
              return;
            }

            // Get the center coordinates (should be [[lng, lat]])
            const center = Array.isArray(coords[0]) ? coords[0] : coords;

            // Validate center is an array with 2 numeric values
            if (!Array.isArray(center) || center.length !== 2) {
              console.error('❌ Invalid circle center - not a 2-element array:', center);
              toast.error('Failed to save circle - invalid center coordinates');
              return;
            }

            // Validate both coordinates are valid numbers
            const [lng, lat] = center;
            if (typeof lng !== 'number' || typeof lat !== 'number' ||
                isNaN(lng) || isNaN(lat) ||
                !isFinite(lng) || !isFinite(lat)) {
              console.error('❌ Invalid circle coordinates - not valid numbers:', { lng, lat });
              toast.error('Failed to save circle - invalid numeric coordinates');
              return;
            }

            // Validate coordinates are within reasonable bounds
            if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
              console.error('❌ Invalid circle coordinates - out of bounds:', { lng, lat });
              toast.error('Failed to save circle - coordinates out of range');
              return;
            }

            console.log('✅ Circle coordinates validated:', coords);
            coordinatesToSave = coords;
          } else {
            // Ensure polygon coordinates are closed before saving to database
            coordinatesToSave = geoJSON.geometry.coordinates.map((ring: any[]) => ensureClosedPolygon(ring));
          }

          const response = await fetch('/api/projects/' + projectId + '/shapes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: defaultName,
              shapeType: shapeType,
              coordinates: coordinatesToSave,
              area: Math.round(areaSqFt),
              perimeter: Math.round(perimeterFeet)
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            const newShapeId = data.shape.id;
            savedShapeId = newShapeId; // Set the ID for the click handler

            // CRITICAL: Store shape ID in layer options so we can find it later
            shapeLayer.options.shapeId = newShapeId;
            shapeLayer.options.bubblingMouseEvents = false;

            // Store dimension labels on layer to avoid stale state issues
            shapeLayer._dimensionLabels = dimensionLabels;

            // Create Leaflet marker delete button that moves with the map
            const bounds = shapeLayer.getBounds();
            const topLeft = bounds.getNorthWest();

            let deleteBtn;
            // Validate coordinates before creating delete button marker
            if (topLeft && isFinite(topLeft.lat) && isFinite(topLeft.lng)) {
              deleteBtn = L.marker([topLeft.lat, topLeft.lng], {
                icon: L.divIcon({
                  className: 'shape-delete-button',
                  html: '<div style="color: #dc2626; cursor: pointer; font-weight: 900; font-size: 24px; text-shadow: 0 0 3px white, 0 0 5px white; pointer-events: auto; z-index: 10000; line-height: 1;">×</div>',
                  iconSize: [32, 32],
                  iconAnchor: [24, 24]
                }),
                zIndexOffset: 1000
              }, {
                interactive: true
              }).addTo(drawLayer.current);

              // Store shape ID on the button element itself
              const buttonElement = deleteBtn.getElement();
              if (buttonElement) {
                buttonElement.setAttribute('data-shape-id', newShapeId);
              }

              deleteBtn.on('click', (e: any) => {
                L.DomEvent.stopPropagation(e);
                const shapeId = deleteBtn.getElement()?.getAttribute('data-shape-id');
                console.log('>>> DELETE CLICKED, shape ID from element:', shapeId);
                if (shapeId) {
                  deleteShapeRef.current?.(shapeId);
                }
              });
            } else {
              console.error('❌ Invalid topLeft coordinates for delete button:', topLeft);
            }

            setDrawnShapes(prev => [...prev, {
              id: newShapeId,
              name: defaultName,
              area: Math.round(areaSqFt),
              perimeter: Math.round(perimeterFeet),
              layer: shapeLayer,
              dimensionLabels: dimensionLabels,
              deleteButton: deleteBtn,
              shapeType: shapeType
            }]);
            toast.success('Shape saved!');
          } else {
            throw new Error('Failed to save shape');
          }
        } catch (saveError) {
          console.error('Error saving shape:', saveError);
          const tempId = 'shape-' + Date.now();
          savedShapeId = tempId; // Set the ID for the click handler

          // Store dimension labels on layer to avoid stale state issues
          shapeLayer._dimensionLabels = dimensionLabels;

          // Create clickable delete button marker
          const bounds = shapeLayer.getBounds();
          const topLeft = bounds.getNorthWest();
          
          const deleteBtn = L.marker([topLeft.lat, topLeft.lng], {
            icon: L.divIcon({
              className: 'shape-delete-button',
              html: '<div style="color: #dc2626; cursor: pointer; font-weight: 900; font-size: 24px; text-shadow: 0 0 3px white, 0 0 5px white; pointer-events: auto; z-index: 10000; line-height: 1;">×</div>',
              iconSize: [32, 32],
              iconAnchor: [24, 24]
              }),
              zIndexOffset: 1000
          }, {
            interactive: true
          }).addTo(drawLayer.current);
          
          // Use Leaflet's click event
          deleteBtn.on('click', (e: any) => {
            L.DomEvent.stopPropagation(e);
            console.log('Deleting shape:', tempId);
            deleteShapeRef.current?.(tempId);
          });
          
          setDrawnShapes(prev => [...prev, {
            id: tempId,
            name: defaultName,
            area: Math.round(areaSqFt),
            perimeter: Math.round(perimeterFeet),
            layer: shapeLayer,
            dimensionLabels: dimensionLabels,
            deleteButton: deleteBtn,
            shapeType: shapeType
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

  // Helper: Snap point to alignment guides (for move/edit)
  const snapToGuides = (point: L.LatLng): L.LatLng => {
    if (!map.current) return point;

    const snapTolerance = 0.00002; // ~2 meters in lat/lng
    let snappedLat = point.lat;
    let snappedLng = point.lng;

    // Check against all vertices of all shapes for alignment
    drawnShapes.forEach(shape => {
      if (shape.shapeType === 'circle') {
        const center = shape.layer.getLatLng();
        if (Math.abs(point.lat - center.lat) < snapTolerance) snappedLat = center.lat;
        if (Math.abs(point.lng - center.lng) < snapTolerance) snappedLng = center.lng;
      } else {
        const latLngs = shape.layer.getLatLngs()[0];
        latLngs.forEach((ll: L.LatLng) => {
          if (Math.abs(point.lat - ll.lat) < snapTolerance) snappedLat = ll.lat;
          if (Math.abs(point.lng - ll.lng) < snapTolerance) snappedLng = ll.lng;
        });
      }
    });

    return L.latLng(snappedLat, snappedLng);
  };

  // Helper: Create custom handle icon
  const createHandleIcon = (type: 'move' | 'vertex' | 'rotation') => {
    const size = type === 'move' ? 16 : 12;
    const borderColor = type === 'move' ? '#3b82f6' : type === 'rotation' ? '#06b6d4' : '#fff';
    const borderWidth = type === 'move' ? 2 : 2;

    return L.divIcon({
      className: 'custom-handle',
      html: `<div style="
        width: ${size}px;
        height: ${size}px;
        background: white;
        border: ${borderWidth}px solid ${borderColor};
        border-radius: 50%;
        cursor: ${type === 'rotation' ? 'grab' : 'move'};
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      "></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  // Helper: Calculate geometric center of a shape
  const getShapeCenter = (layer: any): L.LatLng => {
    if (layer.getLatLng) {
      // Circle
      return layer.getLatLng();
    } else {
      // Polygon or Rectangle
      const latLngs = layer.getLatLngs()[0];
      let latSum = 0, lngSum = 0;
      latLngs.forEach((ll: L.LatLng) => {
        latSum += ll.lat;
        lngSum += ll.lng;
      });
      return L.latLng(latSum / latLngs.length, lngSum / latLngs.length);
    }
  };

  // Helper: Rotate a point around a center point
  const rotatePoint = (point: L.LatLng, center: L.LatLng, angleDegrees: number): L.LatLng => {
    const angleRadians = (angleDegrees * Math.PI) / 180;
    const cos = Math.cos(angleRadians);
    const sin = Math.sin(angleRadians);

    const dx = point.lng - center.lng;
    const dy = point.lat - center.lat;

    const rotatedLng = cos * dx - sin * dy + center.lng;
    const rotatedLat = sin * dx + cos * dy + center.lat;

    return L.latLng(rotatedLat, rotatedLng);
  };

  // Helper: Apply rotation to a polygon/rectangle layer
  const applyRotationToLayer = (layer: any, angleDegrees: number, center?: L.LatLng) => {
    if (!layer.getLatLngs || layer.getLatLng) {
      // Skip circles or invalid layers
      return;
    }

    const layerCenter = center || getShapeCenter(layer);
    const latLngs = layer.getLatLngs()[0];

    const rotatedLatLngs = latLngs.map((ll: L.LatLng) =>
      rotatePoint(ll, layerCenter, angleDegrees)
    );

    layer.setLatLngs([rotatedLatLngs]);
  };

  // Helper: Update delete button position for a shape
  const updateDeleteButtonPosition = (shape: any) => {
    if (!shape || !shape.layer || !shape.deleteButton) return;

    try {
      const bounds = shape.layer.getBounds();
      if (!bounds) return;

      const topLeft = bounds.getNorthWest();
      shape.deleteButton.setLatLng(topLeft);
    } catch (error) {
      console.error('Error updating delete button position:', error);
    }
  };

  // Helper: Update all delete button positions
  const updateAllDeleteButtonPositions = () => {
    drawnShapes.forEach((shape) => {
      updateDeleteButtonPosition(shape);
    });
  };

  // Helper: Remove all handles
  const removeAllHandles = () => {
    console.log('🗑️  removeAllHandles() called');
    if (!map.current) {
      console.log('   ❌ No map available');
      return;
    }

    // Remove move handles
    console.log(`   Removing ${moveHandles.length} move handles...`);
    moveHandles.forEach(handle => {
      if (map.current?.hasLayer(handle)) {
        map.current.removeLayer(handle);
      }
    });
    setMoveHandles([]);

    // Remove edit handles
    console.log(`   Removing ${editHandles.length} edit handles...`);
    editHandles.forEach(handle => {
      if (map.current?.hasLayer(handle)) {
        map.current.removeLayer(handle);
      }
    });
    setEditHandles([]);

    // Remove rotation handle and line
    if (rotationHandle && map.current?.hasLayer(rotationHandle)) {
      console.log('   Removing rotation handle...');
      map.current.removeLayer(rotationHandle);
    }
    setRotationHandle(null);

    if (rotationLine && map.current?.hasLayer(rotationLine)) {
      console.log('   Removing rotation line...');
      map.current.removeLayer(rotationLine);
    }
    setRotationLine(null);

    console.log('   ✓ All handles removed');
  };

  // Helper: Create move handle (center point) for a shape
  const createMoveHandle = (shape: any) => {
    if (!map.current || !drawLayer.current) return;

    const center = getShapeCenter(shape.layer);
    const icon = createHandleIcon('move');

    const handle = L.marker([center.lat, center.lng], {
      icon,
      draggable: true,
      zIndexOffset: 1000,
    });

    // Store original position and shape data
    let originalShapeCenter: L.LatLng;
    let originalShapeCoords: any;

    // Handle drag events
    handle.on('dragstart', (e) => {
      console.log('🎯 Move handle drag started for:', shape.name);
      setIsDraggingHandle(true);
      setDraggedHandleType('move');
      setDraggedShapeId(shape.id);

      // Store original shape position ONCE at start
      originalShapeCenter = getShapeCenter(shape.layer);

      if (shape.shapeType === 'circle') {
        originalShapeCoords = shape.layer.getLatLng();
      } else {
        originalShapeCoords = shape.layer.getLatLngs()[0].map((ll: L.LatLng) =>
          L.latLng(ll.lat, ll.lng)
        );
      }

      console.log('Original shape center:', { lat: originalShapeCenter.lat, lng: originalShapeCenter.lng });

      // Make shape semi-transparent
      if (shape.layer.setStyle) {
        shape.layer.setStyle({ fillOpacity: 0.5, opacity: 0.5 });
      }

      // Change cursor
      if (map.current) {
        map.current.getContainer().style.cursor = 'grabbing';
      }
    });

    handle.on('drag', (e: any) => {
      const newHandleCenter = e.target.getLatLng();
      // Use exact coordinates during drag for smooth movement
      // Snapping disabled during drag to prevent choppy movement

      // Calculate offset from ORIGINAL center (stored at dragstart)
      const latOffset = newHandleCenter.lat - originalShapeCenter.lat;
      const lngOffset = newHandleCenter.lng - originalShapeCenter.lng;

      // Move the shape by applying offset to ORIGINAL coordinates
      if (shape.shapeType === 'circle') {
        const newCenter = L.latLng(
          originalShapeCoords.lat + latOffset,
          originalShapeCoords.lng + lngOffset
        );
        shape.layer.setLatLng(newCenter);
      } else {
        const newLatLngs = originalShapeCoords.map((ll: L.LatLng) =>
          L.latLng(ll.lat + latOffset, ll.lng + lngOffset)
        );
        shape.layer.setLatLngs([newLatLngs]);
      }

      // Update dimension labels - skip React state update during drag to prevent duplicates
      updateShapeDimensionLabels(shape.id, shape.layer, true);

      // Update delete button position during shape move
      updateDeleteButtonPosition(shape);
    });

    handle.on('dragend', async (e: any) => {
      console.log('🏁 Move handle drag ended for:', shape.name);
      setIsDraggingHandle(false);
      setDraggedHandleType(null);
      setDraggedShapeId(null);

      // Reset shape opacity
      if (shape.layer.setStyle) {
        shape.layer.setStyle({ fillOpacity: 0.2, opacity: 1 });
      }

      // Reset cursor
      if (map.current) {
        map.current.getContainer().style.cursor = '';
      }

      // Save to database
      const newCenter = e.target.getLatLng();
      let coordinates;

      if (shape.shapeType === 'circle') {
        // Validate circle coordinates before saving
        if (!newCenter || typeof newCenter.lat !== 'number' || typeof newCenter.lng !== 'number' ||
            isNaN(newCenter.lat) || isNaN(newCenter.lng) ||
            !isFinite(newCenter.lat) || !isFinite(newCenter.lng)) {
          console.error('❌ Invalid circle center coordinates during move:', newCenter);
          toast.error('Failed to save circle - invalid coordinates');
          return;
        }

        // Validate coordinates are within reasonable bounds
        if (newCenter.lng < -180 || newCenter.lng > 180 || newCenter.lat < -90 || newCenter.lat > 90) {
          console.error('❌ Circle coordinates out of bounds during move:', newCenter);
          toast.error('Failed to save circle - coordinates out of range');
          return;
        }

        console.log('✅ Circle move validated:', newCenter);
        // Use consistent array format: [[lng, lat]]
        coordinates = [[newCenter.lng, newCenter.lat]];
      } else {
        const latLngs = shape.layer.getLatLngs()[0];
        coordinates = latLngs.map((ll: L.LatLng) => ({ lat: ll.lat, lng: ll.lng }));
      }

      try {
        const response = await fetch(`/api/projects/${projectId}/shapes/${shape.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coordinates }),
        });

        if (response.ok) {
          console.log('✅ Shape position saved to database');
          toast.success('Shape moved');

          // Update React state with final dimension labels after drag completes
          updateShapeDimensionLabels(shape.id, shape.layer, false);

          // Update delete button position after move
          updateDeleteButtonPosition(shape);
        } else {
          throw new Error('Failed to save');
        }
      } catch (error) {
        console.error('❌ Error saving shape position:', error);
        toast.error('Failed to save shape position');
      }
    });

    handle.addTo(map.current);
    return handle;
  };

  // Helper: Create vertex/corner handles for editing
  const createEditHandles = (shape: any) => {
    console.log('🔧 createEditHandles() called');
    console.log('   Shape:', shape.name, `(${shape.shapeType})`);

    if (!map.current || !drawLayer.current) {
      console.error('   ❌ No map or drawLayer!');
      return [];
    }

    const handles: L.Marker[] = [];
    const icon = createHandleIcon('vertex');
    console.log('   ✓ Handle icon created');

    if (shape.shapeType === 'circle') {
      console.log('   Creating circle radius handle...');
      // Circle: single handle on edge at 3 o'clock
      const center = shape.layer.getLatLng();
      const radius = shape.layer.getRadius();
      const handlePos = L.latLng(center.lat, center.lng + radius / 111320); // approx meters to lng
      console.log(`   Center: [${center.lat}, ${center.lng}], Radius: ${radius}m`);
      console.log(`   Handle position: [${handlePos.lat}, ${handlePos.lng}]`);

      const handle = L.marker([handlePos.lat, handlePos.lng], {
        icon,
        draggable: true,
        zIndexOffset: 1000,
      });

      handle.on('dragstart', () => {
        console.log('🎯 Radius handle drag started');
        setIsDraggingHandle(true);
        setDraggedHandleType('radius');
        setDraggedShapeId(shape.id);
      });

      handle.on('drag', (e: any) => {
        const handleLatLng = e.target.getLatLng();
        const center = shape.layer.getLatLng();

        // Calculate new radius
        const newRadius = map.current!.distance(center, handleLatLng);
        shape.layer.setRadius(newRadius);

        // Update dimension labels - skip state update during drag
        updateShapeDimensionLabels(shape.id, shape.layer, true);

        // Update delete button position during radius drag
        updateDeleteButtonPosition(shape);
      });

      handle.on('dragend', async () => {
        console.log('🏁 Radius handle drag ended');
        setIsDraggingHandle(false);
        setDraggedHandleType(null);

        // Save to database
        const center = shape.layer.getLatLng();
        const radius = shape.layer.getRadius();

        // Validate circle coordinates before saving
        if (!center || typeof center.lat !== 'number' || typeof center.lng !== 'number' ||
            isNaN(center.lat) || isNaN(center.lng) ||
            !isFinite(center.lat) || !isFinite(center.lng)) {
          console.error('❌ Invalid circle center coordinates:', center);
          toast.error('Failed to save circle - invalid coordinates');
          return;
        }

        // Validate coordinates are within reasonable bounds
        if (center.lng < -180 || center.lng > 180 || center.lat < -90 || center.lat > 90) {
          console.error('❌ Circle coordinates out of bounds:', center);
          toast.error('Failed to save circle - coordinates out of range');
          return;
        }

        // Validate radius
        if (typeof radius !== 'number' || isNaN(radius) || !isFinite(radius) || radius <= 0) {
          console.error('❌ Invalid circle radius:', radius);
          toast.error('Failed to save circle - invalid radius');
          return;
        }

        console.log('✅ Circle resize validated:', { center, radius });

        try {
          // Use consistent array format: [[lng, lat]]
          const response = await fetch(`/api/projects/${projectId}/shapes/${shape.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              coordinates: [[center.lng, center.lat]]
            }),
          });

          if (response.ok) {
            toast.success('Circle resized');
            // Update React state with final dimension labels after drag completes
            updateShapeDimensionLabels(shape.id, shape.layer, false);

            // Update delete button position after radius change
            updateDeleteButtonPosition(shape);
          }
        } catch (error) {
          console.error('Error saving circle:', error);
          toast.error('Failed to save changes');
        }
      });

      handle.addTo(map.current);
      handles.push(handle);
      console.log('   ✅ Circle radius handle created and added to map');

    } else {
      console.log('   Creating polygon/rectangle vertex handles...');
      // Polygon or Rectangle: handles on vertices/corners
      const latLngs = shape.layer.getLatLngs()[0];
      console.log(`   Vertices count: ${latLngs.length}`);

      latLngs.forEach((latLng: L.LatLng, index: number) => {
        const handle = L.marker([latLng.lat, latLng.lng], {
          icon,
          draggable: true,
          zIndexOffset: 1000,
        });

        handle.on('dragstart', () => {
          console.log(`🎯 Vertex ${index} drag started`);
          setIsDraggingHandle(true);
          setDraggedHandleType(shape.shapeType === 'rectangle' ? 'corner' : 'vertex');
          setDraggedHandleIndex(index);
          setDraggedShapeId(shape.id);
        });

        handle.on('drag', (e: any) => {
          const newLatLng = e.target.getLatLng();
          // Use exact coordinates during drag for smooth movement
          // Snapping disabled during drag to prevent choppy movement
          const currentLatLngs = shape.layer.getLatLngs()[0];

          if (shape.shapeType === 'rectangle') {
            // Rectangle: resize from opposite corner
            const oppositeIndex = (index + 2) % 4;
            const oppositeCorner = currentLatLngs[oppositeIndex];

            // Recalculate all 4 corners based on drag and opposite corner
            const newLatLngs = [
              L.latLng(oppositeCorner.lat, oppositeCorner.lng),
              L.latLng(oppositeCorner.lat, newLatLng.lng),
              L.latLng(newLatLng.lat, newLatLng.lng),
              L.latLng(newLatLng.lat, oppositeCorner.lng),
            ];

            // Reorder based on which corner is being dragged
            const rotatedLatLngs = [];
            for (let i = 0; i < 4; i++) {
              rotatedLatLngs.push(newLatLngs[(i + oppositeIndex) % 4]);
            }

            shape.layer.setLatLngs([rotatedLatLngs]);

            // Update all corner handles
            rotatedLatLngs.forEach((ll: L.LatLng, i: number) => {
              if (handles[i]) {
                handles[i].setLatLng(ll);
              }
            });
          } else {
            // Polygon: just move this vertex
            currentLatLngs[index] = newLatLng;
            shape.layer.setLatLngs([currentLatLngs]);
            handle.setLatLng(newLatLng);
          }

          // Update dimension labels - skip state update during drag
          updateShapeDimensionLabels(shape.id, shape.layer, true);

          // Update delete button position during vertex drag
          updateDeleteButtonPosition(shape);
        });

        handle.on('dragend', async () => {
          console.log(`🏁 Vertex ${index} drag ended`);
          setIsDraggingHandle(false);
          setDraggedHandleType(null);
          setDraggedHandleIndex(null);

          // Save to database
          const latLngs = shape.layer.getLatLngs()[0];
          const coordinates = latLngs.map((ll: L.LatLng) => ({ lat: ll.lat, lng: ll.lng }));

          try {
            const response = await fetch(`/api/projects/${projectId}/shapes/${shape.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ coordinates }),
            });

            if (response.ok) {
              toast.success('Shape updated');
              // Update React state with final dimension labels after drag completes
              updateShapeDimensionLabels(shape.id, shape.layer, false);

              // Update delete button position after vertex edit
              updateDeleteButtonPosition(shape);
            }
          } catch (error) {
            console.error('Error saving shape:', error);
            toast.error('Failed to save changes');
          }
        });

        handle.addTo(map.current);
        handles.push(handle);
        console.log(`   ✓ Vertex ${index} handle added to map`);
      });

      console.log(`   ✅ All ${handles.length} vertex handles created and added`);
    }

    console.log(`🔧 createEditHandles() complete - returning ${handles.length} handles`);
    return handles;
  };

  // Helper: Create rotation handle
  const createRotationHandle = (shape: any) => {
    console.log('🔄 createRotationHandle() called for:', shape.name);

    if (!map.current || !drawLayer.current) {
      console.error('   ❌ No map or drawLayer!');
      return;
    }
    if (shape.shapeType === 'circle') {
      console.log('   ⏭️  Skipping rotation handle for circle');
      return; // Circles don't need rotation
    }

    const center = getShapeCenter(shape.layer);

    // Create rotation icon with ⟲ symbol (no bubble background)
    const rotationIcon = L.divIcon({
      className: 'rotation-handle',
      html: `<div class="rotation-handle-inner" style="
        font-size: 24px;
        color: #3b82f6;
        cursor: grab;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        transition: all 0.2s ease;
      ">⟲</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    console.log('   Center:', center);
    console.log('   ✓ Rotation icon created');

    // Position rotation handle at top-right corner, 20px outside bounds
    const bounds = shape.layer.getBounds();
    const topRight = bounds.getNorthEast();

    // Calculate 20px offset in lat/lng degrees
    const metersPerPixel = 40075000 / (256 * Math.pow(2, map.current.getZoom()));
    const pixelOffset = 20;
    const latOffset = -(pixelOffset * metersPerPixel) / 111320; // Negative to go up
    const lngOffset = (pixelOffset * metersPerPixel) / (111320 * Math.cos(topRight.lat * Math.PI / 180)); // Positive to go right

    const handlePos = L.latLng(topRight.lat + latOffset, topRight.lng + lngOffset);

    const handle = L.marker([handlePos.lat, handlePos.lng], {
      icon: rotationIcon,
      draggable: true,
      zIndexOffset: 1001,
    });

    // Create connecting line from center to rotation handle
    const line = L.polyline([center, handlePos], {
      color: '#3b82f6',
      weight: 2,
      dashArray: '4, 4',
      opacity: 0.6,
    });

    line.addTo(map.current);
    setRotationLine(line);

    // Add hover state
    handle.on('mouseover', () => {
      const handleElement = handle.getElement();
      if (handleElement) {
        const inner = handleElement.querySelector('.rotation-handle-inner') as HTMLElement;
        if (inner && !isDraggingHandle) {
          inner.style.color = '#2563eb';
          inner.style.transform = 'scale(1.2)';
        }
      }
    });

    handle.on('mouseout', () => {
      const handleElement = handle.getElement();
      if (handleElement) {
        const inner = handleElement.querySelector('.rotation-handle-inner') as HTMLElement;
        if (inner && !isDraggingHandle) {
          inner.style.color = '#3b82f6';
          inner.style.transform = 'scale(1)';
        }
      }
    });

    let angleTooltip: L.Tooltip | null = null;

    handle.on('dragstart', (e: any) => {
      console.log('🎯 Rotation handle drag started');
      setIsDraggingHandle(true);
      setDraggedHandleType('rotation');
      setDraggedShapeId(shape.id);

      // Change to yellow dragging color
      const handleElement = handle.getElement();
      if (handleElement) {
        const inner = handleElement.querySelector('.rotation-handle-inner') as HTMLElement;
        if (inner) {
          inner.style.color = '#f59e0b';
          inner.style.cursor = 'grabbing';
        }
      }

      // Calculate initial angle (negated for intuitive rotation direction)
      const center = getShapeCenter(shape.layer);
      const handlePos = e.target.getLatLng();
      const angle = -Math.atan2(handlePos.lng - center.lng, handlePos.lat - center.lat) * (180 / Math.PI);
      setRotationStartAngle(angle);
      setCurrentRotationAngle(shape.rotationAngle || 0);

      // Create angle tooltip
      angleTooltip = L.tooltip({
        permanent: true,
        direction: 'top',
        offset: [0, -15],
        className: 'rotation-angle-tooltip',
      })
        .setLatLng(handlePos)
        .setContent(`0°`)
        .addTo(map.current!);

      if (map.current) {
        map.current.getContainer().style.cursor = 'grabbing';
      }
    });

    handle.on('drag', (e: any) => {
      const handleLatLng = e.target.getLatLng();
      const center = getShapeCenter(shape.layer);

      // Calculate rotation angle (negated for intuitive rotation direction)
      const angle = -Math.atan2(handleLatLng.lng - center.lng, handleLatLng.lat - center.lat) * (180 / Math.PI);
      const rotationDelta = angle - rotationStartAngle;
      let newRotation = currentRotationAngle + rotationDelta;

      // Shift-key snapping to 15° increments
      if (e.originalEvent?.shiftKey) {
        newRotation = Math.round(newRotation / 15) * 15;
      }

      // Normalize angle to 0-360 range
      newRotation = ((newRotation % 360) + 360) % 360;

      console.log(`🔄 Rotating: ${Math.round(newRotation)}°${e.originalEvent?.shiftKey ? ' (snapped)' : ''}`);

      // Update angle tooltip
      if (angleTooltip) {
        angleTooltip.setLatLng(handleLatLng);
        angleTooltip.setContent(
          `${Math.round(newRotation)}°${e.originalEvent?.shiftKey ? ' ⚡' : ''}`
        );
      }

      // Update rotation line
      if (rotationLine) {
        rotationLine.setLatLngs([center, handleLatLng]);
      }

      // Apply actual rotation transformation to the shape
      const currentRotation = shape.rotationAngle || 0;
      const rotationChange = newRotation - currentRotation;

      // Apply rotation to the layer visually
      applyRotationToLayer(shape.layer, rotationChange, center);

      // Update shape rotation angle
      shape.rotationAngle = newRotation;

      // Update dimension labels after rotation
      updateShapeDimensionLabels(shape.id, shape.layer, true);

      // Update delete button position during rotation
      updateDeleteButtonPosition(shape);
    });

    handle.on('dragend', async () => {
      console.log('🏁 Rotation handle drag ended');
      setIsDraggingHandle(false);
      setDraggedHandleType(null);

      // Reset handle color to blue
      const handleElement = handle.getElement();
      if (handleElement) {
        const inner = handleElement.querySelector('.rotation-handle-inner') as HTMLElement;
        if (inner) {
          inner.style.color = '#3b82f6';
          inner.style.cursor = 'grab';
        }
      }

      // Remove angle tooltip
      if (angleTooltip && map.current) {
        map.current.removeLayer(angleTooltip);
        angleTooltip = null;
      }

      if (map.current) {
        map.current.getContainer().style.cursor = '';
      }

      // Save rotation to database
      try {
        const response = await fetch(`/api/projects/${projectId}/shapes/${shape.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rotationAngle: shape.rotationAngle || 0,
          }),
        });

        if (response.ok) {
          toast.success(`Rotation saved: ${Math.round(shape.rotationAngle || 0)}°`);

          // Update delete button position after rotation
          updateDeleteButtonPosition(shape);

          // CRITICAL: Regenerate dimension labels after rotation completes
          // Use false to trigger React state update and fully regenerate labels
          updateShapeDimensionLabels(shape.id, shape.layer, false);
        }
      } catch (error) {
        console.error('Error saving rotation:', error);
        toast.error('Failed to save rotation');
      }
    });

    handle.addTo(map.current);
    setRotationHandle(handle);
    console.log('   ✅ Rotation handle and connecting line added to map');
    console.log('🔄 createRotationHandle() complete');
  };

  // Helper: Resize rectangle while maintaining 90° angles
  const resizeRectangle = (rectangle: any, cornerIndex: number, newPos: L.LatLng) => {
    const oldBounds = rectangle.getBounds();
    const oppositeCornerIndex = (cornerIndex + 2) % 4; // Opposite corner stays fixed

    // Get anchor point (opposite corner that stays fixed)
    const corners = [
      oldBounds.getNorthWest(),
      oldBounds.getNorthEast(),
      oldBounds.getSouthEast(),
      oldBounds.getSouthWest()
    ];
    const anchor = corners[oppositeCornerIndex];

    // Create new bounds from anchor to new corner position
    const newBounds = L.latLngBounds(anchor, newPos);

    // Update rectangle
    rectangle.setBounds(newBounds);

    // Update corner handle positions
    const newCorners = [
      newBounds.getNorthWest(),
      newBounds.getNorthEast(),
      newBounds.getSouthEast(),
      newBounds.getSouthWest()
    ];

    rectangle._cornerHandles?.forEach((handle: any, idx: number) => {
      handle.setLatLng(newCorners[idx]);
    });

    // Update dimension labels in real-time
    updateShapeDimensionLabels(rectangle._shapeId, rectangle, true);
  };

  // Helper: Setup rectangle resizing with corner handles
  const setupRectangleResizing = (rectangle: any, shapeId: string) => {
    console.log('   📐 Setting up rectangle resize behavior');

    // Store shape ID on rectangle
    rectangle._shapeId = shapeId;

    // Clean up any existing handles
    if (rectangle._cornerHandles) {
      rectangle._cornerHandles.forEach((handle: any) => {
        if (drawLayer.current?.hasLayer(handle)) {
          drawLayer.current.removeLayer(handle);
        }
      });
    }
    rectangle._cornerHandles = [];

    // Get current bounds
    const bounds = rectangle.getBounds();
    const corners = [
      bounds.getNorthWest(), // top-left
      bounds.getNorthEast(), // top-right
      bounds.getSouthEast(), // bottom-right
      bounds.getSouthWest()  // bottom-left
    ];

    // Corner names for logging
    const cornerNames = ['NW', 'NE', 'SE', 'SW'];

    // Create 4 draggable corner handles
    corners.forEach((corner: L.LatLng, index: number) => {
      const handle = L.marker([corner.lat, corner.lng], {
        draggable: true,
        icon: L.divIcon({
          className: 'rectangle-corner-handle',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
          html: '<div style="width:12px;height:12px;background:white;border:3px solid #FFD700;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.15);cursor:nwse-resize;"></div>'
        }),
        zIndexOffset: 1000
      });

      // Track which corner this is
      handle._cornerIndex = index;
      handle._rectangle = rectangle;

      // On drag start
      handle.on('dragstart', function(this: any) {
        console.log(`   🟢 Dragging ${cornerNames[this._cornerIndex]} corner`);
      });

      // On drag, resize rectangle
      handle.on('drag', function(this: any, e: any) {
        const newCornerPos = this.getLatLng();
        resizeRectangle(this._rectangle, this._cornerIndex, newCornerPos);
      });

      // On drag end, update dimension labels and save
      handle.on('dragend', async function(this: any) {
        console.log(`   🔴 Released ${cornerNames[this._cornerIndex]} corner`);
        updateShapeDimensionLabels(shapeId, this._rectangle, false);

        // Save updated shape to database
        try {
          console.log('   💾 Saving resized rectangle...');
          const geoJSON = this._rectangle.toGeoJSON();

          const response = await fetch(`/api/projects/${projectId}/shapes/${shapeId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              coordinates: geoJSON.geometry.coordinates
            })
          });

          if (response.ok) {
            console.log('   ✅ Rectangle saved to database');

            // Update delete button position after rectangle resize
            const shapeObj = drawnShapes.find(s => s.id === shapeId);
            if (shapeObj) {
              updateDeleteButtonPosition(shapeObj);
            }
          } else {
            console.error('   ❌ Failed to save rectangle');
          }
        } catch (err) {
          console.error('   ❌ Error saving rectangle:', err);
        }
      });

      // Add handle to map
      if (drawLayer.current) {
        drawLayer.current.addLayer(handle);
      }

      // Store handle on rectangle for cleanup
      rectangle._cornerHandles.push(handle);
    });

    console.log('   ✅ Rectangle corner handles created');
  };

  // Helper: Attach vertex drag listeners to a layer (for polygons)
  const attachVertexDragListeners = (layer: any, shapeId: string) => {
    if (!layer || !shapeId) {
      console.warn('⚠️ attachVertexDragListeners: missing layer or shapeId');
      return;
    }

    console.log('   🎧 Attaching vertex drag listeners to shape:', shapeId);

    // List of all possible vertex drag events
    const events = [
      'editable:vertex:drag',
      'editable:vertex:dragend',
      'editable:vertex:dragstart',
      'editable:editing',
      'edit',
      'editdrag',
      'drag',
      'dragend',
      'vertexdrag'
    ];

    // Remove all old listeners first
    events.forEach(eventName => {
      layer.off(eventName);
    });

    // Add listeners for vertex drag events
    layer.on('editable:vertex:drag', () => {
      console.log('   🔵 editable:vertex:drag FIRED!');
      updateShapeDimensionLabels(shapeId, layer, true);
    });

    layer.on('editable:vertex:dragstart', () => {
      console.log('   🟢 editable:vertex:dragstart FIRED!');
    });

    layer.on('editable:vertex:dragend', async () => {
      console.log('   🔴 editable:vertex:dragend FIRED!');
      updateShapeDimensionLabels(shapeId, layer, false);

      // Save updated shape to database - PRESERVE the layer
      try {
        console.log('   💾 Saving shape, preserving layer...');
        const coords = layer.getLatLngs ? layer.getLatLngs()[0] : [layer.getLatLng()];
        const geoJSON = layer.toGeoJSON();

        const response = await fetch(`/api/projects/${projectId}/shapes/${shapeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coordinates: geoJSON.geometry.coordinates
          })
        });

        if (response.ok) {
          console.log('   ✅ Shape saved to database, layer preserved for future editing');
        } else {
          console.error('   ❌ Failed to save shape');
        }
      } catch (err) {
        console.error('   ❌ Error saving shape:', err);
      }
    });

    // Try some alternate event names
    layer.on('editable:editing', () => {
      console.log('   🟡 editable:editing FIRED!');
    });

    layer.on('edit', () => {
      console.log('   🟣 edit FIRED!');
    });

    layer.on('drag', () => {
      console.log('   🟠 drag FIRED!');
    });

    layer.on('dragend', () => {
      console.log('   🔵 dragend FIRED!');
    });

    console.log('   ✅ Vertex drag listeners attached');
  };

  // Helper: Update dimension labels for a shape
  const updateShapeDimensionLabels = (shapeId: string, layer: any, skipStateUpdate = false) => {
    if (!drawLayer.current || !layer) {
      console.warn('⚠️ updateShapeDimensionLabels: missing drawLayer or layer');
      return;
    }

    console.log(`🔄 Updating dimension labels for shape ${shapeId}, skipStateUpdate: ${skipStateUpdate}`);

    // Remove old labels - stored on the layer object to avoid stale state issues
    if (layer._dimensionLabels && Array.isArray(layer._dimensionLabels)) {
      console.log(`   Removing ${layer._dimensionLabels.length} old labels`);
      layer._dimensionLabels.forEach((label: any) => {
        try {
          if (drawLayer.current?.hasLayer(label)) {
            drawLayer.current.removeLayer(label);
          }
        } catch (e) {
          console.warn('Error removing dimension label:', e);
        }
      });
      layer._dimensionLabels = [];
    }

    // Determine shape type from layer or stored value
    const isCircle = typeof layer.getRadius === 'function';

    // Create new labels
    if (isCircle) {
      const center = layer.getLatLng();
      const radius = layer.getRadius();
      const diameterFeet = (radius * 2) * 3.28084;

      const newLabel = L.marker([center.lat, center.lng], {
        icon: L.divIcon({
          className: 'dimension-label',
          html: `<div style="background: linear-gradient(to bottom, #ffffff, #f8fafc); border: 1.5px solid rgba(59, 130, 246, 0.5); border-radius: 6px; padding: 3px 8px; font-size: 11px; font-weight: 500; color: #1e40af; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06); white-space: nowrap;">⌀ ${formatFeetInches(diameterFeet)}</div>`,
          iconSize: [60, 22],
          iconAnchor: [30, 11]
        }),
        interactive: false
      });

      drawLayer.current.addLayer(newLabel);

      // Store labels on layer object to avoid stale state
      layer._dimensionLabels = [newLabel];

      console.log(`   ✅ Created 1 circle label, stored on layer`);

      // Only update React state if not dragging (to prevent useEffect from running)
      if (!skipStateUpdate) {
        setDrawnShapes(prev => prev.map(s =>
          s.id === shapeId ? { ...s, dimensionLabels: [newLabel] } : s
        ));
        console.log(`   Updated React state with new labels`);
      } else {
        console.log(`   Skipped React state update (dragging in progress)`);
      }
    } else {
      // Polygon or rectangle - get fresh coordinates from layer
      const coords = layer.getLatLngs()[0].map((ll: any) => [ll.lat, ll.lng]);
      console.log(`   Got ${coords.length} vertices from layer`);

      const labelResult = createDimensionLabels(coords);
      const newDimensionLabels = labelResult.labels;
      const isSmallShape = labelResult.isSmallShape;

      console.log(`   Created ${newDimensionLabels.length} labels, isSmallShape: ${isSmallShape}`);

      if (!isSmallShape) {
        newDimensionLabels.forEach(label => drawLayer.current?.addLayer(label));
        console.log(`   ✅ Added ${newDimensionLabels.length} labels to map`);
      } else {
        console.log(`   Shape too small, labels will show on hover`);
      }

      // Update hover handlers for small shapes
      if (isSmallShape) {
        layer.off('mouseover');
        layer.off('mouseout');

        layer.on('mouseover', () => {
          newDimensionLabels.forEach(label => {
            if (drawLayer.current && !drawLayer.current.hasLayer(label)) {
              drawLayer.current.addLayer(label);
            }
          });
        });

        layer.on('mouseout', () => {
          newDimensionLabels.forEach(label => {
            if (drawLayer.current && drawLayer.current.hasLayer(label)) {
              drawLayer.current.removeLayer(label);
            }
          });
        });
      }

      // Store labels on layer object to avoid stale state
      layer._dimensionLabels = newDimensionLabels;

      console.log(`   ✅ Stored ${newDimensionLabels.length} labels on layer._dimensionLabels`);

      // Only update React state if not dragging (to prevent useEffect from running)
      if (!skipStateUpdate) {
        setDrawnShapes(prev => prev.map(s =>
          s.id === shapeId ? { ...s, dimensionLabels: newDimensionLabels } : s
        ));
        console.log(`   Updated React state with new labels`);
      } else {
        console.log(`   Skipped React state update (dragging in progress)`);
      }
    }
  };

  // Toggle edit vertices mode - ENHANCED with custom vertex handles
  // Toggle Edit Shapes mode - Handle-based interaction
  const toggleEditShapesVertices = () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔘 BUTTON CLICKED: Edit Shapes button');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!map.current || !drawLayer.current) {
      console.error('❌ Cannot toggle: map or drawLayer not available');
      console.log('   map.current:', !!map.current);
      console.log('   drawLayer.current:', !!drawLayer.current);
      return;
    }

    console.log('📊 Current state:');
    console.log('   isEditingShapesVertices:', isEditingShapesVertices);
    console.log('   Total drawn shapes:', drawnShapes.length);
    console.log('   Shapes:', drawnShapes.map(s => ({ id: s.id, name: s.name, type: s.shapeType, hasLayer: !!s.layer })));

    if (isEditingShapesVertices) {
      // Exit Edit mode
      console.log('🚪 Exiting Edit Shapes mode');
      setIsEditingShapesVertices(false);
      setSelectedShapeId(null);

      // Disable editing on all ACTUAL map layers
      console.log('🔄 Disabling Leaflet Editable editing on all map layers...');
      drawLayer.current.eachLayer((layer: any) => {
        if (layer instanceof L.Polygon || layer instanceof L.Rectangle || layer instanceof L.Circle) {
          if (typeof layer.disableEdit === 'function') {
            try {
              layer.disableEdit();
              // Reset style to default
              if (layer.setStyle) {
                layer.setStyle({
                  color: '#3b82f6',
                  weight: 2,
                  fillColor: '#3b82f6',
                  fillOpacity: 0.2,
                });
              }
            } catch (err) {
              console.warn('   Failed to disable editing on layer:', err);
            }
          }
          // Remove click handler from actual map layer
          layer.off('click');
        }
      });
      console.log('   ✓ All layers editing disabled');

      // Reset cursor and remove edit-mode class
      if (map.current) {
        map.current.getContainer().style.cursor = '';
        map.current.getContainer().classList.remove('edit-mode');
        console.log('   ✓ Removed edit-mode class from map container');
      }

      console.log('✅ Edit Shapes mode disabled');
    } else {
      // Enter Edit mode
      console.log('🚀 Entering Edit Shapes mode');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      setIsEditingShapesVertices(true);

      // Change cursor and add edit-mode class to map container
      if (map.current) {
        map.current.getContainer().style.cursor = 'pointer';
        map.current.getContainer().classList.add('edit-mode');
        console.log('✓ Cursor changed to pointer');
        console.log('✓ Added edit-mode class to map container');
      }

      // Add click handlers to ACTUAL map layers (not state objects)
      console.log('📍 Getting layers directly from drawLayer...');

      let shapeLayerCount = 0;
      drawLayer.current.eachLayer((layer: any) => {
        // Skip dimension labels and markers - only handle actual shape layers
        if (layer instanceof L.Polygon || layer instanceof L.Rectangle || layer instanceof L.Circle) {
          shapeLayerCount++;
          const shapeId = layer.options?.shapeId;
          const shapeName = drawnShapes.find(s => s.id === shapeId)?.name || 'Unknown';

          console.log(`   [${shapeLayerCount}] Layer found: ${shapeName} (${layer.constructor.name})`);
          console.log(`       Shape ID: ${shapeId}`);
          console.log(`       Interactive: ${layer.options?.interactive}`);

          // CRITICAL FIX: Ensure layer is interactive and has proper options
          if (!layer.options.interactive) {
            console.warn(`   ⚠️  Layer is NOT interactive - forcing it`);
            layer.options.interactive = true;
          }

          // Force bubblingMouseEvents to false to prevent event bubbling
          layer.options.bubblingMouseEvents = false;

          // Update the layer to apply changes
          if (layer._updatePath) {
            layer._updatePath();
          }

          console.log(`   ✓ Layer options set: interactive=${layer.options.interactive}, bubblingMouseEvents=${layer.options.bubblingMouseEvents}`);

          // Remove any existing click handlers first to avoid duplicates
          const existingHandlers = layer._events?.click?.length || 0;
          layer.off('click');
          console.log(`   ✓ Removed ${existingHandlers} existing click handlers from ${shapeName}`);

          // Add high-priority click handler that stops propagation IMMEDIATELY
          // Using function() instead of arrow function for proper 'this' context
          console.log(`   📌 ADDING CLICK HANDLER to ${shapeName}...`);
          layer.on('click', function(this: any, e: any) {
            // CRITICAL: Stop propagation FIRST - before any other code
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🎯 SHAPE CLICKED ON MAP LAYER!');
            console.log(`   Shape ID: ${this.options.shapeId}`);
            console.log(`   Shape name: ${shapeName}`);
            console.log(`   Layer type: ${this.constructor.name}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            // Disable editing on all other layers first
            console.log('🔄 Disabling editing on all other layers...');
            drawLayer.current.eachLayer((otherLayer: any) => {
              if (otherLayer instanceof L.Polygon || otherLayer instanceof L.Rectangle || otherLayer instanceof L.Circle) {
                if (typeof otherLayer.disableEdit === 'function') {
                  try {
                    otherLayer.disableEdit();
                    // Reset style
                    if (otherLayer.setStyle) {
                      otherLayer.setStyle({
                        color: '#3b82f6',
                        weight: 2,
                        fillColor: '#3b82f6',
                        fillOpacity: 0.2,
                      });
                    }
                  } catch (err) {
                    console.warn('   Failed to disable editing:', err);
                  }
                }
              }
            });
            console.log('   ✓ Other layers editing disabled');

            // Set selected shape
            console.log(`🎯 Setting selected shape: ${this.options.shapeId}`);
            setSelectedShapeId(this.options.shapeId);

            // Highlight the selected layer
            console.log('🌟 Highlighting selected layer...');
            if (this.setStyle) {
              this.setStyle({
                color: '#f59e0b', // Amber/yellow
                weight: 4,
                fillColor: '#fbbf24',
                fillOpacity: 0.35,
              });
              console.log('   ✓ Layer highlighted with yellow glow');
            }

            // NO enableEdit() - shapes only editable when Edit Shapes mode is active

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✅ SHAPE SELECTION COMPLETE');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            // Return false to completely stop event propagation
            return false;
          }, layer); // Pass layer as context for proper binding

          // Verify the handler was successfully attached
          const newHandlerCount = layer._events?.click?.length || 0;
          if (newHandlerCount > 0) {
            console.log(`   ✅ HANDLER SUCCESSFULLY ATTACHED - ${newHandlerCount} click handler(s) now registered`);
          } else {
            console.error(`   ❌ HANDLER NOT ATTACHED - no click handlers found!`);
          }
        }
      });

      if (shapeLayerCount === 0) {
        console.warn('⚠️  No shape layers found on map!');
      } else {
        console.log(`✓ Click handlers added to ${shapeLayerCount} actual map layers`);
      }

      // ESC key to exit mode
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          console.log('⌨️  ESC pressed - exiting Edit Shapes mode');
          toggleEditShapesVertices();
        }
      };
      window.addEventListener('keydown', handleEscape);
      console.log('✓ ESC handler registered');

      // NEW APPROACH: Handle all clicks at map level, use geometric hit testing to find clicked shape
      map.current.on('click', (e: any) => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🗺️  MAP CLICK HANDLER - Geometric Hit Testing');
        console.log('   Clicked at:', e.latlng);

        const clickedPoint = e.latlng;
        let clickedLayer: any = null;
        let clickedShapeId: string | null = null;

        // Check each shape to see if click was inside it
        drawLayer.current.eachLayer((layer: any) => {
          if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
            // For polygons/rectangles: check if point is inside bounds
            if (layer.getBounds && layer.getBounds().contains(clickedPoint)) {
              // For more precise hit testing on polygons, we could use turf.booleanPointInPolygon
              // But bounds check is sufficient for now
              const shapeId = layer.options?.shapeId;
              if (shapeId) {
                console.log('   ✅ CLICKED INSIDE POLYGON/RECTANGLE:', shapeId);
                clickedLayer = layer;
                clickedShapeId = shapeId;
              }
            }
          } else if (layer instanceof L.Circle) {
            // For circles: check distance from center
            if (layer.getLatLng && layer.getRadius) {
              const distance = clickedPoint.distanceTo(layer.getLatLng());
              if (distance <= layer.getRadius()) {
                const shapeId = layer.options?.shapeId;
                if (shapeId) {
                  console.log('   ✅ CLICKED INSIDE CIRCLE:', shapeId);
                  clickedLayer = layer;
                  clickedShapeId = shapeId;
                }
              }
            }
          }
        });

        if (clickedLayer && clickedShapeId) {
          console.log('   🎯 Shape clicked via geometric hit testing:', clickedShapeId);

          // Set as selected shape
          setSelectedShapeId(clickedShapeId);

          // Disable editing on all other layers
          drawLayer.current.eachLayer((layer: any) => {
            if (layer instanceof L.Polygon || layer instanceof L.Rectangle || layer instanceof L.Circle) {
              if (layer !== clickedLayer) {
                // Clean up rectangle corner handles if this is a rectangle
                if (layer instanceof L.Rectangle && layer._cornerHandles) {
                  layer._cornerHandles.forEach((handle: any) => {
                    if (drawLayer.current?.hasLayer(handle)) {
                      drawLayer.current.removeLayer(handle);
                    }
                  });
                  layer._cornerHandles = [];
                }

                // Disable Leaflet Editable editing
                if (typeof layer.disableEdit === 'function') {
                  try {
                    layer.disableEdit();
                    if (layer.setStyle) {
                      layer.setStyle({
                        color: '#3b82f6',
                        weight: 2,
                        fillColor: '#3b82f6',
                        fillOpacity: 0.2,
                      });
                    }
                  } catch (err) {
                    console.warn('Failed to disable editing on other layer:', err);
                  }
                }
              }
            }
          });

          // Highlight clicked layer
          if (clickedLayer.setStyle) {
            clickedLayer.setStyle({
              color: '#f59e0b',
              weight: 4,
              fillColor: '#fbbf24',
              fillOpacity: 0.35,
            });
          }

          // Enable editing on clicked layer - different behavior for rectangles vs polygons
          console.log('   Layer type:', clickedLayer.constructor.name);

          if (clickedLayer instanceof L.Rectangle) {
            // RECTANGLE: Use custom resize behavior with corner handles
            console.log('   📐 Editing rectangle - using resize behavior');
            setupRectangleResizing(clickedLayer, clickedShapeId);
          } else if (clickedLayer instanceof L.Polygon) {
            // POLYGON: NO enableEdit() - shapes only editable when Edit Shapes mode is active
            console.log('   🔷 Polygon selected');
          } else if (clickedLayer instanceof L.Circle) {
            // CIRCLE: NO enableEdit() - shapes only editable when Edit Shapes mode is active
            console.log('   ⭕ Circle selected');
          }

          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          return; // Don't deselect
        }

        // If we get here, clicked outside shapes
        console.log('   🖱️  Clicked outside shapes - deselecting');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        setSelectedShapeId(null);

        // Disable editing on all layers
        drawLayer.current.eachLayer((layer: any) => {
          if (layer instanceof L.Polygon || layer instanceof L.Rectangle || layer instanceof L.Circle) {
            // Clean up rectangle corner handles if this is a rectangle
            if (layer instanceof L.Rectangle && layer._cornerHandles) {
              layer._cornerHandles.forEach((handle: any) => {
                if (drawLayer.current?.hasLayer(handle)) {
                  drawLayer.current.removeLayer(handle);
                }
              });
              layer._cornerHandles = [];
            }

            // Disable Leaflet Editable editing
            if (typeof layer.disableEdit === 'function') {
              try {
                layer.disableEdit();
                if (layer.setStyle) {
                  layer.setStyle({
                    color: '#3b82f6',
                    weight: 2,
                    fillColor: '#3b82f6',
                    fillOpacity: 0.2,
                  });
                }
              } catch (err) {
                console.warn('Failed to disable editing:', err);
              }
            }
          }
        });
      });
      console.log('✓ Map click handler registered (with debug logging)');

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Edit Shapes mode ACTIVATED - Click any shape to edit');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
  };

  // Show vertex handles for editing
  const showVertexHandles = (shape: DrawnShape) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 Creating vertex handles for shape:', shape.name);
    console.log('   Shape type:', shape.shapeType);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!map.current || !drawLayer.current) {
      console.log('❌ Cannot create handles: map or drawLayer not available');
      return;
    }

    // Remove existing handles
    console.log(`  Removing ${vertexHandles.length} existing handles...`);
    vertexHandles.forEach(handle => {
      if (map.current?.hasLayer(handle)) {
        map.current.removeLayer(handle);
      }
    });

    const newHandles: L.CircleMarker[] = [];

    if (shape.shapeType === 'circle') {
      // For circles, show handle on edge to resize
      console.log('  Creating circle radius handle...');
      const center = shape.layer.getLatLng();
      const radius = shape.layer.getRadius();
      const handlePos = L.latLng(center.lat, center.lng + radius / 111320); // Convert meters to degrees

      const handle = L.circleMarker(handlePos, {
        radius: 8,
        fillColor: 'white',
        fillOpacity: 1,
        color: '#3B82F6',
        weight: 2,
        className: 'vertex-handle'
      }).addTo(map.current);

      console.log('  Circle handle created at:', { lat: handlePos.lat, lng: handlePos.lng });

      // Drag handler for circle radius
      handle.on('mousedown', (e: L.LeafletMouseEvent) => {
        console.log('🔄 Dragging circle radius handle');
        L.DomEvent.stopPropagation(e);
        setIsDraggingVertexHandle(true);
        setDraggedVertexHandleIndex(0);

        const onMove = (moveE: L.LeafletMouseEvent) => {
          const newRadius = center.distanceTo(moveE.latlng);
          console.log('  New radius:', newRadius.toFixed(2), 'meters');
          shape.layer.setRadius(newRadius);
          handle.setLatLng(L.latLng(center.lat, center.lng + newRadius / 111320));

          // Update dimension label in real-time
          updateShapeDimensionLabels(shape.id, shape.layer);
        };

        const onUp = async () => {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🏁 Circle resize complete, saving changes');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

          map.current?.off('mousemove', onMove);
          map.current?.off('mouseup', onUp);
          setIsDraggingVertexHandle(false);
          setDraggedVertexHandleIndex(null);

          // Save to database
          const newRadius = shape.layer.getRadius();
          const area = Math.PI * newRadius * newRadius * 10.764; // to sq ft
          const perimeter = 2 * Math.PI * newRadius * 3.28084; // to feet
          const center = shape.layer.getLatLng();

          console.log('  New area:', Math.round(area), 'sq ft');
          console.log('  New perimeter:', Math.round(perimeter), 'ft');

          try {
            console.log('  Sending PATCH request to API...');
            await fetch(`/api/projects/${projectId}/shapes/${shape.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                coordinates: [center.lng, center.lat],
                area: Math.round(area),
                perimeter: Math.round(perimeter)
              })
            });

            setDrawnShapes(prev => prev.map(s =>
              s.id === shape.id ? { ...s, area: Math.round(area), perimeter: Math.round(perimeter) } : s
            ));

            console.log('✅ Circle updated successfully');
            toast.success('Circle updated');
          } catch (error) {
            console.error('❌ Error updating circle:', error);
            toast.error('Failed to update circle');
          }
        };

        map.current?.on('mousemove', onMove);
        map.current?.on('mouseup', onUp);
      });

      newHandles.push(handle);
    } else {
      // For polygons/rectangles, show vertex handles
      const latLngs = shape.layer.getLatLngs()[0];
      console.log(`  Creating ${latLngs.length} vertex handles...`);

      latLngs.forEach((latLng: L.LatLng, index: number) => {
        const handle = L.circleMarker(latLng, {
          radius: 8,
          fillColor: 'white',
          fillOpacity: 1,
          color: '#3B82F6',
          weight: 2,
          className: 'vertex-handle'
        }).addTo(map.current!);

        // Drag handler for vertex
        handle.on('mousedown', (e: L.LeafletMouseEvent) => {
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`🔄 Dragging vertex ${index} of ${shape.name}`);
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

          L.DomEvent.stopPropagation(e);
          setIsDraggingVertexHandle(true);
          setDraggedVertexHandleIndex(index);

          const onMove = (moveE: L.LeafletMouseEvent) => {
            const snappedPos = snapToGuides(moveE.latlng);
            console.log(`  Moving vertex ${index} to:`, { lat: snappedPos.lat.toFixed(6), lng: snappedPos.lng.toFixed(6) });
            latLngs[index] = snappedPos;
            shape.layer.setLatLngs([latLngs]);
            handle.setLatLng(snappedPos);

            // Update dimension labels in real-time
            updateShapeDimensionLabels(shape.id, shape.layer);
          };

          const onUp = async () => {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🏁 Vertex drag complete, saving changes');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            map.current?.off('mousemove', onMove);
            map.current?.off('mouseup', onUp);
            setIsDraggingVertexHandle(false);
            setDraggedVertexHandleIndex(null);

            // Recalculate area and perimeter
            const coords = latLngs.map((ll: L.LatLng) => [ll.lng, ll.lat]);
            const closedCoords = ensureClosedPolygon(coords);
            const polygon = turf.polygon([closedCoords]);
            const areaMeters = turf.area(polygon);
            const areaSqFt = areaMeters * 10.764;
            const perimeterMeters = turf.length(turf.polygonToLine(polygon), { units: 'meters' });
            const perimeterFeet = perimeterMeters * 3.28084;

            console.log('  New area:', Math.round(areaSqFt), 'sq ft');
            console.log('  New perimeter:', Math.round(perimeterFeet), 'ft');

            // Save to database
            try {
              console.log('  Sending PATCH request to API...');
              await fetch(`/api/projects/${projectId}/shapes/${shape.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  coordinates: [closedCoords],
                  area: Math.round(areaSqFt),
                  perimeter: Math.round(perimeterFeet)
                })
              });

              setDrawnShapes(prev => prev.map(s =>
                s.id === shape.id ? { ...s, area: Math.round(areaSqFt), perimeter: Math.round(perimeterFeet) } : s
              ));

              console.log('✅ Shape updated successfully');
              toast.success('Shape updated');
            } catch (error) {
              console.error('❌ Error updating shape:', error);
              toast.error('Failed to update shape');
            }
          };

          map.current?.on('mousemove', onMove);
          map.current?.on('mouseup', onUp);
        });

        // Delete vertex with Delete key (min 3 vertices for polygons)
        handle.on('click', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          // Select this vertex
        });

        newHandles.push(handle);
      });

      // TODO: Add click on edges to add new vertex
    }

    console.log(`✅ Created ${newHandles.length} vertex handles`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    setVertexHandles(newHandles);
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
        liveDistanceLabel = L.marker([currentPos.lat, currentPos.lng], {
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

  // Building Sketches Image Overlay
  useEffect(() => {
    if (!map.current || !parcelData?.buildingSketchesImage) return;

    // Create overlay if it doesn't exist
    if (!sketchesOverlay && showBuildingSketches && boundaryCoords.length > 0) {
      try {
        // Calculate bounds from parcel boundary
        const latLngs = boundaryCoords.map(coord => L.latLng(coord[0], coord[1]));
        const bounds = L.latLngBounds(latLngs);

        // Create image overlay with base64 data
        const imageUrl = parcelData.buildingSketchesImage.startsWith('data:')
          ? parcelData.buildingSketchesImage
          : `data:image/png;base64,${parcelData.buildingSketchesImage}`;

        const overlay = L.imageOverlay(imageUrl, bounds, {
          opacity: sketchesOpacity,
          interactive: true,
          className: 'building-sketches-overlay'
        });

        overlay.addTo(map.current);

        // Make overlay draggable
        let isDragging = false;
        let dragStartLatLng: L.LatLng | null = null;
        let overlayBounds: L.LatLngBounds | null = null;

        const overlayElement = overlay.getElement();
        if (overlayElement) {
          overlayElement.style.cursor = 'move';

          overlayElement.addEventListener('mousedown', (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            isDragging = true;
            dragStartLatLng = map.current!.mouseEventToLatLng(e);
            overlayBounds = overlay.getBounds();
            map.current!.dragging.disable();
            overlayElement.style.cursor = 'grabbing';
          });

          const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !dragStartLatLng || !overlayBounds) return;

            const currentLatLng = map.current!.mouseEventToLatLng(e);
            const latDiff = currentLatLng.lat - dragStartLatLng.lat;
            const lngDiff = currentLatLng.lng - dragStartLatLng.lng;

            const newBounds = L.latLngBounds(
              L.latLng(overlayBounds.getSouth() + latDiff, overlayBounds.getWest() + lngDiff),
              L.latLng(overlayBounds.getNorth() + latDiff, overlayBounds.getEast() + lngDiff)
            );

            overlay.setBounds(newBounds);
          };

          const handleMouseUp = () => {
            if (isDragging) {
              isDragging = false;
              dragStartLatLng = null;
              overlayBounds = null;
              map.current!.dragging.enable();
              overlayElement.style.cursor = 'move';
            }
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);

          // Store cleanup function on the overlay
          (overlay as any)._dragCleanup = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
        }

        setSketchesOverlay(overlay);

        toast.success('Building sketches overlay loaded - drag to reposition');
      } catch (error) {
        console.error('Error creating building sketches overlay:', error);
        toast.error('Failed to load building sketches');
      }
    }

    // Update visibility
    if (sketchesOverlay) {
      if (showBuildingSketches && map.current.hasLayer(sketchesOverlay)) {
        // Already visible, do nothing
      } else if (showBuildingSketches && !map.current.hasLayer(sketchesOverlay)) {
        sketchesOverlay.addTo(map.current);
      } else if (!showBuildingSketches && map.current.hasLayer(sketchesOverlay)) {
        map.current.removeLayer(sketchesOverlay);
      }
    }

    // Cleanup
    return () => {
      if (sketchesOverlay) {
        // Clean up drag listeners
        if ((sketchesOverlay as any)._dragCleanup) {
          (sketchesOverlay as any)._dragCleanup();
        }
        if (map.current) {
          map.current.removeLayer(sketchesOverlay);
        }
      }
    };
  }, [showBuildingSketches, parcelData?.buildingSketchesImage, boundaryCoords]);

  // Update sketches overlay opacity
  useEffect(() => {
    if (sketchesOverlay) {
      sketchesOverlay.setOpacity(sketchesOpacity);
    }
  }, [sketchesOpacity, sketchesOverlay]);

  // Auto-create building section shapes when building sketches overlay is shown
  useEffect(() => {
    if (showBuildingSketches &&
        !autoCreatedBuildingSections &&
        parcelData?.buildingSections &&
        Array.isArray(parcelData.buildingSections) &&
        parcelData.buildingSections.length > 0 &&
        boundaryCoords.length > 0) {
      console.log('🏗️ Auto-creating building section shapes from assessor data...');
      autoCreateBuildingShapes();
    }

    // Reset flag when overlay is hidden (allows re-import if user wants)
    if (!showBuildingSketches && autoCreatedBuildingSections) {
      setAutoCreatedBuildingSections(false);
    }
  }, [showBuildingSketches, autoCreatedBuildingSections, parcelData?.buildingSections, boundaryCoords, autoCreateBuildingShapes]);

  // Toggle move shapes mode - ENHANCED with custom drag functionality
  // Toggle Move Shapes mode - Handle-based interaction
  const toggleShapeEditing = () => {
    console.log('🔘 BUTTON CLICKED: Move Shapes button');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 TOGGLE MOVE SHAPES MODE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!map.current || !drawLayer.current) {
      console.log('❌ Cannot toggle: map or drawLayer not available');
      return;
    }

    console.log('Current isEditingShapes state:', isEditingShapes);
    console.log('Total drawn shapes:', drawnShapes.length);

    if (isEditingShapes) {
      // Exit Move mode
      console.log('🚪 Exiting Move Shapes mode');
      setIsEditingShapes(false);
      setSelectedShapeId(null);

      // Remove all move handles
      removeAllHandles();

      console.log('✅ Move Shapes mode disabled');
    } else {
      // Enter Move mode
      console.log('🚀 Entering Move Shapes mode');
      setIsEditingShapes(true);

      // Create center move handle for each shape
      const newHandles: L.Marker[] = [];
      drawnShapes.forEach((shape, index) => {
        console.log(`  Creating move handle for shape ${index + 1}: ${shape.name}`);
        const handle = createMoveHandle(shape);
        if (handle) {
          newHandles.push(handle);
        }
      });

      setMoveHandles(newHandles);
      console.log(`✅ Created ${newHandles.length} move handles`);
      console.log('✅ Move Shapes mode enabled');
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

  const deleteShape = useCallback(async (shapeId: string) => {
    console.log('>>> deleteShape called with ID:', shapeId);
    console.log('>>> Current drawnShapes:', drawnShapes.map(s => s.id));
    const shapeToDelete = drawnShapes.find(s => s.id === shapeId);
    console.log('>>> Found shape to delete?', shapeToDelete ? 'YES' : 'NO');
    if (!shapeToDelete) {
      console.log('>>> EARLY RETURN: Shape not found in drawnShapes!');
      return;
    }
    
    // Delete from database FIRST
    try {
      const response = await fetch('/api/projects/' + projectId + '/shapes/' + shapeId, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        toast.error('Failed to delete shape');
        return;
      }
      
      // Remove only this shape's layers from the map
      if (drawLayer.current && shapeToDelete.layer) {
        drawLayer.current.removeLayer(shapeToDelete.layer);
        // Remove dimension labels
        if (shapeToDelete.dimensionLabels) {
          shapeToDelete.dimensionLabels.forEach(label => {
            drawLayer.current?.removeLayer(label);
          });
        }
        // Remove name label
        if (shapeToDelete.nameLabel && drawLayer.current) {
          drawLayer.current.removeLayer(shapeToDelete.nameLabel);
        }
        // Remove delete button if it exists (it's a Leaflet marker now)
        if ((shapeToDelete as any).deleteButton) {
          const btn = (shapeToDelete as any).deleteButton;
          if (btn && drawLayer.current) {
            drawLayer.current.removeLayer(btn);
            console.log('>>> Removed delete button marker from map');
          }
        }
      }
      
      // Update state to remove only this shape
      setDrawnShapes(prev => prev.filter(s => s.id !== shapeId));

      // Clear selection if this shape was selected
      if (selectedShapeId === shapeId) {
        setSelectedShapeId(null);
      }

      toast.success('Shape deleted');
      
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete shape');
    }
  }, [drawnShapes, projectId, drawLayer]);

  // Keep ref in sync with deleteShape
  useEffect(() => {
    deleteShapeRef.current = deleteShape;
  }, [deleteShape]);

  // Copy selected shape to clipboard
  const copySelectedShape = useCallback(() => {
    if (!selectedShapeId) return;

    const shapeToCopy = drawnShapes.find(s => s.id === selectedShapeId);
    if (!shapeToCopy) return;

    // Get coordinates from the layer
    let coordinates;
    if (shapeToCopy.shapeType === 'circle') {
      const center = shapeToCopy.layer.getLatLng();
      coordinates = [center.lng, center.lat];
    } else {
      const latLngs = shapeToCopy.layer.getLatLngs()[0];
      coordinates = [latLngs.map((ll: L.LatLng) => [ll.lng, ll.lat])];
    }

    setCopiedShape({
      name: shapeToCopy.name,
      shapeType: shapeToCopy.shapeType || 'polygon',
      coordinates,
      area: shapeToCopy.area,
      perimeter: shapeToCopy.perimeter,
    });

    toast.success('Shape copied');
  }, [selectedShapeId, drawnShapes]);

  // Paste copied shape with offset
  const pasteShape = useCallback(async () => {
    if (!copiedShape || !map.current || !drawLayer.current) return;

    try {
      // Calculate offset (~7 feet in lat/lng degrees)
      // At Phoenix latitude (33°N), 1 degree lat ≈ 364,000 feet, 1 degree lng ≈ 305,000 feet
      const latOffset = 7 / 364000; // ~7 feet south
      const lngOffset = 7 / 305000; // ~7 feet east

      // Offset coordinates
      let offsetCoordinates;
      if (copiedShape.shapeType === 'circle') {
        offsetCoordinates = [
          copiedShape.coordinates[0] + lngOffset,
          copiedShape.coordinates[1] - latOffset
        ];
      } else {
        offsetCoordinates = [
          copiedShape.coordinates[0].map((coord: [number, number]) => [
            coord[0] + lngOffset,
            coord[1] - latOffset
          ])
        ];
      }

      // Generate new name with "(Copy)" suffix
      const copyMatch = copiedShape.name.match(/^(.*?)(?: \(Copy(?: \d+)?\))?$/);
      const baseName = copyMatch ? copyMatch[1] : copiedShape.name;

      // Find existing copies to number them
      const existingCopies = drawnShapes.filter(s =>
        s.name.startsWith(baseName + ' (Copy')
      );

      let newName;
      if (existingCopies.length === 0) {
        newName = baseName + ' (Copy)';
      } else {
        newName = baseName + ` (Copy ${existingCopies.length + 1})`;
      }

      // Ensure polygon coordinates are closed before saving to database
      let coordinatesToSave = offsetCoordinates;
      if (copiedShape.shapeType !== 'circle') {
        coordinatesToSave = [ensureClosedPolygon(offsetCoordinates[0])];
      }

      // Save to database
      const response = await fetch(`/api/projects/${projectId}/shapes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          shapeType: copiedShape.shapeType,
          coordinates: coordinatesToSave,
          area: Math.round(copiedShape.area),
          perimeter: Math.round(copiedShape.perimeter)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save pasted shape');
      }

      const data = await response.json();
      const newShapeId = data.shape.id;

      // Create layer on map
      let layer;
      let dimensionLabels;

      if (copiedShape.shapeType === 'circle') {
        const radius = copiedShape.perimeter / (2 * Math.PI) / 3.28084;
        layer = L.circle([offsetCoordinates[1], offsetCoordinates[0]], {
          radius: radius,
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.3
        });

        const diameterFeet = (radius * 2) * 3.28084;
        dimensionLabels = [L.marker([offsetCoordinates[1], offsetCoordinates[0]], {
          icon: L.divIcon({
            className: 'dimension-label',
            html: `<div style="background: linear-gradient(to bottom, #ffffff, #f8fafc); border: 1.5px solid rgba(59, 130, 246, 0.5); border-radius: 6px; padding: 3px 8px; font-size: 11px; font-weight: 500; color: #1e40af; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06); white-space: nowrap; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);">⌀ ${formatFeetInches(diameterFeet)}</div>`,
            iconSize: [60, 22],
            iconAnchor: [30, 11]
          }),
          interactive: false
        })];
      } else {
        const coords = offsetCoordinates[0].map((coord: any) => [coord[1], coord[0]]);
        // Ensure coordinates are properly closed for Leaflet
        const closedCoords = ensureClosedPolygon(coords);
        layer = L.polygon(closedCoords, {
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.3
        });

        const labelResult = createDimensionLabels(coords);
        dimensionLabels = labelResult.labels;
        const isSmallShape = labelResult.isSmallShape;

        if (!isSmallShape) {
          dimensionLabels.forEach(label => drawLayer.current?.addLayer(label));
        }

        if (isSmallShape) {
          layer.on('mouseover', () => {
            dimensionLabels.forEach(label => {
              if (drawLayer.current && !drawLayer.current.hasLayer(label)) {
                drawLayer.current.addLayer(label);
              }
            });
          });

          layer.on('mouseout', () => {
            dimensionLabels.forEach(label => {
              if (drawLayer.current && drawLayer.current.hasLayer(label)) {
                drawLayer.current.removeLayer(label);
              }
            });
          });
        }
      }

      // Store dimension labels on layer to avoid stale state issues
      layer._dimensionLabels = dimensionLabels;

      drawLayer.current.addLayer(layer);

      // Add click handler
      layer.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        setSelectedShapeId(newShapeId);
      });

      // Create delete button
      const bounds = layer.getBounds();
      const topLeft = bounds.getNorthWest();

      const deleteBtn = L.marker([topLeft.lat, topLeft.lng], {
        icon: L.divIcon({
          className: 'shape-delete-button',
          html: '<div style="color: #dc2626; cursor: pointer; font-weight: 900; font-size: 24px; text-shadow: 0 0 3px white, 0 0 5px white; pointer-events: auto; z-index: 10000; line-height: 1;">×</div>',
          iconSize: [32, 32],
          iconAnchor: [24, 24]
        }),
        zIndexOffset: 1000
      }).addTo(drawLayer.current);

      (deleteBtn as any).shapeId = newShapeId;

      deleteBtn.on('click', async (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        const shapeId = (e.target as any).shapeId;
        if (shapeId && deleteShapeRef.current) {
          await deleteShapeRef.current(shapeId);
        }
      });

      // Create and add name label
      const nameLabel = createShapeNameLabel(layer, newName);
      if (nameLabel && drawLayer.current) {
        nameLabel.addTo(drawLayer.current);
      }

      // Add to state
      setDrawnShapes(prev => [...prev, {
        id: newShapeId,
        name: newName,
        area: copiedShape.area,
        perimeter: copiedShape.perimeter,
        layer: layer,
        dimensionLabels: dimensionLabels,
        nameLabel: nameLabel,
        shapeType: copiedShape.shapeType,
        deleteButton: deleteBtn
      } as any]);

      // Auto-select the pasted shape
      setSelectedShapeId(newShapeId);

      // Brief highlight animation (selection will show yellow glow)
      toast.success('Shape pasted');

    } catch (error) {
      console.error('Error pasting shape:', error);
      toast.error('Failed to paste shape');
    }
  }, [copiedShape, drawnShapes, projectId, map, drawLayer]);
  const clearDrawings = () => {
    drawLayer.current?.clearLayers();
    setViolations([]);
    setDrawnShapes([]);
    setSelectedShapeId(null);
  };

  // Precision mode functions for zoom-lock measurements
  const enterPrecisionMode = () => {
    if (!map.current) return;

    const currentZoom = map.current.getZoom();
    const optimalZoom = 20; // Optimal zoom for Phoenix latitude

    // Save current zoom and zoom to optimal level
    setLockedZoom(currentZoom);
    map.current.setZoom(optimalZoom, { animate: true });

    // Calculate scale factor: pixels to feet at this zoom level
    // Formula: 156543.03392 * cos(latitude) / (2^zoom) * 3.28084 (meters to feet)
    const center = map.current.getCenter();
    const latitude = center.lat;
    const metersPerPixel = 156543.03392 * Math.cos(latitude * Math.PI / 180) / Math.pow(2, optimalZoom);
    const feetPerPixel = metersPerPixel * 3.28084;

    setPixelsToFeet(feetPerPixel);
    setPrecisionMode(true);

    // Disable zoom controls
    map.current.touchZoom.disable();
    map.current.scrollWheelZoom.disable();
    map.current.doubleClickZoom.disable();
    map.current.boxZoom.disable();

    console.log(`🎯 Precision Mode: 1 pixel = ${feetPerPixel.toFixed(3)} feet at zoom ${optimalZoom}`);
    toast.info('Precision Mode Active - Zoom locked for accurate measurements');
  };

  const exitPrecisionMode = () => {
    if (!map.current) return;

    // Re-enable zoom controls
    map.current.touchZoom.enable();
    map.current.scrollWheelZoom.enable();
    map.current.doubleClickZoom.enable();
    map.current.boxZoom.enable();

    setPrecisionMode(false);
    setPixelsToFeet(null);

    console.log('👁️ View Mode: Zoom controls enabled');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle mode changes with precision mode
  const handleModeChange = (newMode: 'view' | 'edit' | 'draw' | 'measure') => {
    // Auto-exit Edit Shapes mode when switching away from Edit/Draw
    if (newMode !== 'edit' && newMode !== 'draw' && isEditShapesMode) {
      console.log('✏️ Auto-exiting Edit Shapes mode due to mode change');
      setIsEditShapesMode(false);

      // Re-enable map dragging
      if (map.current) {
        map.current.dragging?.enable();
      }

      // Disable editing on all shapes
      drawnShapes.forEach(shape => {
        if (typeof (shape.layer as any).disableEdit === 'function') {
          (shape.layer as any).disableEdit();
        }
      });
    }

    // Exit precision mode when leaving draw/measure
    if ((mode === 'draw' || mode === 'measure') && (newMode !== 'draw' && newMode !== 'measure')) {
      exitPrecisionMode();
    }

    // Enter precision mode when entering draw/measure
    if ((newMode === 'draw' || newMode === 'measure') && (mode !== 'draw' && mode !== 'measure')) {
      enterPrecisionMode();
    }

    setMode(newMode);
  };

  // Smart Shape Panel Handler Functions

  // Create dimension labels for a shape
  const createShapeDimensionLabels = (rectangle: L.Rectangle, shapeId: string) => {
    const bounds = rectangle.getBounds();
    const north = bounds.getNorth();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const west = bounds.getWest();

    // Calculate center points for labels (format: [lat, lng])
    const topCenterLat = north; // Top edge latitude
    const topCenterLng = (east + west) / 2; // Center longitude
    const rightCenterLat = (north + south) / 2; // Center latitude
    const rightCenterLng = east; // Right edge longitude

    // Validate coordinates before creating markers
    if (!isFinite(topCenterLat) || !isFinite(topCenterLng) ||
        !isFinite(rightCenterLat) || !isFinite(rightCenterLng)) {
      console.error('❌ Invalid coordinates for shape dimension labels:', {
        topCenterLat, topCenterLng, rightCenterLat, rightCenterLng,
        north, south, east, west, shapeId
      });
      return [];
    }

    console.log('✅ Creating shape dimension labels for shape:', shapeId, {
      topCenter: [topCenterLat, topCenterLng],
      rightCenter: [rightCenterLat, rightCenterLng]
    });

    // Get shape properties to display dimensions
    const props = (rectangle as any).properties;
    const width = props?.width || 0;
    const length = props?.length || 0;

    const labels: L.Marker[] = [];

    // Add width label on top
    if (width > 0) {
      console.log('  → Creating width label at:', [topCenterLat, topCenterLng], `${width}'`);
      const widthLabel = L.marker([topCenterLat, topCenterLng], {
        icon: L.divIcon({
          className: 'dimension-label',
          html: `<div style="background: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${width}'</div>`,
          iconSize: [60, 20]
        })
      });
      labels.push(widthLabel);
    }

    // Add length label on right
    if (length > 0) {
      console.log('  → Creating length label at:', [rightCenterLat, rightCenterLng], `${length}'`);
      const lengthLabel = L.marker([rightCenterLat, rightCenterLng], {
        icon: L.divIcon({
          className: 'dimension-label',
          html: `<div style="background: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${length}'</div>`,
          iconSize: [60, 20]
        })
      });
      labels.push(lengthLabel);
    }

    return labels;
  };

  // Create a centered name label for a shape
  const createShapeNameLabel = (layer: L.Rectangle | L.Circle | L.Polygon, name: string) => {
    if (!layer || !name) return null;

    let centerLat: number;
    let centerLng: number;

    // Calculate center based on layer type
    if (layer instanceof L.Circle) {
      const center = layer.getLatLng();
      centerLat = center.lat;
      centerLng = center.lng;
    } else if (layer instanceof L.Rectangle || layer instanceof L.Polygon) {
      const bounds = layer.getBounds();
      centerLat = (bounds.getNorth() + bounds.getSouth()) / 2;
      centerLng = (bounds.getEast() + bounds.getWest()) / 2;
    } else {
      return null;
    }

    // Validate coordinates
    if (!isFinite(centerLat) || !isFinite(centerLng)) {
      console.error('❌ Invalid coordinates for shape name label:', { centerLat, centerLng, name });
      return null;
    }

    // Create name label marker
    const nameLabel = L.marker([centerLat, centerLng], {
      icon: L.divIcon({
        className: 'shape-name-label',
        html: `<div style="background: rgba(239, 68, 68, 0.9); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; box-shadow: 0 2px 6px rgba(0,0,0,0.3); white-space: nowrap;">${name}</div>`,
        iconSize: [100, 24],
        iconAnchor: [50, 12]
      }),
      interactive: false,
      zIndexOffset: 500
    });

    return nameLabel;
  };

  const handleShapeDragEnd = async (shapeId: string, layer: any) => {
    try {
      console.log('💾 Saving shape position after drag:', shapeId);

      // Get new coordinates
      const geoJson = layer.toGeoJSON();

      // Update database with new position only
      const response = await fetch(`/api/projects/${projectId}/shapes/${shapeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinates: geoJson.geometry.coordinates
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update shape position');
      }

      console.log('✅ Shape position saved');

    } catch (error) {
      console.error('❌ Error updating shape position:', error);
      toast.error('Failed to update shape position');
    }
  };

  const handleRotateShape = async () => {
    const shape = drawnShapes.find(s => s.id === selectedShapeId);
    if (!shape || !shape.layer) return;

    const layer = shape.layer as L.Rectangle;
    const bounds = layer.getBounds();
    const center = bounds.getCenter();

    // Get current width and height
    const props = (layer as any).properties;
    const currentWidth = props?.width || 0;
    const currentLength = props?.length || 0;

    // Swap width and length for 90° rotation
    const latToFeet = 364000;
    const lngToFeet = 287000;
    const latOffset = (currentWidth / 2) / latToFeet;  // Swapped
    const lngOffset = (currentLength / 2) / lngToFeet; // Swapped

    // Create new bounds with rotated dimensions
    const newBounds: L.LatLngBoundsExpression = [
      [center.lat - latOffset, center.lng - lngOffset],
      [center.lat + latOffset, center.lng + lngOffset]
    ];

    layer.setBounds(newBounds);
    (layer as any).properties = {
      ...props,
      width: currentLength,
      length: currentWidth
    };

    await handleShapeDragEnd(selectedShapeId!, layer);
    toast.success('Shape rotated 90°');
  };

  const handleDuplicateShape = async () => {
    const shape = drawnShapes.find(s => s.id === selectedShapeId);
    if (!shape || !shape.layer) return;

    const layer = shape.layer as L.Rectangle;
    const props = (layer as any).properties;
    const width = props?.width || 20;
    const length = props?.length || 30;
    const label = props?.label || shape.name;

    // Create duplicate with offset
    await createShapeAtCenter(width, length, `${label} (Copy)`);
  };

  const handleDeleteShape = async () => {
    if (!selectedShapeId) return;

    const confirmed = window.confirm('Are you sure you want to delete this shape?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/shapes/${selectedShapeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete shape');

      // Remove from map
      const shape = drawnShapes.find(s => s.id === selectedShapeId);
      if (shape?.layer && drawLayer.current) {
        drawLayer.current.removeLayer(shape.layer);
      }

      // Remove dimension labels
      if (shape?.dimensionLabels && map.current) {
        shape.dimensionLabels.forEach(label => {
          map.current?.removeLayer(label);
        });
      }

      // Remove name label
      if (shape?.nameLabel && map.current) {
        map.current.removeLayer(shape.nameLabel);
      }

      // Update state
      setDrawnShapes(prev => prev.filter(s => s.id !== selectedShapeId));
      setSelectedShapeId(null);

      toast.success('Shape deleted');
    } catch (error) {
      console.error('Error deleting shape:', error);
      toast.error('Failed to delete shape');
    }
  };

  const createShapeAtCenter = async (width: number, length: number, label: string = '') => {
    console.log('🏗️ createShapeAtCenter called with:', { width, length, label });

    if (!map.current || !boundaryCoords || boundaryCoords.length === 0) {
      toast.error('Map not ready or no boundary set');
      return;
    }

    if (isNaN(width) || isNaN(length) || width <= 0 || length <= 0) {
      toast.error('Please enter valid width and length values');
      return;
    }

    // Calculate property center
    const lats = boundaryCoords.map(coord => coord[0]);
    const lngs = boundaryCoords.map(coord => coord[1]);
    const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
    const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;

    console.log('📍 Shape center:', { centerLat, centerLng });

    // Convert feet to lat/lng offsets
    const latToFeet = 364000; // Phoenix latitude
    const lngToFeet = 287000;
    const latOffset = (length / 2) / latToFeet;
    const lngOffset = (width / 2) / lngToFeet;

    // Create bounds for rectangle
    const bounds: L.LatLngBoundsExpression = [
      [centerLat - latOffset, centerLng - lngOffset],
      [centerLat + latOffset, centerLng + lngOffset]
    ];

    // Create rectangle layer
    console.log('🎨 Creating native Leaflet rectangle with bounds:', bounds);
    const rectangle = L.rectangle(bounds, {
      color: '#ef4444',
      weight: 2,
      fillOpacity: 0.1,
    });

    if (drawLayer.current) {
      try {
        console.log('➕ Adding rectangle to draw layer');
        console.log('   Rectangle bounds:', rectangle.getBounds());
        drawLayer.current.addLayer(rectangle);
        console.log('✅ Rectangle added successfully to drawLayer');
      } catch (error) {
        console.error('❌ CRITICAL ERROR in addLayer:', error);
        console.error('   Rectangle object:', rectangle);
        console.error('   DrawLayer:', drawLayer.current);
        toast.error('Failed to add shape to map - coordinate error');
        throw error; // Re-throw to stop execution
      }

      // Add metadata to layer
      try {
        console.log('📝 Adding metadata to rectangle...');
        (rectangle as any).shapeType = 'rectangle';
        (rectangle as any).shapeName = label || `Rectangle ${width}x${length}`;
        (rectangle as any).properties = { width, length, label };
        console.log('✅ Metadata added');
      } catch (error) {
        console.error('❌ Error adding metadata:', error);
        throw error;
      }

      // Calculate area and perimeter
      let geoJson, area, perimeter;
      try {
        console.log('📐 Calculating measurements...');
        geoJson = rectangle.toGeoJSON();
        console.log('✅ GeoJSON created:', geoJson);
        area = turf.area(geoJson) * 10.7639; // m² to sqft
        console.log('✅ Area calculated:', area, 'sqft');
        // Convert LatLng objects to [lng, lat] arrays for Turf.js
        const latlngs = rectangle.getLatLngs()[0] as L.LatLng[];
        console.log('   Raw LatLngs:', latlngs);
        const coords = latlngs.map(ll => [ll.lng, ll.lat]);
        console.log('   Converted coords:', coords);
        coords.push(coords[0]); // Close the ring
        perimeter = turf.length(turf.lineString(coords), { units: 'feet' });
        console.log('✅ Perimeter calculated:', perimeter, 'ft');
      } catch (error) {
        console.error('❌ Error calculating measurements:', error);
        console.error('   Rectangle LatLngs:', rectangle.getLatLngs());
        throw error;
      }

      // Save to database
      try {
        console.log('💾 Saving shape to database:', {
          name: label || `Rectangle ${width}x${length}`,
          shapeType: 'rectangle',
          area: Math.round(area),
          perimeter: Math.round(perimeter)
        });

        const response = await fetch(`/api/projects/${projectId}/shapes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: label || `Rectangle ${width}x${length}`,
            shapeType: 'rectangle',
            coordinates: geoJson.geometry.coordinates,  // Save ONLY the coordinates array, not full GeoJSON
            area,
            perimeter,
            properties: {
              width,
              length,
              label
            }
          }),
        });

        if (!response.ok) throw new Error('Failed to save shape');

        const responseData = await response.json();
        console.log('✅ Raw API response:', responseData);
        const savedShape = responseData.shape || responseData; // Handle both {shape: {...}} and {...} formats
        console.log('✅ Extracted shape data:', {
          id: savedShape.id,
          name: savedShape.name,
          area: savedShape.area,
          perimeter: savedShape.perimeter
        });

        // ⚠️ TEMPORARY: Label creation removed for debugging
        // This allows us to verify shapes save and appear in Drawn Shapes card
        // Once that's working, we can add labels back
        console.log('⚠️ SKIPPING label creation (temporary debug mode)');
        const dimensionLabels: L.Marker[] = [];
        const nameLabel: L.Marker | null = null;

        console.log('📌 Continuing with state update (no labels)...');

        // NO enableEdit() - shapes only draggable when Edit Shapes mode active

        // Add to drawnShapes state - THIS IS CRITICAL FOR UI UPDATE
        console.log('📊 Adding shape to drawnShapes state. Current count:', drawnShapes.length);
        console.log('📊 Shape data:', { id: savedShape.id, name: savedShape.name, hasLayer: !!rectangle });

        try {
          setDrawnShapes(prev => {
            const newShapes = [...prev, {
              id: savedShape.id,
              name: savedShape.name,
              area: savedShape.area,
              perimeter: savedShape.perimeter,
              layer: rectangle,
              dimensionLabels,
              nameLabel,
              shapeType: 'rectangle'
            }];
            console.log('✅ State updated! New shapes count:', newShapes.length);
            console.log('✅ Shape IDs:', newShapes.map(s => s.id));
            return newShapes;
          });
          console.log('✅ setDrawnShapes called successfully');
        } catch (error) {
          console.error('❌ CRITICAL: Failed to update drawnShapes state:', error);
        }

        // Enable dragging via Leaflet.Editable
        rectangle.on('editable:dragend', async (e: any) => {
          console.log('🔄 Shape dragged:', savedShape.id);
          const layer = e.target;
          await handleShapeDragEnd(savedShape.id, layer);
        });

        // Enable selection
        rectangle.on('click', () => {
          console.log('🖱️ Shape clicked:', savedShape.id);
          setSelectedShapeId(savedShape.id);
        });

        toast.success(`Added ${label || 'shape'} to map`);

      } catch (error) {
        console.error('Error saving shape:', error);
        toast.error('Failed to save shape');
        drawLayer.current.removeLayer(rectangle);
      }
    }
  };

  const updateShapeDimensions = async (shapeId: string, newWidth: number, newLength: number) => {
    try {
      // Find the shape
      const shapeIndex = drawnShapes.findIndex(s => s.id === shapeId);
      if (shapeIndex === -1) {
        console.error('❌ Error: Shape not found');
        return;
      }

      const shape = drawnShapes[shapeIndex];
      const layer = shape.layer as L.Rectangle;

      console.log('🔄 Resizing shape:', shape.name, 'to', newWidth, 'x', newLength);

      // Get current center and dimensions
      const bounds = layer.getBounds();
      const center = bounds.getCenter();

      console.log('📏 Input dimensions:', { newWidth, newLength });

      // Get current bounds to understand orientation
      const currentBounds = layer.getBounds();
      const currentNorthSouth = currentBounds.getNorth() - currentBounds.getSouth();
      const currentEastWest = currentBounds.getEast() - currentBounds.getWest();

      console.log('📏 Current shape spans:', {
        northSouth: currentNorthSouth,
        eastWest: currentEastWest
      });

      // Determine which dimension is which based on current orientation
      // Rectangles are usually wider than tall, so:
      // - If east-west > north-south: width = east-west, length = north-south
      // - If north-south > east-west: width = north-south, length = east-west

      const isHorizontal = currentEastWest > currentNorthSouth;

      // Phoenix area conversion factors
      const latToFeet = 364000;  // 1 degree latitude ≈ 364,000 feet
      const lngToFeet = 287000;  // 1 degree longitude ≈ 287,000 feet at 33.5°N

      let latOffset, lngOffset;

      if (isHorizontal) {
        // Shape is wider (east-west) than tall (north-south)
        // Width = east-west (longitude), Length = north-south (latitude)
        lngOffset = (newWidth / 2) / lngToFeet;
        latOffset = (newLength / 2) / latToFeet;
        console.log('📐 Horizontal shape: Width=E-W, Length=N-S');
      } else {
        // Shape is taller (north-south) than wide (east-west)
        // Width = north-south (latitude), Length = east-west (longitude)
        latOffset = (newWidth / 2) / latToFeet;
        lngOffset = (newLength / 2) / lngToFeet;
        console.log('📐 Vertical shape: Width=N-S, Length=E-W');
      }

      console.log('📐 Applying offsets:', { latOffset, lngOffset });

      // Create new bounds centered on same point
      const south = center.lat - latOffset;
      const west = center.lng - lngOffset;
      const north = center.lat + latOffset;
      const east = center.lng + lngOffset;

      // Update rectangle coordinates
      (layer as L.Rectangle).setLatLngs([
        [south, west],
        [north, west],
        [north, east],
        [south, east]
      ]);

      // Force map to redraw
      if (map.current) {
        map.current.invalidateSize();
      }

      // Recalculate measurements
      const geoJson = layer.toGeoJSON();
      const newArea = turf.area(geoJson) * 10.7639; // m² to sqft

      // Calculate perimeter
      const latlngs = layer.getLatLngs()[0] as L.LatLng[];
      const coords = latlngs.map((ll: L.LatLng) => [ll.lng, ll.lat]);
      coords.push(coords[0]); // Close the ring
      const newPerimeter = turf.length(turf.lineString(coords), { units: 'feet' });

      // Update database
      const response = await fetch(`/api/projects/${projectId}/shapes/${shapeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinates: geoJson.geometry.coordinates,
          area: newArea,
          perimeter: newPerimeter,
          properties: { width: newWidth, length: newLength, label: shape.name }
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Update local state
      setDrawnShapes(prev => {
        const updated = [...prev];
        updated[shapeIndex] = {
          ...shape,
          area: newArea,
          perimeter: newPerimeter,
          layer: layer
        };
        return updated;
      });

      console.log('✅ Shape resized successfully');
      toast.success('Shape resized');

    } catch (error) {
      console.error('❌ Error:', error);
      toast.error('Failed to resize shape');
    }
  };

  const handleAddShapeFromInput = async () => {
    console.log('🎨 handleAddShapeFromInput called');

    if (!shapeWidth || !shapeLength) {
      toast.error('Please enter width and length');
      return;
    }

    const width = parseFloat(shapeWidth);
    const length = parseFloat(shapeLength);

    if (isNaN(width) || isNaN(length) || width <= 0 || length <= 0) {
      toast.error('Please enter valid dimensions');
      return;
    }

    console.log('🎨 Creating shape with:', { width, length, label: shapeLabel });
    console.log('🔢 Current shapes count BEFORE:', drawnShapes.length);

    // For non-rectangle shapes, show placeholder message
    if (selectedShapeType !== 'rectangle') {
      toast.info(`${selectedShapeType.toUpperCase()} builder coming soon! Using rectangle for now.`);
    }

    // Call shared creation function
    console.log('📍 Calling createShapeAtCenter...');
    await createShapeAtCenter(width, length, shapeLabel);
    console.log('✅ createShapeAtCenter complete');
    console.log('🔢 Current shapes count AFTER:', drawnShapes.length);

    // Clear inputs
    setShapeWidth('');
    setShapeLength('');
    setShapeLabel('');
  };

  const handleQuickInput = async () => {
    if (!quickInput.trim()) return;

    // Parse patterns like:
    // "51x34" or "51 x 34" or "51x34 rectangle" or "51x34 house"
    const match = quickInput.match(/(\d+\.?\d*)\s*[x×]\s*(\d+\.?\d*)/i);

    if (!match) {
      toast.error('Format: "51x34" or "51 x 34 rectangle"');
      return;
    }

    const width = parseFloat(match[1]);
    const length = parseFloat(match[2]);

    // Extract label (everything after dimensions)
    const labelMatch = quickInput.match(/(\d+\.?\d*)\s*[x×]\s*(\d+\.?\d*)\s+(.+)/i);
    const label = labelMatch ? labelMatch[3].trim() : '';

    // Clear input
    setQuickInput('');

    // Create shape directly
    await createShapeAtCenter(width, length, label);
  };

  // Template Library Data
  const shapeTemplates = {
    houses: [
      { name: 'Small House', width: 30, length: 40, sqft: 1200 },
      { name: 'Medium House', width: 40, length: 50, sqft: 2000 },
      { name: 'Large House', width: 50, length: 60, sqft: 3000 },
      { name: 'Luxury House', width: 60, length: 70, sqft: 4200 },
    ],
    garages: [
      { name: 'Single Car', width: 12, length: 20, sqft: 240 },
      { name: 'Double Car', width: 20, length: 20, sqft: 400 },
      { name: 'Triple Car', width: 30, length: 20, sqft: 600 },
      { name: 'Workshop', width: 24, length: 30, sqft: 720 },
    ],
    adu: [
      { name: 'Studio ADU', width: 20, length: 25, sqft: 500 },
      { name: '1BR ADU', width: 25, length: 30, sqft: 750 },
      { name: '2BR ADU', width: 30, length: 35, sqft: 1050 },
      { name: 'Guest House', width: 35, length: 40, sqft: 1400 },
    ],
    pools: [
      { name: 'Small Pool', width: 15, length: 30, sqft: 450 },
      { name: 'Medium Pool', width: 18, length: 36, sqft: 648 },
      { name: 'Large Pool', width: 20, length: 40, sqft: 800 },
      { name: 'Lap Pool', width: 10, length: 50, sqft: 500 },
    ],
  };

  const handleTemplateSelect = async (template: { name: string; width: number; length: number; sqft: number }) => {
    setShowTemplateLibrary(false);
    await createShapeAtCenter(template.width, template.length, template.name);
  };

  // Highlight selected shape
  useEffect(() => {
    drawnShapes.forEach(shape => {
      if (shape.layer && shape.layer.setStyle) {
        if (shape.id === selectedShapeId) {
          // Highlight selected shape
          shape.layer.setStyle({
            color: '#f59e0b',
            weight: 4,
            fillOpacity: 0.2,
          });
        } else {
          // Reset unselected shapes
          shape.layer.setStyle({
            color: '#ef4444',
            weight: 2,
            fillOpacity: 0.1,
          });
        }
      }
    });
  }, [selectedShapeId, drawnShapes]);

  // Function to create boundary dimension labels
  const createBoundaryDimensionLabels = () => {
    if (!map.current || !boundaryCoords || boundaryCoords.length === 0) return;

    // Clear existing boundary dimension labels
    boundaryDimensionLabels.current.forEach(marker => {
      if (map.current) {
        map.current.removeLayer(marker);
      }
    });
    boundaryDimensionLabels.current = [];

    // Calculate bounds from boundary coordinates
    const lats = boundaryCoords.map(coord => coord[0]);
    const lngs = boundaryCoords.map(coord => coord[1]);
    const north = Math.max(...lats);
    const south = Math.min(...lats);
    const east = Math.max(...lngs);
    const west = Math.min(...lngs);

    // Calculate distances in feet using approximate conversion for Phoenix latitude (~33°)
    const latToFeet = 364000; // Approximate conversion at ~33° latitude
    const lngToFeet = 287000;

    const heightFt = Math.abs(north - south) * latToFeet;
    const widthFt = Math.abs(east - west) * lngToFeet;

    // Calculate offset based on zoom 20 scale
    // At zoom 20, approximate scale: 0.59 ft/pixel at Phoenix latitude
    // Target: 30 pixels offset = ~18 feet in real world
    const latMid = (north + south) / 2;
    const optimalZoom = 20;
    const metersPerPixel = 156543.03392 * Math.cos(latMid * Math.PI / 180) / Math.pow(2, optimalZoom);
    const feetPerPixel = metersPerPixel * 3.28084;

    const pixelOffset = 30; // 30 pixels outside boundary
    const feetOffset = pixelOffset * feetPerPixel; // Convert to feet

    // Convert feet offset to lat/lng offset
    const latOffset = feetOffset / latToFeet;
    const lngOffset = feetOffset / lngToFeet;

    // Position labels OUTSIDE the property boundary
    const northMid: [number, number] = [north + latOffset, (east + west) / 2];
    const southMid: [number, number] = [south - latOffset, (east + west) / 2];
    const eastMid: [number, number] = [(north + south) / 2, east + lngOffset];
    const westMid: [number, number] = [(north + south) / 2, west - lngOffset];

    // Validate all coordinates before creating markers
    if (!isFinite(northMid[0]) || !isFinite(northMid[1]) ||
        !isFinite(southMid[0]) || !isFinite(southMid[1]) ||
        !isFinite(eastMid[0]) || !isFinite(eastMid[1]) ||
        !isFinite(westMid[0]) || !isFinite(westMid[1])) {
      console.error('❌ Invalid boundary dimension label coordinates:', {
        northMid, southMid, eastMid, westMid,
        north, south, east, west, latOffset, lngOffset
      });
      return;
    }

    console.log('✅ Creating boundary dimension markers at:', {
      northMid, southMid, eastMid, westMid
    });

    // Create markers for all four sides with try-catch
    const markers: L.Marker[] = [];

    try {
      const northMarker = L.marker([Number(northMid[0]), Number(northMid[1])], {
        icon: createDimensionIcon(`${widthFt.toFixed(1)} ft`, 'horizontal', 'north', viewMode),
        interactive: false,
        zIndexOffset: 1000
      }).addTo(map.current);
      markers.push(northMarker);
    } catch (error) {
      console.warn('Failed to create north boundary marker:', error, { northMid });
    }

    try {
      const southMarker = L.marker([Number(southMid[0]), Number(southMid[1])], {
        icon: createDimensionIcon(`${widthFt.toFixed(1)} ft`, 'horizontal', 'south', viewMode),
        interactive: false,
        zIndexOffset: 1000
      }).addTo(map.current);
      markers.push(southMarker);
    } catch (error) {
      console.warn('Failed to create south boundary marker:', error, { southMid });
    }

    try {
      const eastMarker = L.marker([Number(eastMid[0]), Number(eastMid[1])], {
        icon: createDimensionIcon(`${heightFt.toFixed(1)} ft`, 'vertical', 'east', viewMode),
        interactive: false,
        zIndexOffset: 1000
      }).addTo(map.current);
      markers.push(eastMarker);
    } catch (error) {
      console.warn('Failed to create east boundary marker:', error, { eastMid });
    }

    try {
      const westMarker = L.marker([Number(westMid[0]), Number(westMid[1])], {
        icon: createDimensionIcon(`${heightFt.toFixed(1)} ft`, 'vertical', 'west', viewMode),
        interactive: false,
        zIndexOffset: 1000
      }).addTo(map.current);
      markers.push(westMarker);
    } catch (error) {
      console.warn('Failed to create west boundary marker:', error, { westMid });
    }

    // Store successfully created markers in ref
    boundaryDimensionLabels.current = markers;
  };

  // Function to create buildable area dimension labels
  const createBuildableAreaDimensionLabels = () => {
    if (!map.current || !boundaryCoords || boundaryCoords.length === 0) return;

    // Calculate bounds from boundary coordinates
    const lats = boundaryCoords.map(coord => coord[0]);
    const lngs = boundaryCoords.map(coord => coord[1]);
    const north = Math.max(...lats);
    const south = Math.min(...lats);
    const east = Math.max(...lngs);
    const west = Math.min(...lngs);

    const latToFeet = 364000;
    const lngToFeet = 287000;

    // Calculate property dimensions
    const propertyHeightFt = Math.abs(north - south) * latToFeet;
    const propertyWidthFt = Math.abs(east - west) * lngToFeet;

    // Get setback values (in feet)
    const frontSetback = setbacks.front || 0;
    const rearSetback = setbacks.rear || 0;
    const leftSetback = setbacks.left || 0;
    const rightSetback = setbacks.right || 0;

    // Calculate buildable dimensions
    const buildableWidth = propertyWidthFt - leftSetback - rightSetback;
    const buildableHeight = propertyHeightFt - frontSetback - rearSetback;

    // Convert setback feet to lat/lng offsets
    const frontOffset = (frontSetback / latToFeet);
    const rearOffset = (rearSetback / latToFeet);
    const leftOffset = (leftSetback / lngToFeet);
    const rightOffset = (rightSetback / lngToFeet);

    // Calculate buildable boundary positions
    const buildableNorth = north - frontOffset;
    const buildableSouth = south + rearOffset;
    const buildableEast = east - rightOffset;
    const buildableWest = west + leftOffset;

    // Midpoints for labels on buildable boundaries
    const buildableNorthMid: [number, number] = [buildableNorth, (buildableEast + buildableWest) / 2];
    const buildableSouthMid: [number, number] = [buildableSouth, (buildableEast + buildableWest) / 2];
    const buildableEastMid: [number, number] = [(buildableNorth + buildableSouth) / 2, buildableEast];
    const buildableWestMid: [number, number] = [(buildableNorth + buildableSouth) / 2, buildableWest];

    // Validate all coordinates before creating markers
    if (!isFinite(buildableNorthMid[0]) || !isFinite(buildableNorthMid[1]) ||
        !isFinite(buildableSouthMid[0]) || !isFinite(buildableSouthMid[1]) ||
        !isFinite(buildableEastMid[0]) || !isFinite(buildableEastMid[1]) ||
        !isFinite(buildableWestMid[0]) || !isFinite(buildableWestMid[1])) {
      console.error('❌ Invalid buildable area dimension label coordinates:', {
        buildableNorthMid, buildableSouthMid, buildableEastMid, buildableWestMid,
        buildableNorth, buildableSouth, buildableEast, buildableWest,
        setbacks
      });
      return;
    }

    console.log('✅ Creating buildable area dimension markers at:', {
      buildableNorthMid, buildableSouthMid, buildableEastMid, buildableWestMid,
      buildableWidth, buildableHeight
    });

    // Create markers for buildable area dimensions with try-catch
    const markers: L.Marker[] = [];

    try {
      const northMarker = L.marker([Number(buildableNorthMid[0]), Number(buildableNorthMid[1])], {
        icon: createBuildableIcon(`${buildableWidth.toFixed(1)} ft`, 'horizontal', 'north', viewMode),
        interactive: false,
        zIndexOffset: 1000
      }).addTo(map.current);
      markers.push(northMarker);
    } catch (error) {
      console.warn('Failed to create north buildable marker:', error, { buildableNorthMid });
    }

    try {
      const southMarker = L.marker([Number(buildableSouthMid[0]), Number(buildableSouthMid[1])], {
        icon: createBuildableIcon(`${buildableWidth.toFixed(1)} ft`, 'horizontal', 'south', viewMode),
        interactive: false,
        zIndexOffset: 1000
      }).addTo(map.current);
      markers.push(southMarker);
    } catch (error) {
      console.warn('Failed to create south buildable marker:', error, { buildableSouthMid });
    }

    try {
      const eastMarker = L.marker([Number(buildableEastMid[0]), Number(buildableEastMid[1])], {
        icon: createBuildableIcon(`${buildableHeight.toFixed(1)} ft`, 'vertical', 'east', viewMode),
        interactive: false,
        zIndexOffset: 1000
      }).addTo(map.current);
      markers.push(eastMarker);
    } catch (error) {
      console.warn('Failed to create east buildable marker:', error, { buildableEastMid });
    }

    try {
      const westMarker = L.marker([Number(buildableWestMid[0]), Number(buildableWestMid[1])], {
        icon: createBuildableIcon(`${buildableHeight.toFixed(1)} ft`, 'vertical', 'west', viewMode),
        interactive: false,
        zIndexOffset: 1000
      }).addTo(map.current);
      markers.push(westMarker);
    } catch (error) {
      console.warn('Failed to create west buildable marker:', error, { buildableWestMid });
    }

    // Add successfully created markers to boundary labels ref for cleanup (they'll all be cleaned together)
    boundaryDimensionLabels.current.push(...markers);
  };

  return (
    <div className="space-y-2">
      {/* CSS for selected shape glow effect */}
      <style jsx global>{`
        .selected-shape-highlight {
          filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.6)) drop-shadow(0 0 16px rgba(245, 158, 11, 0.4));
        }
      `}</style>

      {/* Header with Title and Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Property Visualization</h2>
          <p className="text-sm text-gray-500">
            {parcelData?.address || 'Interactive map showing property boundaries'}
          </p>
        </div>
        <div className="flex items-center gap-3">
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
      </div>

      {/* Map Container */}
      <Card className={`relative ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
        <div className={`relative w-full h-[600px] overflow-hidden ${precisionMode ? 'ring-4 ring-orange-500' : ''}`}>
          <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
          
          {/* Top Center - Mode Toolbar */}
          <MapToolbar
            mode={mode}
            onModeChange={handleModeChange}
          />

          {/* Precision Mode Indicator Banner */}
          {precisionMode && (
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-[1000] bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <div>
                <div className="font-semibold">Precision Mode Active</div>
                <div className="text-xs">Scale locked at 1 pixel = {pixelsToFeet?.toFixed(3)} feet</div>
              </div>
            </div>
          )}

          {/* Edit Shapes Mode Banner */}
          {isEditShapesMode && (
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-6 py-2 rounded-full shadow-lg z-[1000] flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              <span className="font-medium">
                Edit Mode Active - Zoom locked at 1 pixel = 0.408 feet
              </span>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Bottom Left - Layer Controls */}
          <div className="absolute bottom-4 left-4 flex gap-2 z-[1000]">
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
            {(drawnShapes.length > 0 || savedMeasurements.length > 0) && (
              <Button
                size="sm"
                variant={showDimensionLabels ? 'selected' : 'outline'}
                onClick={() => setShowDimensionLabels(!showDimensionLabels)}
                className="shadow-sm"
              >
                <Ruler className="h-4 w-4 mr-2" />
                Labels
              </Button>
            )}
            {mode === 'view' && parcelData?.buildingSketchesImage && (
              <Button
                size="sm"
                variant={showBuildingSketches ? 'selected' : 'outline'}
                onClick={() => setShowBuildingSketches(!showBuildingSketches)}
                className="shadow-sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                📐 Show Sketches
              </Button>
            )}

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* View Mode Toggle Buttons */}
            <button
              onClick={() => setViewMode('satellite')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'satellite'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
              }`}
              title="Satellite View"
            >
              🛰️ Satellite
            </button>

            <button
              onClick={() => setViewMode('hybrid')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'hybrid'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
              }`}
              title="Hybrid View (OpenStreetMap with Streets & Labels)"
            >
              🔀 Hybrid
            </button>

            <button
              onClick={() => setViewMode('clean')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'clean'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
              }`}
              title="Clean Slate (Grid Only)"
            >
              📄 Clean Slate
            </button>

            {/* Separator before Edit Shapes */}
            {(mode === 'edit' || mode === 'draw') && (
              <div className="h-6 w-px bg-gray-300 mx-2"></div>
            )}

            {/* Edit Shapes Button - Only in Edit/Draw modes */}
            {(mode === 'edit' || mode === 'draw') && (
              <button
                onClick={() => {
                  setIsEditShapesMode(!isEditShapesMode);
                  if (!isEditShapesMode) {
                    // Entering Edit Shapes mode
                    console.log('✏️ Edit Shapes mode ENABLED');

                    // Enable precision mode (zoom lock at 20)
                    if (map.current) {
                      map.current.setZoom(20);
                      map.current.dragging?.disable(); // Disable map panning
                    }

                    // Variables for dragging (OUTSIDE forEach to persist)
                    let isDragging = false;
                    let dragStartLatLng: L.LatLng | null = null;
                    let dragStartBounds: L.LatLngBounds | null = null;
                    let draggedLayer: L.Rectangle | null = null;

                    // Enable simple click-and-drag on all shapes
                    drawnShapes.forEach(shape => {
                      const layer = shape.layer as L.Rectangle;

                      // Make layer interactive
                      layer.options.interactive = true;

                      // Remove existing listeners
                      layer.off('mousedown');
                      layer.off('click');

                      // Mouse down - start drag
                      layer.on('mousedown', (e: L.LeafletMouseEvent) => {
                        isDragging = true;
                        draggedLayer = layer;
                        dragStartLatLng = e.latlng;
                        dragStartBounds = layer.getBounds();

                        // Disable map dragging
                        if (map.current) {
                          map.current.dragging.disable();
                        }

                        L.DomEvent.stopPropagation(e);
                      });

                      // Click - select shape
                      layer.on('click', () => {
                        if (!isDragging) {
                          setSelectedShapeId(shape.id);
                          console.log('🖱️ Shape selected:', shape.name);
                        }
                      });

                      console.log('✏️ Shape enabled for dragging:', shape.name);
                    });

                    // Map-level handlers
                    if (map.current) {
                      const handleMouseMove = (e: L.LeafletMouseEvent) => {
                        if (!isDragging || !draggedLayer || !dragStartLatLng || !dragStartBounds) return;

                        // Calculate offset
                        const latDiff = e.latlng.lat - dragStartLatLng.lat;
                        const lngDiff = e.latlng.lng - dragStartLatLng.lng;

                        // Create new bounds
                        const south = dragStartBounds.getSouth() + latDiff;
                        const west = dragStartBounds.getWest() + lngDiff;
                        const north = dragStartBounds.getNorth() + latDiff;
                        const east = dragStartBounds.getEast() + lngDiff;

                        // Update rectangle position
                        draggedLayer.setLatLngs([
                          [south, west],
                          [north, west],
                          [north, east],
                          [south, east]
                        ]);
                      };

                      const handleMouseUp = async () => {
                        if (!isDragging) return;

                        const wasDragging = isDragging;
                        const layer = draggedLayer;

                        // Reset drag state
                        isDragging = false;
                        dragStartLatLng = null;
                        dragStartBounds = null;
                        draggedLayer = null;

                        // Re-enable map dragging
                        if (map.current) {
                          map.current.dragging.enable();
                        }

                        // Save to database if actually dragged
                        if (wasDragging && layer) {
                          const shapeId = drawnShapes.find(s => s.layer === layer)?.id;
                          if (shapeId) {
                            await handleShapeDragEnd(shapeId, layer);
                          }
                        }
                      };

                      map.current.on('mousemove', handleMouseMove);
                      map.current.on('mouseup', handleMouseUp);

                      // Store for cleanup
                      (map.current as any)._editHandlers = { handleMouseMove, handleMouseUp };
                    }
                  } else {
                    // Exiting Edit Shapes mode
                    console.log('✏️ Edit Shapes mode DISABLED');

                    // Re-enable map dragging
                    if (map.current) {
                      map.current.dragging?.enable();
                    }

                    // Disable dragging and remove handlers
                    drawnShapes.forEach(shape => {
                      const layer = shape.layer as any;
                      layer.off('mousedown');
                      layer.off('click');
                    });

                    // Remove map-level handlers
                    if (map.current && (map.current as any)._editHandlers) {
                      const { handleMouseMove, handleMouseUp } = (map.current as any)._editHandlers;
                      map.current.off('mousemove', handleMouseMove);
                      map.current.off('mouseup', handleMouseUp);
                      delete (map.current as any)._editHandlers;
                    }
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isEditShapesMode
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                title="Edit Shapes - Move and resize drawn shapes"
              >
                <Pencil className="w-4 h-4 inline mr-2" />
                Edit Shapes
              </button>
            )}
          </div>

          {/* Sketches Overlay Controls */}
          {showBuildingSketches && mode === 'view' && (
            <div className="absolute bottom-16 left-4 bg-white p-3 rounded-lg shadow-lg z-[1000] space-y-2 border border-gray-200">
              <div className="flex items-center gap-2">
                <Label htmlFor="sketches-opacity" className="text-xs font-medium whitespace-nowrap">
                  Opacity:
                </Label>
                <input
                  id="sketches-opacity"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={sketchesOpacity}
                  onChange={(e) => setSketchesOpacity(parseFloat(e.target.value))}
                  className="w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-600 w-8">{Math.round(sketchesOpacity * 100)}%</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (sketchesOverlay && boundaryCoords.length > 0) {
                    // Reset to parcel bounds
                    const latLngs = boundaryCoords.map(coord => L.latLng(coord[0], coord[1]));
                    const bounds = L.latLngBounds(latLngs);
                    sketchesOverlay.setBounds(bounds);
                    toast.success('Overlay position reset');
                  }
                }}
                className="w-full"
              >
                Reset Position
              </Button>
            </div>
          )}

          {/* Scale Indicator - Precision Mode */}
          {precisionMode && pixelsToFeet && (
            <div className="absolute bottom-24 right-4 z-[1000] bg-white px-3 py-2 rounded shadow-lg border-2 border-orange-500">
              <div className="text-xs font-semibold text-gray-700">Scale</div>
              <div className="text-sm font-mono">1" = {(pixelsToFeet * 96).toFixed(1)} ft</div>
              <div className="text-xs text-gray-500">Zoom 20 locked</div>
            </div>
          )}

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
          {mode === 'draw' && drawnShapes.length > 0 && (
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[1000]">
              {/* Shape Management Tools */}
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
                variant="outline"
                onClick={copySelectedShape}
                disabled={!selectedShapeId}
                className="shadow-sm"
                title="Copy selected shape (Cmd+C / Ctrl+C)"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={pasteShape}
                disabled={!copiedShape}
                className="shadow-sm"
                title="Paste copied shape (Cmd+V / Ctrl+V)"
              >
                <Clipboard className="h-4 w-4 mr-2" />
                Paste
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
            </div>
          )}

          {/* Smart Shape Panel - Scrollable Container (Draw Mode) */}
          {mode === 'draw' && (
            <div className="absolute top-4 bottom-4 right-20 w-96 bg-white rounded-lg shadow-lg z-[1000] p-6 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-semibold text-lg">Smart Shape Builder</h3>
                  <button
                    onClick={() => setMode('view')}
                    className="text-gray-400 hover:text-gray-600"
                    title="Close panel"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Selected Shape Controls */}
                {selectedShapeId && (() => {
                  const selectedShape = drawnShapes.find(s => s.id === selectedShapeId);
                  if (!selectedShape) return null;

                  return (
                    <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-500 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Selected Shape</h4>
                        <button
                          onClick={() => setSelectedShapeId(null)}
                          className="text-gray-400 hover:text-gray-600 text-sm"
                        >
                          Deselect
                        </button>
                      </div>

                      <div className="text-sm text-gray-700 mb-3">
                        <div className="font-medium">{selectedShape.name}</div>
                        <div className="text-xs text-gray-500">
                          {selectedShape.area.toFixed(0)} sq ft
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={async () => {
                            // Duplicate shape
                            const props = (selectedShape.layer as any).properties;
                            if (props && props.width && props.length) {
                              await createShapeAtCenter(
                                props.width,
                                props.length,
                                `${selectedShape.name} Copy`
                              );
                            }
                          }}
                          className="w-full bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium"
                        >
                          📋 Duplicate
                        </button>

                        <button
                          onClick={async () => {
                            if (confirm(`Delete ${selectedShape.name}?`)) {
                              try {
                                // Remove from map
                                if (drawLayer.current && selectedShape.layer) {
                                  drawLayer.current.removeLayer(selectedShape.layer);
                                }

                                // Remove dimension labels
                                selectedShape.dimensionLabels?.forEach(label => {
                                  if (map.current) {
                                    map.current.removeLayer(label);
                                  }
                                });

                                // Delete from database
                                await fetch(`/api/projects/${projectId}/shapes/${selectedShapeId}`, {
                                  method: 'DELETE',
                                });

                                // Remove from state
                                setDrawnShapes(prev => prev.filter(s => s.id !== selectedShapeId));
                                setSelectedShapeId(null);

                                toast.success('Shape deleted');
                              } catch (error) {
                                console.error('Error deleting shape:', error);
                                toast.error('Failed to delete shape');
                              }
                            }
                          }}
                          className="w-full bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 text-sm font-medium"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Shape Type Dropdown */}
                <div>
                  <Label htmlFor="shape-type" className="text-sm font-medium">Shape Type</Label>
                  <select
                    id="shape-type"
                    value={selectedShapeType}
                    onChange={(e) => setSelectedShapeType(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="rectangle">Rectangle</option>
                    <option value="l-shape">L-Shape (Coming Soon)</option>
                    <option value="u-shape">U-Shape (Coming Soon)</option>
                    <option value="t-shape">T-Shape (Coming Soon)</option>
                  </select>
                </div>

                {/* Manual Dimension Inputs */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">Manual Input</h4>
                  <div>
                    <Label htmlFor="shape-width" className="text-sm">Width (feet)</Label>
                    <Input
                      id="shape-width"
                      type="number"
                      placeholder="e.g., 51"
                      value={shapeWidth}
                      onChange={(e) => setShapeWidth(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shape-length" className="text-sm">Length (feet)</Label>
                    <Input
                      id="shape-length"
                      type="number"
                      placeholder="e.g., 34"
                      value={shapeLength}
                      onChange={(e) => setShapeLength(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shape-label" className="text-sm">Label (optional)</Label>
                    <Input
                      id="shape-label"
                      type="text"
                      placeholder="e.g., Main House"
                      value={shapeLabel}
                      onChange={(e) => setShapeLabel(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleAddShapeFromInput}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={!shapeWidth || !shapeLength}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Add to Map
                  </Button>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-4"></div>

                {/* Quick Input */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">Quick Input</h4>
                  <p className="text-xs text-gray-500">Type dimensions like "51x34" or "51 x 34 house"</p>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="e.g., 51x34 rectangle"
                      value={quickInput}
                      onChange={(e) => setQuickInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleQuickInput();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleQuickInput}
                      variant="outline"
                      disabled={!quickInput.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-4"></div>

                {/* Template Library Button */}
                <div>
                  <Button
                    onClick={() => setShowTemplateLibrary(true)}
                    variant="outline"
                    className="w-full border-dashed border-2 hover:border-blue-500 hover:bg-blue-50"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Browse Template Library
                  </Button>
                </div>

                {/* Selected Shape Edit Controls */}
                {selectedShapeId && drawnShapes.find(s => s.id === selectedShapeId) && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm mb-3 text-gray-700">Selected Shape</h4>
                    {(() => {
                      const selectedShape = drawnShapes.find(s => s.id === selectedShapeId);
                      if (!selectedShape) return null;

                      return (
                        <div className="space-y-3">
                          {/* Shape Info */}
                          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                            <div className="text-sm font-semibold text-orange-900 mb-1">
                              {selectedShape.name}
                            </div>
                            <div className="text-xs text-orange-700 space-y-1">
                              <div>Area: {selectedShape.area.toFixed(0)} sq ft</div>
                              <div>Perimeter: {selectedShape.perimeter.toFixed(1)} ft</div>
                            </div>
                          </div>

                          {/* Edit Actions */}
                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              onClick={handleRotateShape}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              title="Rotate 90 degrees"
                            >
                              <RotateCw className="h-3 w-3 mr-1" />
                              Rotate
                            </Button>
                            <Button
                              onClick={handleDuplicateShape}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              title="Duplicate shape"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                            <Button
                              onClick={handleDeleteShape}
                              variant="outline"
                              size="sm"
                              className="text-xs text-red-600 hover:bg-red-50 border-red-200"
                              title="Delete shape"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>

                          <div className="text-xs text-gray-500 text-center">
                            Click another shape to edit, or deselect to create new shapes
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Help Text */}
                <div className="bg-blue-50 p-3 rounded-lg text-xs space-y-1">
                  <p className="font-semibold text-blue-900">💡 How it works:</p>
                  <ul className="text-blue-800 space-y-1 ml-3">
                    <li>• Enter dimensions and click "Add to Map"</li>
                    <li>• Shape appears at property center</li>
                    <li>• Use "Move Shapes" tool to reposition</li>
                    <li>• Templates provide common sizes</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Template Library Modal */}
          {showTemplateLibrary && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Shape Template Library</h2>
                  <button
                    onClick={() => setShowTemplateLibrary(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                  {/* Houses */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">🏠 Houses</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {shapeTemplates.houses.map((template) => (
                        <button
                          key={template.name}
                          onClick={() => handleTemplateSelect(template)}
                          className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                        >
                          <div className="font-semibold text-gray-900">{template.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {template.width} × {template.length} ft
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{template.sqft.toLocaleString()} sq ft</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Garages */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">🚗 Garages</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {shapeTemplates.garages.map((template) => (
                        <button
                          key={template.name}
                          onClick={() => handleTemplateSelect(template)}
                          className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                        >
                          <div className="font-semibold text-gray-900">{template.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {template.width} × {template.length} ft
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{template.sqft.toLocaleString()} sq ft</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ADUs */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">🏡 ADU / Guest Houses</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {shapeTemplates.adu.map((template) => (
                        <button
                          key={template.name}
                          onClick={() => handleTemplateSelect(template)}
                          className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                        >
                          <div className="font-semibold text-gray-900">{template.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {template.width} × {template.length} ft
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{template.sqft.toLocaleString()} sq ft</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pools */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">🏊 Pools</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {shapeTemplates.pools.map((template) => (
                        <button
                          key={template.name}
                          onClick={() => handleTemplateSelect(template)}
                          className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                        >
                          <div className="font-semibold text-gray-900">{template.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {template.width} × {template.length} ft
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{template.sqft.toLocaleString()} sq ft</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Measure Mode Controls */}
          {mode === 'measure' && (
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[1000]">
              {/* Measurement Type Toggle */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={measurementType === 'line' ? 'default' : 'outline'}
                  onClick={() => {
                    setMeasurementType('line');
                    clearMeasurements();
                  }}
                  className="shadow-lg flex-1"
                >
                  Line
                </Button>
                <Button
                  size="sm"
                  variant={measurementType === 'polyline' ? 'default' : 'outline'}
                  onClick={() => {
                    setMeasurementType('polyline');
                    clearMeasurements();
                  }}
                  className="shadow-lg flex-1"
                >
                  Polyline
                </Button>
              </div>

              {/* Line measurement controls */}
              {measurementType === 'line' && measurementPoints.length === 2 && (
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

              {/* Polyline measurement controls */}
              {measurementType === 'polyline' && polylinePoints.length > 0 && (
                <>
                  <Card className="p-3 shadow-lg bg-white">
                    <div className="text-xs font-semibold text-cyan-600 mb-2">
                      {polylinePoints.length} point{polylinePoints.length !== 1 ? 's' : ''}
                    </div>
                    {polylinePoints.length >= 2 && (
                      <div className="text-sm font-semibold text-cyan-600">
                        Total: {
                          (() => {
                            let total = 0;
                            for (let i = 0; i < polylinePoints.length - 1; i++) {
                              total += map.current!.distance(polylinePoints[i], polylinePoints[i + 1]);
                            }
                            return (total * 3.28084).toFixed(1);
                          })()
                        } ft
                      </div>
                    )}
                  </Card>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={finishPolyline}
                      className="shadow-lg flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Finish
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={clearMeasurements}
                      className="shadow-lg flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </>
              )}

              {/* Instructions */}
              <Card className="p-3 shadow-lg bg-blue-50 max-w-xs">
                <p className="text-xs text-blue-900 font-semibold mb-1">
                  📏 {measurementType === 'line' ? 'Line Measurement' : 'Polyline Measurement'}
                </p>
                <p className="text-xs text-blue-800">
                  {measurementType === 'line'
                    ? 'Click two points on the map to measure distance.'
                    : 'Click to add points along a path. Double-click or press Enter to finish.'}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg border">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Setbacks Panel */}
        <Card className="p-3">
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
              <div className="flex flex-wrap gap-3 items-center">
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

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded flex-shrink-0" style={{backgroundColor: '#ef4444'}}></div>
              <Label htmlFor="front" className="text-sm font-medium w-24">Front Street</Label>
              <Input
                id="front"
                type="number"
                value={setbacks.front}
                onChange={(e) => handleSetbackChange('front', e.target.value)}
                disabled={!isEditingSetbacks}
                className="h-9 flex-1"
              />
              <span className="text-sm text-gray-500 w-6">ft</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded flex-shrink-0" style={{backgroundColor: '#3b82f6'}}></div>
              <Label htmlFor="rear" className="text-sm font-medium w-24">Rear (Back)</Label>
              <Input
                id="rear"
                type="number"
                value={setbacks.rear}
                onChange={(e) => handleSetbackChange('rear', e.target.value)}
                disabled={!isEditingSetbacks}
                className="h-9 flex-1"
              />
              <span className="text-sm text-gray-500 w-6">ft</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded flex-shrink-0" style={{backgroundColor: '#10b981'}}></div>
              <Label htmlFor="left" className="text-sm font-medium w-24">Side Left</Label>
              <Input
                id="left"
                type="number"
                value={setbacks.left}
                onChange={(e) => handleSetbackChange('left', e.target.value)}
                disabled={!isEditingSetbacks}
                className="h-9 flex-1"
              />
              <span className="text-sm text-gray-500 w-6">ft</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded flex-shrink-0" style={{backgroundColor: '#f59e0b'}}></div>
              <Label htmlFor="right" className="text-sm font-medium w-24">Side Right</Label>
              <Input
                id="right"
                type="number"
                value={setbacks.right}
                onChange={(e) => handleSetbackChange('right', e.target.value)}
                disabled={!isEditingSetbacks}
                className="h-9 flex-1"
              />
              <span className="text-sm text-gray-500 w-6">ft</span>
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
        <Card className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Drawn Shapes ({(() => {
                console.log('📊 Drawn Shapes card rendering, count:', drawnShapes.length);
                console.log('📊 Shape names:', drawnShapes.map(s => s.name));
                return drawnShapes.length;
              })()})
            </h3>
            {parcelData?.buildingSections && Array.isArray(parcelData.buildingSections) && parcelData.buildingSections.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={autoCreateBuildingShapes}
                className="text-xs"
              >
                <Building2 className="h-3 w-3 mr-1" />
                Import from Assessor
              </Button>
            )}
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
                💡 Click any shape to select it (highlighted in amber). Click the pencil to rename (e.g., "Main House", "ADU", "Garage")
              </p>
              <div className="space-y-3 max-h-80 overflow-y-auto mb-3">
                {drawnShapes.map((shape, idx) => (
                  <div
                    key={shape.id}
                    className={`p-3 rounded border cursor-pointer transition-all ${
                      selectedShapeId === shape.id
                        ? 'bg-amber-50 border-amber-400 border-2 shadow-md'
                        : 'bg-blue-50 border-blue-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedShapeId(shape.id)}
                  >
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
                    {(() => {
                      // Helper function to convert decimal feet to feet + inches format
                      const toFeetInches = (feet) => {
                        const wholeFeet = Math.floor(feet);
                        const inches = Math.round((feet - wholeFeet) * 12);
                        if (inches === 0) {
                          return `${wholeFeet}'`;
                        } else if (inches === 12) {
                          return `${wholeFeet + 1}'`;
                        } else {
                          return `${wholeFeet}' ${inches}"`;
                        }
                      };

                      if (shape.layer && shape.layer.getRadius) {
                        // Circle - show diameter, radius, circumference, area in feet/inches
                        const diameterFeet = shape.perimeter / Math.PI;
                        const radiusFeet = shape.perimeter / (2 * Math.PI);
                        const circumferenceFeet = shape.perimeter;
                        return (
                          <>
                            <div className="text-xs text-gray-700">Diameter: {toFeetInches(diameterFeet)}</div>
                            <div className="text-xs text-gray-600">Radius: {toFeetInches(radiusFeet)}</div>
                            <div className="text-xs text-gray-600">Circumference: {toFeetInches(circumferenceFeet)}</div>
                            <div className="text-xs text-gray-700">{shape.area.toLocaleString()} sq ft</div>
                          </>
                        );
                      } else if (shape.shapeType === 'rectangle' && shape.layer) {
                        // Rectangle - calculate and show length and width
                        try {
                          const coords = shape.layer.getLatLngs()[0];
                          if (coords && coords.length >= 4) {
                            // Calculate all 4 side lengths
                            const sideLengths = [];
                            for (let i = 0; i < 4; i++) {
                              const p1 = coords[i];
                              const p2 = coords[(i + 1) % 4];
                              const point1 = turf.point([p1.lng, p1.lat]);
                              const point2 = turf.point([p2.lng, p2.lat]);
                              const distanceMeters = turf.distance(point1, point2, { units: 'meters' });
                              const distanceFeet = distanceMeters * 3.28084;
                              sideLengths.push(distanceFeet);
                            }
                            // Sort to get the two unique dimensions (rectangles have 2 pairs of equal sides)
                            const sortedLengths = [...sideLengths].sort((a, b) => b - a);
                            const length = sortedLengths[0]; // Longest side
                            const width = sortedLengths[2];  // Shortest side (3rd in sorted descending)

                            return (
                              <div className="text-sm space-y-2">
                                {/* Editable Width */}
                                <div className="flex items-center gap-2">
                                  <label className="text-gray-600 text-xs w-12">Width:</label>
                                  <input
                                    type="number"
                                    value={Math.round(width)}
                                    onChange={async (e) => {
                                      const newWidth = parseFloat(e.target.value);
                                      if (isNaN(newWidth) || newWidth <= 0) return;

                                      console.log('📏 Updating shape width:', shape.name, newWidth);

                                      // Update shape dimensions
                                      await updateShapeDimensions(shape.id, newWidth, length);
                                    }}
                                    className="w-16 px-2 py-1 text-xs border rounded"
                                    disabled={!isEditShapesMode}
                                  />
                                  <span className="text-gray-600 text-xs">ft</span>
                                </div>

                                {/* Editable Length */}
                                <div className="flex items-center gap-2">
                                  <label className="text-gray-600 text-xs w-12">Length:</label>
                                  <input
                                    type="number"
                                    value={Math.round(length)}
                                    onChange={async (e) => {
                                      const newLength = parseFloat(e.target.value);
                                      if (isNaN(newLength) || newLength <= 0) return;

                                      console.log('📏 Updating shape length:', shape.name, newLength);

                                      // Update shape dimensions
                                      await updateShapeDimensions(shape.id, width, newLength);
                                    }}
                                    className="w-16 px-2 py-1 text-xs border rounded"
                                    disabled={!isEditShapesMode}
                                  />
                                  <span className="text-gray-600 text-xs">ft</span>
                                </div>

                                {/* Read-only calculated values */}
                                <div className="text-gray-600 text-xs pt-2 border-t">
                                  Area: {shape.area.toLocaleString()} sq ft<br />
                                  Perimeter: {Math.round(shape.perimeter)} ft
                                </div>
                              </div>
                            );
                          }
                        } catch (err) {
                          console.error('Error calculating rectangle dimensions:', err);
                        }
                        // Fallback if calculation fails
                        return (
                          <>
                            <div className="text-xs text-gray-700">{shape.area.toLocaleString()} sq ft</div>
                            <div className="text-xs text-gray-600">{shape.perimeter.toLocaleString()} ft perimeter</div>
                          </>
                        );
                      } else {
                        // Polygon - show individual edge measurements
                        try {
                          const coords = shape.layer?.getLatLngs?.()?.[0];
                          if (coords && coords.length >= 3) {
                            // Calculate each edge length
                            const edgeLengths = [];
                            for (let i = 0; i < coords.length; i++) {
                              const p1 = coords[i];
                              const p2 = coords[(i + 1) % coords.length];
                              const point1 = turf.point([p1.lng, p1.lat]);
                              const point2 = turf.point([p2.lng, p2.lat]);
                              const distanceMeters = turf.distance(point1, point2, { units: 'meters' });
                              const distanceFeet = distanceMeters * 3.28084;
                              edgeLengths.push(distanceFeet);
                            }

                            // Label edges alphabetically (A-B, B-C, C-D, etc.)
                            const vertexLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

                            return (
                              <>
                                <div className="text-xs text-gray-700 font-semibold mb-1">Edges:</div>
                                {edgeLengths.map((length, i) => {
                                  const fromLabel = vertexLabels[i % vertexLabels.length];
                                  const toLabel = vertexLabels[(i + 1) % vertexLabels.length];
                                  return (
                                    <div key={i} className="text-xs text-gray-600 pl-2">
                                      {fromLabel}→{toLabel}: {toFeetInches(length)}
                                    </div>
                                  );
                                })}
                                <div className="text-xs text-gray-700 font-semibold mt-2">{shape.area.toLocaleString()} sq ft</div>
                              </>
                            );
                          }
                        } catch (err) {
                          console.error('Error calculating polygon edges:', err);
                        }
                        // Fallback if calculation fails
                        return (
                          <>
                            <div className="text-xs text-gray-700">{shape.area.toLocaleString()} sq ft</div>
                            <div className="text-xs text-gray-600">{shape.perimeter.toLocaleString()} ft perimeter</div>
                          </>
                        );
                      }
                    })()}
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Existing Building:</span>
                    <span className="font-semibold text-gray-700">
                      {buildingArea.toLocaleString(undefined, { maximumFractionDigits: 0 })} sq ft
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Drawn Shapes:</span>
                    <span className="font-semibold text-gray-700">
                      {drawnShapes.reduce((sum, s) => sum + s.area, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} sq ft
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Total Coverage:</span>
                    <span className="font-bold text-blue-900">
                      {(buildingArea + drawnShapes.reduce((sum, s) => sum + s.area, 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })} sq ft
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Buildable Area:</span>
                    <span className="font-semibold text-gray-900">
                      {buildableArea.toLocaleString()} sq ft
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Coverage:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {(((buildingArea + drawnShapes.reduce((sum, s) => sum + s.area, 0)) / (parcelData?.lotSizeSqFt || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Saved Measurements Panel */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              📏 Measurements ({savedMeasurements.length + savedPolylines.length})
            </h3>
          </div>

          {savedMeasurements.length === 0 && savedPolylines.length === 0 ? (
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
                {/* Line Measurements */}
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

                {/* Polyline Measurements */}
                {savedPolylines.map((polyline) => {
                  const totalFeet = Math.floor(polyline.totalDistance);
                  const totalInches = Math.round((polyline.totalDistance - totalFeet) * 12);
                  const totalText = totalInches > 0 ? `${totalFeet}' ${totalInches}"` : `${totalFeet}'`;

                  return (
                    <div key={polyline.id} className="p-3 bg-cyan-50 rounded border border-cyan-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-semibold text-sm text-cyan-900">
                            Polyline ({polyline.points.length} points)
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deletePolyline(polyline.id)}
                          className="h-6 w-6 p-0"
                          title="Delete this polyline"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>

                      {/* Total Distance */}
                      <div className="text-sm text-cyan-900 font-semibold mb-2">
                        Total: {totalText}
                      </div>

                      {/* Segment Breakdown */}
                      <div className="text-xs text-cyan-700 space-y-1">
                        <div className="font-semibold mb-1">Segments:</div>
                        {polyline.segmentDistances.map((distance, i) => {
                          const feet = Math.floor(distance);
                          const inches = Math.round((distance - feet) * 12);
                          const text = inches > 0 ? `${feet}' ${inches}"` : `${feet}'`;
                          return (
                            <div key={i} className="flex justify-between">
                              <span>{String.fromCharCode(65 + i)} → {String.fromCharCode(65 + i + 1)}:</span>
                              <span className="font-semibold">{text}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
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
          buildingArea={buildingArea}
          setbacks={setbacks}
          drawnShapes={drawnShapes}
          onSetbackChange={(side, value) => handleSetbackChange(side as keyof typeof setbacks, value.toString())}
          isEditingSetbacks={isEditingSetbacks}
        />
      </Card>
    </div>

  );
}
