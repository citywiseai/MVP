"use client";

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Maximize2, Minimize2, Map, Building2, Grid3x3, MapPin } from 'lucide-react';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface PropertyVisualizationProps {
  address: string;
  parcelData?: {
    geometry?: {
      type: string;
      coordinates: number[][][] | number[][][][];
    };
    properties?: {
      apn?: string;
      lotSize?: number;
      zoning?: string;
    };
  };
  buildingFootprint?: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

export default function PropertyVisualization({ 
  address, 
  parcelData,
  buildingFootprint 
}: PropertyVisualizationProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'satellite' | 'street'>('satellite');
  const [showParcel, setShowParcel] = useState(true);
  const [showBuilding, setShowBuilding] = useState(true);
  const [showZoning, setShowZoning] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-111.8910, 33.4484],
      zoom: 18,
      pitch: 45,
      bearing: 0,
    });

    map.current.on('load', () => {
      setIsLoading(false);
      
      if (!map.current?.getLayer('3d-buildings')) {
        map.current?.addLayer({
          'id': '3d-buildings',
          'source': 'composite',
          'source-layer': 'building',
          'filter': ['==', 'extrude', 'true'],
          'type': 'fill-extrusion',
          'minzoom': 15,
          'paint': {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.6
          }
        });
      }

      if (parcelData?.geometry) {
        addParcelLayer(parcelData.geometry);
      }

      if (buildingFootprint) {
        addBuildingLayer(buildingFootprint);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;
    
    const style = activeLayer === 'satellite' 
      ? 'mapbox://styles/mapbox/satellite-streets-v12'
      : 'mapbox://styles/mapbox/streets-v12';
    
    map.current.setStyle(style);
  }, [activeLayer]);

  useEffect(() => {
    if (!map.current) return;
    
    if (map.current.getLayer('parcel-layer')) {
      map.current.setLayoutProperty(
        'parcel-layer',
        'visibility',
        showParcel ? 'visible' : 'none'
      );
    }
  }, [showParcel]);

  useEffect(() => {
    if (!map.current) return;
    
    if (map.current.getLayer('building-layer')) {
      map.current.setLayoutProperty(
        'building-layer',
        'visibility',
        showBuilding ? 'visible' : 'none'
      );
    }
  }, [showBuilding]);

  const addParcelLayer = (geometry: any) => {
    if (!map.current) return;

    if (map.current.getSource('parcel')) {
      map.current.removeLayer('parcel-layer');
      map.current.removeLayer('parcel-outline');
      map.current.removeSource('parcel');
    }

    map.current.addSource('parcel', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: geometry
      }
    });

    map.current.addLayer({
      id: 'parcel-layer',
      type: 'fill',
      source: 'parcel',
      paint: {
        'fill-color': '#FFD700',
        'fill-opacity': 0.2
      }
    });

    map.current.addLayer({
      id: 'parcel-outline',
      type: 'line',
      source: 'parcel',
      paint: {
        'line-color': '#FFD700',
        'line-width': 3
      }
    });

    const bounds = new mapboxgl.LngLatBounds();
    const coords = geometry.coordinates[0];
    coords.forEach((coord: number[]) => {
      bounds.extend(coord as [number, number]);
    });

    map.current.fitBounds(bounds, {
      padding: 50,
      duration: 1000
    });
  };

  const addBuildingLayer = (footprint: any) => {
    if (!map.current) return;

    if (map.current.getSource('building')) {
      map.current.removeLayer('building-layer');
      map.current.removeSource('building');
    }

    map.current.addSource('building', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: footprint
      }
    });

    map.current.addLayer({
      id: 'building-layer',
      type: 'fill',
      source: 'building',
      paint: {
        'fill-color': '#FF6B6B',
        'fill-opacity': 0.6
      }
    });
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

        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
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

        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
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
            variant={showBuilding ? 'default' : 'secondary'}
            onClick={() => setShowBuilding(!showBuilding)}
            className="shadow-lg"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Building
          </Button>
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

        {parcelData?.properties && (
          <Card className="absolute bottom-4 left-4 p-4 shadow-lg z-10">
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-semibold">APN:</span> {parcelData.properties.apn || 'N/A'}
              </div>
              {parcelData.properties.lotSize && (
                <div className="text-sm">
                  <span className="font-semibold">Lot Size:</span> {parcelData.properties.lotSize.toLocaleString()} sq ft
                </div>
              )}
              {parcelData.properties.zoning && (
                <div className="text-sm">
                  <span className="font-semibold">Zoning:</span> {parcelData.properties.zoning}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </Card>
  );
}
