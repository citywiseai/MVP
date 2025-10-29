"use client";
import { useState } from "react";
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { AddressValidator } from '@/components/AddressValidator';
import { PropertyLookup } from '@/components/PropertyLookup';

export default function NewProjectClientForm() {
  const [address, setAddress] = useState("");
  const handleAddressSelect = (addr: string, placeDetails?: any) => {
    setAddress(addr);
    if (placeDetails?.address_components) {
      const city = placeDetails.address_components.find((component: any) => component.types.includes("locality"));
      if (city) {
        const jurisdictionInput = document.getElementById("jurisdiction") as HTMLInputElement | null;
        if (jurisdictionInput && !jurisdictionInput.value) {
          jurisdictionInput.value = `City of ${city.long_name}`;
        }
      }
    }
  };
  return (
    <>
      {/* Hidden full address field for server */}
      <input type="hidden" name="fullAddress" value={address} required />

      {/* Address Autocomplete */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Full Address <span className="text-red-500">*</span>
        </label>
        <AddressAutocomplete name="address-autocomplete" required id="address-autocomplete" placeholder="123 Main St, Phoenix, AZ 85001" className="w-full px-3 py-2 border rounded-md" onAddressSelect={handleAddressSelect} />
        <div className="mt-2">
          <AddressValidator address={address} />
        </div>
      </div>

      {/* Property Lookup */}
      <div className="my-4">
        <PropertyLookup address={address} />
      </div>

      {/* Property Type */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Property Type</label>
        <select name="propertyType" id="propertyType" className="w-full px-3 py-2 border rounded-md" required>
          <option value="">Select property type</option>
          <option value="Single Family">Single Family</option>
          <option value="Multi-family">Multi-family</option>
          <option value="Commercial">Commercial</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Jurisdiction */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Jurisdiction</label>
        <input name="jurisdiction" id="jurisdiction" type="text" className="w-full px-3 py-2 border rounded-md" placeholder="e.g. City of Phoenix" />
      </div>

      {/* Lot Size */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Lot Size (sq ft)</label>
        <input name="lotSizeSqFt" id="lotSizeSqFt" type="number" min="0" className="w-full px-3 py-2 border rounded-md" placeholder="e.g. 7500" />
      </div>

      {/* Building Size */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Building Size (sq ft)</label>
        <input name="buildingFootprintSqFt" id="buildingFootprintSqFt" type="number" min="0" className="w-full px-3 py-2 border rounded-md" placeholder="e.g. 2000" />
      </div>

      {/* Project Type */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Project Type</label>
        <select name="projectType" id="projectType" className="w-full px-3 py-2 border rounded-md" required>
          <option value="">Select project type</option>
          <option value="remodel">Remodel</option>
          <option value="addition">Addition</option>
          <option value="new_construction">New Construction</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Description / Scope of Work */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Project Description / Scope of Work</label>
        <textarea name="scopeOfWork" rows={3} className="w-full px-3 py-2 border rounded-md" placeholder="Describe the project scope, goals, or any special requirements" />
      </div>
    </>
  );
}
