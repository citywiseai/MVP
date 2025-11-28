'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { toast } from 'sonner';
import * as turf from '@turf/turf';
import ShapeBuilderPanel from './ShapeBuilderPanel';
import { getTemplateById } from '@/lib/shape-templates';
import { transformSvg } from '@/lib/svg-utils';

// Check token availability
console.log('🔑 Mapbox token:', process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.substring(0, 20) + '...');

// Snap threshold for edge snapping (roughly 1 foot in lat/lng degrees)
const SNAP_THRESHOLD = 0.000003;

interface MapboxPropertyVisualizationProps {
  parcelId: string;
  projectId: string;
  boundaryCoords: [number, number][];
  centerLat: number;
  centerLng: number;
  parcel?: any; // Full parcel object with totalBuildingSF, etc.
}

export default function MapboxPropertyVisualization({
  parcelId,
  projectId,
  boundaryCoords,
  centerLat,
  centerLng,
  parcel,
}: MapboxPropertyVisualizationProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const setbackMarkers = useRef<mapboxgl.Marker[]>([]);
  const dimensionMarkers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const vertexMarkers = useRef<mapboxgl.Marker[]>([]);
  const edgeLabelMarkers = useRef<mapboxgl.Marker[]>([]);
  const measurementMarkers = useRef<mapboxgl.Marker[]>([]);
  const svgOverlays = useRef<Map<string, {
    element: HTMLDivElement;
    featureId: string;
    coordinates: [number, number][]; // Store polygon coordinates for position updates
    properties: any; // Store rotation and other properties
  }>>(new Map());

  const [isEditMode, setIsEditMode] = useState(false);
  const [shapeWidth, setShapeWidth] = useState('');
  const [shapeLength, setShapeLength] = useState('');
  const [shapeLabel, setShapeLabel] = useState('');
  const [drawnShapes, setDrawnShapes] = useState<any[]>([]);
  const [showDimensions, setShowDimensions] = useState(true);
  const [viewMode, setViewMode] = useState<'view' | 'edit' | 'draw' | 'measure'>('view');
  const [mapStyle, setMapStyle] = useState<'satellite' | 'map'>('satellite');
  const [showShapeBuilder, setShowShapeBuilder] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Property metrics state
  const [propertyMetrics, setPropertyMetrics] = useState({
    lotSize: 0,
    buildableArea: 0,
    existingBuildings: 0,
    drawnShapes: 0,
    currentCoverage: 0,
    remainingArea: 0
  });

  // Setback state
  const [showSetbacks, setShowSetbacks] = useState(true);
  const [setbacks, setSetbacks] = useState({
    front: 20,
    rear: 20,
    left: 5,
    right: 5,
    sideLeft: 5,
    sideRight: 5
  });
  const [setbacksApplied, setSetbacksApplied] = useState(false); // Track if user has applied setbacks - start hidden
  const [setbackPolygon, setSetbackPolygon] = useState<any>(null); // Store buildable area polygon for violation detection
  const [shapeViolations, setShapeViolations] = useState<Set<string>>(new Set()); // Track shapes violating setbacks
  const [shapeIntersections, setShapeIntersections] = useState<Map<string, string[]>>(new Map()); // Track shapes overlapping with each other

  // Snap guide lines state
  const [snapGuideLines, setSnapGuideLines] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });

  // Clipboard state for copy/paste
  const [clipboardShape, setClipboardShape] = useState<any | null>(null);

  // Measurement tool state
  const [measurementMode, setMeasurementMode] = useState<'off' | 'single' | 'polyline'>('off');
  const [measurementPoints, setMeasurementPoints] = useState<[number, number][]>([]);
  const [measurementPreview, setMeasurementPreview] = useState<[number, number] | null>(null);
  const [isDrawingMeasurement, setIsDrawingMeasurement] = useState(false);
  const [savedMeasurements, setSavedMeasurements] = useState<Array<{
    id: string;
    name: string;
    points: [number, number][];
    totalDistance: number;
    segmentDistances: number[];
    displayDistance?: string;
  }>>([]);
  const [snapPoint, setSnapPoint] = useState<[number, number] | null>(null);
  const [highlightedMeasurementId, setHighlightedMeasurementId] = useState<string | null>(null);

  // Inline editing state for measurements
  const [editingMeasurementId, setEditingMeasurementId] = useState<string | null>(null);
  const [editingMeasurementName, setEditingMeasurementName] = useState('');
  const [editingMeasurementDistanceId, setEditingMeasurementDistanceId] = useState<string | null>(null);
  const [editingMeasurementDistance, setEditingMeasurementDistance] = useState('');

  // Expanded edit mode state
  const [expandedEditMeasurementId, setExpandedEditMeasurementId] = useState<string | null>(null);
  const [expandedEditData, setExpandedEditData] = useState<{
    name: string;
    segments: { label: string; distance: string }[];
    totalDistance: string;
  } | null>(null);

  // Shape editing state
  const [expandedShapeId, setExpandedShapeId] = useState<string | null>(null);
  const [editingShapeData, setEditingShapeData] = useState<{
    name: string;
    width: string;
    length: string;
  } | null>(null);

  const measurementLayersRef = useRef<string[]>([]);
  const measurementMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const savedMeasurementMarkersRef = useRef<mapboxgl.Marker[]>([]); // Separate ref for saved measurement markers
  const previewLineRef = useRef<mapboxgl.Marker | null>(null);
  const previewLabelRef = useRef<mapboxgl.Marker | null>(null);
  const measurementModeRef = useRef<'off' | 'single' | 'polyline'>('off'); // Track current mode to avoid stale closure
  const prevMeasurementModeRef = useRef<'off' | 'single' | 'polyline'>('off'); // Track previous mode for cleanup
  const isSavingMeasurementRef = useRef<boolean>(false); // Prevent duplicate saves

  // Keep ref in sync with state
  useEffect(() => {
    console.log('Syncing measurementModeRef with measurementMode:', measurementMode);
    measurementModeRef.current = measurementMode;
  }, [measurementMode]);

  // Edge labels state
  const [edgeLabels, setEdgeLabels] = useState<Array<{ edgeIndex: number; side: string }>>([]);

  // Local boundary coordinates state (for editing)
  // Remove duplicate closing coordinate and auto-simplify if needed
  const [localBoundaryCoords, setLocalBoundaryCoords] = useState<[number, number][]>(boundaryCoords);

  // Helper: Find the N sharpest corner vertices (must be defined before useEffect)
  const findCornerVertices = (coords: [number, number][], numCorners: number): [number, number][] => {
    if (coords.length <= numCorners) {
      return coords;
    }

    // Calculate angles at each vertex to find the most significant corners
    const vertexAngles = coords.map((coord, i) => {
      const prev = coords[(i - 1 + coords.length) % coords.length];
      const next = coords[(i + 1) % coords.length];

      // Calculate vectors
      const v1 = [prev[0] - coord[0], prev[1] - coord[1]];
      const v2 = [next[0] - coord[0], next[1] - coord[1]];

      // Calculate angle between vectors (in degrees)
      const dot = v1[0] * v2[0] + v1[1] * v2[1];
      const mag1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
      const mag2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
      const angle = Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);

      return { index: i, coord, angle };
    });

    // Sort by angle (smallest angles are the sharpest corners)
    const sortedByAngle = [...vertexAngles].sort((a, b) => a.angle - b.angle);

    // Take the N sharpest corners
    const corners = sortedByAngle.slice(0, numCorners);

    // Sort by original index to maintain clockwise order
    corners.sort((a, b) => a.index - b.index);

    // Extract coordinates
    const simplifiedCoords: [number, number][] = corners.map(c => c.coord);

    console.log(`✅ Simplified to ${numCorners} corners:`, corners.map(c => `Index ${c.index}, Angle ${c.angle.toFixed(1)}°`));

    return simplifiedCoords;
  };

  // Update local coords when prop changes
  useEffect(() => {
    let coordsWithoutDupe = boundaryCoords;

    // Check if last coord equals first coord (closed polygon)
    if (boundaryCoords.length > 0 &&
        boundaryCoords[0][0] === boundaryCoords[boundaryCoords.length - 1][0] &&
        boundaryCoords[0][1] === boundaryCoords[boundaryCoords.length - 1][1]) {
      console.log('🔷 Removing duplicate closing coordinate:', boundaryCoords.length, '→', boundaryCoords.length - 1);
      coordsWithoutDupe = boundaryCoords.slice(0, -1);
    }

    // Auto-simplify if more than 4 corners (rectangular lot assumption)
    let finalCoords = coordsWithoutDupe;
    if (coordsWithoutDupe.length > 4) {
      console.log(`🔧 Auto-simplifying boundary: ${coordsWithoutDupe.length} → 4 corners`);
      finalCoords = findCornerVertices(coordsWithoutDupe, 4);
    }

    setLocalBoundaryCoords(finalCoords);
  }, [boundaryCoords]);

  // Add property boundary helper function
  const addPropertyBoundary = useCallback(() => {
    if (!map.current || !localBoundaryCoords || localBoundaryCoords.length === 0) return;

    console.log('🔷 Adding property boundary...');
    console.log('Boundary coords count:', localBoundaryCoords.length);
    console.log('First coord:', localBoundaryCoords[0]);
    console.log('Last coord:', localBoundaryCoords[localBoundaryCoords.length - 1]);

    // Create GeoJSON - coordinates should already be [lng, lat]
    const coordinates = [
      ...localBoundaryCoords,
      localBoundaryCoords[0] // Close the polygon
    ];

    console.log('Polygon ring coords:', coordinates.length);

    const geojson = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates] // Array of rings
        }
      }]
    };

    // Remove existing
    if (map.current.getLayer('boundary-line')) map.current.removeLayer('boundary-line');
    if (map.current.getLayer('boundary-fill')) map.current.removeLayer('boundary-fill');
    if (map.current.getSource('boundary')) map.current.removeSource('boundary');

    // Add source
    map.current.addSource('boundary', {
      type: 'geojson',
      data: geojson
    });

    // Add fill (light blue)
    map.current.addLayer({
      id: 'boundary-fill',
      type: 'fill',
      source: 'boundary',
      paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.2
      }
    });

    // Add line (bright blue) - NO beforeId, let it go on top
    map.current.addLayer({
      id: 'boundary-line',
      type: 'line',
      source: 'boundary',
      paint: {
        'line-color': '#2563eb',
        'line-width': 5,  // Extra thick
        'line-opacity': 1
      }
    });

    console.log('✅ Boundary layers added');
  }, [localBoundaryCoords, centerLng, centerLat]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error('❌ Mapbox token missing');
      toast.error('Mapbox token missing - check .env');
      return;
    }

    console.log('🗺️ Initializing Mapbox map...');

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [centerLng, centerLat],
      zoom: 19,
    });

    // Add controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    // Initialize draw
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      defaultMode: 'simple_select',
    });
    map.current.addControl(draw.current);

    // CRITICAL: Only add layers AFTER style loads
    map.current.on('load', () => {
      console.log('🎉 Map fully loaded and ready');

      // Set ready flag - this triggers the master useEffect to add all layers
      setIsMapReady(true);
    });

    // Handle style changes (satellite/hybrid/street switching)
    // styledata fires multiple times during style changes
    map.current.on('styledata', () => {
      // Skip the initial styledata event (happens on first load)
      if (!isMapReady) return;

      // Skip if we don't have boundary data yet
      if (!localBoundaryCoords?.length) return;

      console.log('🔄 Style data event fired - waiting for style to load');

      // Wait for style to fully load before adding layers
      // Don't check isStyleLoaded() here - it might be false when styledata fires
      setTimeout(() => {
        if (map.current?.isStyleLoaded()) {
          console.log('✅ Style ready - calling reAddAllMapLayers');
          reAddAllMapLayers();
        } else {
          console.log('⏳ Style still loading, skipping layer add');
        }
      }, 100);
    });

    // Listen for shape creation
    map.current.on('draw.create', handleShapeCreate);
    map.current.on('draw.update', handleShapeUpdate);
    map.current.on('draw.delete', handleShapeDelete);

    // Update SVG overlays on map move/zoom/render for smooth updates
    map.current.on('move', updateAllSvgOverlays);
    map.current.on('zoom', updateAllSvgOverlays);
    map.current.on('render', updateAllSvgOverlays); // Smooth frame-by-frame updates

    // Measurement click handler
    map.current.on('click', (e) => {
      const mode = measurementModeRef.current;
      if (mode === 'off') return;

      const point: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      console.log('📍 Added measurement point:', point);

      setMeasurementPoints(prev => {
        const newPoints = [...prev, point];

        // Add circle marker for this point
        const marker = createMeasurementMarker(point, true);
        if (marker) {
          measurementMarkersRef.current.push(marker);
        }

        // If we have 2+ points, draw line and add distance label
        if (newPoints.length >= 2) {
          const lastPoint = newPoints[newPoints.length - 2];
          const currentPoint = newPoints[newPoints.length - 1];

          // Calculate distance using Turf
          const from = turf.point(lastPoint);
          const to = turf.point(currentPoint);
          const distance = turf.distance(from, to, { units: 'feet' });

          // Add line
          addMeasurementLine(newPoints, 'measurement-line-current', true);

          // Add distance label
          const label = addDistanceLabel(lastPoint, currentPoint, distance);
          if (label) {
            measurementMarkersRef.current.push(label);
          }

          // Single line mode: auto-save after 2 points
          if (mode === 'single' && newPoints.length === 2) {
            console.log('✅ Single line complete, saving...');
            // Don't set flag here - let saveMeasurement handle it
            saveMeasurement(newPoints);
            return []; // Clear points after saving
          }
        }

        return newPoints;
      });
    });

    // Mousemove handler for live preview
    map.current.on('mousemove', (e) => {
      const mode = measurementModeRef.current;
      if (mode === 'off') return;

      setMeasurementPreview([e.lngLat.lng, e.lngLat.lat]);
    });

    // Double-click handler for finishing polyline
    map.current.on('dblclick', (e) => {
      const mode = measurementModeRef.current;
      if (mode !== 'polyline') return;

      e.preventDefault(); // Prevent zoom

      setMeasurementPoints(prev => {
        if (prev.length >= 2) {
          console.log('✅ Polyline complete (double-click), saving...');
          // Clear points IMMEDIATELY, then save asynchronously
          setTimeout(() => saveMeasurement(prev), 0);
        }
        return []; // Clear points to prevent duplicate saves
      });
    });

    // Error handling - only log if error has meaningful content
    map.current.on('error', (e) => {
      // Only log if there's an actual error message, not empty objects
      if (e && (e.error?.message || e.message)) {
        console.error('❌ Mapbox error:', e);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Empty deps - run once only

  const loadShapesFromDatabase = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/shapes`);
      const data = await response.json();

      if (data.shapes && data.shapes.length > 0) {
        console.log(`📦 Loading ${data.shapes.length} shapes...`);

        // Clean up any orphan overlays with undefined/null keys before loading
        const keysToClean: (string | undefined)[] = [undefined, null as any, 'undefined', 'null'];
        keysToClean.forEach(key => {
          if (svgOverlays.current.has(key as any)) {
            const orphan = svgOverlays.current.get(key as any);
            if (orphan?.element) {
              orphan.element.remove();
              console.log(`🧹 Cleaned up orphan overlay with key: ${key}`);
            }
            svgOverlays.current.delete(key as any);
          }
        });

        setDrawnShapes(data.shapes);

        // Clear existing drawn features
        if (draw.current) {
          draw.current.deleteAll();
        }

        data.shapes.forEach((shape: any) => {
          try {
            let coordinates = shape.coordinates;

            // Validate coordinates format
            if (!Array.isArray(coordinates) || coordinates.length === 0) {
              console.warn('Invalid shape coordinates:', shape.id, '- deleting from database');
              // Delete invalid shape from database
              fetch(`/api/projects/${projectId}/shapes/${shape.id}`, {
                method: 'DELETE'
              }).catch(e => console.error('Failed to delete invalid shape:', e));
              return;
            }

            // Clean up old problematic "Court" shapes (temporary cleanup)
            if (shape.name && shape.name.includes('Court')) {
              console.warn('Removing old Court shape:', shape.id, shape.name);
              fetch(`/api/projects/${projectId}/shapes/${shape.id}`, {
                method: 'DELETE'
              }).catch(e => console.error('Failed to delete Court shape:', e));
              return;
            }

            // Handle different coordinate formats
            // Format 1: [[[lng, lat], ...]]  (GeoJSON Polygon)
            // Format 2: [[lng, lat], ...]    (flat ring)
            if (!Array.isArray(coordinates[0][0])) {
              // It's format 2, wrap it
              coordinates = [coordinates];
            }

            const feature = {
              type: 'Feature' as const,
              id: shape.id,
              properties: {
                name: shape.name,
                width: shape.properties?.width,
                length: shape.properties?.length,
              },
              geometry: {
                type: 'Polygon' as const,
                coordinates: coordinates
              }
            };

            if (draw.current) {
              draw.current.add(feature);
              console.log(`✅ Loaded shape: ${shape.name}`);

              // Create SVG overlay if this is a template shape
              if (shape.properties?.templateId && map.current && mapContainer.current) {
                // Check if overlay already exists (duplicate prevention)
                if (svgOverlays.current.has(shape.id)) {
                  console.log(`⚠️ Overlay already exists for loaded shape ${shape.id}, skipping creation`);
                } else {
                  // Check if AI-generated or template-based
                  const isAiGenerated = shape.properties.aiGenerated === true;
                  const hasCustomSvg = !!shape.properties.customSvg;
                  const template = !isAiGenerated ? getTemplateById(shape.properties.templateId) : null;

                  if (template || (isAiGenerated && hasCustomSvg)) {
                    try {
                      // Create HTML overlay div
                      const overlayDiv = document.createElement('div');
                      overlayDiv.style.position = 'absolute';
                      overlayDiv.style.pointerEvents = 'none';
                      overlayDiv.style.zIndex = '10';
                      overlayDiv.style.transformOrigin = 'center center';
                      overlayDiv.className = 'shape-svg-overlay';

                      // Get dimensions and flip properties
                      const widthFt = shape.properties?.width || 20;
                      const heightFt = shape.properties?.height || shape.properties?.length || 20;
                      const flipH = shape.properties?.flipHorizontal || false;
                      const flipV = shape.properties?.flipVertical || false;
                      const isAiGenerated = shape.properties?.aiGenerated === true;
                      const customSvg = shape.properties?.customSvg;

                      // Generate and transform SVG (keeps text readable)
                      let transformedSvg: string;

                      if (isAiGenerated && customSvg) {
                        // AI-generated shape: use custom SVG directly
                        transformedSvg = customSvg;
                      } else {
                        // Template shape: generate from template and apply transforms
                        const baseSvg = template.getSvg(widthFt, heightFt);
                        transformedSvg = transformSvg(baseSvg, widthFt, heightFt, {
                          flipHorizontal: flipH,
                          flipVertical: flipV
                        });
                      }

                      overlayDiv.innerHTML = transformedSvg;

                      // Find the Mapbox canvas container and append overlay
                      const canvasContainer = mapContainer.current.querySelector('.mapboxgl-canvas-container');
                      if (canvasContainer) {
                        canvasContainer.appendChild(overlayDiv);
                      } else {
                        mapContainer.current.appendChild(overlayDiv);
                      }

                      // Extract polygon coordinates (handle different formats)
                      // coordinates is already normalized to [[[lng, lat], ...]] format from lines 475-478
                      const coords = coordinates[0]; // Get first ring

                      console.log('📍 Raw coords from DB:', {
                        coords: coords,
                        firstElement: coords?.[0],
                        isCoordArray: Array.isArray(coords?.[0]) && typeof coords?.[0]?.[0] === 'number'
                      });

                      // coords should now be [[lng, lat], [lng, lat], ...]
                      const polygonCoords = coords as [number, number][];

                      // Store overlay reference with coordinates and properties
                      svgOverlays.current.set(shape.id, {
                        element: overlayDiv,
                        featureId: shape.id,  // Use shape.id as feature ID
                        coordinates: polygonCoords,
                        properties: shape.properties
                      });

                      // Position the overlay after a brief delay to ensure map is ready
                      setTimeout(() => {
                        updateSvgOverlayPosition(shape.id);
                        console.log(`✨ Added SVG overlay for loaded shape: ${shape.name}`, {
                          shapeId: shape.id,
                          featureId: shape.id,
                          coordinates: polygonCoords.length + ' points',
                          firstCoord: polygonCoords[0]
                        });
                      }, 100);
                    } catch (error) {
                      console.error(`Error creating SVG overlay for ${shape.name}:`, error);
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error(`Error loading shape ${shape.id}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Error loading shapes:', error);
    }
  };

  // Load edge labels from the database (stored in parcel.zoningRules)
  const loadEdgeLabelsFromAPI = async () => {
    try {
      console.log('🏷️ Auto-labeling sides for project:', projectId);
      const response = await fetch(`/api/projects/${projectId}/auto-label-sides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      console.log('📦 API Response:', data);

      if (data.edgeLabels && Array.isArray(data.edgeLabels)) {
        console.log('✅ Edge labels loaded:', {
          count: data.edgeLabels.length,
          labels: data.edgeLabels,
          boundaryCount: localBoundaryCoords.length
        });
        setEdgeLabels(data.edgeLabels);
      } else if (data.error) {
        console.error('❌ Error fetching edge labels:', data.error);
      }
    } catch (error) {
      console.error('Error loading edge labels:', error);
    }
  };

  // Load data when map is ready
  useEffect(() => {
    if (isMapReady && projectId) {
      console.log('🎯 Map ready - loading shapes and edge labels');
      loadShapesFromDatabase();
      loadEdgeLabelsFromAPI();
    }
  }, [isMapReady, projectId]);

  // Trigger updateSetbacks when edge labels are loaded or changed
  useEffect(() => {
    if (edgeLabels.length > 0 && map.current) {
      console.log('🔄 Edge labels changed - triggering updateSetbacks', {
        edgeLabelsCount: edgeLabels.length,
        boundaryCount: localBoundaryCoords.length,
        edgeLabels
      });
      updateSetbacks();
    }
  }, [edgeLabels]);

  // Trigger updateSetbacks when setback values change
  useEffect(() => {
    if (map.current && localBoundaryCoords.length > 0) {
      console.log('📏 Setback values changed - triggering updateSetbacks', {
        setbacks,
        edgeLabelsCount: edgeLabels.length
      });
      updateSetbacks();
    }
  }, [setbacks]);

  // Render live preview line
  useEffect(() => {
    if (!map.current || measurementMode === 'off' || !measurementPreview || measurementPoints.length === 0) {
      // Remove preview elements if they exist
      if (previewLineRef.current) {
        previewLineRef.current.remove();
        previewLineRef.current = null;
      }
      if (previewLabelRef.current) {
        previewLabelRef.current.remove();
        previewLabelRef.current = null;
      }
      return;
    }

    const lastPoint = measurementPoints[measurementPoints.length - 1];
    const previewPoints = [lastPoint, measurementPreview];

    // Calculate preview distance
    const from = turf.point(lastPoint);
    const to = turf.point(measurementPreview);
    const distance = turf.distance(from, to, { units: 'feet' });

    // Add or update preview line
    const layerId = 'measurement-preview-line';
    const sourceId = `${layerId}-source`;

    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }

    map.current.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: previewPoints
        }
      }
    });

    map.current.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#ec4899',
        'line-width': 2,
        'line-dasharray': [2, 2],
        'line-opacity': 0.6
      }
    });

    // Add or update preview distance label
    const midpoint: [number, number] = [
      (lastPoint[0] + measurementPreview[0]) / 2,
      (lastPoint[1] + measurementPreview[1]) / 2
    ];

    if (previewLabelRef.current) {
      previewLabelRef.current.remove();
    }

    const el = document.createElement('div');
    el.style.backgroundColor = 'rgba(236, 72, 153, 0.9)';
    el.style.color = 'white';
    el.style.padding = '3px 6px';
    el.style.borderRadius = '4px';
    el.style.fontSize = '11px';
    el.style.fontWeight = 'bold';
    el.style.whiteSpace = 'nowrap';
    el.style.pointerEvents = 'none';
    el.textContent = formatFeetInches(distance);

    previewLabelRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat(midpoint as mapboxgl.LngLatLike)
      .addTo(map.current);

  }, [measurementMode, measurementPreview, measurementPoints]);

  // Load saved measurements on mount
  useEffect(() => {
    const loadMeasurements = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/measurements`);
        if (response.ok) {
          const data = await response.json();
          setSavedMeasurements(data.measurements || []);
        }
      } catch (error) {
        console.error('Error loading measurements:', error);
      }
    };

    if (projectId) {
      loadMeasurements();
    }
  }, [projectId]);

  // Render saved measurements on map
  useEffect(() => {
    if (!map.current || !isMapReady) return;

    // Clear all saved measurement markers
    savedMeasurementMarkersRef.current.forEach(marker => marker?.remove());
    savedMeasurementMarkersRef.current = [];

    // Clear existing saved measurement layers (clean up more than current length to handle deletions)
    for (let i = 0; i < 100; i++) {
      const layerId = `saved-measurement-${i}`;
      if (map.current?.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
      const sourceId = `${layerId}-source`;
      if (map.current?.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }
    }

    // Render each saved measurement
    savedMeasurements.forEach((measurement, index) => {
      const isHighlighted = measurement.id === highlightedMeasurementId;
      const layerId = `saved-measurement-${index}`;

      // Add line
      addMeasurementLine(measurement.points, layerId, false);

      // Add DRAGGABLE markers for points with edit functionality
      measurement.points.forEach((point, pointIndex) => {
        const el = document.createElement('div');
        el.className = 'measurement-point-marker';
        el.style.width = '12px';
        el.style.height = '12px';
        el.style.borderRadius = '50%';
        el.style.border = '3px solid #3b82f6';
        el.style.backgroundColor = 'white';
        el.style.cursor = 'grab';
        el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        el.style.transition = 'all 0.2s';

        const marker = new mapboxgl.Marker({
          element: el,
          draggable: true // ENABLE DRAGGING
        })
          .setLngLat(point as mapboxgl.LngLatLike)
          .addTo(map.current!);

        // Update line and labels during drag
        marker.on('drag', () => {
          const newLngLat = marker.getLngLat();
          const newPoint: [number, number] = [newLngLat.lng, newLngLat.lat];

          // Update points array
          const updatedPoints = [...measurement.points];
          updatedPoints[pointIndex] = newPoint;

          // Redraw line with updated points
          addMeasurementLine(updatedPoints, layerId, false);

          // REAL-TIME DISTANCE UPDATE: Recalculate distances and update labels
          let tempTotalDistance = 0;
          const tempSegmentDistances: number[] = [];

          for (let i = 0; i < updatedPoints.length - 1; i++) {
            const from = turf.point(updatedPoints[i]);
            const to = turf.point(updatedPoints[i + 1]);
            const distance = turf.distance(from, to, { units: 'feet' });
            tempSegmentDistances.push(distance);
            tempTotalDistance += distance;
          }

          // Update distance labels on map in real-time
          // Remove old labels and add new ones
          const labelStartIndex = savedMeasurementMarkersRef.current.findIndex(m => {
            const elem = m.getElement();
            return elem && elem.textContent?.includes(formatFeetInches(measurement.segmentDistances?.[0] || 0));
          });

          // Clear old labels for this measurement
          savedMeasurementMarkersRef.current = savedMeasurementMarkersRef.current.filter((marker, idx) => {
            const elem = marker.getElement();
            const isLabel = elem?.style.backgroundColor === 'white' && elem?.style.fontSize === '11px';
            if (isLabel) {
              marker.remove();
              return false;
            }
            return true;
          });

          // Add new labels with updated distances
          for (let i = 0; i < updatedPoints.length - 1; i++) {
            const label = addDistanceLabel(updatedPoints[i], updatedPoints[i + 1], tempSegmentDistances[i]);
            if (label) {
              savedMeasurementMarkersRef.current.push(label);
            }
          }

          // Update cursor style
          el.style.cursor = 'grabbing';
        });

        // Save updated measurement when drag ends
        marker.on('dragend', async () => {
          const newLngLat = marker.getLngLat();
          const newPoint: [number, number] = [newLngLat.lng, newLngLat.lat];

          // Update points array
          const updatedPoints = [...measurement.points];
          updatedPoints[pointIndex] = newPoint;

          // Recalculate distances
          let totalDistance = 0;
          const segmentDistances: number[] = [];
          for (let i = 0; i < updatedPoints.length - 1; i++) {
            const from = turf.point(updatedPoints[i]);
            const to = turf.point(updatedPoints[i + 1]);
            const distance = turf.distance(from, to, { units: 'feet' });
            segmentDistances.push(distance);
            totalDistance += distance;
          }

          // Update in state and database
          try {
            const response = await fetch(`/api/projects/${projectId}/measurements/${measurement.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                points: updatedPoints,
                totalDistance,
                segmentDistances
              })
            });

            if (response.ok) {
              // Update local state
              setSavedMeasurements(prev => prev.map(m =>
                m.id === measurement.id
                  ? { ...m, points: updatedPoints, totalDistance, segmentDistances }
                  : m
              ));
              toast.success('Measurement updated');
            }
          } catch (error) {
            console.error('Failed to update measurement:', error);
            toast.error('Failed to update measurement');
          }

          // Reset cursor
          el.style.cursor = 'grab';
        });

        savedMeasurementMarkersRef.current.push(marker);

        if (isHighlighted) {
          el.style.animation = 'pulse 1s infinite';
        }
      });

      // Add distance labels
      for (let i = 0; i < measurement.points.length - 1; i++) {
        const distance = measurement.segmentDistances?.[i] || 0;
        const label = addDistanceLabel(measurement.points[i], measurement.points[i + 1], distance);
        if (label) {
          savedMeasurementMarkersRef.current.push(label);
        }
      }
    });
  }, [savedMeasurements, isMapReady, highlightedMeasurementId]);

  // Paste shape function
  const pasteShape = async () => {
    if (!clipboardShape || !map.current || !draw.current) return;

    try {
      console.log('📋 Pasting shape:', clipboardShape.name);
      console.log('📋 Clipboard shape type:', clipboardShape.shapeType);
      console.log('📋 Clipboard shape coordinates format:', JSON.stringify(clipboardShape.coordinates).substring(0, 200));
      console.log('📋 Coordinates[0] is array?:', Array.isArray(clipboardShape.coordinates[0]));
      console.log('📋 Coordinates[0][0] is array?:', Array.isArray(clipboardShape.coordinates[0]?.[0]));

      // Offset coordinates to make the pasted shape visible (roughly 30 feet)
      const offsetLng = 0.0001; // ~30 feet east
      const offsetLat = -0.0001; // ~30 feet south

      // Handle different coordinate formats
      // Database stores coordinates as [[lng, lat], ...] (flat array)
      // We need to offset each coordinate point
      let newCoordinates: any;

      // Check if coordinates are already nested (from MapboxDraw format)
      const isNested = Array.isArray(clipboardShape.coordinates[0]?.[0]);

      if (isNested) {
        // Coordinates are [[[lng, lat], ...]] - nested array (MapboxDraw format)
        console.log('📋 Offsetting nested coordinates');
        newCoordinates = clipboardShape.coordinates.map((ring: any[]) =>
          ring.map((coord: [number, number]) => [
            coord[0] + offsetLng,
            coord[1] + offsetLat
          ])
        );
      } else {
        // Coordinates are [[lng, lat], ...] - flat array (database format)
        console.log('📋 Offsetting flat coordinates');
        newCoordinates = clipboardShape.coordinates.map((coord: [number, number]) => [
          coord[0] + offsetLng,
          coord[1] + offsetLat
        ]);
      }

      // Create GeoJSON for area/perimeter calculation
      // Turf.js expects Polygon coordinates as [[[lng, lat], ...]]
      // IMPORTANT: geometry.type must be standard GeoJSON type ('Polygon'), not app-specific type ('template', 'rectangle', etc.)
      let turfCoordinates = newCoordinates;
      if (!isNested) {
        // Wrap flat coordinates for Turf.js
        turfCoordinates = [newCoordinates];
        console.log('📋 Wrapped coordinates for Turf.js calculation');
      }

      const geoJson = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',  // Always 'Polygon' for GeoJSON, not clipboardShape.shapeType
          coordinates: turfCoordinates
        },
        properties: {}
      };

      console.log('📋 GeoJSON for calculation:', JSON.stringify(geoJson).substring(0, 200));

      // Calculate area and perimeter for new position
      const area = turf.area(geoJson.geometry) * 10.7639; // m² to sqft
      const perimeter = turf.length(geoJson, { units: 'feet' });

      // Create new shape object
      const newShape = {
        name: `${clipboardShape.name} (copy)`,
        shapeType: clipboardShape.shapeType,
        coordinates: newCoordinates,
        area: area,
        perimeter: perimeter,
        rotationAngle: clipboardShape.rotationAngle || 0,
        properties: clipboardShape.properties || {}
      };

      // Save to database
      const response = await fetch(`/api/projects/${projectId}/shapes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newShape)
      });

      if (response.ok) {
        const savedShape = await response.json();
        console.log('✅ Pasted shape saved:', savedShape.id);

        // Add to drawn shapes state
        setDrawnShapes(prev => [...prev, savedShape]);

        // Add to map via draw control
        // IMPORTANT: Ensure coordinates are in the correct format for MapboxDraw
        // Database stores as [[lng,lat], ...] but Polygon needs [[[lng,lat], ...]]
        // IMPORTANT: geometry.type must always be 'Polygon', not app-specific types like 'template', 'rectangle', etc.
        let drawCoordinates = savedShape.coordinates;

        // Check if we need to wrap coordinates for Polygon type
        // If coordinates is [[lng, lat], [lng, lat]], wrap it to [[[lng, lat], [lng, lat]]]
        if (Array.isArray(savedShape.coordinates[0]) && !Array.isArray(savedShape.coordinates[0][0])) {
          drawCoordinates = [savedShape.coordinates];
          console.log('📋 Wrapped coordinates for Polygon');
        }

        const feature = {
          type: 'Feature',
          id: savedShape.id,
          geometry: {
            type: 'Polygon',  // Always 'Polygon' for GeoJSON, not savedShape.shapeType
            coordinates: drawCoordinates
          },
          properties: {
            id: savedShape.id,
            name: savedShape.name,
            shapeType: savedShape.shapeType,  // Store app-specific type in properties
            ...savedShape.properties
          }
        };

        console.log('📋 Feature to add to MapboxDraw:', JSON.stringify(feature, null, 2));
        draw.current.add(feature);

        // If original shape had an SVG overlay (templateId), create one for the copy
        if (savedShape.properties?.templateId) {
          const template = getTemplateById(savedShape.properties.templateId);
          if (template?.svg) {
            // Transform and position SVG overlay
            const transformedSvg = transformSvg(
              template.svg,
              savedShape.properties.width || 50,
              savedShape.properties.height || 50,
              savedShape.properties.rotation || 0
            );

            // Create SVG overlay element
            const overlayDiv = document.createElement('div');
            overlayDiv.innerHTML = transformedSvg;
            overlayDiv.style.position = 'absolute';
            overlayDiv.style.pointerEvents = 'none';
            overlayDiv.style.zIndex = '10';

            // Store overlay
            svgOverlays.current.set(savedShape.id, {
              element: overlayDiv,
              featureId: savedShape.id,
              coordinates: savedShape.coordinates[0],
              properties: savedShape.properties
            });

            // Add to map
            map.current.getCanvasContainer().appendChild(overlayDiv);

            // Update position
            updateSvgOverlayPosition(savedShape.id);
          }
        }

        toast.success(`Pasted: ${savedShape.name}`);

        // Expand the newly pasted shape
        setExpandedShapeId(savedShape.id);
      } else {
        toast.error('Failed to paste shape');
      }
    } catch (error) {
      console.error('Error pasting shape:', error);
      toast.error('Error pasting shape');
    }
  };

  // Keyboard event handlers for measurement tool and copy/paste
  useEffect(() => {
    console.log('🎯 Keyboard event listener useEffect running');
    console.log('🎯 Current state - expandedShapeId:', expandedShapeId, 'clipboardShape:', clipboardShape, 'drawnShapes:', drawnShapes.length);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Debug: Log every key press
      console.log('⌨️ Key pressed:', e.key, 'metaKey:', e.metaKey, 'ctrlKey:', e.ctrlKey, 'shiftKey:', e.shiftKey);

      // Handle copy/paste for shapes (works in any mode)
      // Copy: Cmd+C or Ctrl+C
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && !e.shiftKey) {
        console.log('📋 Copy triggered');
        console.log('📋 expandedShapeId:', expandedShapeId);
        console.log('📋 drawnShapes count:', drawnShapes.length);
        console.log('📋 drawnShapes:', drawnShapes);

        if (expandedShapeId) {
          const shapeToCopy = drawnShapes.find(s => s.id === expandedShapeId);
          console.log('📋 shapeToCopy found:', shapeToCopy);
          if (shapeToCopy) {
            setClipboardShape(shapeToCopy);
            console.log('📋 Copied shape to clipboard:', shapeToCopy.name);
            toast.success(`Copied: ${shapeToCopy.name}`);
            e.preventDefault();
          } else {
            console.log('❌ Shape not found in drawnShapes');
          }
        } else {
          console.log('❌ No expandedShapeId - no shape selected');
        }
        return;
      }

      // Paste: Cmd+V or Ctrl+V
      if ((e.metaKey || e.ctrlKey) && e.key === 'v' && !e.shiftKey) {
        console.log('📋 Paste triggered');
        console.log('📋 clipboardShape:', clipboardShape);

        if (clipboardShape) {
          console.log('📋 Calling pasteShape()');
          e.preventDefault();
          pasteShape();
        } else {
          console.log('❌ No clipboardShape - nothing to paste');
        }
        return;
      }

      // Measurement tool handlers
      if (measurementMode === 'off') return;

      if (e.key === 'Escape') {
        console.log('⚠️ Escape pressed - clearing current measurement');
        clearMeasurementVisuals();
        setMeasurementPoints([]);
        // FIX 2: Keep mode active (just clear points, don't exit mode)
        toast.info('Measurement cleared');
      }

      if (e.key === 'Enter' && measurementMode === 'polyline' && measurementPoints.length >= 2) {
        console.log('✅ Enter pressed - finishing polyline');
        const pointsToSave = [...measurementPoints];
        setMeasurementPoints([]); // Clear immediately to prevent duplicate saves
        saveMeasurement(pointsToSave);
      }
    };

    console.log('🎯 Attaching keydown listener to window');
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      console.log('🎯 Removing keydown listener from window');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [measurementMode, measurementPoints, expandedShapeId, drawnShapes, clipboardShape]);

  // Setback violation detection functions
  const checkShapeSetbackViolation = useCallback((shape: any): boolean => {
    console.log('🔍 Checking shape for violation:', shape.id, shape.name);
    console.log('🔍 Setback polygon exists:', !!setbackPolygon);
    console.log('🔍 Shape coordinates:', shape.coordinates);

    if (!setbackPolygon || !shape.coordinates) {
      console.log('⚠️ Skipping violation check - missing setback polygon or coordinates');
      return false; // No violation if no setback polygon or coordinates
    }

    try {
      // Create polygon from shape coordinates
      const shapeCoords = Array.isArray(shape.coordinates[0][0])
        ? shape.coordinates[0] // Already in correct format [[lng, lat], ...]
        : shape.coordinates; // Convert if needed

      console.log('🔍 Shape coords format:', shapeCoords.slice(0, 2));

      // Ensure polygon is closed
      const closedCoords = [...shapeCoords];
      if (JSON.stringify(closedCoords[0]) !== JSON.stringify(closedCoords[closedCoords.length - 1])) {
        closedCoords.push(closedCoords[0]);
      }

      const shapePolygon = turf.polygon([closedCoords]);

      console.log('🔍 Shape polygon created:', shapePolygon.geometry.type);
      console.log('🔍 Setback polygon type:', setbackPolygon.geometry?.type || setbackPolygon.type);

      // Check if shape is completely within buildable area
      // A violation occurs if shape extends outside the buildable area
      const isWithin = turf.booleanWithin(shapePolygon, setbackPolygon);
      const isViolation = !isWithin;

      console.log('🔍 Is shape within buildable area?', isWithin);
      console.log('🔍 Is violation?', isViolation);

      if (isViolation) {
        console.log(`⚠️ Setback violation detected for shape ${shape.id} (${shape.name})`);
      } else {
        console.log(`✅ Shape ${shape.id} (${shape.name}) is within buildable area`);
      }

      return isViolation;
    } catch (error) {
      console.error('Error checking setback violation:', error, shape);
      return false;
    }
  }, [setbackPolygon]);

  const checkAllShapesForViolations = useCallback(() => {
    console.log('🔍 checkAllShapesForViolations called');
    console.log('🔍 Number of shapes:', drawnShapes?.length || 0);
    console.log('🔍 Setback polygon exists:', !!setbackPolygon);
    console.log('🔍 Setback polygon:', setbackPolygon);

    if (!setbackPolygon || !drawnShapes || drawnShapes.length === 0) {
      console.log('⚠️ Skipping violation check - missing data');
      setShapeViolations(new Set());
      return;
    }

    console.log('🔍 Starting violation checks for', drawnShapes.length, 'shapes');

    const violations = new Set<string>();
    drawnShapes.forEach(shape => {
      console.log('🔍 Checking shape:', shape.name, shape.id);
      if (checkShapeSetbackViolation(shape)) {
        violations.add(shape.id);
      }
    });

    setShapeViolations(violations);

    if (violations.size > 0) {
      console.log(`🚨 Found ${violations.size} shape(s) violating setbacks:`, Array.from(violations));
    } else {
      console.log(`✅ All ${drawnShapes.length} shape(s) are within buildable area`);
    }
  }, [setbackPolygon, drawnShapes, checkShapeSetbackViolation]);

  // Check for shape intersections (shapes overlapping each other)
  const checkAllShapesForIntersections = useCallback(() => {
    console.log('🔍 checkAllShapesForIntersections called');
    console.log('🔍 Number of shapes:', drawnShapes?.length || 0);

    if (!drawnShapes || drawnShapes.length < 2) {
      console.log('⚠️ Skipping intersection check - need at least 2 shapes');
      setShapeIntersections(new Map());
      return;
    }

    console.log('🔍 Starting intersection checks for', drawnShapes.length, 'shapes');

    const intersections = new Map<string, string[]>();

    // Compare each shape with every other shape
    for (let i = 0; i < drawnShapes.length; i++) {
      for (let j = i + 1; j < drawnShapes.length; j++) {
        const shape1 = drawnShapes[i];
        const shape2 = drawnShapes[j];

        try {
          // Create polygons from shape coordinates
          const coords1 = Array.isArray(shape1.coordinates[0][0])
            ? shape1.coordinates[0]
            : shape1.coordinates;

          const coords2 = Array.isArray(shape2.coordinates[0][0])
            ? shape2.coordinates[0]
            : shape2.coordinates;

          // Ensure polygons are closed
          const closedCoords1 = [...coords1];
          if (JSON.stringify(closedCoords1[0]) !== JSON.stringify(closedCoords1[closedCoords1.length - 1])) {
            closedCoords1.push(closedCoords1[0]);
          }

          const closedCoords2 = [...coords2];
          if (JSON.stringify(closedCoords2[0]) !== JSON.stringify(closedCoords2[closedCoords2.length - 1])) {
            closedCoords2.push(closedCoords2[0]);
          }

          const poly1 = turf.polygon([closedCoords1]);
          const poly2 = turf.polygon([closedCoords2]);

          // Check if shapes actually overlap (share interior area)
          // Use turf.intersect to get intersection geometry and check if area > 1 sq ft
          try {
            const intersection = turf.intersect(turf.featureCollection([poly1, poly2]));

            if (intersection) {
              const intersectionArea = turf.area(intersection); // Returns area in square meters

              // Only count as overlap if intersection area is more than 1 square foot (~0.1 sq meters)
              // This filters out edge-touching scenarios which have zero or negligible area
              if (intersectionArea > 0.1) {
                console.log(`⚠️ REAL OVERLAP: ${shape1.name} and ${shape2.name}, area: ${intersectionArea.toFixed(4)} m² (${(intersectionArea * 10.7639).toFixed(2)} sq ft)`);

                // Add to intersections map for both shapes
                const existing1 = intersections.get(shape1.id) || [];
                const existing2 = intersections.get(shape2.id) || [];

                intersections.set(shape1.id, [...existing1, shape2.id]);
                intersections.set(shape2.id, [...existing2, shape1.id]);
              } else {
                console.log(`✅ ${shape1.name} and ${shape2.name} touching edges only (area: ${(intersectionArea * 10.7639).toFixed(4)} sq ft) - OK`);
              }
            } else {
              console.log(`✅ ${shape1.name} and ${shape2.name} do not intersect`);
            }
          } catch (e) {
            // No intersection or error computing intersection
            console.log(`✅ ${shape1.name} and ${shape2.name} do not overlap`);
          }
        } catch (error) {
          console.error('Error checking intersection between shapes:', shape1.name, shape2.name, error);
        }
      }
    }

    setShapeIntersections(intersections);

    if (intersections.size > 0) {
      console.log(`🚨 Found ${intersections.size} shape(s) with intersections:`, Object.fromEntries(intersections));
    } else {
      console.log(`✅ No shape intersections detected`);
    }
  }, [drawnShapes]);

  // Helper function to get shape bounding box
  const getShapeBounds = useCallback((coordinates: any) => {
    // Handle different coordinate formats
    const coords = Array.isArray(coordinates[0]?.[0])
      ? coordinates[0] // Nested format [[[lng, lat], ...]]
      : coordinates;    // Flat format [[lng, lat], ...]

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    coords.forEach((coord: [number, number]) => {
      const [lng, lat] = coord;
      minX = Math.min(minX, lng);
      maxX = Math.max(maxX, lng);
      minY = Math.min(minY, lat);
      maxY = Math.max(maxY, lat);
    });

    return { minX, maxX, minY, maxY };
  }, []);

  // Helper function to find snap points for a moving shape
  const getSnapPoints = useCallback((movingShapeCoords: any, movingShapeId: string) => {
    console.log('🧲 ========== getSnapPoints CALLED ==========');
    console.log('🧲 movingShapeId:', movingShapeId);
    console.log('🧲 drawnShapes count:', drawnShapes?.length || 0);
    console.log('🧲 SNAP_THRESHOLD:', SNAP_THRESHOLD);

    if (!drawnShapes || drawnShapes.length < 2) {
      console.log('⚠️ Not enough shapes for snapping (need at least 2)');
      return { snapX: null, snapY: null, snapInfo: null };
    }

    const movingBounds = getShapeBounds(movingShapeCoords);
    let snapX: number | null = null;
    let snapY: number | null = null;
    let snapInfo: { type: string; otherShapeName: string } | null = null;

    console.log('🧲 Moving shape bounds:', movingBounds);
    console.log('🧲 Checking against', drawnShapes.length - 1, 'other shapes');

    for (const otherShape of drawnShapes) {
      // Skip the shape being moved
      if (otherShape.id === movingShapeId) {
        console.log(`  ⏭️ Skipping self: ${otherShape.name}`);
        continue;
      }

      const otherBounds = getShapeBounds(otherShape.coordinates);
      console.log(`  🔍 Comparing with ${otherShape.name}:`, otherBounds);

      // Check horizontal edges (left/right alignment)
      // Snap moving shape's left edge to other's right edge (shapes touch, no overlap)
      const leftToRightDist = Math.abs(movingBounds.minX - otherBounds.maxX);
      console.log(`  📏 Left-to-right distance: ${leftToRightDist} (threshold: ${SNAP_THRESHOLD})`);
      if (leftToRightDist < SNAP_THRESHOLD) {
        snapX = otherBounds.maxX;
        snapInfo = { type: 'left-to-right', otherShapeName: otherShape.name };
        console.log(`  ✅ SNAP: Left edge to ${otherShape.name}'s right edge`);
      }

      // Snap moving shape's right edge to other's left edge
      const rightToLeftDist = Math.abs(movingBounds.maxX - otherBounds.minX);
      if (rightToLeftDist < SNAP_THRESHOLD) {
        const shapeWidth = movingBounds.maxX - movingBounds.minX;
        snapX = otherBounds.minX - shapeWidth;
        snapInfo = { type: 'right-to-left', otherShapeName: otherShape.name };
        console.log(`  ✅ SNAP: Right edge to ${otherShape.name}'s left edge`);
      }

      // Snap left edges to align
      const leftToLeftDist = Math.abs(movingBounds.minX - otherBounds.minX);
      if (leftToLeftDist < SNAP_THRESHOLD) {
        snapX = otherBounds.minX;
        snapInfo = { type: 'left-align', otherShapeName: otherShape.name };
        console.log(`  ✅ SNAP: Left edges align with ${otherShape.name}`);
      }

      // Snap right edges to align
      const rightToRightDist = Math.abs(movingBounds.maxX - otherBounds.maxX);
      if (rightToRightDist < SNAP_THRESHOLD) {
        const shapeWidth = movingBounds.maxX - movingBounds.minX;
        snapX = otherBounds.maxX - shapeWidth;
        snapInfo = { type: 'right-align', otherShapeName: otherShape.name };
        console.log(`  ✅ SNAP: Right edges align with ${otherShape.name}`);
      }

      // Check vertical edges (top/bottom alignment)
      // Snap moving shape's top to other's bottom
      const topToBottomDist = Math.abs(movingBounds.maxY - otherBounds.minY);
      if (topToBottomDist < SNAP_THRESHOLD) {
        const shapeHeight = movingBounds.maxY - movingBounds.minY;
        snapY = otherBounds.minY - shapeHeight;
        snapInfo = { type: 'top-to-bottom', otherShapeName: otherShape.name };
        console.log(`  ✅ SNAP: Top edge to ${otherShape.name}'s bottom edge`);
      }

      // Snap moving shape's bottom to other's top
      const bottomToTopDist = Math.abs(movingBounds.minY - otherBounds.maxY);
      if (bottomToTopDist < SNAP_THRESHOLD) {
        snapY = otherBounds.maxY;
        snapInfo = { type: 'bottom-to-top', otherShapeName: otherShape.name };
        console.log(`  ✅ SNAP: Bottom edge to ${otherShape.name}'s top edge`);
      }

      // Snap top edges to align
      const topToTopDist = Math.abs(movingBounds.maxY - otherBounds.maxY);
      if (topToTopDist < SNAP_THRESHOLD) {
        const shapeHeight = movingBounds.maxY - movingBounds.minY;
        snapY = otherBounds.maxY - shapeHeight;
        snapInfo = { type: 'top-align', otherShapeName: otherShape.name };
        console.log(`  ✅ SNAP: Top edges align with ${otherShape.name}`);
      }

      // Snap bottom edges to align
      const bottomToBottomDist = Math.abs(movingBounds.minY - otherBounds.minY);
      if (bottomToBottomDist < SNAP_THRESHOLD) {
        snapY = otherBounds.minY;
        snapInfo = { type: 'bottom-align', otherShapeName: otherShape.name };
        console.log(`  ✅ SNAP: Bottom edges align with ${otherShape.name}`);
      }

      // If we found a snap, we can return early
      if (snapX !== null || snapY !== null) {
        console.log('🧲 Snap points found:', { snapX, snapY, snapInfo });
        break;
      }
    }

    if (snapX === null && snapY === null) {
      console.log('🧲 No snap points found');
    }

    return { snapX, snapY, snapInfo };
  }, [drawnShapes, getShapeBounds]);

  // Function to update SVG overlay position based on stored coordinates
  const updateSvgOverlayPosition = useCallback((shapeId: string) => {
    if (!map.current) return;

    const overlay = svgOverlays.current.get(shapeId);
    if (!overlay?.element || !overlay.coordinates) return;

    try {
      // Project all polygon coordinates from storage to screen pixels
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      overlay.coordinates.forEach(coord => {
        const point = map.current!.project([coord[0], coord[1]]);
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });

      const width = maxX - minX;
      const height = maxY - minY;

      // Position overlay at exact bounds (not centered, use direct positioning)
      overlay.element.style.position = 'absolute';
      overlay.element.style.left = `${minX}px`;
      overlay.element.style.top = `${minY}px`;
      overlay.element.style.width = `${width}px`;
      overlay.element.style.height = `${height}px`;
      overlay.element.style.pointerEvents = 'none';
      overlay.element.style.zIndex = '10';
      overlay.element.style.transform = `rotate(${overlay.properties?.rotation || 0}deg)`;
      overlay.element.style.transformOrigin = 'center center';

      // Make sure the SVG inside scales to fill the container
      const svgElement = overlay.element.querySelector('svg');
      if (svgElement) {
        svgElement.style.width = '100%';
        svgElement.style.height = '100%';
        svgElement.setAttribute('preserveAspectRatio', 'none');
      }
    } catch (error) {
      console.error('Error updating SVG overlay position:', error);
    }
  }, []);

  // Function to update all SVG overlay positions
  const updateAllSvgOverlays = useCallback(() => {
    if (!map.current) return;

    // Simply update each overlay from its stored coordinates
    svgOverlays.current.forEach((_, shapeId) => {
      updateSvgOverlayPosition(shapeId);
    });
  }, [updateSvgOverlayPosition]);

  const handleShapeCreate = async (e: any) => {
    const feature = e.features[0];
    const coordinates = feature.geometry.coordinates;

    // Calculate area and perimeter using turf
    const area = turf.area(feature.geometry) * 10.7639; // m² to sqft
    const perimeter = turf.length(feature, { units: 'feet' });

    // Check if this shape came from the template builder (has templateId in properties)
    const isFromTemplate = feature.properties?.templateId;

    const shape = {
      name: isFromTemplate ? feature.properties.name : (shapeLabel || 'Unnamed Shape'),
      shapeType: feature.geometry.type,
      coordinates: coordinates,
      area: area,
      perimeter: perimeter,
      rotationAngle: isFromTemplate ? (feature.properties.rotation || 0) : 0,
      properties: isFromTemplate ? {
        templateId: feature.properties.templateId,
        width: feature.properties.width,
        height: feature.properties.height,
        rotation: feature.properties.rotation
      } : {
        width: shapeWidth ? Number(shapeWidth) : undefined,
        length: shapeLength ? Number(shapeLength) : undefined
      }
    };

    try {
      const response = await fetch(`/api/projects/${projectId}/shapes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shape)
      });

      if (response.ok) {
        const savedShape = await response.json();
        setDrawnShapes(prev => [...prev, savedShape]);
        toast.success(`${shape.name} saved`);

        // If this is a template shape, add SVG overlay
        if (isFromTemplate && map.current && mapContainer.current) {
          // Check if overlay already exists (duplicate prevention)
          if (svgOverlays.current.has(savedShape.id)) {
            console.log(`⚠️ Overlay already exists for ${savedShape.id}, skipping creation`);
          } else {
            // Check if AI-generated or template-based
            const isAiGenerated = feature.properties?.aiGenerated === true;
            const customSvg = feature.properties?.customSvg;
            const template = !isAiGenerated ? getTemplateById(feature.properties.templateId) : null;

            if (template || (isAiGenerated && customSvg)) {
              try {
                // Create HTML overlay div
                const overlayDiv = document.createElement('div');
                overlayDiv.style.position = 'absolute';
                overlayDiv.style.pointerEvents = 'none';
                overlayDiv.style.zIndex = '10';
                overlayDiv.style.transformOrigin = 'center center';
                overlayDiv.className = 'shape-svg-overlay';

                // Get flip properties
                const flipH = feature.properties?.flipHorizontal || false;
                const flipV = feature.properties?.flipVertical || false;

                // Generate and transform SVG (keeps text readable)
                let transformedSvg: string;

                if (isAiGenerated && customSvg) {
                  // AI-generated shape: use custom SVG directly
                  transformedSvg = customSvg;
                } else if (template) {
                  // Template shape: generate from template and apply transforms
                  const baseSvg = template.getSvg(
                    feature.properties.width,
                    feature.properties.height
                  );
                  transformedSvg = transformSvg(
                    baseSvg,
                    feature.properties.width,
                    feature.properties.height,
                    { flipHorizontal: flipH, flipVertical: flipV }
                  );
                } else {
                  throw new Error('No template or custom SVG available');
                }

                overlayDiv.innerHTML = transformedSvg;

                // Find the Mapbox canvas container and append overlay
                const canvasContainer = mapContainer.current.querySelector('.mapboxgl-canvas-container');
                if (canvasContainer) {
                  canvasContainer.appendChild(overlayDiv);
                } else {
                  // Fallback to map container
                  mapContainer.current.appendChild(overlayDiv);
                }

                // Extract polygon coordinates (handle GeoJSON polygon format)
                // coordinates format: [[[lng, lat], [lng, lat], ...]]
                // We need: [[lng, lat], [lng, lat], ...]
                console.log('📍 Raw coordinates from handleShapeCreate:', {
                  coordinates: coordinates,
                  firstElement: coordinates?.[0],
                  secondElement: coordinates?.[0]?.[0]
                });

                const polygonCoords = Array.isArray(coordinates[0][0])
                  ? coordinates[0] as [number, number][]
                  : coordinates as [number, number][];

                console.log('📍 Extracted polygon coordinates:', {
                  length: polygonCoords.length,
                  firstCoord: polygonCoords[0]
                });

                // Store overlay reference with coordinates and properties
                svgOverlays.current.set(savedShape.id, {
                  element: overlayDiv,
                  featureId: feature.id as string,
                  coordinates: polygonCoords,
                  properties: shape.properties
                });

                console.log('🆔 Stored overlay with:', {
                  shapeId: savedShape.id,
                  featureId: feature.id,
                  hasOverlayElement: !!overlayDiv
                });

                // Position the overlay after a brief delay to ensure map is ready
                setTimeout(() => {
                  updateSvgOverlayPosition(savedShape.id);
                  console.log(`✨ Added SVG overlay for ${shape.name}`, {
                    shapeId: savedShape.id,
                    featureId: feature.id,
                    svgLength: svg.length,
                    overlayElement: overlayDiv,
                    appendedTo: canvasContainer ? 'canvas-container' : 'map-container',
                    properties: shape.properties,
                    coordinatesCount: polygonCoords.length
                  });
                }, 100);
              } catch (svgError) {
                console.error('Error adding SVG overlay:', svgError);
              }
            }
          }
        }

        // Clear inputs only if not from template
        if (!isFromTemplate) {
          setShapeWidth('');
          setShapeLength('');
          setShapeLabel('');
        }
      }
    } catch (error) {
      console.error('Error saving shape:', error);
      toast.error('Failed to save shape');
    }
  };

  // Clean up any orphan SVG overlays that exist in DOM but not in our map
  const cleanupOrphanOverlays = useCallback(() => {
    if (!mapContainer.current) return;

    const allOverlays = mapContainer.current.querySelectorAll('.shape-svg-overlay');
    const validElements = new Set(
      Array.from(svgOverlays.current.values()).map(overlay => overlay.element)
    );

    let removedCount = 0;
    allOverlays.forEach(element => {
      if (!validElements.has(element as HTMLDivElement)) {
        console.log('🧹 Removing orphan overlay from DOM');
        element.remove();
        removedCount++;
      }
    });

    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} orphan overlay(s)`);
    }
  }, []);

  // Debounce timer for saving shape coordinates
  const saveTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Save shape coordinates to database (debounced to avoid excessive API calls)
  const saveShapeCoordinates = useCallback(async (shapeId: string, coordinates: [number, number][]) => {
    // Clear existing timer for this shape
    const existingTimer = saveTimers.current.get(shapeId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer to save after 1 second of inactivity
    const timer = setTimeout(async () => {
      console.log('💾 Saving shape coordinates to database:', shapeId);
      try {
        const response = await fetch(`/api/projects/${projectId}/shapes/${shapeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coordinates })
        });

        if (!response.ok) {
          throw new Error('Failed to save shape coordinates');
        }

        console.log('✅ Shape coordinates saved successfully:', shapeId);
        saveTimers.current.delete(shapeId);
      } catch (error) {
        console.error('❌ Error saving shape coordinates:', error);
        toast.error('Failed to save shape position');
      }
    }, 1000); // 1 second debounce

    saveTimers.current.set(shapeId, timer);
  }, [projectId]);

  const handleShapeUpdate = useCallback((e: any) => {
    console.log('🔄 Shape updated, features:', e.features?.length);

    // Clean up any orphan overlays before updating
    cleanupOrphanOverlays();

    // Apply snapping to moving shapes
    e.features?.forEach((feature: any) => {
      if (!feature.geometry || !draw.current) return;

      const coords = feature.geometry.coordinates[0];

      // Find the shape ID for this feature
      const shapeEntry = Array.from(svgOverlays.current.entries()).find(
        ([_, overlay]) => overlay.featureId === feature.id
      );
      const movingShapeId = shapeEntry ? shapeEntry[0] : feature.id;

      // Get snap points for this shape
      const { snapX, snapY, snapInfo } = getSnapPoints(coords, movingShapeId);

      // If we have snap points, adjust the coordinates
      if (snapX !== null || snapY !== null) {
        console.log('🧲 Snapping active!', { snapX, snapY, snapInfo });

        // Get current bounds
        const currentBounds = getShapeBounds(coords);

        // Calculate offset to apply
        const offsetX = snapX !== null ? snapX - currentBounds.minX : 0;
        const offsetY = snapY !== null ? snapY - currentBounds.minY : 0;

        // Apply offset to all coordinates
        const snappedCoords = coords.map((coord: [number, number]) => [
          coord[0] + offsetX,
          coord[1] + offsetY
        ]);

        // Update the feature's coordinates with snapped version
        feature.geometry.coordinates[0] = snappedCoords;

        // Update the feature in MapboxDraw
        const allFeatures = draw.current.getAll();
        const featureToUpdate = allFeatures.features.find((f: any) => f.id === feature.id);
        if (featureToUpdate) {
          featureToUpdate.geometry.coordinates[0] = snappedCoords;
          draw.current.set(allFeatures);
        }

        // Update snap guide lines
        setSnapGuideLines({
          x: snapX,
          y: snapY
        });

        // Show toast with snap info
        if (snapInfo) {
          toast.info(`Snapped to ${snapInfo.otherShapeName}`, { duration: 500 });
        }
      } else {
        // Clear snap guide lines if no snapping
        setSnapGuideLines({ x: null, y: null });
      }
    });

    // Update SVG overlays for updated shapes
    e.features?.forEach((feature: any) => {
      console.log('🔍 Looking for overlay with featureId:', feature.id);
      console.log('📋 Available overlays:', Array.from(svgOverlays.current.entries()).map(([key, val]) => ({
        key,
        featureId: val.featureId
      })));

      // Find shape ID by feature ID
      const shapeEntry = Array.from(svgOverlays.current.entries()).find(
        ([_, overlay]) => overlay.featureId === feature.id
      );

      if (shapeEntry && feature.geometry) {
        const [shapeId, overlay] = shapeEntry;
        console.log('✅ Found overlay for shapeId:', shapeId);

        // Update stored coordinates and properties
        const newCoords = feature.geometry.coordinates[0];
        overlay.coordinates = Array.isArray(newCoords[0][0])
          ? newCoords[0] as [number, number][]
          : newCoords as [number, number][];

        console.log('📍 Updated overlay coordinates:', overlay.coordinates.length, 'points');

        if (feature.properties) {
          overlay.properties = feature.properties;
        }

        // Update position immediately
        console.log('🎯 Calling updateSvgOverlayPosition for:', shapeId);
        updateSvgOverlayPosition(shapeId);

        // Update local state with new coordinates
        setDrawnShapes(prev => prev.map(shape => {
          if (shape.id === shapeId) {
            console.log('✅ Updated shape coordinates in state:', shapeId);
            return {
              ...shape,
              coordinates: overlay.coordinates
            };
          }
          return shape;
        }));

        // Save coordinates to database
        saveShapeCoordinates(shapeId, overlay.coordinates);
      } else {
        console.error('❌ No overlay found for feature:', feature.id);
        console.error('Available overlays:', Array.from(svgOverlays.current.keys()));
      }
    });
  }, [cleanupOrphanOverlays, getSnapPoints, getShapeBounds, setSnapGuideLines, updateSvgOverlayPosition, setDrawnShapes, saveShapeCoordinates, drawnShapes]);

  // Re-register draw.update listener when handleShapeUpdate changes
  // This ensures the handler always has access to the latest drawnShapes and other state
  useEffect(() => {
    if (!map.current || !isMapReady) return;

    console.log('🔄 Re-registering draw.update event listener with updated handler');

    // Remove old listener
    map.current.off('draw.update', handleShapeUpdate);

    // Add new listener with updated handler
    map.current.on('draw.update', handleShapeUpdate);

    return () => {
      if (map.current) {
        map.current.off('draw.update', handleShapeUpdate);
      }
    };
  }, [handleShapeUpdate, isMapReady]);

  const handleShapeDelete = useCallback(async (e: any) => {
    const deletedFeatures = e.features;

    for (const feature of deletedFeatures) {
      try {
        const shapeId = feature.id;

        // Remove from state
        setDrawnShapes(prev => prev.filter(s => s.id !== shapeId));

        // Remove from map
        const overlay = svgOverlays.current.get(shapeId);
        if (overlay) {
          overlay.element.remove();
          svgOverlays.current.delete(shapeId);
        }

        // Delete from database
        await fetch(`/api/projects/${projectId}/shapes/${shapeId}`, {
          method: 'DELETE'
        });

        toast.success('Shape deleted');
      } catch (error) {
        console.error('Error deleting shape:', error);
        toast.error('Failed to delete shape');
      }
    }
  }, [projectId]);

  const handleAddShapeFromInput = () => {
    if (!shapeWidth || !shapeLength) {
      toast.error('Please enter width and length');
      return;
    }

    if (!draw.current || !map.current) {
      toast.error('Map not ready');
      return;
    }

    // Get center of map
    const center = map.current.getCenter();
    const width = Number(shapeWidth);
    const length = Number(shapeLength);

    // Convert feet to meters (approximate)
    const widthM = width * 0.3048;
    const lengthM = length * 0.3048;

    // Calculate corners (simplified rectangle)
    const halfWidth = widthM / 2;
    const halfLength = lengthM / 2;

    // Create a simple rectangle
    const coords = [
      [center.lng - halfWidth / 111320, center.lat - halfLength / 110540],
      [center.lng + halfWidth / 111320, center.lat - halfLength / 110540],
      [center.lng + halfWidth / 111320, center.lat + halfLength / 110540],
      [center.lng - halfWidth / 111320, center.lat + halfLength / 110540],
      [center.lng - halfWidth / 111320, center.lat - halfLength / 110540]
    ];

    const feature = {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'Polygon' as const,
        coordinates: [coords]
      }
    };

    draw.current.add(feature);
    toast.success('Shape added - now edit on map');
  };

  // Handler for adding shapes from the professional template builder
  const handleAddShapeFromBuilder = async (shape: {
    templateId: string;
    name: string;
    width: number;
    height: number;
    rotation: number;
    flipHorizontal: boolean;
    flipVertical: boolean;
    area: number;
    customSvg?: string; // For AI-generated shapes
    aiGenerated?: boolean;
  }) => {
    if (!draw.current || !map.current || !mapContainer.current) {
      toast.error('Map not ready');
      return;
    }

    // Get center of map
    const center = map.current.getCenter();

    // Convert feet to meters
    const widthM = shape.width * 0.3048;
    const heightM = shape.height * 0.3048;

    // Calculate corners for rectangle
    const halfWidth = widthM / 2;
    const halfHeight = heightM / 2;

    // Create base rectangle coordinates (before rotation)
    let coords = [
      [center.lng - halfWidth / 111320, center.lat - halfHeight / 110540],
      [center.lng + halfWidth / 111320, center.lat - halfHeight / 110540],
      [center.lng + halfWidth / 111320, center.lat + halfHeight / 110540],
      [center.lng - halfWidth / 111320, center.lat + halfHeight / 110540],
      [center.lng - halfWidth / 111320, center.lat - halfHeight / 110540]
    ];

    // Apply rotation if needed (rotate around center)
    if (shape.rotation !== 0) {
      const angleRad = (shape.rotation * Math.PI) / 180;
      const centerLng = center.lng;
      const centerLat = center.lat;

      coords = coords.map(([lng, lat]) => {
        const dx = lng - centerLng;
        const dy = lat - centerLat;
        const rotatedX = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
        const rotatedY = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);
        return [centerLng + rotatedX, centerLat + rotatedY];
      });
    }

    const feature = {
      type: 'Feature' as const,
      properties: {
        name: shape.name,
        templateId: shape.templateId,
        width: shape.width,
        height: shape.height,
        rotation: shape.rotation,
        flipHorizontal: shape.flipHorizontal,
        flipVertical: shape.flipVertical
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [coords]
      }
    };

    // Add to draw control and capture the assigned feature ID
    const addedFeatureIds = draw.current.add(feature);
    const assignedFeatureId = addedFeatureIds[0]; // MapboxDraw returns array of IDs

    console.log('🆔 MapboxDraw assigned featureId:', assignedFeatureId);

    // Calculate area and perimeter for saving
    const polygon = turf.polygon(feature.geometry.coordinates);
    const areaM2 = turf.area(polygon);
    const areaSqFt = areaM2 * 10.7639;
    const perimeterM = turf.length(polygon, { units: 'kilometers' }) * 1000;
    const perimeterFt = perimeterM * 3.28084;

    // Save to database
    try {
      const shapeData = {
        name: shape.name,
        shapeType: 'template',
        coordinates: feature.geometry.coordinates[0],
        area: areaSqFt,
        perimeter: perimeterFt,
        properties: {
          templateId: shape.templateId,
          width: shape.width,
          height: shape.height,
          rotation: shape.rotation,
          flipHorizontal: shape.flipHorizontal,
          flipVertical: shape.flipVertical,
          ...(shape.customSvg && { customSvg: shape.customSvg }), // Save AI-generated SVG
          ...(shape.aiGenerated && { aiGenerated: true })
        }
      };

      const response = await fetch(`/api/projects/${projectId}/shapes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shapeData)
      });

      if (response.ok) {
        const savedShape = await response.json();

        // Validate that we got an ID back from the database
        if (!savedShape || !savedShape.id) {
          console.error('❌ No ID returned from database:', savedShape);
          toast.error('Failed to save shape - no ID returned');
          // Clean up the feature we added
          if (draw.current) {
            draw.current.delete(assignedFeatureId);
          }
          return;
        }

        setDrawnShapes(prev => [...prev, savedShape]);

        console.log('💾 Shape saved to database:', {
          dbId: savedShape.id,
          mapboxFeatureId: assignedFeatureId,
          fullResponse: savedShape
        });

        // Update the MapboxDraw feature to use the database ID
        if (draw.current) {
          try {
            const existingFeature = draw.current.get(assignedFeatureId);
            if (existingFeature) {
              console.log('🔄 Updating MapboxDraw feature ID:', assignedFeatureId, '→', savedShape.id);
              draw.current.delete(assignedFeatureId);
              existingFeature.id = savedShape.id;
              draw.current.add(existingFeature);
              console.log('✅ MapboxDraw feature updated with database ID');
            }
          } catch (updateError) {
            console.error('Error updating MapboxDraw feature ID:', updateError);
          }
        }

        // Create SVG overlay - check for duplicates first
        if (svgOverlays.current.has(savedShape.id)) {
          console.log(`⚠️ Overlay already exists for ${savedShape.id}, skipping creation`);
          toast.success(`${shape.name} added to map - drag to position and resize as needed`);
        } else {
          // Check if this is an AI-generated shape with custom SVG
          const isAiGenerated = shape.aiGenerated === true;
          const customSvg = shape.customSvg;

          // For AI-generated shapes, use customSvg; otherwise look up template
          const template = !isAiGenerated ? getTemplateById(shape.templateId) : null;

          if (template || (isAiGenerated && customSvg)) {
            try {
              // Create HTML overlay div
              const overlayDiv = document.createElement('div');
              overlayDiv.style.position = 'absolute';
              overlayDiv.style.pointerEvents = 'none';
              overlayDiv.style.zIndex = '10';
              overlayDiv.style.transformOrigin = 'center center';
              overlayDiv.className = 'shape-svg-overlay';

              // Generate and transform SVG (keeps text readable)
              let transformedSvg: string;

              if (isAiGenerated && customSvg) {
                // AI-generated shape: use custom SVG directly
                transformedSvg = customSvg;
              } else if (template) {
                // Template shape: generate from template and apply transforms
                const baseSvg = template.getSvg(shape.width, shape.height);
                transformedSvg = transformSvg(
                  baseSvg,
                  shape.width,
                  shape.height,
                  {
                    flipHorizontal: shape.flipHorizontal,
                    flipVertical: shape.flipVertical
                  }
                );
              } else {
                throw new Error('No template or custom SVG available');
              }

              overlayDiv.innerHTML = transformedSvg;

              // Find the Mapbox canvas container and append overlay
              const canvasContainer = mapContainer.current.querySelector('.mapboxgl-canvas-container');
              if (canvasContainer) {
                canvasContainer.appendChild(overlayDiv);
              } else {
                mapContainer.current.appendChild(overlayDiv);
              }

              // Store overlay with database ID as BOTH key and featureId (now that we've updated MapboxDraw)
              svgOverlays.current.set(savedShape.id, {
                element: overlayDiv,
                featureId: savedShape.id, // Use database ID since MapboxDraw feature was updated
                coordinates: shapeData.coordinates as [number, number][],
                properties: shapeData.properties
              });

              console.log('💾 Stored overlay:', {
                key: savedShape.id,
                featureId: savedShape.id,
                hasElement: !!overlayDiv
              });

              // Position the overlay after a brief delay to ensure map is ready
              setTimeout(() => {
                updateSvgOverlayPosition(savedShape.id);
                console.log(`✨ Added SVG overlay for ${shape.name}`, {
                  shapeId: savedShape.id,
                  featureId: savedShape.id,
                  svgLength: transformedSvg.length,
                  overlayElement: overlayDiv,
                  appendedTo: canvasContainer ? 'canvas-container' : 'map-container',
                  properties: shapeData.properties
                });
              }, 100);

              toast.success(`${shape.name} added to map - drag to position and resize as needed`);
            } catch (svgError) {
              console.error('Error adding SVG overlay:', svgError);
              toast.error('Shape added but SVG overlay failed');
            }
          }
        }
      } else {
        toast.error('Failed to save shape');
      }
    } catch (error) {
      console.error('Error saving shape from builder:', error);
      toast.error('Failed to save shape');
    }
  };

  const drawMeasurementLine = (points: [number, number][]) => {
    if (!map.current) return;

    const lineGeoJSON = {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: points
      }
    };

    // Remove existing
    if (map.current.getLayer('measurement-line')) {
      map.current.removeLayer('measurement-line');
    }
    if (map.current.getLayer('measurement-points')) {
      map.current.removeLayer('measurement-points');
    }
    if (map.current.getSource('measurement')) {
      map.current.removeSource('measurement');
    }

    // Add line
    map.current.addSource('measurement', {
      type: 'geojson',
      data: lineGeoJSON
    });

    map.current.addLayer({
      id: 'measurement-line',
      type: 'line',
      source: 'measurement',
      paint: {
        'line-color': '#ff0000',
        'line-width': 3
      }
    });

    // Add points
    const pointsGeoJSON = {
      type: 'FeatureCollection' as const,
      features: points.map(p => ({
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Point' as const,
          coordinates: p
        }
      }))
    };

    map.current.addSource('measurement-points', {
      type: 'geojson',
      data: pointsGeoJSON
    });

    map.current.addLayer({
      id: 'measurement-points',
      type: 'circle',
      source: 'measurement-points',
      paint: {
        'circle-radius': 6,
        'circle-color': '#ff0000'
      }
    });
  };

  // Change map style
  const changeMapStyle = (style: 'satellite' | 'map') => {
    if (!map.current) return;

    const styleUrls = {
      satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
      map: 'mapbox://styles/mapbox/streets-v12'
    };

    console.log(`🎨 Changing map style to ${style}`);
    map.current.setStyle(styleUrls[style]);
    setMapStyle(style);

    // Wait for map to be completely idle (all tiles loaded, style ready)
    // This is more reliable than setTimeout for satellite imagery
    map.current.once('idle', () => {
      console.log('✅ Map idle after style change - re-adding all layers');
      reAddAllMapLayers();
    });

    toast.success(`Map style changed to ${style}`);
  };

  // Calculate property metrics
  const calculatePropertyMetrics = () => {
    try {
      // Use Regrid lot size data (more accurate than polygon calculation)
      // Fallback to polygon calculation only if Regrid data is missing
      const regridLotSize = parcel?.lotSizeSqFt;

      const turfCoords = boundaryCoords.map(c => [c[1], c[0]]);
      const closedCoords = [...turfCoords, turfCoords[0]];
      const boundaryPolygon = turf.polygon([closedCoords]);
      const calculatedLotSize = turf.area(boundaryPolygon) * 10.7639; // m² to sqft (fallback)

      // Prefer Regrid data over calculated polygon area
      const lotSizeSqFt = regridLotSize || calculatedLotSize;

      console.log('📏 Lot Size Sources:', {
        regridLotSize: regridLotSize?.toLocaleString(),
        calculatedLotSize: calculatedLotSize?.toLocaleString(),
        using: regridLotSize ? 'Regrid (accurate)' : 'Polygon (fallback)'
      });

      // Get max lot coverage percentage from zoning rules
      const getMaxLotCoverage = (zoningCode: string): number => {
        // Phoenix residential zoning max lot coverage percentages
        const coverageLimits: Record<string, number> = {
          'R1-6': 0.50,   // 50%
          'R1-8': 0.45,   // 45%
          'R1-10': 0.40,  // 40%
          'R1-14': 0.40,  // 40%
          'R1-18': 0.35,  // 35%
          'R-2': 0.50,    // 50%
          'R-3': 0.60,    // 60%
          'R-4': 0.60,    // 60%
          'R-5': 0.60,    // 60%
        };
        return coverageLimits[zoningCode] || 0.40; // Default 40%
      };

      // Calculate buildable area based on zoning max lot coverage
      const zoningCode = parcel?.zoning || 'R1-10';
      const maxCoveragePercent = getMaxLotCoverage(zoningCode);
      const buildableAreaSqFt = lotSizeSqFt * maxCoveragePercent;

      console.log('📐 Buildable Area Calculation:', {
        lotSizeSqFt: lotSizeSqFt.toLocaleString(),
        zoning: zoningCode,
        maxCoverage: `${(maxCoveragePercent * 100).toFixed(0)}%`,
        buildableAreaSqFt: buildableAreaSqFt.toLocaleString()
      });

      // Existing building coverage from assessor (totalBuildingSF is the roofed footprint)
      const existingBuildingSqFt = parcel?.totalBuildingSF || 0;

      // New shapes drawn by user (additions, new structures)
      const drawnShapesSqFt = drawnShapes.reduce((sum, shape) => sum + (shape.area || 0), 0);

      // Total coverage = existing buildings + new drawn shapes
      const currentCoverageSqFt = existingBuildingSqFt + drawnShapesSqFt;

      // Calculate remaining area
      const remainingAreaSqFt = Math.max(0, buildableAreaSqFt - currentCoverageSqFt);

      setPropertyMetrics({
        lotSize: Math.round(lotSizeSqFt),
        buildableArea: Math.round(buildableAreaSqFt),
        existingBuildings: Math.round(existingBuildingSqFt),
        drawnShapes: Math.round(drawnShapesSqFt),
        currentCoverage: Math.round(currentCoverageSqFt),
        remainingArea: Math.round(remainingAreaSqFt)
      });
    } catch (error) {
      console.error('Error calculating property metrics:', error);
    }
  };

  // Calculate and draw setbacks
  // Save setbacks and edge labels to database
  const saveSetbacksAndLabels = async () => {
    try {
      console.log('💾 Saving setbacks and edge labels:', {
        setbacks,
        edgeLabels,
        projectId
      });

      const response = await fetch(`/api/projects/${projectId}/save-setbacks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setbacks: {
            front: setbacks.front,
            rear: setbacks.rear,
            left: setbacks.sideLeft,
            right: setbacks.sideRight,
          },
          edgeLabels
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Setbacks and edge labels saved to database');
        toast.success('Setbacks saved');
      } else {
        console.error('❌ Failed to save:', data.error);
        toast.error('Failed to save setbacks');
      }
    } catch (error) {
      console.error('Error saving setbacks:', error);
      toast.error('Failed to save setbacks');
    }
  };

  const updateSetbacks = useCallback(() => {
    if (!map.current || !localBoundaryCoords || localBoundaryCoords.length === 0) return;

    // ISSUE 2 FIX: Check if Mapbox style is loaded before adding sources
    if (!map.current.isStyleLoaded()) {
      console.log('⏳ Style not loaded yet, skipping setback update');
      return;
    }

    console.log('🔴 ENTERING updateSetbacks (Mapbox)', {
      showSetbacks,
      setbacks,
      edgeLabelsCount: edgeLabels?.length,
      boundaryCount: localBoundaryCoords.length,
      hasMap: !!map.current,
      styleLoaded: map.current.isStyleLoaded(),
      edgeLabelsArray: edgeLabels,
      boundaryCoords: localBoundaryCoords
    });

    try {
      // Remove existing setback layers
      if (map.current.getLayer('setback-line')) map.current.removeLayer('setback-line');
      if (map.current.getSource('setback')) map.current.removeSource('setback');

      // ISSUE 1 FIX: Allow MORE labels than edges (use >= instead of ===)
      // We can find labels for each edge by edgeIndex even if we have extra labels
      console.log('🔍 COMPARISON:', {
        edgeLabelsLength: edgeLabels.length,
        localBoundaryCoordsLength: localBoundaryCoords.length,
        hasEnoughLabels: edgeLabels.length >= localBoundaryCoords.length,
        willUsePerEdge: (edgeLabels.length >= localBoundaryCoords.length && localBoundaryCoords.length > 0) ? 'YES ✅' : 'NO ❌ FALLBACK'
      });

      if (edgeLabels.length >= localBoundaryCoords.length && localBoundaryCoords.length > 0) {
        console.log('✅ Edge labels sufficient for boundary coords - using PER-EDGE setbacks (correct)');

        // Calculate offset lines and their intersections
        const offsetLinesData: any[] = [];

        localBoundaryCoords.forEach((coord, index) => {
          const nextIndex = (index + 1) % localBoundaryCoords.length;
          const nextCoord = localBoundaryCoords[nextIndex];

          const edgeLabel = edgeLabels.find(el => el.edgeIndex === index);
          if (!edgeLabel) return;

          // Map edge side to setbacks key (handle "sideLeft" → use it directly)
          let setbackFeet: number;
          if (edgeLabel.side === 'front') {
            setbackFeet = setbacks.front;
          } else if (edgeLabel.side === 'rear') {
            setbackFeet = setbacks.rear;
          } else if (edgeLabel.side === 'left') {
            setbackFeet = setbacks.sideLeft;
          } else if (edgeLabel.side === 'right') {
            setbackFeet = setbacks.sideRight;
          } else {
            setbackFeet = setbacks.sideLeft; // Default fallback
          }

          console.log(`🎨 Edge ${index}:`, {
            side: edgeLabel.side,
            setbackFeet,
            offsetDistance: `-${setbackFeet} feet`
          });

          // Create edge line (coords are already [lng, lat] format in Mapbox)
          const edgeLine = turf.lineString([coord, nextCoord]);

          try {
            // Offset inward using feet
            const offsetLine = turf.lineOffset(edgeLine, -setbackFeet, { units: 'feet' });
            offsetLinesData.push({
              line: offsetLine,
              edgeIndex: index,
              side: edgeLabel.side
            });
          } catch (error) {
            console.error('Error calculating offset for edge:', index, error);
          }
        });

        // Find intersections and create line segments with proper corners
        const lineSegments: any[] = [];

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

          // Add line segment
          lineSegments.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [startPoint, endPoint]
            },
            properties: {
              side: lineData.side,
              edgeIndex: lineData.edgeIndex
            }
          });
        });

        // Create GeoJSON FeatureCollection with all segments
        const setbackGeoJSON = {
          type: 'FeatureCollection',
          features: lineSegments
        };

        // Create buildable area polygon from line segments for violation detection
        try {
          const polygonCoords: any[] = [];

          // Extract coordinates from each line segment in order
          lineSegments.forEach((segment, index) => {
            // Add the start point of each segment
            polygonCoords.push(segment.geometry.coordinates[0]);
          });

          // Close the polygon by adding the first point at the end
          if (polygonCoords.length > 0) {
            polygonCoords.push(polygonCoords[0]);
          }

          // Create GeoJSON polygon for Turf.js violation detection
          const buildableAreaPolygon = turf.polygon([polygonCoords]);

          console.log('📐 Storing PER-EDGE buildable area polygon for violation detection');
          console.log('📐 Polygon type:', buildableAreaPolygon.type, buildableAreaPolygon.geometry.type);
          console.log('📐 Polygon coordinates (first 3):', buildableAreaPolygon.geometry.coordinates[0].slice(0, 3));
          console.log('📐 Total vertices:', polygonCoords.length);

          // Store the buildable area polygon in state
          setSetbackPolygon(buildableAreaPolygon);
        } catch (error) {
          console.error('❌ Error creating buildable area polygon from line segments:', error);
        }

        // Add to map
        map.current.addSource('setback', {
          type: 'geojson',
          data: setbackGeoJSON as any
        });

        map.current.addLayer({
          id: 'setback-line',
          type: 'line',
          source: 'setback',
          paint: {
            'line-color': '#f97316',
            'line-width': 4,
            'line-dasharray': [3, 2],
            'line-opacity': 1
          }
        });

        console.log('✅ PER-EDGE setback lines added:', lineSegments.length, 'segments');

      } else {
        // Fallback to averaged setback (only when we don't have enough edge labels)
        console.log('❌ FALLBACK MODE - Using AVERAGE setback (insufficient edge labels)', {
          edgeLabelsCount: edgeLabels.length,
          boundaryCount: localBoundaryCoords.length,
          reason: edgeLabels.length < localBoundaryCoords.length ? 'Not enough labels' : 'No boundary coords'
        });

        const ring = [...localBoundaryCoords, localBoundaryCoords[0]];
        const boundaryPolygon = turf.polygon([ring]);

        const avgSetbackFeet = (setbacks.front + setbacks.rear + setbacks.sideLeft + setbacks.sideRight) / 4;
        const avgSetbackMiles = avgSetbackFeet / 5280;
        const calculatedSetbackPolygon = turf.buffer(boundaryPolygon, -avgSetbackMiles, { units: 'miles' });

        if (calculatedSetbackPolygon) {
          // Store setback polygon in state for violation detection
          console.log('📐 Storing setback polygon for violation detection');
          console.log('📐 Setback polygon type:', calculatedSetbackPolygon.type, calculatedSetbackPolygon.geometry?.type);
          console.log('📐 Setback polygon coordinates:', calculatedSetbackPolygon.geometry?.coordinates?.[0]?.slice(0, 3));
          setSetbackPolygon(calculatedSetbackPolygon);

          map.current.addSource('setback', {
            type: 'geojson',
            data: calculatedSetbackPolygon
          });

          map.current.addLayer({
            id: 'setback-line',
            type: 'line',
            source: 'setback',
            paint: {
              'line-color': '#f97316',
              'line-width': 4,
              'line-dasharray': [3, 2],
              'line-opacity': 1
            }
          });

          console.log('⚠️ AVERAGE setback layer added (fallback mode)');
        }
      }
    } catch (error) {
      console.error('Error calculating setbacks:', error);
    }
  }, [localBoundaryCoords, setbacks, edgeLabels, showSetbacks]);

  // Helper: Convert meters to feet/inches format
  const toFeetInches = (meters: number) => {
    const totalFeet = meters * 3.28084;
    const feet = Math.floor(totalFeet);
    const inches = Math.round((totalFeet - feet) * 12);
    return inches > 0 ? `${feet}' ${inches}"` : `${feet}'`;
  };

  // Clear all editing markers
  const clearEditingMarkers = () => {
    vertexMarkers.current.forEach(marker => marker?.remove());
    vertexMarkers.current = [];
    edgeLabelMarkers.current.forEach(marker => marker?.remove());
    edgeLabelMarkers.current = [];
    measurementMarkers.current.forEach(marker => marker?.remove());
    measurementMarkers.current = [];
    setbackMarkers.current.forEach(marker => marker?.remove());
    setbackMarkers.current = [];
    dimensionMarkers.current.forEach(marker => marker?.remove());
    dimensionMarkers.current.clear();
  };

  // Format distance as feet and inches
  const formatFeetInches = (feet: number) => {
    const wholeFeet = Math.floor(feet);
    const inches = Math.round((feet - wholeFeet) * 12);
    return inches > 0 ? `${wholeFeet}' ${inches}"` : `${wholeFeet}'`;
  };

  // Create a circle marker for measurement points
  const createMeasurementMarker = (lngLat: [number, number], isInProgress: boolean = true) => {
    if (!map.current) return null;

    const el = document.createElement('div');
    el.className = 'measurement-point-marker';
    el.style.width = '10px';
    el.style.height = '10px';
    el.style.borderRadius = '50%';
    el.style.border = isInProgress ? '2px solid #ec4899' : '2px solid #3b82f6';
    el.style.backgroundColor = 'white';
    el.style.cursor = 'pointer';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat(lngLat as mapboxgl.LngLatLike)
      .addTo(map.current);

    return marker;
  };

  // Add a line layer to the map
  const addMeasurementLine = (points: [number, number][], layerId: string, isInProgress: boolean = true) => {
    if (!map.current || points.length < 2) return;

    // CRITICAL: Wait for style to be loaded before adding layers
    if (!map.current.isStyleLoaded()) {
      // Use event listener instead of setTimeout to avoid infinite loops
      map.current.once('styledata', () => {
        addMeasurementLine(points, layerId, isInProgress);
      });
      return;
    }

    const sourceId = `${layerId}-source`;
    const color = isInProgress ? '#ec4899' : '#3b82f6'; // magenta for in-progress, blue for saved

    // Remove existing layer and source if they exist
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }

    map.current.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: points
        }
      }
    });

    map.current.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': color,
        'line-width': 3, // Increased from 2 to 3 for better visibility
        'line-opacity': 1, // Increased from 0.8 to 1 for full opacity
        'line-dasharray': [4, 3] // Increased dash pattern for better visibility
      }
    });

    console.log(`✅ Added measurement line layer: ${layerId} with ${points.length} points, color: ${color}`);
    measurementLayersRef.current.push(layerId);
  };

  // Add distance label at midpoint of line segment
  const addDistanceLabel = (point1: [number, number], point2: [number, number], distance: number) => {
    if (!map.current) return null;

    const midpoint: [number, number] = [
      (point1[0] + point2[0]) / 2,
      (point1[1] + point2[1]) / 2
    ];

    const el = document.createElement('div');
    // FIX 4: Cleaner, more compact label styling
    el.style.backgroundColor = 'white';
    el.style.color = '#333';
    el.style.border = '1px solid #666';
    el.style.padding = '2px 6px';
    el.style.borderRadius = '3px';
    el.style.fontSize = '11px';
    el.style.fontWeight = 'bold';
    el.style.whiteSpace = 'nowrap';
    el.style.textAlign = 'center';
    el.style.pointerEvents = 'none';
    el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
    el.textContent = formatFeetInches(distance);

    const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat(midpoint as mapboxgl.LngLatLike)
      .addTo(map.current);

    return marker;
  };

  // Clear all measurement markers and lines
  const clearMeasurementVisuals = () => {
    measurementMarkersRef.current.forEach(marker => marker?.remove());
    measurementMarkersRef.current = [];

    measurementLayersRef.current.forEach(layerId => {
      if (map.current?.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
      const sourceId = `${layerId}-source`;
      if (map.current?.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }
    });
    measurementLayersRef.current = [];

    // Remove preview elements
    if (previewLineRef.current) {
      previewLineRef.current.remove();
      previewLineRef.current = null;
    }
    if (previewLabelRef.current) {
      previewLabelRef.current.remove();
      previewLabelRef.current = null;
    }
  };

  // Save measurement to database
  const saveMeasurement = async (points: [number, number][]) => {
    if (points.length < 2) {
      toast.error('Need at least 2 points to save measurement');
      return;
    }

    // PREVENT DUPLICATE SAVES: Check if already saving
    if (isSavingMeasurementRef.current) {
      console.log('⚠️ Already saving measurement, skipping duplicate');
      return;
    }

    // Calculate total distance and segment distances FIRST (needed for default name)
    let totalDistance = 0;
    const segmentDistances: number[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const from = turf.point(points[i]);
      const to = turf.point(points[i + 1]);
      const distance = turf.distance(from, to, { units: 'feet' });
      segmentDistances.push(distance);
      totalDistance += distance;
    }

    const measurementType = points.length === 2 ? 'line' : 'polyline';
    const defaultName = `${measurementType === 'line' ? 'Line' : 'Polyline'} ${formatFeetInches(totalDistance)}`;

    // Prompt for name
    const name = prompt('Name this measurement:', defaultName);
    if (!name) {
      toast.info('Measurement canceled');
      clearMeasurementVisuals();
      return;
    }

    // Set flag AFTER user confirms (prevents blocking if they cancel)
    isSavingMeasurementRef.current = true;

    try {
      const response = await fetch(`/api/projects/${projectId}/measurements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          measurementType,
          points,
          totalDistance,
          segmentDistances
        })
      });

      if (response.ok) {
        const saved = await response.json();
        setSavedMeasurements(prev => [...prev, saved.measurement]);
        toast.success('Measurement saved');

        // Clear current measurement visuals
        clearMeasurementVisuals();
        // Note: Mode and points are already cleared by the click handler
      } else {
        toast.error('Failed to save measurement');
      }
    } catch (error) {
      console.error('Error saving measurement:', error);
      toast.error('Failed to save measurement');
    } finally {
      // Reset flag after save completes or fails
      isSavingMeasurementRef.current = false;
    }
  };

  // Find snap point near cursor
  const findSnapPoint = (mousePos: [number, number]): [number, number] | null => {
    if (!map.current) return null;

    const snapDistance = 10; // pixels
    const point = map.current.project(mousePos as mapboxgl.LngLatLike);

    // Check boundary vertices
    for (const coord of localBoundaryCoords) {
      const projected = map.current.project(coord as mapboxgl.LngLatLike);
      const distance = Math.sqrt(
        Math.pow(projected.x - point.x, 2) + Math.pow(projected.y - point.y, 2)
      );
      if (distance <= snapDistance) {
        return coord;
      }
    }

    // Check drawn shapes
    for (const shape of drawnShapes) {
      if (shape.coordinates && Array.isArray(shape.coordinates[0])) {
        for (const coord of shape.coordinates[0]) {
          const projected = map.current.project(coord as mapboxgl.LngLatLike);
          const distance = Math.sqrt(
            Math.pow(projected.x - point.x, 2) + Math.pow(projected.y - point.y, 2)
          );
          if (distance <= snapDistance) {
            return [coord[0], coord[1]];
          }
        }
      }
    }

    // Check other measurement points
    for (const point of measurementPoints) {
      const projected = map.current.project(point as mapboxgl.LngLatLike);
      const distance = Math.sqrt(
        Math.pow(projected.x - point.x, 2) + Math.pow(projected.y - point.y, 2)
      );
      if (distance <= snapDistance) {
        return point;
      }
    }

    return null;
  };

  // Clear current measurement
  const clearMeasurement = useCallback(() => {
    setMeasurementPoints([]);
    setMeasurementPreview(null);
    setIsDrawingMeasurement(false);
    setSnapPoint(null);

    // Remove preview layers
    if (map.current) {
      if (map.current.getLayer('measurement-preview-line')) {
        map.current.removeLayer('measurement-preview-line');
      }
      if (map.current.getSource('measurement-preview')) {
        map.current.removeSource('measurement-preview');
      }
      if (map.current.getLayer('measurement-drawing-line')) {
        map.current.removeLayer('measurement-drawing-line');
      }
      if (map.current.getSource('measurement-drawing')) {
        map.current.removeSource('measurement-drawing');
      }
    }

    // Remove markers
    measurementMarkersRef.current.forEach(m => m?.remove());
    measurementMarkersRef.current = [];
  }, []);

  // Add measurement point
  const addMeasurementPoint = useCallback((lngLat: [number, number]) => {
    const pointToAdd = snapPoint || lngLat;

    // Add point marker
    if (map.current) {
      const el = document.createElement('div');
      el.style.cssText = `
        width: 10px;
        height: 10px;
        background: white;
        border: 2px solid #3b82f6;
        border-radius: 50%;
        cursor: pointer;
      `;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(pointToAdd as mapboxgl.LngLatLike)
        .addTo(map.current);

      measurementMarkersRef.current.push(marker);
    }

    setMeasurementPoints(prev => [...prev, pointToAdd]);
    setIsDrawingMeasurement(true);
  }, [snapPoint]);

  // Finish measurement and save
  const finishMeasurement = useCallback(async () => {
    if (measurementPoints.length < 2) return;

    // Calculate distances
    const segmentDistances: number[] = [];
    let totalDistance = 0;

    for (let i = 0; i < measurementPoints.length - 1; i++) {
      const point1 = turf.point(measurementPoints[i]);
      const point2 = turf.point(measurementPoints[i + 1]);
      const distance = turf.distance(point1, point2, { units: 'feet' });
      segmentDistances.push(distance);
      totalDistance += distance;
    }

    // Prompt for name
    const name = prompt('Name this measurement:', `Measurement ${savedMeasurements.length + 1}`);
    if (!name) {
      clearMeasurement();
      return;
    }

    // Create measurement object
    const measurement = {
      id: `measurement-${Date.now()}`,
      name,
      points: measurementPoints,
      totalDistance,
      segmentDistances
    };

    // Save to state
    setSavedMeasurements(prev => [...prev, measurement]);

    // Determine measurement type
    const measurementType = measurementPoints.length === 2 ? 'line' : 'polyline';

    // Save to database
    try {
      await fetch(`/api/projects/${projectId}/measurements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: measurement.name,
          measurementType,
          points: measurement.points,
          totalDistance: measurement.totalDistance,
          segmentDistances: measurement.segmentDistances
        })
      });
    } catch (error) {
      console.error('Failed to save measurement:', error);
    }

    // Clear current drawing
    clearMeasurement();
  }, [measurementPoints, savedMeasurements, clearMeasurement, projectId]);

  // Inline editing functions for measurement name
  const startEditingName = (id: string, currentName: string) => {
    setEditingMeasurementId(id);
    setEditingMeasurementName(currentName || '');
  };

  const saveMeasurementName = async (id: string) => {
    if (!editingMeasurementName.trim()) {
      setEditingMeasurementId(null);
      return;
    }

    // Update local state
    setSavedMeasurements(prev =>
      prev.map(m => m.id === id ? { ...m, name: editingMeasurementName.trim() } : m)
    );

    // Save to database
    try {
      await fetch(`/api/projects/${projectId}/measurements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingMeasurementName.trim() }),
      });
    } catch (error) {
      console.error('Error saving measurement name:', error);
    }

    setEditingMeasurementId(null);
  };

  // Inline editing functions for measurement distance
  const startEditingDistance = (id: string, currentDistance: string) => {
    setEditingMeasurementDistanceId(id);
    setEditingMeasurementDistance(currentDistance);
  };

  const saveMeasurementDistance = async (id: string) => {
    const trimmedDistance = editingMeasurementDistance.trim();
    console.log('💾 Saving measurement distance:', { id, trimmedDistance });

    // Update local state with display override
    setSavedMeasurements(prev =>
      prev.map(m => m.id === id ? { ...m, displayDistance: trimmedDistance || undefined } : m)
    );

    // Save to database
    try {
      const response = await fetch(`/api/projects/${projectId}/measurements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayDistance: trimmedDistance || null }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Measurement distance saved successfully:', data);
      } else {
        console.error('❌ Failed to save measurement distance:', response.status, await response.text());
      }
    } catch (error) {
      console.error('❌ Error saving measurement distance:', error);
    }

    setEditingMeasurementDistanceId(null);
  };

  // Helper: Parse distance string to inches
  const parseDistanceToInches = (distance: string): number => {
    if (!distance || !distance.trim()) return 0;

    // Handle format: 32' 9" or 32'9" or 32' or 32.5 or just 32
    const feetInchesMatch = distance.match(/(\d+(?:\.\d+)?)'?\s*(\d+(?:\.\d+)?)?\"?/);

    if (feetInchesMatch) {
      const feet = parseFloat(feetInchesMatch[1]) || 0;
      const inches = parseFloat(feetInchesMatch[2]) || 0;
      return (feet * 12) + inches;
    }

    // Just a number - assume feet
    const numMatch = distance.match(/(\d+(?:\.\d+)?)/);
    if (numMatch) {
      return parseFloat(numMatch[1]) * 12;
    }

    return 0;
  };

  // Helper: Calculate total from segment distances
  const calculateTotalFromSegments = (segments: { label: string; distance: string }[]): string => {
    let totalInches = 0;

    segments.forEach(seg => {
      totalInches += parseDistanceToInches(seg.distance);
    });

    // Convert back to feet and inches format
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);

    if (inches === 0) {
      return `${feet}'`;
    }
    return `${feet}' ${inches}"`;
  };

  // Expanded edit mode functions
  const startExpandedEdit = (measurement: typeof savedMeasurements[0]) => {
    // Parse segments for polylines
    const segments = measurement.segmentDistances.length > 1
      ? measurement.segmentDistances.map((dist, i) => {
          const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          const from = letters[i];
          const to = letters[i + 1];
          return {
            label: `${from}→${to}`,
            distance: formatFeetInches(dist)
          };
        })
      : [];

    setExpandedEditMeasurementId(measurement.id);
    setExpandedEditData({
      name: measurement.name || '',
      segments,
      totalDistance: measurement.displayDistance || formatFeetInches(measurement.totalDistance),
    });
  };

  const saveExpandedEdit = async (id: string) => {
    if (!expandedEditData) return;

    const measurement = savedMeasurements.find(m => m.id === id);
    console.log('💾 saveExpandedEdit called for:', {
      id,
      name: expandedEditData.name,
      totalDistance: expandedEditData.totalDistance,
      segments: expandedEditData.segments,
      isSingleLine: expandedEditData.segments.length === 0,
      currentDisplayDistance: measurement?.displayDistance
    });

    // Parse segment distances back to numbers for polylines
    const segmentDistancesNumbers = expandedEditData.segments.length > 0
      ? expandedEditData.segments.map(seg => parseDistanceToInches(seg.distance) / 12) // Convert back to feet
      : [];

    // Update local state
    setSavedMeasurements(prev => {
      const updated = prev.map(m => m.id === id ? {
        ...m,
        name: expandedEditData.name,
        displayDistance: expandedEditData.totalDistance,
        // Update segmentDistances if it's a polyline
        ...(segmentDistancesNumbers.length > 0 && { segmentDistances: segmentDistancesNumbers }),
      } : m);

      console.log('✅ State updated. New measurement:', updated.find(m => m.id === id));
      return updated;
    });

    // Save to database
    try {
      const payload: any = {
        name: expandedEditData.name,
        displayDistance: expandedEditData.totalDistance || null,
      };

      // Include segmentDistances for polylines
      if (segmentDistancesNumbers.length > 0) {
        payload.segmentDistances = segmentDistancesNumbers;
      }

      console.log('💾 Saving measurement edits:', payload);

      const response = await fetch(`/api/projects/${projectId}/measurements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log('✅ Expanded measurement edits saved');
        toast.success('Measurement updated');
        // Map labels will auto-update via useEffect watching savedMeasurements
      } else {
        console.error('❌ Failed to save expanded edits:', response.status);
        toast.error('Failed to update measurement');
      }
    } catch (error) {
      console.error('❌ Error saving expanded edits:', error);
      toast.error('Failed to update measurement');
    }

    setExpandedEditMeasurementId(null);
    setExpandedEditData(null);
  };

  const cancelExpandedEdit = () => {
    setExpandedEditMeasurementId(null);
    setExpandedEditData(null);
  };

  // Re-render saved measurements when they change
  useEffect(() => {
    if (map.current && savedMeasurements.length > 0) {
      console.log(`📊 Re-rendering ${savedMeasurements.length} saved measurements`);
      renderSavedMeasurements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedMeasurements]); // renderSavedMeasurements is stable (useCallback)

  // Comprehensive function to re-add ALL map layers after style change
  const reAddAllMapLayers = useCallback(() => {
    if (!map.current || !map.current.isStyleLoaded()) {
      console.log('⏳ Map not ready, skipping layer re-add');
      return;
    }

    console.log('🔄 Re-adding ALL map layers after style change');

    try {
      // 1. Add property boundary first (bottom layer)
      addPropertyBoundary();

      // 2. Add setbacks after a small delay to ensure style is fully settled
      setTimeout(() => {
        if (map.current?.isStyleLoaded()) {
          console.log('🔄 Re-adding setbacks');
          updateSetbacks();
        }
      }, 50);

      // 3. Re-add saved measurements with dashed lines
      savedMeasurements.forEach((measurement, index) => {
        const lineId = `saved-measurement-${measurement.id}`;
        const sourceId = lineId;

        // Remove if exists
        if (map.current?.getLayer(lineId)) {
          map.current.removeLayer(lineId);
        }
        if (map.current?.getSource(sourceId)) {
          map.current.removeSource(sourceId);
        }

        // Create line with turf
        const lineString = turf.lineString(measurement.points);

        // Add source
        map.current?.addSource(sourceId, {
          type: 'geojson',
          data: lineString
        });

        // Add layer with dashed line
        map.current?.addLayer({
          id: lineId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': '#3b82f6',
            'line-width': 3,
            'line-dasharray': [4, 3] // CRITICAL: dashed line
          }
        });

        console.log(`✅ Re-added measurement line: ${measurement.name}`);

        // Add distance labels
        measurement.segmentDistances.forEach((distance, segIndex) => {
          const point1 = measurement.points[segIndex];
          const point2 = measurement.points[segIndex + 1];
          const midLng = (point1[0] + point2[0]) / 2;
          const midLat = (point1[1] + point2[1]) / 2;

          const labelEl = document.createElement('div');
          labelEl.style.cssText = `
            background: white;
            border: 2px solid #3b82f6;
            color: #3b82f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            pointer-events: none;
          `;
          labelEl.textContent = formatFeetInches(distance);

          const marker = new mapboxgl.Marker({ element: labelEl })
            .setLngLat([midLng, midLat] as mapboxgl.LngLatLike)
            .addTo(map.current!);

          savedMeasurementMarkersRef.current.push(marker);
        });
      });

      console.log(`✅ Re-added ${savedMeasurements.length} measurements`);

    } catch (error) {
      console.error('Error re-adding map layers:', error);
    }
  }, [savedMeasurements, addPropertyBoundary, updateSetbacks]);

  // Render saved measurements on map
  const renderSavedMeasurements = useCallback(() => {
    if (!map.current) return;

    // Note: We use Mapbox Markers (DOM elements) for labels, which don't require
    // style to be loaded. Only check style for layers/sources.
    const styleLoaded = map.current.isStyleLoaded();
    console.log('📊 Rendering saved measurements, styleLoaded:', styleLoaded);

    // Clear existing markers (DOM elements - always works)
    savedMeasurementMarkersRef.current.forEach(marker => marker?.remove());
    savedMeasurementMarkersRef.current = [];

    // Remove existing measurement layers (only if style is loaded)
    if (styleLoaded) {
      measurementLayersRef.current.forEach(layerId => {
        if (map.current?.getLayer(layerId)) {
          map.current.removeLayer(layerId);
        }
        if (map.current?.getSource(layerId)) {
          map.current.removeSource(layerId);
        }
      });
      measurementLayersRef.current = [];
    }

    // Render each saved measurement
    savedMeasurements.forEach((measurement, index) => {
      const lineId = `saved-measurement-${measurement.id}`;

      if (styleLoaded) {
        measurementLayersRef.current.push(lineId);

        // Create line
        const lineString = turf.lineString(measurement.points);

        if (map.current) {
          try {
            // Check and remove existing layer and source if they exist
            if (map.current.getLayer(lineId)) {
              map.current.removeLayer(lineId);
            }
            if (map.current.getSource(lineId)) {
              map.current.removeSource(lineId);
            }

            map.current.addSource(lineId, {
              type: 'geojson',
              data: lineString
            });

            map.current.addLayer({
              id: lineId,
              type: 'line',
              source: lineId,
              paint: {
                'line-color': '#3b82f6',
                'line-width': 3,
                'line-dasharray': [4, 3] // Add dashed line for visibility
              }
            });
          } catch (error) {
            console.warn('Failed to add measurement line layer:', error);
          }
        }
      }

      // Add distance labels at midpoints (markers work regardless of style state)
      if (map.current) {
        measurement.segmentDistances.forEach((distance, segIndex) => {
          const point1 = measurement.points[segIndex];
          const point2 = measurement.points[segIndex + 1];
          const midLng = (point1[0] + point2[0]) / 2;
          const midLat = (point1[1] + point2[1]) / 2;

          const labelEl = document.createElement('div');
          labelEl.style.cssText = `
            background: white;
            border: 2px solid #3b82f6;
            color: #3b82f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            pointer-events: none;
          `;

          // Use displayDistance for single-segment measurements, otherwise use segment distance
          const isSingleLine = measurement.segmentDistances.length === 1;
          const displayText = (isSingleLine && measurement.displayDistance)
            ? measurement.displayDistance
            : formatFeetInches(distance);

          console.log(`🏷️ Rendering label for ${measurement.name}:`, {
            isSingleLine,
            displayDistance: measurement.displayDistance,
            calculatedDistance: formatFeetInches(distance),
            finalText: displayText
          });

          labelEl.textContent = displayText;

          const marker = new mapboxgl.Marker({ element: labelEl })
            .setLngLat([midLng, midLat] as mapboxgl.LngLatLike)
            .addTo(map.current);

          savedMeasurementMarkersRef.current.push(marker);
        });
      }
    });
  }, [savedMeasurements]);

  // Auto-render saved measurements when state changes
  useEffect(() => {
    if (!map.current) {
      console.log('⏳ Skipping measurement render - no map instance');
      return;
    }
    // Don't check isStyleLoaded() here - markers (DOM elements) don't need it
    console.log('🔄 useEffect triggered - re-rendering measurements:', savedMeasurements.length);
    renderSavedMeasurements();
  }, [savedMeasurements, renderSavedMeasurements]);

  // Add vertex markers for editing
  const addVertexMarkers = useCallback(() => {
    if (!map.current || !localBoundaryCoords || viewMode !== 'edit') return;

    clearEditingMarkers();

    localBoundaryCoords.forEach((coord, index) => {
      const el = document.createElement('div');
      el.style.cssText = `
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #3b82f6;
        border: 2px solid white;
        cursor: move;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      `;

      const marker = new mapboxgl.Marker({
        element: el,
        draggable: true
      })
        .setLngLat(coord)
        .addTo(map.current);

      // Real-time boundary update while dragging
      marker.on('drag', () => {
        const lngLat = marker.getLngLat();
        const newCoords = [...localBoundaryCoords];
        newCoords[index] = [lngLat.lng, lngLat.lat];

        // Update the boundary line SOURCE in real-time (visual only, no state update)
        const source = map.current?.getSource('boundary');
        if (source && source.type === 'geojson') {
          const coordinates = [...newCoords, newCoords[0]]; // Close polygon
          source.setData({
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Polygon',
                coordinates: [coordinates]
              }
            }]
          });
        }
      });

      // Update state on dragend (triggers full re-render)
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        const newCoords = [...localBoundaryCoords];
        newCoords[index] = [lngLat.lng, lngLat.lat];

        // Update local boundary coordinates state (this will trigger re-render and redraw)
        setLocalBoundaryCoords(newCoords);

        console.log('✅ Vertex dragged to:', [lngLat.lng, lngLat.lat]);
      });

      vertexMarkers.current.push(marker);
    });
  }, [localBoundaryCoords, viewMode]);

  // FIX 2: Add edge label markers - ONE label per edge (not per coordinate)
  const addEdgeLabelMarkers = useCallback(() => {
    if (!map.current || !localBoundaryCoords || viewMode !== 'edit') return;

    edgeLabelMarkers.current.forEach(marker => marker?.remove());
    edgeLabelMarkers.current = [];

    // Remove consecutive duplicate coordinates
    const cleanCoords: [number, number][] = [];
    for (let i = 0; i < localBoundaryCoords.length; i++) {
      const current = localBoundaryCoords[i];
      const next = localBoundaryCoords[i + 1];

      // Skip if next coordinate is identical to current (consecutive duplicate)
      if (next && current[0] === next[0] && current[1] === next[1]) {
        console.log(`⚠️ Skipping duplicate at index ${i}: [${current[0]}, ${current[1]}]`);
        continue;
      }

      cleanCoords.push(current);
    }

    console.log(`🔷 Cleaned coords: ${localBoundaryCoords.length} → ${cleanCoords.length}`);

    // Calculate unique edges (pairs of consecutive points) using cleaned coordinates
    const edges: Array<{ start: [number, number]; end: [number, number]; edgeIndex: number }> = [];

    // Process edges as consecutive coordinate pairs
    // For a 4-corner property with coords [A, B, C, D], create edges: A-B, B-C, C-D, D-A
    for (let i = 0; i < cleanCoords.length; i++) {
      const start = cleanCoords[i];
      const end = cleanCoords[(i + 1) % cleanCoords.length];

      // Skip if this creates a duplicate edge (when last coord equals first coord)
      const isDuplicateClosingEdge =
        i === cleanCoords.length - 1 &&
        start[0] === end[0] &&
        start[1] === end[1];

      if (!isDuplicateClosingEdge) {
        edges.push({
          start,
          end,
          edgeIndex: i
        });
      }
    }

    console.log(`📍 Creating ${edges.length} edge labels for ${cleanCoords.length} clean coordinates`);

    // Calculate edge lengths and only label significant edges
    const significantEdges = edges.filter(edge => {
      const [lng1, lat1] = edge.start;
      const [lng2, lat2] = edge.end;

      // Calculate distance in meters using Turf
      const from = turf.point([lng1, lat1]);
      const to = turf.point([lng2, lat2]);
      const distanceMeters = turf.distance(from, to, { units: 'meters' });
      const distanceFeet = distanceMeters * 3.28084;

      // Only create labels for edges longer than 5 feet
      // This skips duplicate/intermediate vertices
      const isSignificant = distanceFeet > 5;

      if (!isSignificant) {
        console.log(`⏭️ Skipping short edge: ${distanceFeet.toFixed(1)} ft`);
      }

      return isSignificant;
    });

    console.log(`🔷 ${edges.length} edges → ${significantEdges.length} labeled edges`);

    // Create ONE label at midpoint of each significant edge
    significantEdges.forEach(edge => {
      // Calculate midpoint
      const midLng = (edge.start[0] + edge.end[0]) / 2;
      const midLat = (edge.start[1] + edge.end[1]) / 2;

      const currentLabel = edgeLabels.find(l => l.edgeIndex === edge.edgeIndex);
      const side = currentLabel?.side || 'unlabeled';

      const el = document.createElement('div');
      el.style.cssText = `
        background: #FCD34D;
        color: #000;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      `;
      el.textContent = side === 'unlabeled' ? 'Click to label' : side.charAt(0).toUpperCase() + side.slice(1);

      el.addEventListener('click', () => {
        const sides = ['front', 'side-left', 'side-right', 'rear'];
        const currentIndex = sides.indexOf(side);
        const nextSide = sides[(currentIndex + 1) % sides.length];

        setEdgeLabels(prev => {
          const filtered = prev.filter(l => l.edgeIndex !== edge.edgeIndex);
          return [...filtered, { edgeIndex: edge.edgeIndex, side: nextSide }];
        });
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([midLng, midLat])
        .addTo(map.current);

      edgeLabelMarkers.current.push(marker);
    });
  }, [localBoundaryCoords, edgeLabels, viewMode]);

  // Add draggable setback handles (replicate Leaflet behavior)
  const addSetbackHandles = useCallback(() => {
    if (!map.current || !localBoundaryCoords || viewMode !== 'edit') return;

    // Clear existing setback handles and dimension labels
    setbackMarkers.current.forEach(marker => marker?.remove());
    setbackMarkers.current = [];
    dimensionMarkers.current.forEach(marker => marker?.remove());
    dimensionMarkers.current.clear();

    // Side colors (Apple-style)
    const sideColors: Record<string, string> = {
      'front': '#ef4444',      // red
      'rear': '#3b82f6',       // blue
      'side-left': '#10b981',  // green
      'side-right': '#f59e0b'  // orange
    };

    // Map side labels to setback property names
    const sideToSetbackKey: Record<string, keyof typeof setbacks> = {
      'front': 'front',
      'rear': 'rear',
      'side-left': 'sideLeft',
      'side-right': 'sideRight'
    };

    // Group edges by their labeled side
    const edgesBySide: Record<string, Array<{ start: [number, number]; end: [number, number] }>> = {};

    localBoundaryCoords.forEach((coord, i) => {
      const nextCoord = localBoundaryCoords[(i + 1) % localBoundaryCoords.length];
      const label = edgeLabels.find(l => l.edgeIndex === i);

      if (label && label.side !== 'unlabeled') {
        if (!edgesBySide[label.side]) {
          edgesBySide[label.side] = [];
        }
        edgesBySide[label.side].push({
          start: coord,
          end: nextCoord
        });
      }
    });

    console.log('🎯 Edges grouped by side:', Object.keys(edgesBySide));

    // Create handle for each labeled side
    Object.entries(edgesBySide).forEach(([side, edges]) => {
      if (edges.length === 0) return;

      // Calculate average midpoint of all edges for this side
      let totalLng = 0;
      let totalLat = 0;
      edges.forEach(edge => {
        const midLng = (edge.start[0] + edge.end[0]) / 2;
        const midLat = (edge.start[1] + edge.end[1]) / 2;
        totalLng += midLng;
        totalLat += midLat;
      });
      const avgMidLng = totalLng / edges.length;
      const avgMidLat = totalLat / edges.length;

      // Get current setback distance for this side
      const setbackKey = sideToSetbackKey[side];
      const currentSetback = setbackKey ? setbacks[setbackKey] : 20;

      // Calculate perpendicular offset direction
      // For now, offset inward by the setback distance
      const setbackMeters = currentSetback / 3.28084;

      // Create line from first edge
      const firstEdge = edges[0];
      const edgeLine = turf.lineString([firstEdge.start, firstEdge.end]);

      // Calculate perpendicular offset (negative = inward)
      let setbackLine;
      try {
        setbackLine = turf.lineOffset(edgeLine, -setbackMeters / 1000, { units: 'kilometers' });
      } catch (error) {
        console.error(`Error calculating setback line for ${side}:`, error);
        return;
      }

      // Get midpoint of setback line
      const setbackCoords = setbackLine.geometry.coordinates as [number, number][];
      const setbackMidLng = (setbackCoords[0][0] + setbackCoords[1][0]) / 2;
      const setbackMidLat = (setbackCoords[0][1] + setbackCoords[1][1]) / 2;

      // Create handle element (white square with colored border)
      const handleEl = document.createElement('div');
      handleEl.style.cssText = `
        width: 24px;
        height: 24px;
        background: white;
        border: 3px solid ${sideColors[side] || '#666'};
        border-radius: 4px;
        cursor: move;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        color: ${sideColors[side] || '#666'};
      `;
      handleEl.textContent = '↔';

      const handleMarker = new mapboxgl.Marker({
        element: handleEl,
        draggable: true
      })
        .setLngLat([setbackMidLng, setbackMidLat])
        .addTo(map.current);

      // Create dimension label ONLY if setbacks have been applied (positioned AWAY from edge label buttons)
      console.log('Creating setback labels, setbacksApplied:', setbacksApplied);
      let labelMarker: mapboxgl.Marker | null = null;

      if (setbacksApplied) {
        const labelEl = document.createElement('div');
        labelEl.style.cssText = `
          background: ${sideColors[side] || '#666'};
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          pointer-events: none;
          user-select: none;
        `;
        labelEl.textContent = `${currentSetback.toFixed(1)} ft`;

        // Position label further INWARD from the boundary (on the setback line)
        // Calculate direction vector pointing inward from boundary
        const boundaryMidLng = avgMidLng;
        const boundaryMidLat = avgMidLat;
        const inwardVectorLng = setbackMidLng - boundaryMidLng;
        const inwardVectorLat = setbackMidLat - boundaryMidLat;
        const vectorLength = Math.sqrt(inwardVectorLng * inwardVectorLng + inwardVectorLat * inwardVectorLat);

        // Normalize and extend the vector to move label further inward
        const extraOffset = 0.00005; // Additional inward offset in degrees
        const labelLng = setbackMidLng + (inwardVectorLng / vectorLength) * extraOffset;
        const labelLat = setbackMidLat + (inwardVectorLat / vectorLength) * extraOffset;

        labelMarker = new mapboxgl.Marker({
          element: labelEl,
          anchor: 'center', // Center the label on the position
          offset: [0, 0]
        })
          .setLngLat([labelLng, labelLat])
          .addTo(map.current);
      }

      // Store original edges for distance calculation
      const originalEdges = edges.map(edge => turf.lineString([edge.start, edge.end]));

      // Handle drag events
      handleMarker.on('drag', () => {
        const lngLat = handleMarker.getLngLat();
        const point = turf.point([lngLat.lng, lngLat.lat]);

        // Calculate distance from boundary edges
        let totalDistance = 0;
        originalEdges.forEach(edgeLine => {
          const distance = turf.pointToLineDistance(point, edgeLine, { units: 'meters' });
          totalDistance += distance;
        });

        const avgDistance = totalDistance / originalEdges.length;
        const distanceFeet = avgDistance * 3.28084;

        // Update dimension label in real-time (only if labels are visible)
        if (labelMarker) {
          const labelEl = labelMarker.getElement().querySelector('div');
          if (labelEl) {
            labelEl.textContent = `${distanceFeet.toFixed(1)} ft`;
          }
          labelMarker.setLngLat(lngLat);
        }
      });

      handleMarker.on('dragend', () => {
        const lngLat = handleMarker.getLngLat();
        const point = turf.point([lngLat.lng, lngLat.lat]);

        // Calculate final distance
        let totalDistance = 0;
        originalEdges.forEach(edgeLine => {
          const distance = turf.pointToLineDistance(point, edgeLine, { units: 'meters' });
          totalDistance += distance;
        });

        const avgDistance = totalDistance / originalEdges.length;
        const distanceFeet = avgDistance * 3.28084;

        // Update setbacks state
        if (setbackKey) {
          setSetbacks(prev => ({
            ...prev,
            [setbackKey]: Math.round(distanceFeet * 10) / 10 // Round to 1 decimal
          }));

          toast.success(`${side} setback updated to ${distanceFeet.toFixed(1)} ft`);

          // Recalculate buildable area
          setTimeout(() => {
            updateSetbacks();
          }, 100);
        }
      });

      setbackMarkers.current.push(handleMarker);
      dimensionMarkers.current.set(side, labelMarker);
    });
  }, [localBoundaryCoords, edgeLabels, setbacks, viewMode, updateSetbacks, setbacksApplied]);

  // Add measurement labels (FIX 2: Only show in edit mode, FIX 3: Offset labels outside lines)
  const addMeasurementLabels = useCallback(() => {
    if (!map.current || !localBoundaryCoords || viewMode !== 'edit') return;

    // Clear existing measurement markers
    measurementMarkers.current.forEach(marker => marker?.remove());
    measurementMarkers.current = [];

    // Validation helper
    const isValidCoord = (coord: any) => {
      return Array.isArray(coord) &&
             coord.length === 2 &&
             typeof coord[0] === 'number' &&
             typeof coord[1] === 'number' &&
             !isNaN(coord[0]) &&
             !isNaN(coord[1]) &&
             isFinite(coord[0]) &&
             isFinite(coord[1]);
    };

    // Validate all boundary coordinates first
    const invalidCoords = localBoundaryCoords.filter((coord, idx) => {
      const valid = isValidCoord(coord);
      if (!valid) {
        console.error(`❌ Invalid boundary coordinate at index ${idx}:`, coord);
      }
      return !valid;
    });

    if (invalidCoords.length > 0) {
      console.error('❌ Cannot create measurements - invalid coordinates found');
      return;
    }

    // Calculate property center for determining outward direction
    const centerLng = localBoundaryCoords.reduce((sum, c) => sum + c[0], 0) / localBoundaryCoords.length;
    const centerLat = localBoundaryCoords.reduce((sum, c) => sum + c[1], 0) / localBoundaryCoords.length;

    console.log('📏 Creating measurement labels for', localBoundaryCoords.length, 'edges');
    console.log('🎯 Property center:', [centerLng, centerLat]);

    localBoundaryCoords.forEach((coord, index) => {
      try {
        const nextIndex = (index + 1) % localBoundaryCoords.length;
        const nextCoord = localBoundaryCoords[nextIndex];

        // Validate coordinates for this edge
        if (!isValidCoord(coord) || !isValidCoord(nextCoord)) {
          console.warn(`⚠️ Skipping edge ${index} - invalid coordinates`);
          return;
        }

        // Calculate distance using Turf
        const from = turf.point(coord);
        const to = turf.point(nextCoord);
        const distance = turf.distance(from, to, { units: 'meters' });

        // Calculate midpoint
        let midLng = (coord[0] + nextCoord[0]) / 2;
        let midLat = (coord[1] + nextCoord[1]) / 2;

        // Validate midpoint
        if (isNaN(midLng) || isNaN(midLat)) {
          console.error(`❌ NaN midpoint for edge ${index}:`, { coord, nextCoord, midLng, midLat });
          return;
        }

        // FIX 3: Calculate perpendicular offset (push labels OUTWARD ~20px from boundary)
        // Edge vector
        const edgeLng = nextCoord[0] - coord[0];
        const edgeLat = nextCoord[1] - coord[1];

        // Perpendicular vector (rotate 90 degrees) - right hand side
        const perpLng = -edgeLat;
        const perpLat = edgeLng;

        // Normalize perpendicular vector
        const perpLength = Math.sqrt(perpLng * perpLng + perpLat * perpLat);

        // Prevent division by zero
        if (perpLength === 0 || !isFinite(perpLength)) {
          console.warn(`⚠️ Edge ${index} has zero length or invalid perpLength:`, perpLength);
          // Just use midpoint without offset
          const el = document.createElement('div');
          el.style.cssText = `
            background: white;
            color: #2563eb;
            padding: 3px 8px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 600;
            border: 1.5px solid #2563eb;
            white-space: nowrap;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          `;
          el.textContent = toFeetInches(distance);

          const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat([midLng, midLat])
            .addTo(map.current);

          measurementMarkers.current.push(marker);
          return;
        }

        const normPerpLng = perpLng / perpLength;
        const normPerpLat = perpLat / perpLength;

        // Determine if this perpendicular points outward (away from center)
        const toMidLng = midLng - centerLng;
        const toMidLat = midLat - centerLat;
        const dotProduct = normPerpLng * toMidLng + normPerpLat * toMidLat;

        // If dot product is negative, flip the perpendicular (we want outward)
        const directionMultiplier = dotProduct >= 0 ? 1 : -1;

        // Offset by ~8 pixels (approximately 0.00003 degrees at this zoom level)
        const offsetDistance = 0.00003 * directionMultiplier;
        midLng += normPerpLng * offsetDistance;
        midLat += normPerpLat * offsetDistance;

        // Final validation before creating marker
        if (isNaN(midLng) || isNaN(midLat) || !isFinite(midLng) || !isFinite(midLat)) {
          console.error(`❌ Invalid final coordinates for edge ${index}:`, [midLng, midLat]);
          return;
        }

        const el = document.createElement('div');
        el.style.cssText = `
          background: white;
          color: #2563eb;
          padding: 3px 8px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 600;
          border: 1.5px solid #2563eb;
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        `;
        el.textContent = toFeetInches(distance);

        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([midLng, midLat])
          .addTo(map.current);

        measurementMarkers.current.push(marker);

        console.log(`✅ Created label for edge ${index}:`, toFeetInches(distance), 'at', [midLng, midLat]);
      } catch (error) {
        console.error(`❌ Error creating measurement label for edge ${index}:`, error);
      }
    });

    console.log(`📏 Created ${measurementMarkers.current.length} measurement labels`);
  }, [localBoundaryCoords, viewMode]);

  // Helper function to create setback label elements
  const createSetbackLabel = (text: string) => {
    const el = document.createElement('div');
    el.className = 'setback-label';
    el.style.cssText = `
      background: rgba(255, 255, 255, 0.9);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      color: #10B981;
      border: 1px solid #10B981;
      white-space: nowrap;
    `;
    el.textContent = text;
    return el;
  };

  // MASTER useEffect: Add all layers when map is ready or when dependencies change
  useEffect(() => {
    if (!isMapReady || !map.current) return;

    console.log('✅ Map ready - adding all layers');

    // Add boundary
    if (localBoundaryCoords && localBoundaryCoords.length > 0) {
      addPropertyBoundary();
    }

    // Add setbacks
    if (setbacks) {
      updateSetbacks();
    }

    // Load shapes
    if (drawnShapes.length > 0) {
      loadShapesFromDatabase();
    }

  }, [isMapReady, localBoundaryCoords, setbacks, drawnShapes.length]);

  // Calculate metrics when shapes or setbacks change
  useEffect(() => {
    calculatePropertyMetrics();
  }, [drawnShapes, setbacks, localBoundaryCoords]);

  // Handle edit mode - show/hide vertex and edge label markers
  useEffect(() => {
    if (viewMode === 'edit') {
      addVertexMarkers();
      addEdgeLabelMarkers();
      addSetbackHandles();
    } else {
      clearEditingMarkers();
    }
  }, [viewMode, localBoundaryCoords, addVertexMarkers, addEdgeLabelMarkers, addSetbackHandles]);

  // Update edge labels when they change
  useEffect(() => {
    if (viewMode === 'edit') {
      addEdgeLabelMarkers();
    }
  }, [edgeLabels, addEdgeLabelMarkers, viewMode]);

  // Update setback handles when edge labels or setbacks change
  useEffect(() => {
    if (viewMode === 'edit') {
      addSetbackHandles();
    }
  }, [edgeLabels, setbacks, addSetbackHandles, viewMode]);

  // FIX 4: Only show measurement labels in EDIT mode (not VIEW mode)
  useEffect(() => {
    if (viewMode === 'edit') {
      addMeasurementLabels();
    } else {
      // Clear measurements when not in edit mode
      measurementMarkers.current.forEach(marker => marker?.remove());
      measurementMarkers.current = [];
    }
  }, [localBoundaryCoords, addMeasurementLabels, viewMode]);

  // Measurement mode handlers
  useEffect(() => {
    console.log('Measurement mode handlers useEffect triggered, measurementMode:', measurementMode, 'map:', !!map.current);

    if (!map.current) {
      console.log('Map not ready in measurement mode handler');
      return;
    }

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!measurementMode || !isDrawingMeasurement) return;

      const mousePos: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const snap = findSnapPoint(mousePos);

      setSnapPoint(snap);
      setMeasurementPreview(snap || mousePos);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!measurementMode) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        finishMeasurement();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        clearMeasurement();
        // FIX 2: Keep mode active (just clear measurement, don't exit mode)
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        if (measurementPoints.length > 0) {
          setMeasurementPoints(prev => prev.slice(0, -1));
          if (measurementMarkersRef.current.length > 0) {
            measurementMarkersRef.current[measurementMarkersRef.current.length - 1]?.remove();
            measurementMarkersRef.current = measurementMarkersRef.current.slice(0, -1);
          }
        }
      }
    };

    if (measurementMode) {
      console.log('Setting up measurement mode: adding event listeners, changing cursor to crosshair');
      map.current.on('mousemove', handleMouseMove);
      // ❌ REMOVED: document.addEventListener('keydown', handleKeyDown);
      // This was causing duplicate Enter key events (already added in lines 722-723)
      map.current.getCanvas().style.cursor = 'crosshair';
      console.log('Cursor set to:', map.current.getCanvas().style.cursor);
    } else {
      console.log('Measurement mode OFF: resetting cursor');
      map.current.getCanvas().style.cursor = '';
    }

    return () => {
      if (map.current) {
        map.current.off('mousemove', handleMouseMove);
        map.current.getCanvas().style.cursor = '';
      }
      // ❌ REMOVED: document.removeEventListener('keydown', handleKeyDown);
      // Listener is managed by other useEffect (lines 722-723)
    };
  }, [measurementMode, finishMeasurement]);

  // Clear measurement when mode is turned off (only on transition from active to 'off')
  useEffect(() => {
    if (prevMeasurementModeRef.current !== 'off' && measurementMode === 'off') {
      // Mode changed from active to off, clear the measurement
      clearMeasurementVisuals();
      setMeasurementPoints([]);
    }
    // Update the ref for next render
    prevMeasurementModeRef.current = measurementMode;
  }, [measurementMode]); // clearMeasurementVisuals is defined inline so no need to include

  // Render current measurement drawing
  useEffect(() => {
    if (!map.current || !measurementMode) return;

    // Draw current line segments
    if (measurementPoints.length >= 2) {
      const lineString = turf.lineString(measurementPoints);

      if (map.current.getSource('measurement-drawing')) {
        (map.current.getSource('measurement-drawing') as mapboxgl.GeoJSONSource).setData(lineString);
      } else {
        map.current.addSource('measurement-drawing', {
          type: 'geojson',
          data: lineString
        });

        map.current.addLayer({
          id: 'measurement-drawing-line',
          type: 'line',
          source: 'measurement-drawing',
          paint: {
            'line-color': '#3b82f6',
            'line-width': 3
          }
        });
      }
    }

    // Draw preview line
    if (measurementPreview && measurementPoints.length >= 1) {
      const lastPoint = measurementPoints[measurementPoints.length - 1];
      const previewLine = turf.lineString([lastPoint, measurementPreview]);

      if (map.current.getSource('measurement-preview')) {
        (map.current.getSource('measurement-preview') as mapboxgl.GeoJSONSource).setData(previewLine);
      } else {
        // Remove existing layer if present (prevents "already exists" error)
        if (map.current.getLayer('measurement-preview-line')) {
          map.current.removeLayer('measurement-preview-line');
        }
        if (map.current.getSource('measurement-preview')) {
          map.current.removeSource('measurement-preview');
        }

        map.current.addSource('measurement-preview', {
          type: 'geojson',
          data: previewLine
        });

        map.current.addLayer({
          id: 'measurement-preview-line',
          type: 'line',
          source: 'measurement-preview',
          paint: {
            'line-color': '#FF00FF',
            'line-width': 2,
            'line-dasharray': [2, 2]
          }
        });
      }

      // Show preview distance
      const point1 = turf.point(lastPoint);
      const point2 = turf.point(measurementPreview);
      const previewDistance = turf.distance(point1, point2, { units: 'feet' });

      // Calculate total if polyline
      let totalDistance = previewDistance;
      for (let i = 0; i < measurementPoints.length - 1; i++) {
        const p1 = turf.point(measurementPoints[i]);
        const p2 = turf.point(measurementPoints[i + 1]);
        totalDistance += turf.distance(p1, p2, { units: 'feet' });
      }

      // Update cursor label (we'll add this to the UI)
      console.log(`Segment: ${formatFeetInches(previewDistance)} | Total: ${formatFeetInches(totalDistance)}`);
    }
  }, [measurementPoints, measurementPreview, measurementMode]);

  // Render saved measurements - DISABLED: Using the other useEffect at line 563 instead
  // useEffect(() => {
  //   if (map.current && isMapReady) {
  //     renderSavedMeasurements();
  //   }
  // }, [savedMeasurements, isMapReady, renderSavedMeasurements]);

  // Load saved measurements on mount
  useEffect(() => {
    if (!projectId || !isMapReady) return;

    const loadMeasurements = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/measurements`);
        if (response.ok) {
          const data = await response.json();
          setSavedMeasurements(data.measurements || []);
        }
      } catch (error) {
        console.error('Failed to load measurements:', error);
      }
    };

    loadMeasurements();
  }, [projectId, isMapReady]);

  // Check for setback violations whenever shapes or setback polygon changes
  useEffect(() => {
    console.log('🔍 Violation check useEffect triggered');
    console.log('🔍 setbackPolygon:', !!setbackPolygon);
    console.log('🔍 drawnShapes:', drawnShapes?.length || 0);

    if (setbackPolygon && drawnShapes && drawnShapes.length > 0) {
      console.log('🔍 Calling checkAllShapesForViolations...');
      checkAllShapesForViolations();
    } else {
      console.log('⚠️ Not checking violations - conditions not met');
    }
  }, [setbackPolygon, drawnShapes, checkAllShapesForViolations]);

  // Check for shape intersections whenever shapes change
  useEffect(() => {
    console.log('🔍 Intersection check useEffect triggered');
    console.log('🔍 drawnShapes:', drawnShapes?.length || 0);

    if (drawnShapes && drawnShapes.length >= 2) {
      console.log('🔍 Calling checkAllShapesForIntersections...');
      checkAllShapesForIntersections();
    } else {
      console.log('⚠️ Not checking intersections - need at least 2 shapes');
    }
  }, [drawnShapes, checkAllShapesForIntersections]);

  // Visualize setback violations with red borders
  useEffect(() => {
    console.log('🔴 Visualization useEffect triggered');
    console.log('🔴 shapeViolations.size:', shapeViolations.size);
    console.log('🔴 Violations:', Array.from(shapeViolations));

    if (!map.current || !isMapReady) {
      console.log('⚠️ Map not ready for visualization');
      return;
    }

    // Remove existing violation layer if it exists
    if (map.current.getLayer('shape-violations-line')) {
      map.current.removeLayer('shape-violations-line');
      console.log('🔴 Removed existing violation layer');
    }
    if (map.current.getSource('shape-violations')) {
      map.current.removeSource('shape-violations');
      console.log('🔴 Removed existing violation source');
    }

    // Only add layer if there are violations
    if (shapeViolations.size === 0) {
      console.log('✅ No violations to visualize');
      return;
    }

    // Get violated shape geometries
    const violatedShapes = drawnShapes.filter(shape => shapeViolations.has(shape.id));

    if (violatedShapes.length === 0) return;

    // Create GeoJSON for violated shapes
    const violationFeatures = violatedShapes.map(shape => ({
      type: 'Feature' as const,
      properties: { id: shape.id, name: shape.name },
      geometry: {
        type: 'Polygon' as const,
        coordinates: shape.coordinates
      }
    }));

    const violationGeoJSON = {
      type: 'FeatureCollection' as const,
      features: violationFeatures
    };

    // Add source and layer for violations
    map.current.addSource('shape-violations', {
      type: 'geojson',
      data: violationGeoJSON
    });

    map.current.addLayer({
      id: 'shape-violations-line',
      type: 'line',
      source: 'shape-violations',
      paint: {
        'line-color': '#ef4444', // Red border
        'line-width': 3,
        'line-dasharray': [2, 2] // Dashed line to distinguish from normal borders
      }
    });

    console.log(`🔴 Visualized ${violatedShapes.length} violated shape(s) with red borders`);
  }, [shapeViolations, drawnShapes, isMapReady]);

  // Visualize shape intersections with orange/yellow borders
  useEffect(() => {
    console.log('🟠 Intersection visualization useEffect triggered');
    console.log('🟠 shapeIntersections.size:', shapeIntersections.size);
    console.log('🟠 Intersections:', Object.fromEntries(shapeIntersections));

    if (!map.current || !isMapReady) {
      console.log('⚠️ Map not ready for intersection visualization');
      return;
    }

    // Remove existing intersection layer if it exists
    if (map.current.getLayer('shape-intersections-line')) {
      map.current.removeLayer('shape-intersections-line');
      console.log('🟠 Removed existing intersection layer');
    }
    if (map.current.getSource('shape-intersections')) {
      map.current.removeSource('shape-intersections');
      console.log('🟠 Removed existing intersection source');
    }

    // Only add layer if there are intersections
    if (shapeIntersections.size === 0) {
      console.log('✅ No intersections to visualize');
      return;
    }

    // Get shapes that have intersections
    const intersectingShapeIds = Array.from(shapeIntersections.keys());
    const intersectingShapes = drawnShapes.filter(shape => intersectingShapeIds.includes(shape.id));

    if (intersectingShapes.length === 0) return;

    // Create GeoJSON for intersecting shapes
    const intersectionFeatures = intersectingShapes.map(shape => ({
      type: 'Feature' as const,
      properties: { id: shape.id, name: shape.name },
      geometry: {
        type: 'Polygon' as const,
        coordinates: shape.coordinates
      }
    }));

    const intersectionGeoJSON = {
      type: 'FeatureCollection' as const,
      features: intersectionFeatures
    };

    // Add source and layer for intersections
    map.current.addSource('shape-intersections', {
      type: 'geojson',
      data: intersectionGeoJSON
    });

    map.current.addLayer({
      id: 'shape-intersections-line',
      type: 'line',
      source: 'shape-intersections',
      paint: {
        'line-color': '#f59e0b', // Orange/amber border
        'line-width': 3,
        'line-dasharray': [4, 2] // Dashed line (different pattern from violations)
      }
    });

    console.log(`🟠 Visualized ${intersectingShapes.length} intersecting shape(s) with orange borders`);
  }, [shapeIntersections, drawnShapes, isMapReady]);

  // Visualize snap guide lines with cyan lines
  useEffect(() => {
    console.log('🧲 Snap guide lines useEffect triggered');
    console.log('🧲 snapGuideLines:', snapGuideLines);

    if (!map.current || !isMapReady) {
      console.log('⚠️ Map not ready for snap guide visualization');
      return;
    }

    // Remove existing snap guide layers if they exist
    if (map.current.getLayer('snap-guide-x')) {
      map.current.removeLayer('snap-guide-x');
    }
    if (map.current.getLayer('snap-guide-y')) {
      map.current.removeLayer('snap-guide-y');
    }
    if (map.current.getSource('snap-guide-x')) {
      map.current.removeSource('snap-guide-x');
    }
    if (map.current.getSource('snap-guide-y')) {
      map.current.removeSource('snap-guide-y');
    }

    // Get map bounds to draw lines across the entire viewport
    const bounds = map.current.getBounds();
    const north = bounds.getNorth();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const west = bounds.getWest();

    // Add vertical guide line (X coordinate)
    if (snapGuideLines.x !== null) {
      const verticalLine = {
        type: 'FeatureCollection' as const,
        features: [{
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: [
              [snapGuideLines.x, south],
              [snapGuideLines.x, north]
            ]
          }
        }]
      };

      map.current.addSource('snap-guide-x', {
        type: 'geojson',
        data: verticalLine
      });

      map.current.addLayer({
        id: 'snap-guide-x',
        type: 'line',
        source: 'snap-guide-x',
        paint: {
          'line-color': '#00d9ff', // Cyan color
          'line-width': 2,
          'line-dasharray': [2, 4], // Dashed line
          'line-opacity': 0.8
        }
      });

      console.log('🧲 Added vertical snap guide at X:', snapGuideLines.x);
    }

    // Add horizontal guide line (Y coordinate)
    if (snapGuideLines.y !== null) {
      const horizontalLine = {
        type: 'FeatureCollection' as const,
        features: [{
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: [
              [west, snapGuideLines.y],
              [east, snapGuideLines.y]
            ]
          }
        }]
      };

      map.current.addSource('snap-guide-y', {
        type: 'geojson',
        data: horizontalLine
      });

      map.current.addLayer({
        id: 'snap-guide-y',
        type: 'line',
        source: 'snap-guide-y',
        paint: {
          'line-color': '#00d9ff', // Cyan color
          'line-width': 2,
          'line-dasharray': [2, 4], // Dashed line
          'line-opacity': 0.8
        }
      });

      console.log('🧲 Added horizontal snap guide at Y:', snapGuideLines.y);
    }

    if (snapGuideLines.x === null && snapGuideLines.y === null) {
      console.log('✅ No snap guides to visualize');
    }
  }, [snapGuideLines, isMapReady]);

  // Save shape edits (dimensions, name)
  const saveShapeEdits = async (shapeId: string) => {
    if (!editingShapeData || !map.current || !draw.current) return;

    const newWidth = parseFloat(editingShapeData.width);
    const newLength = parseFloat(editingShapeData.length);

    if (isNaN(newWidth) || isNaN(newLength) || newWidth <= 0 || newLength <= 0) {
      toast.error('Invalid dimensions');
      return;
    }

    const newArea = newWidth * newLength;

    console.log('💾 Saving shape edits:', { shapeId, newWidth, newLength, newArea });

    try {
      // Get the shape
      const shape = drawnShapes.find(s => s.id === shapeId);
      if (!shape) return;

      // Get the overlay to find current coordinates
      const overlay = svgOverlays.current.get(shapeId);
      if (!overlay || !overlay.coordinates) return;

      // Calculate centroid of current polygon
      const coords = overlay.coordinates;
      let sumLng = 0, sumLat = 0;
      coords.forEach(([lng, lat]) => {
        sumLng += lng;
        sumLat += lat;
      });
      const centerLng = sumLng / coords.length;
      const centerLat = sumLat / coords.length;

      // Convert feet to degrees (approximate)
      const feetPerDegreeLng = 288563; // at ~33° latitude
      const feetPerDegreeLat = 364320;

      const halfWidthDeg = (newWidth / 2) / feetPerDegreeLng;
      const halfLengthDeg = (newLength / 2) / feetPerDegreeLat;

      // Create new rectangle coordinates
      const newCoordinates: [number, number][] = [
        [centerLng - halfWidthDeg, centerLat - halfLengthDeg],
        [centerLng + halfWidthDeg, centerLat - halfLengthDeg],
        [centerLng + halfWidthDeg, centerLat + halfLengthDeg],
        [centerLng - halfWidthDeg, centerLat + halfLengthDeg],
        [centerLng - halfWidthDeg, centerLat - halfLengthDeg], // Close the polygon
      ];

      console.log('🔍 Looking for feature with ID:', overlay.featureId);

      // Update the feature in draw control using the overlay's featureId
      let feature = draw.current.get(overlay.featureId);

      if (!feature) {
        // Fallback: try to find by shapeId
        console.log('⚠️ Feature not found by featureId, trying shapeId:', shapeId);
        feature = draw.current.get(shapeId);
      }

      if (feature) {
        console.log('✅ Found feature:', feature.id);

        // Update feature geometry and properties
        feature.geometry.coordinates = [newCoordinates];
        feature.properties = {
          ...feature.properties,
          name: editingShapeData.name,
          width: newWidth,
          height: newLength,
        };

        console.log('🔄 Updating feature on map...');

        // Delete old and add updated feature
        draw.current.delete(feature.id as string);
        draw.current.add(feature);

        console.log('✅ Feature updated on map');
      } else {
        console.error('❌ Feature not found in draw control!', {
          shapeId,
          featureId: overlay.featureId,
          availableFeatures: draw.current.getAll().features.map((f: any) => f.id)
        });
        toast.warning('Shape not found on map, but overlay will update');
      }

      // Update overlay stored coordinates (even if feature not found)
      console.log('📍 Updating overlay coordinates and regenerating SVG');
      overlay.coordinates = newCoordinates;
      overlay.properties = {
        ...overlay.properties,
        width: newWidth,
        height: newLength,
      };

      // Regenerate SVG if template exists
      const templateId = shape.properties?.templateId || overlay.properties?.templateId;
      if (templateId) {
        const template = getTemplateById(templateId);
        if (template) {
          const newSvg = template.getSvg(newWidth, newLength);
          overlay.element.innerHTML = newSvg;

          // Ensure SVG fills container
          const svgEl = overlay.element.querySelector('svg');
          if (svgEl) {
            svgEl.style.width = '100%';
            svgEl.style.height = '100%';
            svgEl.setAttribute('preserveAspectRatio', 'none');
          }
        }
      }

      // Update overlay position
      updateSvgOverlayPosition(shapeId);

      // Update local state
      setDrawnShapes(prev => prev.map(s =>
        s.id === shapeId ? {
          ...s,
          name: editingShapeData.name,
          area: newArea,
          properties: {
            ...s.properties,
            width: newWidth,
            height: newLength,
          }
        } : s
      ));

      // Save to database
      await fetch(`/api/projects/${projectId}/shapes/${shapeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingShapeData.name,
          coordinates: newCoordinates,
          area: newArea,
          properties: {
            ...shape.properties,
            width: newWidth,
            height: newLength,
          }
        }),
      });

      console.log('✅ Shape saved to database');
      toast.success('Shape updated');

      // Close edit panel
      setExpandedShapeId(null);
      setEditingShapeData(null);
    } catch (error) {
      console.error('Error saving shape:', error);
      toast.error('Failed to save shape');
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top Bar with Property Stats */}
      <div className="flex gap-4 p-4 bg-white border-b">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600">Lot Size</div>
          <div className="text-lg font-bold">{propertyMetrics.lotSize.toLocaleString()} sq ft</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600">Max Allowed Coverage</div>
          <div className="text-lg font-bold text-green-600">{propertyMetrics.buildableArea.toLocaleString()} sq ft</div>
          <div className="text-xs text-gray-500">
            ({parcel?.zoning || 'R1-10'} - {((propertyMetrics.buildableArea / propertyMetrics.lotSize) * 100).toFixed(0)}% max)
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600">Existing Buildings</div>
          <div className="text-lg font-bold text-blue-600">
            {propertyMetrics.existingBuildings > 0
              ? `${propertyMetrics.existingBuildings.toLocaleString()} sq ft`
              : 'Not imported'}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600">New Structures</div>
          <div className="text-lg font-bold text-purple-600">{propertyMetrics.drawnShapes.toLocaleString()} sq ft</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600">Total Coverage</div>
          <div className="text-lg font-bold text-orange-600">{propertyMetrics.currentCoverage.toLocaleString()} sq ft</div>
          <div className="text-xs text-gray-500">
            ({((propertyMetrics.currentCoverage / propertyMetrics.lotSize) * 100).toFixed(1)}% of lot)
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600">Remaining Space</div>
          <div className={`text-lg font-bold ${propertyMetrics.remainingArea > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {propertyMetrics.remainingArea.toLocaleString()} sq ft
          </div>
          <div className={`text-xs ${propertyMetrics.remainingArea > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {propertyMetrics.remainingArea > 0 ? 'Under limit' : 'Over limit!'}
          </div>
        </div>

        {/* Smart Shape Builder Toggle */}
        <button
          onClick={() => {
            setViewMode(viewMode === 'draw' ? 'view' : 'draw');
            setMeasurementMode('off'); // Deactivate measurement when toggling Shape Builder
          }}
          className="ml-auto px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
        >
          {viewMode === 'draw' ? 'Hide' : 'Show'} Shape Builder
        </button>
      </div>

      {/* Map Section */}
      <div className="flex-1 relative">
        {/* Map Container */}
        <div ref={mapContainer} className="w-full h-full" />

        {/* Professional Shape Builder Panel */}
        <ShapeBuilderPanel
          isOpen={viewMode === 'draw'}
          onClose={() => {
            setViewMode('view');
            setMeasurementMode('off'); // Deactivate measurement when closing Shape Builder
          }}
          onAddShape={handleAddShapeFromBuilder}
          maxCoverage={propertyMetrics.buildableArea}
          currentCoverage={propertyMetrics.currentCoverage}
          lotSize={propertyMetrics.lotSize}
        />

        {/* Measurement Tool Floating Panel (bottom-right) */}
        {viewMode === 'measure' && (
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[1000]">
            <button
              onClick={() => setMeasurementMode('single')}
              className={`px-6 py-2.5 text-sm font-medium whitespace-nowrap shadow-lg rounded-lg ${
                measurementMode === 'single'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              📏 Single Line
            </button>
            <button
              onClick={() => setMeasurementMode('polyline')}
              className={`px-6 py-2.5 text-sm font-medium whitespace-nowrap shadow-lg rounded-lg ${
                measurementMode === 'polyline'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              📐 Polyline
            </button>
            <div className="p-3 shadow-lg bg-blue-50 rounded-lg border border-blue-200 max-w-xs">
              <p className="text-xs text-blue-900 font-semibold mb-1">
                📏 Measurement Mode
              </p>
              <p className="text-xs text-blue-800">
                {measurementMode === 'single'
                  ? 'Click two points to measure distance.'
                  : 'Click points to measure. Double-click to finish.'}
              </p>
              {measurementPoints.length > 0 && (
                <p className="text-xs text-blue-900 font-semibold mt-2">
                  Points: {measurementPoints.length}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Map Controls Overlay */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {/* View/Edit/Draw/Measure Buttons */}
          <div className="flex gap-0 bg-white rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => {
                setViewMode('view');
                setMeasurementMode('off'); // Deactivate measurement when switching modes
              }}
              className={`px-6 py-2.5 text-sm font-medium whitespace-nowrap min-w-[80px] ${
                viewMode === 'view' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              View
            </button>
            <button
              onClick={() => {
                setViewMode('edit');
                setMeasurementMode('off'); // Deactivate measurement when switching modes
              }}
              className={`px-6 py-2.5 text-sm font-medium whitespace-nowrap min-w-[80px] ${
                viewMode === 'edit' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => {
                setViewMode('draw');
                setMeasurementMode('off'); // Deactivate measurement when switching modes
              }}
              className={`px-6 py-2.5 text-sm font-medium whitespace-nowrap min-w-[80px] ${
                viewMode === 'draw' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Draw
            </button>
            <button
              onClick={() => {
                console.log('✅ Measure button clicked - using unified mode');
                setViewMode('measure');
                setMeasurementMode('single'); // Activate single-line measurement
                setMeasurementPoints([]);
                setMeasurementPreview(null);
              }}
              className={`px-6 py-2.5 text-sm font-medium whitespace-nowrap min-w-[80px] ${
                viewMode === 'measure' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Measure
            </button>
          </div>

          <div className="h-8 w-px bg-gray-300"></div>

          {/* Satellite/Map Buttons */}
          <div className="flex gap-0 bg-white rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => changeMapStyle('satellite')}
              className={`px-6 py-2.5 text-sm font-medium whitespace-nowrap min-w-[90px] ${
                mapStyle === 'satellite' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => changeMapStyle('map')}
              className={`px-6 py-2.5 text-sm font-medium whitespace-nowrap min-w-[90px] ${
                mapStyle === 'map' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Map
            </button>
          </div>

          <div className="h-8 w-px bg-gray-300"></div>

          {/* Clean Slate Button */}
          <button
            onClick={async () => {
              if (window.confirm('Clear all shapes and measurements? This cannot be undone.')) {
                // Clear drawn shapes
                if (draw.current) {
                  draw.current.deleteAll();
                }
                setDrawnShapes([]);

                // Clear current measurement
                clearMeasurement();

                // Delete all saved measurements from database
                try {
                  const deleteResults = await Promise.all(
                    savedMeasurements.map(async m => {
                      const response = await fetch(`/api/projects/${projectId}/measurements/${m.id}`, {
                        method: 'DELETE'
                      });
                      if (!response.ok) {
                        console.error(`Failed to delete measurement ${m.id}:`, await response.text());
                        return { success: false, id: m.id };
                      }
                      return { success: true, id: m.id };
                    })
                  );

                  const failures = deleteResults.filter(r => !r.success);
                  if (failures.length > 0) {
                    console.error('Failed to delete measurements:', failures);
                    toast.error(`Failed to delete ${failures.length} measurement(s)`);
                    return; // Don't clear state if deletions failed
                  }

                  // Clear from state ONLY if all deletions succeeded
                  setSavedMeasurements([]);

                  // Clear map markers
                  savedMeasurementMarkersRef.current.forEach(marker => marker?.remove());
                  savedMeasurementMarkersRef.current = [];

                  // Remove ALL measurement layers and sources from map
                  if (map.current) {
                    // Remove saved measurement layers (indexed)
                    for (let i = 0; i < 100; i++) {
                      const layerId = `saved-measurement-${i}`;
                      if (map.current.getLayer(layerId)) {
                        map.current.removeLayer(layerId);
                      }
                      const sourceId = `${layerId}-source`;
                      if (map.current.getSource(sourceId)) {
                        map.current.removeSource(sourceId);
                      }
                    }

                    // Remove current measurement drawing layers
                    const currentMeasurementLayers = [
                      'measurement-line-current',
                      'measurement-drawing-line',
                      'measurement-preview-line',
                      'measurement-line',
                      'measurement-points'
                    ];
                    const currentMeasurementSources = [
                      'measurement-line-current-source',
                      'measurement-drawing',
                      'measurement-preview',
                      'measurement'
                    ];

                    currentMeasurementLayers.forEach(layerId => {
                      if (map.current?.getLayer(layerId)) {
                        map.current.removeLayer(layerId);
                      }
                    });

                    currentMeasurementSources.forEach(sourceId => {
                      if (map.current?.getSource(sourceId)) {
                        map.current.removeSource(sourceId);
                      }
                    });
                  }

                  toast.success('Map cleared - all shapes and measurements deleted');
                } catch (error) {
                  console.error('Failed to delete measurements:', error);
                  toast.error('Failed to delete some measurements');
                }
              }
            }}
            className="px-6 py-2.5 text-sm font-medium whitespace-nowrap min-w-[110px] bg-white text-gray-700 rounded-lg shadow-lg hover:bg-gray-100"
          >
            Clean Slate
          </button>
        </div>
      </div>

      {/* Three Cards Row: Setbacks | Drawn Shapes | Measurements */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-t">
        {/* Setback Requirements Card */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">Setback Requirements</h3>
            <button
              onClick={() => setShowSetbacks(!showSetbacks)}
              className="text-xs px-2 py-1 bg-green-500 text-white rounded"
            >
              {showSetbacks ? 'Hide' : 'Show'}
            </button>
          </div>

          {showSetbacks && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 font-medium">Front Street</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={setbacks.front}
                    onChange={(e) => {
                      setSetbacks(prev => ({...prev, front: parseInt(e.target.value) || 0}));
                      setSetbacksApplied(false); // Hide labels when editing
                    }}
                    className="w-16 px-2 py-1 border-2 rounded text-xs text-right font-semibold bg-red-50 border-red-400 text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <span className="text-xs text-gray-500">ft</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 font-medium">Rear (Back)</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={setbacks.rear}
                    onChange={(e) => {
                      setSetbacks(prev => ({...prev, rear: parseInt(e.target.value) || 0}));
                      setSetbacksApplied(false); // Hide labels when editing
                    }}
                    className="w-16 px-2 py-1 border-2 rounded text-xs text-right font-semibold bg-blue-50 border-blue-400 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-500">ft</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 font-medium">Side Left</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={setbacks.sideLeft}
                    onChange={(e) => {
                      setSetbacks(prev => ({...prev, sideLeft: parseInt(e.target.value) || 0}));
                      setSetbacksApplied(false); // Hide labels when editing
                    }}
                    className="w-16 px-2 py-1 border-2 rounded text-xs text-right font-semibold bg-green-50 border-green-400 text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-xs text-gray-500">ft</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 font-medium">Side Right</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={setbacks.sideRight}
                    onChange={(e) => {
                      setSetbacks(prev => ({...prev, sideRight: parseInt(e.target.value) || 0}));
                      setSetbacksApplied(false); // Hide labels when editing
                    }}
                    className="w-16 px-2 py-1 border-2 rounded text-xs text-right font-semibold bg-orange-50 border-orange-400 text-orange-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-xs text-gray-500">ft</span>
                </div>
              </div>

              {/* Apply Button */}
              <button
                onClick={() => {
                  setSetbacksApplied(true);
                  updateSetbacks();
                  saveSetbacksAndLabels(); // Save to database
                }}
                className="w-full mt-2 px-3 py-2 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600"
              >
                Apply Setbacks
              </button>
            </div>
          )}
        </div>

        {/* Drawn Shapes Card */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">Drawn Shapes ({drawnShapes.length})</h3>
            <button
              onClick={() => setShowShapeBuilder(true)}
              className="text-xs text-blue-500 hover:underline"
            >
              Add
            </button>
          </div>

          <div className="space-y-0 max-h-40 overflow-y-auto border border-gray-200 rounded">
            {drawnShapes.length === 0 ? (
              <div className="text-xs text-gray-500 text-center py-4">
                No shapes drawn yet.<br />
                Click "Add" to create shapes
              </div>
            ) : (
              drawnShapes.map((shape) => (
                <div key={shape.id} className="border-b border-gray-100 last:border-0">
                  {/* Collapsed header row */}
                  <div
                    className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      if (expandedShapeId === shape.id) {
                        setExpandedShapeId(null);
                        setEditingShapeData(null);
                      } else {
                        setExpandedShapeId(shape.id);
                        setEditingShapeData({
                          name: shape.name || 'Shape',
                          width: String(shape.properties?.width || 20),
                          length: String(shape.properties?.height || shape.properties?.length || 20),
                        });
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div className="text-sm font-medium">{shape.name}</div>
                      <div className="text-xs text-gray-500">
                        {Math.round(shape.area || 0).toLocaleString()} sq ft
                      </div>
                      {shapeViolations.has(shape.id) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Setback Violation
                        </span>
                      )}
                      {shapeIntersections.has(shape.id) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Shape Overlap
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Chevron icon */}
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${expandedShapeId === shape.id ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded edit panel */}
                  {expandedShapeId === shape.id && editingShapeData && (
                    <div className="px-3 pb-3 bg-gray-50 space-y-3">
                      {/* Name input */}
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Name</label>
                        <input
                          type="text"
                          value={editingShapeData.name}
                          onChange={(e) => setEditingShapeData(prev => prev ? {...prev, name: e.target.value} : null)}
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      {/* Dimensions */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Width (ft)</label>
                          <input
                            type="number"
                            value={editingShapeData.width}
                            onChange={(e) => setEditingShapeData(prev => prev ? {...prev, width: e.target.value} : null)}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Length (ft)</label>
                          <input
                            type="number"
                            value={editingShapeData.length}
                            onChange={(e) => setEditingShapeData(prev => prev ? {...prev, length: e.target.value} : null)}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      {/* Calculated area */}
                      <div className="text-xs text-gray-500">
                        Area: {(parseFloat(editingShapeData.width || '0') * parseFloat(editingShapeData.length || '0')).toFixed(0)} sq ft
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await saveShapeEdits(shape.id);
                          }}
                          className="flex-1 bg-blue-500 text-white text-sm py-1.5 rounded hover:bg-blue-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm(`Delete ${shape.name}?`)) return;

                            try {
                              console.log(`🗑️ Deleting shape: ${shape.name} (ID: ${shape.id})`);

                              // Strategy 1: Try deleting by shape.id
                              let deleted = false;
                              if (draw.current) {
                                try {
                                  draw.current.delete(shape.id);
                                  console.log(`✅ Deleted by shape.id: ${shape.id}`);
                                  deleted = true;
                                } catch (e) {
                                  console.log(`⚠️ Could not delete by shape.id, trying other strategies...`);
                                }
                              }

                              // Strategy 2: Try deleting by overlay.featureId
                              const shapeEntry = Array.from(svgOverlays.current.entries()).find(
                                ([shapeId]) => shapeId === shape.id
                              );

                              if (shapeEntry) {
                                const [_, overlay] = shapeEntry;

                                if (!deleted && draw.current && overlay.featureId) {
                                  try {
                                    draw.current.delete(overlay.featureId);
                                    console.log(`✅ Deleted by overlay.featureId: ${overlay.featureId}`);
                                    deleted = true;
                                  } catch (e) {
                                    console.log(`⚠️ Could not delete by featureId, trying feature matching...`);
                                  }
                                }

                                // Remove SVG overlay
                                overlay.element.remove();
                                svgOverlays.current.delete(shape.id);
                                console.log(`✅ Removed SVG overlay for ${shape.id}`);
                              }

                              // Strategy 3: Find and delete matching feature
                              if (!deleted && draw.current) {
                                const allFeatures = draw.current.getAll();
                                const matchingFeature = allFeatures.features.find(
                                  f => f.id === shape.id || f.properties?.name === shape.name
                                );

                                if (matchingFeature) {
                                  try {
                                    draw.current.delete(matchingFeature.id as string);
                                    console.log(`✅ Deleted by matching feature: ${matchingFeature.id}`);
                                    deleted = true;
                                  } catch (e) {
                                    console.error(`❌ Could not delete matching feature:`, e);
                                  }
                                }
                              }

                              if (!deleted) {
                                console.warn(`⚠️ Shape ${shape.id} may not have been removed from map`);
                              }

                              // Delete from database
                              await fetch(`/api/projects/${projectId}/shapes/${shape.id}`, {
                                method: 'DELETE'
                              });
                              console.log(`✅ Deleted from database: ${shape.id}`);

                              // Update state
                              setDrawnShapes(prev => prev.filter(s => s.id !== shape.id));
                              setExpandedShapeId(null);
                              setEditingShapeData(null);
                              toast.success(`${shape.name} deleted`);
                            } catch (error) {
                              console.error('Error deleting shape:', error);
                              toast.error('Failed to delete shape');
                            }
                          }}
                          className="px-3 bg-red-100 text-red-600 text-sm py-1.5 rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Measurements Card */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">Measurements ({savedMeasurements.length})</h3>
            <button
              onClick={() => setMeasurementMode(measurementMode === 'off' ? 'polyline' : 'off')}
              className={`text-xs ${measurementMode !== 'off' ? 'text-red-500' : 'text-blue-500'}`}
            >
              {measurementMode !== 'off' ? 'Cancel' : 'Add'}
            </button>
          </div>

          {measurementMode !== 'off' && (
            <div className="mb-3 p-2 bg-blue-50 rounded text-xs">
              <div className="font-medium text-blue-900 mb-1">
                {measurementMode === 'single' ? 'Single Line' : 'Polyline'} Mode Active
              </div>
              <div className="text-blue-700">
                {measurementMode === 'single' ? (
                  <div>• Click 2 points (auto-saves)</div>
                ) : (
                  <div>
                    • Click to add points<br />
                    • Double-click or Enter to finish
                  </div>
                )}
                • Press Escape to cancel
              </div>
              {measurementPoints.length > 0 && (
                <div className="mt-2 font-semibold text-blue-900">
                  Points: {measurementPoints.length}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {savedMeasurements.length === 0 ? (
              <div className="text-xs text-gray-500 text-center py-4">
                No measurements saved yet.<br />
                Use "Single Line" or "Polyline" buttons to measure
              </div>
            ) : (
              savedMeasurements.map((measurement) => (
                <div key={measurement.id}>
                  {/* EXPANDED EDIT MODE */}
                  {expandedEditMeasurementId === measurement.id && expandedEditData ? (
                    <div className="space-y-2 bg-blue-50 p-3 rounded border border-blue-200">
                      {/* Editable Name */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600 w-14 flex-shrink-0">Name:</label>
                        <input
                          type="text"
                          value={expandedEditData.name}
                          onChange={(e) => setExpandedEditData(prev =>
                            prev ? { ...prev, name: e.target.value } : null
                          )}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* For polylines: edit each segment */}
                      {expandedEditData.segments.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs text-gray-600 font-medium">Segments:</div>
                          {expandedEditData.segments.map((seg, i) => (
                            <div key={i} className="flex items-center gap-2 ml-2">
                              <label className="text-xs text-gray-500 w-12 flex-shrink-0">{seg.label}:</label>
                              <input
                                type="text"
                                value={seg.distance}
                                onChange={(e) => {
                                  const newSegments = [...expandedEditData.segments];
                                  newSegments[i] = { ...newSegments[i], distance: e.target.value };

                                  // Auto-calculate total from segments
                                  const newTotal = calculateTotalFromSegments(newSegments);

                                  setExpandedEditData(prev => prev ? {
                                    ...prev,
                                    segments: newSegments,
                                    totalDistance: newTotal // Auto-update total
                                  } : null);
                                }}
                                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={formatFeetInches(measurement.segmentDistances[i])}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Total distance */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600 w-14 flex-shrink-0 font-medium">Total:</label>
                        <input
                          type="text"
                          value={expandedEditData.totalDistance}
                          onChange={(e) => setExpandedEditData(prev =>
                            prev ? { ...prev, totalDistance: e.target.value } : null
                          )}
                          className="w-28 px-2 py-1 text-sm border border-gray-300 rounded text-right font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Save / Cancel buttons */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => saveExpandedEdit(measurement.id)}
                          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelExpandedEdit}
                          className="px-3 py-1.5 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* NORMAL VIEW MODE */
                    <div
                      onClick={() => {
                        // Toggle highlight: if already highlighted, unhighlight; otherwise highlight this one
                        setHighlightedMeasurementId(prev =>
                          prev === measurement.id ? null : measurement.id
                        );
                      }}
                      className={`p-2 rounded cursor-pointer group transition-all ${
                        highlightedMeasurementId === measurement.id
                          ? 'bg-blue-100 ring-2 ring-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></div>
                            {/* Editable Name */}
                            {editingMeasurementId === measurement.id ? (
                              <input
                                type="text"
                                value={editingMeasurementName}
                                onChange={(e) => setEditingMeasurementName(e.target.value)}
                                onBlur={() => saveMeasurementName(measurement.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveMeasurementName(measurement.id);
                                  if (e.key === 'Escape') setEditingMeasurementId(null);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                            ) : (
                              <div
                                className="text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors truncate"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingName(measurement.id, measurement.name);
                                }}
                                title="Click to rename"
                              >
                                {measurement.name}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 ml-5 flex items-center gap-2">
                            {/* Editable Distance */}
                            {editingMeasurementDistanceId === measurement.id ? (
                              <input
                                type="text"
                                value={editingMeasurementDistance}
                                onChange={(e) => setEditingMeasurementDistance(e.target.value)}
                                onBlur={() => saveMeasurementDistance(measurement.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveMeasurementDistance(measurement.id);
                                  if (e.key === 'Escape') setEditingMeasurementDistanceId(null);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-32 px-2 py-1 border rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                            ) : (
                              <span
                                className="cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const currentDisplay = measurement.displayDistance || formatFeetInches(measurement.totalDistance);
                                  startEditingDistance(measurement.id, currentDisplay);
                                }}
                                title="Click to edit distance"
                              >
                                {measurement.displayDistance || formatFeetInches(measurement.totalDistance)}
                              </span>
                            )}
                            {measurement.segmentDistances.length > 1 && (
                              <span className="text-gray-400">
                                ({measurement.points.length} points)
                              </span>
                            )}
                          </div>
                          {/* Segment breakdown for polylines */}
                          {measurement.segmentDistances.length > 1 && (
                            <div className="text-xs text-gray-500 ml-5 mt-1 flex flex-col gap-0.5">
                              {measurement.segmentDistances.map((dist, idx) => {
                                const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                                const from = letters[idx];
                                const to = letters[idx + 1];
                                return (
                                  <span key={idx} className="whitespace-nowrap">
                                    {from}→{to}: {formatFeetInches(dist)}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                          {/* Edit button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startExpandedEdit(measurement);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700 transition-opacity p-1"
                            title="Edit measurement"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm(`Delete measurement "${measurement.name}"?`)) {
                                const measurementIndex = savedMeasurements.findIndex(m => m.id === measurement.id);

                                // Remove map layer and source for this measurement BEFORE updating state
                                if (map.current && measurementIndex !== -1) {
                                  const layerId = `saved-measurement-${measurementIndex}`;
                                  if (map.current.getLayer(layerId)) {
                                    map.current.removeLayer(layerId);
                                  }
                                  const sourceId = `${layerId}-source`;
                                  if (map.current.getSource(sourceId)) {
                                    map.current.removeSource(sourceId);
                                  }
                                }

                                // Remove from state (this will trigger useEffect to re-render remaining measurements)
                                setSavedMeasurements(prev =>
                                  prev.filter(m => m.id !== measurement.id)
                                );

                                // Remove from database
                                try {
                                  await fetch(
                                    `/api/projects/${projectId}/measurements/${measurement.id}`,
                                    { method: 'DELETE' }
                                  );
                                  toast.success('Measurement deleted');
                                } catch (error) {
                                  console.error('Failed to delete measurement:', error);
                                  toast.error('Failed to delete measurement');
                                }
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity p-1"
                            title="Delete measurement"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Property Inspector Card - Bottom Section */}
      <div className="bg-white border-t p-4">
        <h3 className="font-bold mb-2 text-sm">Property Inspector</h3>
        <div className="text-xs text-gray-600 mb-3">Real-time analysis & validation</div>

        <div className="grid grid-cols-4 gap-6">
          {/* Overall Status */}
          <div>
            <div className="text-xs font-medium text-gray-600 mb-2">Overall Status</div>
            {shapeViolations.size === 0 && shapeIntersections.size === 0 ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">All Pass</span>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Setback Violations */}
                {shapeViolations.size > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                      <span className="text-sm font-medium text-red-600">Setback Violation</span>
                    </div>
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {shapeViolations.size} shape{shapeViolations.size > 1 ? 's' : ''} violating setbacks:
                      <ul className="mt-1 ml-2 list-disc list-inside">
                        {drawnShapes
                          .filter(shape => shapeViolations.has(shape.id))
                          .map(shape => (
                            <li key={shape.id}>{shape.name || 'Unnamed'}</li>
                          ))
                        }
                      </ul>
                    </div>
                  </div>
                )}

                {/* Shape Intersections */}
                {shapeIntersections.size > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></div>
                      <span className="text-sm font-medium text-amber-600">Shape Overlap</span>
                    </div>
                    <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      {shapeIntersections.size} shape{shapeIntersections.size > 1 ? 's' : ''} overlapping:
                      <ul className="mt-1 ml-2 list-disc list-inside">
                        {Array.from(shapeIntersections.keys()).map(shapeId => {
                          const shape = drawnShapes.find(s => s.id === shapeId);
                          const overlappingShapes = shapeIntersections.get(shapeId) || [];
                          const overlappingNames = overlappingShapes
                            .map(id => drawnShapes.find(s => s.id === id)?.name || 'Unnamed')
                            .join(', ');
                          return (
                            <li key={shapeId}>
                              {shape?.name || 'Unnamed'} → {overlappingNames}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Property Stats */}
          <div>
            <div className="text-xs font-medium text-gray-600 mb-2">Property Stats</div>
            <div className="text-sm space-y-1">
              <div>Lot Size: {propertyMetrics.lotSize.toLocaleString()} sq ft</div>
            </div>
          </div>

          {/* Setback Values */}
          <div>
            <div className="text-xs font-medium text-gray-600 mb-2">Setback Values</div>
            <div className="text-sm space-y-1">
              <div>Front: {setbacks.front} ft</div>
            </div>
          </div>

          {/* Code Compliance */}
          <div>
            <div className="text-xs font-medium text-gray-600 mb-2">Code Compliance</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Front Setback</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
