"use client";

import React from 'react';
import { X, MapPin, FileText, Home, Building2, Users, DollarSign, Map, Ruler, Calendar, Hash, Tag, Landmark, Layers, TrendingUp, Shield, Droplet, Globe, Database } from 'lucide-react';

interface PropertyReportModalProps {
  parcelData: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function PropertyReportModal({ parcelData, isOpen, onClose }: PropertyReportModalProps) {
  if (!isOpen || !parcelData) return null;

  // Extract propertyMetadata (contains all Regrid API data)
  const metadata = parcelData.propertyMetadata || {};

  // Merge top-level parcel data with metadata for comprehensive access
  const data = {
    ...parcelData,
    ...metadata,
  };

  const formatAcres = (sqft: number) => {
    if (!sqft) return 'N/A';
    return (sqft / 43560).toFixed(3);
  };

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

  // Helper to get field value with multiple possible names
  const getField = (...fieldNames: string[]) => {
    for (const name of fieldNames) {
      if (data[name] !== null && data[name] !== undefined && data[name] !== '') {
        return data[name];
      }
    }
    return null;
  };

  // Check if sections have data
  const hasBuildingInfo = getField('yearBuilt', 'year_built') || getField('buildingSqFt', 'building_sqft') ||
                          getField('bedrooms') || getField('bathrooms') || getField('stories') ||
                          getField('constructionType', 'construction_type', 'structure_type') ||
                          getField('roofType', 'roof_type');

  const hasOwnerInfo = getField('owner', 'owner_name') || getField('ownerAddress', 'owner_mailing_address') ||
                       getField('ownerCity', 'owner_city');

  const hasSaleInfo = getField('lastSaleDate', 'sale_date') || getField('lastSalePrice', 'sale_price') ||
                      getField('prior_sale_date') || getField('prior_sale_price');

  const hasTaxInfo = getField('landValue', 'assessed_land_value') || getField('improvementValue', 'assessed_improvement_value') ||
                     getField('totalValue', 'assessed_total_value') || getField('assessedValue') ||
                     getField('taxAmount', 'tax_amount');

  const hasDistrictInfo = getField('schoolDistrict', 'school_district') || getField('fireDistrict', 'fire_district') ||
                          getField('waterDistrict', 'water_district');

  const hasEnvironmentalInfo = getField('floodZone', 'flood_zone') || getField('floodPlain', 'flood_plain');

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
                <h1 className="text-4xl font-bold text-gray-900 mb-3">Property Report</h1>
                <div className="space-y-1">
                  <p className="text-xl text-gray-700 font-semibold">{data.address || parcelData.address}</p>
                  {(data.city || data.state || data.zip || data.zipCode) && (
                    <p className="text-lg text-gray-600">
                      {data.city}
                      {data.state && `, ${data.state}`}
                      {(data.zip || data.zipCode) && ` ${data.zip || data.zipCode}`}
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
                {!parcelData.propertyMetadata && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Additional property data is not available. Only basic parcel information is shown.
                    </p>
                  </div>
                )}
              </div>

              {/* Three Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Column 1 */}
                <div className="space-y-8">
                  {/* Property Identification */}
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-200">
                      <Hash className="h-5 w-5 text-blue-600" />
                      <h2 className="text-lg font-bold text-gray-900">Property Identification</h2>
                    </div>
                    <div className="space-y-3 pl-1">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">APN (Parcel Number)</p>
                        <p className="text-base font-bold text-gray-900">{data.apn || 'Not Available'}</p>
                      </div>
                      {getField('propertyType', 'property_type') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Property Type</p>
                          <p className="text-base text-gray-900">{getField('propertyType', 'property_type')}</p>
                        </div>
                      )}
                      {getField('usedesc', 'use_desc', 'use_description') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Land Use Description</p>
                          <p className="text-base text-gray-900">{getField('usedesc', 'use_desc', 'use_description')}</p>
                        </div>
                      )}
                      {getField('landUseCode', 'land_use_code', 'landuse') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Land Use Code</p>
                          <p className="text-base text-gray-900">{getField('landUseCode', 'land_use_code', 'landuse')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-200">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <h2 className="text-lg font-bold text-gray-900">Location</h2>
                    </div>
                    <div className="space-y-3 pl-1">
                      {data.city && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">City/Jurisdiction</p>
                          <p className="text-base text-gray-900">{data.city}</p>
                        </div>
                      )}
                      {getField('county', 'scounty') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">County</p>
                          <p className="text-base text-gray-900">{getField('county', 'scounty')}</p>
                        </div>
                      )}
                      {getField('state', 'sstate', 'state2') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">State</p>
                          <p className="text-base text-gray-900">{getField('state', 'sstate', 'state2')}</p>
                        </div>
                      )}
                      {getField('zip', 'zipCode', 'szip5', 'szip') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ZIP Code</p>
                          <p className="text-base text-gray-900">{getField('zip', 'zipCode', 'szip5', 'szip')}</p>
                        </div>
                      )}
                      {(data.latitude && data.longitude) && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Coordinates</p>
                          <p className="text-sm text-gray-900 font-mono">
                            {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}
                          </p>
                        </div>
                      )}
                      {getField('censusTract', 'census_tract', 'census', 'tract') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Census Tract</p>
                          <p className="text-base text-gray-900">{getField('censusTract', 'census_tract', 'census', 'tract')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Legal Description & Subdivision */}
                  {(getField('subdivision') || getField('platBook', 'plat_book', 'book') || getField('platPage', 'plat_page', 'page') || getField('mcrweblink') || getField('legal_description')) && (
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-200">
                        <Map className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900">Legal Description</h2>
                      </div>
                      <div className="space-y-3 pl-1">
                        {getField('subdivision') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subdivision</p>
                            <p className="text-base text-gray-900">{getField('subdivision')}</p>
                          </div>
                        )}
                        {getField('neighborhood') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Neighborhood</p>
                            <p className="text-base text-gray-900">{getField('neighborhood')}</p>
                          </div>
                        )}
                        {(getField('platBook', 'plat_book', 'book') || getField('platPage', 'plat_page', 'page')) && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Plat Reference</p>
                            <p className="text-base text-gray-900">
                              {getField('platBook', 'plat_book', 'book') && `Book ${getField('platBook', 'plat_book', 'book')}`}
                              {getField('platBook', 'plat_book', 'book') && getField('platPage', 'plat_page', 'page') && ', '}
                              {getField('platPage', 'plat_page', 'page') && `Page ${getField('platPage', 'plat_page', 'page')}`}
                            </p>
                          </div>
                        )}
                        {getField('legal_description') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Legal Description</p>
                            <p className="text-sm text-gray-900 leading-relaxed">{getField('legal_description')}</p>
                          </div>
                        )}
                        {getField('mcrweblink') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">County Records</p>
                            <a
                              href={getField('mcrweblink')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                            >
                              View Official County Records
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Column 2 */}
                <div className="space-y-8">
                  {/* Lot Information */}
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-200">
                      <Ruler className="h-5 w-5 text-blue-600" />
                      <h2 className="text-lg font-bold text-gray-900">Lot Information</h2>
                    </div>
                    <div className="space-y-3 pl-1">
                      {getField('lotSizeSqFt', 'lot_size_sqft', 'sqft') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Lot Size</p>
                          <p className="text-lg font-bold text-blue-600">
                            {formatNumber(getField('lotSizeSqFt', 'lot_size_sqft', 'sqft'))} sq ft
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatAcres(getField('lotSizeSqFt', 'lot_size_sqft', 'sqft'))} acres
                          </p>
                        </div>
                      )}
                      {getField('acres', 'gisacre', 'll_gisacre') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Acres (GIS Calculated)</p>
                          <p className="text-base text-gray-900">{Number(getField('acres', 'gisacre', 'll_gisacre')).toFixed(3)} acres</p>
                        </div>
                      )}
                      {getField('frontage') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Street Frontage</p>
                          <p className="text-base text-gray-900">{getField('frontage')} ft</p>
                        </div>
                      )}
                      {getField('depth') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Lot Depth</p>
                          <p className="text-base text-gray-900">{getField('depth')} ft</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Zoning */}
                  {(getField('zoning', 'zoningCode', 'zoning_code') || getField('zoningDescription', 'zoning_description')) && (
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-200">
                        <Tag className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900">Zoning & Planning</h2>
                      </div>
                      <div className="space-y-3 pl-1">
                        {getField('zoning', 'zoningCode', 'zoning_code') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Zoning Code</p>
                            <p className="text-lg font-bold text-blue-600">{getField('zoning', 'zoningCode', 'zoning_code')}</p>
                          </div>
                        )}
                        {getField('zoningDescription', 'zoning_description') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Zoning Description</p>
                            <p className="text-base text-gray-900">{getField('zoningDescription', 'zoning_description')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Environmental */}
                  {hasEnvironmentalInfo && (
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-200">
                        <Droplet className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900">Environmental</h2>
                      </div>
                      <div className="space-y-3 pl-1">
                        {getField('floodZone', 'flood_zone', 'fld_zone') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Flood Zone</p>
                            <p className="text-base text-gray-900">{getField('floodZone', 'flood_zone', 'fld_zone')}</p>
                          </div>
                        )}
                        {getField('floodPlain', 'flood_plain', 'fema_flood') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Flood Plain Status</p>
                            <p className="text-base text-gray-900">{getField('floodPlain', 'flood_plain', 'fema_flood')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Column 3 */}
                <div className="space-y-8">
                  {/* Building Information */}
                  {hasBuildingInfo && (
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-200">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900">Building Details</h2>
                      </div>
                      <div className="space-y-3 pl-1">
                        {getField('buildingSqFt', 'building_sqft', 'recrdareano', 'improvarea') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Building Size</p>
                            <p className="text-lg font-bold text-blue-600">{formatNumber(getField('buildingSqFt', 'building_sqft', 'recrdareano', 'improvarea'))} sq ft</p>
                          </div>
                        )}
                        {getField('yearBuilt', 'year_built', 'yearbuilt') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Year Built</p>
                            <p className="text-base text-gray-900">{getField('yearBuilt', 'year_built', 'yearbuilt')}</p>
                            <p className="text-xs text-gray-500">({new Date().getFullYear() - Number(getField('yearBuilt', 'year_built', 'yearbuilt'))} years old)</p>
                          </div>
                        )}
                        {getField('stories') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stories</p>
                            <p className="text-base text-gray-900">{getField('stories')}</p>
                          </div>
                        )}
                        {(getField('bedrooms') || getField('bathrooms', 'bathfixtures')) && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bedrooms / Bathrooms</p>
                            <p className="text-base text-gray-900">
                              {getField('bedrooms') || 'N/A'} / {getField('bathrooms', 'bathfixtures') || 'N/A'}
                            </p>
                          </div>
                        )}
                        {getField('constructionType', 'construction_type', 'structure_type', 'construct') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Construction Type</p>
                            <p className="text-base text-gray-900">{getField('constructionType', 'construction_type', 'structure_type', 'construct')}</p>
                          </div>
                        )}
                        {getField('roofType', 'roof_type', 'rooftype') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Roof Type</p>
                            <p className="text-base text-gray-900">{getField('roofType', 'roof_type', 'rooftype')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Existing Buildings - From Assessor */}
                  {parcelData.totalBuildingSF && (
                    <div className="mt-8 pt-6 border-t-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-4">
                        <Building2 className="h-5 w-5 text-orange-600" />
                        <h3 className="text-lg font-bold text-gray-900">Existing Buildings</h3>
                        <span className="text-sm font-normal text-gray-500">
                          (from County Assessor)
                        </span>
                      </div>

                      <div className="bg-orange-50 rounded-lg p-4 mb-3">
                        <div className="text-sm text-gray-600">Total Building Area</div>
                        <div className="text-2xl font-bold text-orange-600">
                          {formatNumber(parcelData.totalBuildingSF)} sq ft
                        </div>
                      </div>

                      {parcelData.buildingSections && Array.isArray(parcelData.buildingSections) && parcelData.buildingSections.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-gray-700">Building Sections:</div>
                          {(parcelData.buildingSections as any[]).map((section: any, idx: number) => (
                            <div key={idx} className="bg-gray-50 rounded p-3 flex justify-between items-center">
                              <div>
                                <div className="font-medium">{section.name}</div>
                                {section.dimensions && (
                                  <div className="text-sm text-gray-500">{section.dimensions}</div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">{formatNumber(section.sqft)} sq ft</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {parcelData.assessorDataFetchedAt && (
                        <div className="text-xs text-gray-400 mt-2">
                          Data fetched: {formatDate(parcelData.assessorDataFetchedAt)}
                        </div>
                      )}

                      {parcelData.assessorUrl && (
                        <a
                          href={parcelData.assessorUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                        >
                          View on County Assessor →
                        </a>
                      )}
                    </div>
                  )}

                  {/* Owner Information */}
                  {hasOwnerInfo && (
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-200">
                        <Users className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900">Owner Information</h2>
                      </div>
                      <div className="space-y-3 pl-1">
                        {getField('owner', 'owner_name') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Owner Name</p>
                            <p className="text-base font-semibold text-gray-900">{getField('owner', 'owner_name')}</p>
                          </div>
                        )}
                        {getField('ownerAddress', 'owner_mailing_address', 'mailadd', 'mail_address1') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mailing Address</p>
                            <p className="text-sm text-gray-900">{getField('ownerAddress', 'owner_mailing_address', 'mailadd', 'mail_address1')}</p>
                          </div>
                        )}
                        {(getField('ownerCity', 'owner_city', 'mail_city') || getField('ownerState', 'owner_state', 'mail_state2') || getField('ownerZip', 'owner_zip', 'mail_zip')) && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mailing City/State</p>
                            <p className="text-base text-gray-900">
                              {getField('ownerCity', 'owner_city', 'mail_city')}
                              {getField('ownerState', 'owner_state', 'mail_state2') && `, ${getField('ownerState', 'owner_state', 'mail_state2')}`}
                              {getField('ownerZip', 'owner_zip', 'mail_zip') && ` ${getField('ownerZip', 'owner_zip', 'mail_zip')}`}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sale Information */}
                  {hasSaleInfo && (
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-200">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900">Sale History</h2>
                      </div>
                      <div className="space-y-3 pl-1">
                        {getField('lastSaleDate', 'sale_date', 'saledt') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Sale Date</p>
                            <p className="text-base text-gray-900">{formatDate(getField('lastSaleDate', 'sale_date', 'saledt'))}</p>
                          </div>
                        )}
                        {getField('lastSalePrice', 'sale_price', 'price', 'saleprice') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Sale Price</p>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(getField('lastSalePrice', 'sale_price', 'price', 'saleprice'))}</p>
                          </div>
                        )}
                        {getField('prior_sale_date') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prior Sale Date</p>
                            <p className="text-base text-gray-900">{formatDate(getField('prior_sale_date'))}</p>
                          </div>
                        )}
                        {getField('prior_sale_price') && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prior Sale Price</p>
                            <p className="text-base text-gray-900">{formatCurrency(getField('prior_sale_price'))}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Full Width Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Tax Assessment */}
                {hasTaxInfo && (
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-200">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <h2 className="text-lg font-bold text-gray-900">Tax Assessment</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pl-1">
                      {getField('landValue', 'assessed_land_value', 'landval') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Land Value</p>
                          <p className="text-base font-bold text-gray-900">{formatCurrency(getField('landValue', 'assessed_land_value', 'landval'))}</p>
                        </div>
                      )}
                      {getField('improvementValue', 'assessed_improvement_value', 'improvval') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Improvement Value</p>
                          <p className="text-base font-bold text-gray-900">{formatCurrency(getField('improvementValue', 'assessed_improvement_value', 'improvval'))}</p>
                        </div>
                      )}
                      {getField('totalValue', 'assessed_total_value', 'assessedValue', 'totalval', 'assdtotval', 'marketvalu') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Assessed Value</p>
                          <p className="text-lg font-bold text-blue-600">
                            {formatCurrency(getField('totalValue', 'assessed_total_value', 'assessedValue', 'totalval', 'assdtotval', 'marketvalu'))}
                          </p>
                        </div>
                      )}
                      {getField('taxAmount', 'tax_amount', 'taxtot') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Annual Property Tax</p>
                          <p className="text-lg font-bold text-orange-600">{formatCurrency(getField('taxAmount', 'tax_amount', 'taxtot'))}</p>
                        </div>
                      )}
                      {getField('taxYear', 'tax_year', 'taxyear') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tax Year</p>
                          <p className="text-base text-gray-900">{getField('taxYear', 'tax_year', 'taxyear')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Districts & Services */}
                {hasDistrictInfo && (
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-200">
                      <Landmark className="h-5 w-5 text-blue-600" />
                      <h2 className="text-lg font-bold text-gray-900">Districts & Services</h2>
                    </div>
                    <div className="space-y-3 pl-1">
                      {getField('schoolDistrict', 'school_district', 'schooldist') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">School District</p>
                          <p className="text-base text-gray-900">{getField('schoolDistrict', 'school_district', 'schooldist')}</p>
                        </div>
                      )}
                      {getField('fireDistrict', 'fire_district', 'firedist') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fire District</p>
                          <p className="text-base text-gray-900">{getField('fireDistrict', 'fire_district', 'firedist')}</p>
                        </div>
                      )}
                      {getField('waterDistrict', 'water_district', 'waterdist') && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Water District</p>
                          <p className="text-base text-gray-900">{getField('waterDistrict', 'water_district', 'waterdist')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Data Section - Shows any remaining fields from propertyMetadata */}
              {parcelData.propertyMetadata && Object.keys(metadata).length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-gray-200">
                    <Database className="h-5 w-5 text-gray-600" />
                    <h2 className="text-lg font-bold text-gray-900">Additional Property Data</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-1">
                    {Object.entries(metadata).map(([key, value]) => {
                      // Skip null/undefined/empty values
                      if (!value || value === 'N/A' || value === '') return null;

                      // Format key to be more readable
                      const formattedKey = key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/_/g, ' ')
                        .replace(/^./, str => str.toUpperCase())
                        .trim();

                      return (
                        <div key={key}>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{formattedKey}</p>
                          <p className="text-sm text-gray-900 break-words">{String(value)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 text-center">
                    <strong>Disclaimer:</strong> This report is generated from Regrid parcel data and is for informational purposes only.
                    All information should be independently verified with official county records and local jurisdiction.
                    Property data is subject to change and may not reflect the most current information.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-center gap-4 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
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
