"use client";

import React from 'react';
import { X, MapPin, FileText, Home, Building2, DollarSign, Calendar, Hash, Landmark, TrendingUp, Globe, Layout } from 'lucide-react';

interface AssessorReportModalProps {
  data: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function AssessorReportModal({ data, isOpen, onClose }: AssessorReportModalProps) {
  if (!isOpen || !data) return null;

  const parcel = data.parcel || {};
  const residential = data.residential || {};
  const valuation = data.valuation || {};

  const formatNumber = (num: number | null | undefined) => {
    if (!num) return 'N/A';
    return num.toLocaleString();
  };

  const formatCurrency = (num: number | null | undefined) => {
    if (!num) return 'N/A';
    return `$${num.toLocaleString()}`;
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return date;
    }
  };

  // Helper to safely get nested values
  const get = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
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
                <h1 className="text-4xl font-bold text-gray-900 mb-3">Maricopa County Assessor Report</h1>
                <div className="space-y-1">
                  <p className="text-xl text-gray-700 font-semibold">{get(parcel, 'situsStreet1') || 'Address Not Available'}</p>
                  {get(parcel, 'situsCity') && (
                    <p className="text-lg text-gray-600">
                      {get(parcel, 'situsCity')}, {get(parcel, 'situsState')} {get(parcel, 'situsZip')}
                    </p>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-3">
                  Report Generated: {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
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
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Parcel Number (APN)</p>
                        <p className="text-base font-bold text-gray-900">{get(parcel, 'parcelNumber') || 'Not Available'}</p>
                      </div>
                      {get(parcel, 'propertyClass') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Property Class</p>
                          <p className="text-base text-gray-900">{get(parcel, 'propertyClass')}</p>
                        </div>
                      )}
                      {get(parcel, 'propertyType') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Property Type</p>
                          <p className="text-base text-gray-900">{get(parcel, 'propertyType')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-orange-200">
                      <MapPin className="h-5 w-5 text-orange-600" />
                      <h2 className="text-lg font-bold text-gray-900">Location</h2>
                    </div>
                    <div className="space-y-3 pl-1">
                      {get(parcel, 'subdivision') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subdivision</p>
                          <p className="text-base text-gray-900">{get(parcel, 'subdivision')}</p>
                        </div>
                      )}
                      {get(parcel, 'schoolDistrict') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">School District</p>
                          <p className="text-base text-gray-900">{get(parcel, 'schoolDistrict')}</p>
                        </div>
                      )}
                      {get(parcel, 'taxArea') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tax Area</p>
                          <p className="text-base text-gray-900">{get(parcel, 'taxArea')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Legal Description */}
                  {get(parcel, 'legalDescription') && (
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-orange-200">
                        <FileText className="h-5 w-5 text-orange-600" />
                        <h2 className="text-lg font-bold text-gray-900">Legal Description</h2>
                      </div>
                      <div className="space-y-3 pl-1">
                        <p className="text-sm text-gray-900 leading-relaxed">{get(parcel, 'legalDescription')}</p>
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
                      {get(parcel, 'fullCashValue') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Cash Value (FCV)</p>
                          <p className="text-lg font-bold text-orange-600">{formatCurrency(get(parcel, 'fullCashValue'))}</p>
                        </div>
                      )}
                      {get(parcel, 'limitedPropertyValue') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Limited Property Value (LPV)</p>
                          <p className="text-base font-bold text-gray-900">{formatCurrency(get(parcel, 'limitedPropertyValue'))}</p>
                        </div>
                      )}
                      {get(parcel, 'landValue') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Land Value</p>
                          <p className="text-base text-gray-900">{formatCurrency(get(parcel, 'landValue'))}</p>
                        </div>
                      )}
                      {get(parcel, 'improvementValue') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Improvement Value</p>
                          <p className="text-base text-gray-900">{formatCurrency(get(parcel, 'improvementValue'))}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tax Information */}
                  {(get(parcel, 'taxYear') || get(parcel, 'taxAmount')) && (
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-orange-200">
                        <Landmark className="h-5 w-5 text-orange-600" />
                        <h2 className="text-lg font-bold text-gray-900">Tax Information</h2>
                      </div>
                      <div className="space-y-3 pl-1">
                        {get(parcel, 'taxYear') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tax Year</p>
                            <p className="text-base text-gray-900">{get(parcel, 'taxYear')}</p>
                          </div>
                        )}
                        {get(parcel, 'assessedValue') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assessed Value</p>
                            <p className="text-base font-bold text-gray-900">{formatCurrency(get(parcel, 'assessedValue'))}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Valuation History */}
                  {valuation && Array.isArray(valuation) && valuation.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-orange-200">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                        <h2 className="text-lg font-bold text-gray-900">Valuation History</h2>
                      </div>
                      <div className="space-y-2 pl-1">
                        {valuation.slice(0, 5).map((val: any, idx: number) => (
                          <div key={idx} className="bg-gray-50 rounded p-3">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{val.taxYear || 'N/A'}</span>
                              <span className="font-semibold text-orange-600">{formatCurrency(val.fullCashValue)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Column 3 - Physical Characteristics */}
                <div className="space-y-8">
                  {/* Building Details */}
                  {residential && Object.keys(residential).length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-orange-200">
                        <Building2 className="h-5 w-5 text-orange-600" />
                        <h2 className="text-lg font-bold text-gray-900">Building Details</h2>
                      </div>
                      <div className="space-y-3 pl-1">
                        {get(residential, 'livingArea') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Living Area</p>
                            <p className="text-lg font-bold text-orange-600">{formatNumber(get(residential, 'livingArea'))} sq ft</p>
                          </div>
                        )}
                        {get(residential, 'yearBuilt') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Year Built</p>
                            <p className="text-base text-gray-900">{get(residential, 'yearBuilt')}</p>
                            <p className="text-xs text-gray-500">({new Date().getFullYear() - Number(get(residential, 'yearBuilt'))} years old)</p>
                          </div>
                        )}
                        {get(residential, 'bedrooms') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bedrooms</p>
                            <p className="text-base text-gray-900">{get(residential, 'bedrooms')}</p>
                          </div>
                        )}
                        {get(residential, 'bathrooms') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bathrooms</p>
                            <p className="text-base text-gray-900">{get(residential, 'bathrooms')}</p>
                          </div>
                        )}
                        {get(residential, 'stories') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stories</p>
                            <p className="text-base text-gray-900">{get(residential, 'stories')}</p>
                          </div>
                        )}
                        {get(residential, 'garageSpaces') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Garage Spaces</p>
                            <p className="text-base text-gray-900">{get(residential, 'garageSpaces')}</p>
                          </div>
                        )}
                        {get(residential, 'pool') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pool</p>
                            <p className="text-base text-gray-900">{get(residential, 'pool') === true ? 'Yes' : 'No'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Lot Information */}
                  {(get(parcel, 'lotSize') || get(parcel, 'lotSizeAcres')) && (
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-orange-200">
                        <Home className="h-5 w-5 text-orange-600" />
                        <h2 className="text-lg font-bold text-gray-900">Lot Information</h2>
                      </div>
                      <div className="space-y-3 pl-1">
                        {get(parcel, 'lotSize') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Lot Size</p>
                            <p className="text-lg font-bold text-orange-600">{formatNumber(get(parcel, 'lotSize'))} sq ft</p>
                          </div>
                        )}
                        {get(parcel, 'lotSizeAcres') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Lot Size (Acres)</p>
                            <p className="text-base text-gray-900">{Number(get(parcel, 'lotSizeAcres')).toFixed(3)} acres</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  {get(parcel, 'zoning') && (
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-orange-200">
                        <Globe className="h-5 w-5 text-orange-600" />
                        <h2 className="text-lg font-bold text-gray-900">Zoning</h2>
                      </div>
                      <div className="space-y-3 pl-1">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Zoning Code</p>
                          <p className="text-lg font-bold text-orange-600">{get(parcel, 'zoning')}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 text-center">
                    <strong>Source:</strong> Maricopa County Assessor's Office. Data is for informational purposes only.
                    All information should be independently verified with official county records.
                  </p>
                  <div className="text-center mt-2">
                    <a
                      href={`https://treasurer.maricopa.gov/Parcel/${get(parcel, 'parcelNumber')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-orange-600 hover:text-orange-800 underline"
                    >
                      View on Maricopa County Assessor Website →
                    </a>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-center gap-4 print:hidden">
                <a
                  href={`https://mcassessor.maricopa.gov/mcs/?q=${get(parcel, 'parcelNumber')}`}
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
