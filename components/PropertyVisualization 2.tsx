"use client";

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Maximize2, Minimize2, Map, Building2, Grid3x3, MapPin } from 'lucide-react';

const REGRID_API_KEY = process.env.NEXT_PUBLIC_REGRID_API_KEY || '';
console.log('Regrid API Key:', REGRID_API_KEY ? 'Key exists' : 'NO KEY FOUND');

interface PropertyVisualizationProps {
  projectId: string;
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
  projectId,
  parcelData,
  buildingFootprint 
}: PropertyVisualizationProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const parcelLayer = useRef<L.GeoJSON | null>(null);
  const buildingLayer = useRef<L.GeoJSON | null>(null);
  const satelliteLayer = useRef<L.TileLayer | null>(null);
  const streetLayer = useRef<L.TileLayer | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'satellite' | 'street'>('satellite');
  const [showParcel, setShowParcel] = useState(true);
  const [showBuilding, setShowBuilding] = useState(true);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize Leaflet map
    map.current = L.map(mapContainer.current, {
      center: [33.4484, -111.8910],
      zoom: 18,
      zoomControl: true,
    });

    // Add Regrid Satellite Tiles
    satelliteLayer.current = L.tileLayer(
      `https://tiles.regrid.com/api/v1/tile/usaerial_latest/{z}/{x}/{y}.png?token=${REGRID_API_KEY}`,
      {
        attribution: '© Regrid',
        maxZoom: 20,
      }
    );

    // Add Regrid Street Map Tiles  
    streetLayer.current = L.tileLayer(
      `https://tiles.regrid.com/api/v1/tile/usstreets/{z}/{x}/{y}.png?token=${REGRID_API_KEY}`,
      {
        attribution: '© Regrid',
        maxZoom: 20,
      }
    );

    // Start with satellite view
    satelliteLayer.current.addTo(map.current);

    // Add parcel boundary if data exists
    if (parcelData?.geometry) {
      addParcelLayer(parcelData.geometry);
    }

    // Add building footprint if exists
    if (buildingFootprint) {
      addBuildingLayer(buildingFootprint);
    }

    setIsLoading(false);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [parcelData, buildingFootprint]);

  // Toggle between satellite and street view
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

  // Toggle parcel visibility
  useEffect(() => {
    if (!parcelLayer.current || !map.current) return;
    
    if (showParcel) {
      parcelLayer.current.addTo(map.current);
    } else {
      map.current.removeLayer(parcelLayer.current);
    }
  }, [showParcel]);

  // Toggle building visibility
  useEffect(() => {
    if (!buildingLayer.current || !map.current) return;
    
    if (showBuilding) {
      buildingLayer.current.addTo(map.current);
    } else {
      map.current.removeLayer(buildingLayer.current);
    }
  }, [showBuilding]);

  const addParcelLayer = (geometry: any) => {
    if (!map.current) return;

    // Remove existing parcel layer if present
    if (parcelLayer.current) {
      map.current.removeLayer(parcelLayer.current);
    }

    // Create GeoJSON layer with golden styling
    parcelLayer.current = L.geoJSON(geometry, {
      style: {
        color: '#FFD700',
        weight: 3,
        fillColor: '#FFD700',
        fillOpacity: 0.2,
      },
    });

    parcelLayer.current.addTo(map.current);

    // Fit map to parcel bounds
    const bounds = parcelLayer.current.getBounds();
    map.current.fitBounds(bounds, { padding: [50, 50] });
  };

  const addBuildingLayer = (footprint: any) => {
    if (!map.current) return;

    // Remove existing building layer if present
    if (buildingLayer.current) {
      map.current.removeLayer(buildingLayer.current);
    }

    // Create GeoJSON layer with red styling
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

        <div className="absolute top-4 left-4 flex flex-col gap-2 z-[1000]">
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

        <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
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
          <Card className="absolute bottom-4 left-4 p-4 shadow-lg z-[1000]">
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
