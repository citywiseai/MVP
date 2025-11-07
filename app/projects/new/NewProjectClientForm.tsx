"use client";

import { useState } from "react";
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { AddressValidator } from '@/components/AddressValidator';

export default function NewProjectClientForm() {
  const [address, setAddress] = useState("");
  const [lotSize, setLotSize] = useState("");
  const [buildingSize, setBuildingSize] = useState("");
  const [fetchingData, setFetchingData] = useState(false);

  const handleAddressSelect = async (addr: string, placeDetails?: any) => {
    setAddress(addr);
    
    if (placeDetails?.address_components) {
      const city = placeDetails.address_components.find((component: any) => 
        component.types.includes("locality")
      );
      if (city) {
        const jurisdictionInput = document.getElementById("jurisdiction") as HTMLInputElement | null;
        if (jurisdictionInput && !jurisdictionInput.value) {
          jurisdictionInput.value = `City of ${city.long_name}`;
        }
      }
    }

    setFetchingData(true);
    
    try {
      const response = await fetch('/api/real-address-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: addr }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Parcel data received:', data);
        
        if (data.lotSizeSqFt) {
          setLotSize(data.lotSizeSqFt.toString());
        }
        
        if (data.buildingSqFt || data.buildingFootprintSqFt) {
          setBuildingSize((data.buildingSqFt || data.buildingFootprintSqFt).toString());
        }
      }
    } catch (error) {
      console.error('Error fetching parcel data:', error);
    } finally {
      setFetchingData(false);
    }
  };

  return (
    <>
      <input type="hidden" name="fullAddress" value={address} required />

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Full Address <span className="text-red-500">*</span>
        </label>
        <AddressAutocomplete
          name="address-autocomplete"
          required
          id="address-autocomplete"
          placeholder="123 Main St, Phoenix, AZ 85001"
          className="w-full px-3 py-2 border rounded-md"
          onAddressSelect={handleAddressSelect}
        />
        <div className="mt-2">
          <AddressValidator address={address} />
        </div>
        {fetchingData && (
          <p className="text-sm text-blue-600">Loading property data...</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Property Type</label>
        <select
          name="propertyType"
          id="propertyType"
          className="w-full px-3 py-2 border rounded-md"
          required
        >
          <option value="">Select property type</option>
          <option value="Single Family">Single Family</option>
          <option value="Multi-family">Multi-family</option>
          <option value="Commercial">Commercial</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Jurisdiction</label>
        <input
          name="jurisdiction"
          id="jurisdiction"
          type="text"
          className="w-full px-3 py-2 border rounded-md"
          placeholder="e.g. City of Phoenix"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Lot Size (sq ft)
          {lotSize && <span className="ml-2 text-xs text-green-600">✓ Auto-filled</span>}
        </label>
        <input
          name="lotSizeSqFt"
          id="lotSizeSqFt"
          type="number"
          min="0"
          value={lotSize}
          onChange={(e) => setLotSize(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="e.g. 7500"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Building Size (sq ft)
          {buildingSize && <span className="ml-2 text-xs text-green-600">✓ Auto-filled</span>}
        </label>
        <input
          name="buildingFootprintSqFt"
          id="buildingFootprintSqFt"
          type="number"
          min="0"
          value={buildingSize}
          onChange={(e) => setBuildingSize(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="e.g. 2000"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Project Type</label>
        <select
          name="projectType"
          id="projectType"
          className="w-full px-3 py-2 border rounded-md"
          required
        >
          <option value="">Select project type</option>
          <option value="remodel">Remodel</option>
          <option value="addition">Addition</option>
          <option value="new_construction">New Construction</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Project Description / Scope of Work
        </label>
        <textarea
          name="scopeOfWork"
          rows={3}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Describe the project scope, goals, or any special requirements"
        />
      </div>
    </>
  );
}
