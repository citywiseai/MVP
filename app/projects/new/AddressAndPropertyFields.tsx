"use client";
import { useState } from "react";
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { AddressValidator } from '@/components/AddressValidator';
import { PropertyLookup } from '@/components/PropertyLookup';

export default function AddressAndPropertyFields() {
  const [address, setAddress] = useState("");
  const handleAddressSelect = (addr: string, placeDetails?: any) => {
    setAddress(addr);
    // Optionally auto-populate jurisdiction
    if (placeDetails?.address_components) {
      const city = placeDetails.address_components.find(
        (component: any) => component.types.includes("locality")
      );
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
          <AddressValidator />
        </div>
      </div>
      <div className="my-4">
        <PropertyLookup />
      </div>
    </>
  );
}
