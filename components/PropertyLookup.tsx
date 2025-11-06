'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, MapPin } from 'lucide-react';
import PropertyVisualization from './PropertyVisualization';

interface ParcelGeometry {
  type: string;
  coordinates: number[][][];
}

interface ParcelData {
  apn: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  latitude: number;
  longitude: number;
  geometry: ParcelGeometry;
  owner?: string;
  landUse?: string;
  zoning?: string;
  lotSize?: number;
  yearBuilt?: number;
}

interface PropertyLookupProps {
  projectId?: string;
  onDataLoaded?: (data: ParcelData) => void;
}

export default function PropertyLookup({ projectId, onDataLoaded }: PropertyLookupProps) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parcelData, setParcelData] = useState<ParcelData | null>(null);

  const handleLookup = async () => {
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    setLoading(true);
    setError(null);
    setParcelData(null);

    try {
      const response = await fetch('/api/real-address-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to lookup address');
      }

      const data = await response.json();

      if (!data.geometry || !data.latitude || !data.longitude) {
        throw new Error('Incomplete parcel data received');
      }

      const parcelInfo: ParcelData = {
        apn: data.apn || 'N/A',
        address: data.address || address,
        city: data.city || 'Phoenix',
        state: data.state || 'AZ',
        zip: data.zip || '',
        county: data.county || 'Maricopa',
        latitude: data.latitude,
        longitude: data.longitude,
        geometry: data.geometry,
        owner: data.owner,
        landUse: data.landUse,
        zoning: data.zoning,
        lotSize: data.lotSize,
        yearBuilt: data.yearBuilt,
      };

      setParcelData(parcelInfo);
      
      if (onDataLoaded) {
        onDataLoaded(parcelInfo);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Address lookup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleLookup();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Property Lookup
          </CardTitle>
          <CardDescription>
            Enter a Phoenix metro address to view parcel data and boundaries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Property Address</Label>
            <div className="flex gap-2">
              <Input
                id="address"
                type="text"
                placeholder="123 Main St, Phoenix, AZ 85001"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="flex-1"
              />
              <Button 
                onClick={handleLookup} 
                disabled={loading}
                className="min-w-[100px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Looking up...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Look Up
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {parcelData && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">APN:</span> {parcelData.apn}
                </div>
                <div>
                  <span className="font-medium">Address:</span> {parcelData.address}
                </div>
                <div>
                  <span className="font-medium">City:</span> {parcelData.city}
                </div>
                <div>
                  <span className="font-medium">County:</span> {parcelData.county}
                </div>
                {parcelData.zoning && (
                  <div>
                    <span className="font-medium">Zoning:</span> {parcelData.zoning}
                  </div>
                )}
                {parcelData.lotSize && (
                  <div>
                    <span className="font-medium">Lot Size:</span> {parcelData.lotSize.toLocaleString()} sq ft
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {parcelData && parcelData.geometry && (
        <PropertyVisualization
          projectId={projectId || 'preview'}
          parcelData={parcelData.geometry}
          buildingFootprint={parcelData.geometry}
        />
      )}
    </div>
  );
}