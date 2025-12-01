"use client";

import React from 'react';
import { X, MapPin, FileText, Home, Building2, DollarSign, Calendar, Hash, Landmark, TrendingUp, Globe, Layout, AlertCircle } from 'lucide-react';

interface AssessorReportModalProps {
  data: any;
  isOpen: boolean;
  onClose: () => void;
}

// Source badge component
const SourceBadge = ({ source, small = false }: { source: string; small?: boolean }) => {
  const colors = {
    assessor: 'bg-orange-100 text-orange-700 border-orange-200',
    regrid: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  
  const labels = {
    assessor: 'Assessor',
    regrid: 'Regrid',
  };

  return (
    <span className={`inline-flex items-center ${small ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} rounded-full border ${colors[source as keyof typeof colors] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {labels[source as keyof typeof labels] || source}
    </span>
  );
};

// Conflict indicator component
const ConflictValue = ({ label, assessorValue, regridValue, formatFn }: { 
  label: string; 
  assessorValue: any; 
  regridValue: any; 
  formatFn?: (v: any) => string;
}) => {
  const format = formatFn || ((v: any) => String(v));
  
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
      <div className="flex items-center gap-1 text-amber-700 text-xs font-medium mb-2">
        <AlertCircle className="h-3 w-3" />
        Data Discrepancy
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {assessorValue && (
          <div>
            <SourceBadge source="assessor" small />
            <p className="mt-1 font-medium">{format(assessorValue)}</p>
          </div>
        )}
        {regridValue && (
          <div>
            <SourceBadge source="regrid" small />
            <p className="mt-1 font-medium">{format(regridValue)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function AssessorReportModal({ data, isOpen, onClose }: AssessorReportModalProps) {
  if (!isOpen || !data) return null;

  const parcel = data.parcel || {};
  const residential = data.residential || {};
  const valuation = data.valuation || {};
  const sources = data._sources || {};

  const formatNumber = (num: number | null | undefined) => {
    if (!num) return 'N/A';
    return num.toLocaleString();
  };

  const formatCurrency = (num: number | null | undefined) => {
    if (!num) return 'N/A';
    return `$${num.toLocaleString()}`;
  };

  // Helper to get value from field (handles both new format with source and old format)
  const getValue = (field: any) => {
    if (field === null || field === undefined) return null;
    if (typeof field === 'object' && 'value' in field) return field.value;
    return field;
  };

  const getSource = (field: any) => {
    if (typeof field === 'object' && 'source' in field) return field.source;
    return null;
  };

  const hasConflict = (field: any) => {
    if (typeof field === 'object' && 'hasConflict' in field) return field.hasConflict;
    return false;
  };

  const getAssessorValue = (field: any) => {
    if (typeof field === 'object' && 'assessorValue' in field) return field.assessorValue;
    return null;
  };

  const getRegridValue = (field: any) => {
    if (typeof field === 'object' && 'regridValue' in field) return field.regridValue;
    return null;
  };

  // Field display component
  const Field = ({ label, field, format = 'text', showSource = true }: { 
    label: string; 
    field: any; 
    format?: 'text' | 'number' | 'currency' | 'sqft' | 'acres';
    showSource?: boolean;
  }) => {
    const value = getValue(field);
    const source = getSource(field);
    const conflict = hasConflict(field);
    
    if (!value && value !== 0) return null;

    let displayValue = value;
    if (format === 'number') displayValue = formatNumber(value);
    if (format === 'currency') displayValue = formatCurrency(value);
    if (format === 'sqft') displayValue = `${formatNumber(value)} sq ft`;
    if (format === 'acres') displayValue = `${Number(value).toFixed(3)} acres`;

    return (
      <div>
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          {showSource && source && <SourceBadge source={source} small />}
        </div>
        <p className={`text-base ${format === 'sqft' || format === 'currency' ? 'font-bold text-orange-600 text-lg' : 'text-gray-900'}`}>
          {displayValue}
        </p>
        {conflict && (
          <ConflictValue 
            label={label}
            assessorValue={getAssessorValue(field)}
            regridValue={getRegridValue(field)}
            formatFn={format === 'number' || format === 'sqft' ? formatNumber : 
                     format === 'currency' ? formatCurrency : undefined}
          />
        )}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-60 z-[9998] print:hidden"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] overflow-y-auto">
        <div className="min-h-screen px-4 py-8 flex items-center justify-center">
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-7xl w-full mx-auto print:shadow-none print:max-w-full print:rounded-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors print:hidden z-10"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>

            {/* Content */}
            <div className="p-8 print:p-6">
              {/* Header */}
              <div className="mb-8 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-4xl font-bold text-gray-900">Combined Property Report</h1>
                </div>
                <div className="space-y-1">
                  <p className="text-xl text-gray-700 font-semibold">{getValue(parcel.situsStreet1) || 'Address Not Available'}</p>
                  {getValue(parcel.situsCity) && (
                    <div className="flex items-center gap-2">
                      <p className="text-lg text-gray-600">
                        {getValue(parcel.situsCity)}, {getValue(parcel.situsState)} {getValue(parcel.situsZip)}
                      </p>
                      {hasConflict(parcel.situsCity) && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                          ⚠️ Jurisdiction differs between sources
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <p className="text-sm text-gray-400">
                    Report Generated: {new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Sources:</span>
                    {sources.assessor && <SourceBadge source="assessor" />}
                    {sources.regrid && <SourceBadge source="regrid" />}
                  </div>
                </div>
              </div>

              {/* Source Legend */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Data Priority:</strong> County Assessor data is shown when available. Regrid data fills in gaps. 
                  Fields with ⚠️ indicate discrepancies between sources.
                </p>
              </div>

              {/* Three Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Column 1 - Property Identification & Location */}
                <div className="space-y-8">
                  {/* Property Identification */}
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-orange-200">
                      <Hash className="h-5 w-5 text-orange-600" />
                      <h2 className="text-lg font-bold text-gray-900">Property Identification</h2>
                    </div>
                    <div className="space-y-3 pl-1">
                      <Field label="Parcel Number (APN)" field={parcel.parcelNumber} showSource={false} />
                      <Field label="Property Class" field={parcel.propertyClass} />
                      <Field label="Property Type" field={parcel.propertyType} />
                      <Field label="Ownership" field={parcel.ownership} />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-orange-200">
                      <MapPin className="h-5 w-5 text-orange-600" />
                      <h2 className="text-lg font-bold text-gray-900">Location</h2>
                    </div>
                    <div className="space-y-3 pl-1">
                      <Field label="Jurisdiction" field={parcel.situsCity} />
                      <Field label="Subdivision" field={parcel.subdivision} />
                      <Field label="School District" field={parcel.schoolDistrict} />
                      <Field label="Tax Area" field={parcel.taxArea} />
                    </div>
                  </div>

                  {/* Legal Description */}
                  {getValue(parcel.legalDescription) && (
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-orange-200">
                        <FileText className="h-5 w-5 text-orange-600" />
                        <h2 className="text-lg font-bold text-gray-900">Legal Description</h2>
                      </div>
                      <div className="space-y-3 pl-1">
                        <div className="flex items-center gap-2">
                          {getSource(parcel.legalDescription) && <SourceBadge source={getSource(parcel.legalDescription)} small />}
                        </div>
                        <p className="text-sm text-gray-900 leading-relaxed">{getValue(parcel.legalDescription)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Column 2 - Valuation & Tax */}
                <div className="space-y-8">
                  {/* Property Valuation */}
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-orange-200">
                      <DollarSign className="h-5 w-5 text-orange-600" />
                      <h2 className="text-lg font-bold text-gray-900">Property Valuation</h2>
                    </div>
                    <div className="space-y-3 pl-1">
                      <Field label="Full Cash Value (FCV)" field={valuation.fullCashValue} format="currency" />
                      <Field label="Market Value" field={valuation.marketValue} format="currency" />
                      <Field label="Land Value" field={valuation.landValue} format="currency" />
                      <Field label="Improvement Value" field={valuation.improvementValue} format="currency" />
                    </div>
                  </div>

                  {/* Tax Information */}
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-orange-200">
                      <Landmark className="h-5 w-5 text-orange-600" />
                      <h2 className="text-lg font-bold text-gray-900">Tax Information</h2>
                    </div>
                    <div className="space-y-3 pl-1">
                      <Field label="Tax Year" field={valuation.taxYear} />
                    </div>
                  </div>

                  {/* Zoning */}
                  {getValue(parcel.zoning) && (
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-orange-200">
                        <Globe className="h-5 w-5 text-orange-600" />
                        <h2 className="text-lg font-bold text-gray-900">Zoning</h2>
                      </div>
                      <div className="space-y-3 pl-1">
                        <Field label="Zoning Code" field={parcel.zoning} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Column 3 - Building Details */}
                <div className="space-y-8">
                  {/* Building Details */}
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-orange-200">
                      <Building2 className="h-5 w-5 text-orange-600" />
                      <h2 className="text-lg font-bold text-gray-900">Building Details</h2>
                    </div>
                    <div className="space-y-3 pl-1">
                      <Field label="Living Area" field={residential.livingArea} format="sqft" />
                      <Field label="Year Built" field={residential.yearBuilt} />
                      <Field label="Bedrooms" field={residential.bedrooms} />
                      <Field label="Bathrooms" field={residential.bathrooms} />
                      <Field label="Stories" field={residential.stories} />
                      <Field label="Garage Spaces" field={residential.garageSpaces} />
                      <Field label="Pool" field={{ 
                        value: getValue(residential.pool) ? 'Yes' : 'No', 
                        source: getSource(residential.pool) 
                      }} />
                      <Field label="Quality Grade" field={residential.qualityGrade} />
                      <Field label="Roof Type" field={residential.roofType} />
                      <Field label="Exterior Walls" field={residential.exteriorWalls} />
                      <Field label="Cooling" field={residential.cooling} />
                    </div>
                  </div>

                  {/* Lot Information */}
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-orange-200">
                      <Home className="h-5 w-5 text-orange-600" />
                      <h2 className="text-lg font-bold text-gray-900">Lot Information</h2>
                    </div>
                    <div className="space-y-3 pl-1">
                      <Field label="Lot Size" field={parcel.lotSize} format="sqft" />
                      <Field label="Lot Size (Acres)" field={parcel.lotSizeAcres} format="acres" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="bg-gradient-to-r from-orange-50 to-blue-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 text-center">
                    <strong>Sources:</strong> Maricopa County Assessor's Office & Regrid Property Data. 
                    Data is for informational purposes only. All information should be independently verified with official records.
                  </p>
                  <div className="text-center mt-2 space-x-4">
                    <a
                      href={data.assessorUrl || `https://mcassessor.maricopa.gov/mcs/?q=${getValue(parcel.parcelNumber)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-orange-600 hover:text-orange-800 underline"
                    >
                      View on County Assessor →
                    </a>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-center gap-4 print:hidden">
                <a
                  href={`https://mcassessor.maricopa.gov/mcs/?q=${getValue(parcel.parcelNumber)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  <Layout className="h-5 w-5" />
                  View Building Sketch
                </a>
                <button
                  onClick={() => window.print()}
                  className="px-8 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  Print Report
                </button>
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed.inset-0.z-\\[9999\\] * {
            visibility: visible;
          }
          .fixed.inset-0.z-\\[9999\\] {
            position: static;
          }
          @page {
            margin: 0.5in;
          }
        }
      `}</style>
    </>
  );
}
