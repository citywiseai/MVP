// Regrid API Integration - Using v1 Search API Only
const REGRID_API_TOKEN = process.env.REGRID_API_TOKEN

interface ParcelData {
  apn: string
  address: string
  city: string
  state?: string
  zip: string
  county?: string
  owner: string
  ownerAddress?: string
  ownerCity?: string
  ownerState?: string
  ownerZip?: string
  subdivision?: string
  lotSizeSqFt: number
  acres: number
  frontage?: number
  depth?: number
  latitude: number
  longitude: number
  boundaryCoordinates: number[][]
  boundaryRings: number[][][]
  zoning?: string
  zoningCode?: string
  zoningDescription?: string
  landUseCode?: string
  usedesc?: string
  yearBuilt?: number
  buildingSqFt?: number
  bedrooms?: number
  bathrooms?: number
  stories?: number
  constructionType?: string
  roofType?: string
  propertyType?: string
  platBook?: string
  platPage?: string
  mcrweblink?: string
  censusTract?: string
  floodZone?: string
  floodPlain?: string
  landValue?: number
  improvementValue?: number
  totalValue?: number
  assessedValue?: number
  taxAmount?: number
  taxYear?: number
  lastSaleDate?: string
  lastSalePrice?: number
  schoolDistrict?: string
  fireDistrict?: string
  waterDistrict?: string
  rawRegridData?: any  // Store the complete raw Regrid API response
}

export async function searchRegridParcel(address: string): Promise<ParcelData | null> {
  console.log('🚀 searchRegridParcel called with address:', address)
  console.log('🔑 REGRID_API_TOKEN exists:', !!REGRID_API_TOKEN)
  
  try {
    if (!REGRID_API_TOKEN) {
      console.error('❌ REGRID_API_TOKEN not found in environment')
      return null
    }

    const searchUrl = `https://app.regrid.com/api/v1/search.json?query=${encodeURIComponent(address)}&token=${REGRID_API_TOKEN}`
    
    console.log('🔍 Searching Regrid for:', address)
    
    const searchResponse = await fetch(searchUrl)
    
    console.log('📡 Response status:', searchResponse.status)
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.error('❌ Regrid search error:', errorText)
      throw new Error(`Regrid search failed: ${searchResponse.statusText}`)
    }
    
    const searchResults = await searchResponse.json()
    console.log('📋 Results count:', searchResults.results?.length || 0)
    
    if (!searchResults.results || searchResults.results.length === 0) {
      console.log('⚠️ No results found in Regrid')
      return null
    }
    
    const result = searchResults.results[0]
    
    // Data is in result.properties.fields
    const props = result.properties?.fields || {}
    const headline = result.properties?.headline || ''
    
    console.log('✅ Regrid data extracted:', {
      apn: props.parcelnumb,
      sqft: props.sqft,
      gisacre: props.gisacre,
      recrdareano: props.recrdareano,
      subdivision: props.subdivision,
      zoning: props.zoning,
      city: props.city || props.scity,
      mcrweblink: props.mcrweblink
    })
    
    let boundaryCoordinates: number[][] = []
    let boundaryRings: number[][][]= []
    
    if (result.geometry?.coordinates) {
      boundaryRings = result.geometry.coordinates
      if (boundaryRings.length > 0 && boundaryRings[0].length > 0) {
        boundaryCoordinates = boundaryRings[0]
      }
    }
    
    const parcelData = {
      apn: props.parcelnumb || 'UNKNOWN',
      address: props.address || headline || address,
      city: props.city || props.scity || '',
      state: props.state2 || props.sstate || 'AZ',
      zip: props.szip5 || props.szip || '',
      county: props.county || props.scounty || '',
      owner: props.owner || '',
      ownerAddress: props.mailadd || props.mail_address1 || '',
      ownerCity: props.mail_city || '',
      ownerState: props.mail_state2 || '',
      ownerZip: props.mail_zip || '',
      subdivision: props.subdivision || null,
      lotSizeSqFt: props.sqft || (props.gisacre ? Math.round(props.gisacre * 43560) : 0),
      acres: props.gisacre || props.ll_gisacre || 0,
      frontage: props.frontage || null,
      depth: props.depth || null,
      latitude: parseFloat(props.lat) || 0,
      longitude: parseFloat(props.lon) || 0,
      boundaryCoordinates,
      boundaryRings,
      zoning: props.zoning || null,
      zoningCode: props.zoning || null,
      zoningDescription: props.zoning_description || null,
      landUseCode: props.landuse || props.usecode || null,
      usedesc: props.usedesc || null,
      yearBuilt: props.yearbuilt || null,
      buildingSqFt: props.recrdareano || props.improvarea || null,
      bedrooms: props.bedrooms || null,
      bathrooms: props.bathfixtures || props.bathrooms || null,
      stories: props.stories || null,
      constructionType: props.construct || null,
      roofType: props.rooftype || null,
      propertyType: props.usedesc || 'Single Family',
      platBook: props.book || null,
      platPage: props.page || null,
      mcrweblink: props.mcrweblink || null,
      censusTract: props.census || props.tract || null,
      floodZone: props.fld_zone || props.flood_zone || null,
      floodPlain: props.fema_flood || null,
      landValue: props.landval || props.assessed_land || null,
      improvementValue: props.improvval || props.assessed_improvement || null,
      totalValue: props.totalval || props.assessed_total || null,
      assessedValue: props.assdtotval || props.marketvalu || null,
      taxAmount: props.taxtot || props.tax_amount || null,
      taxYear: props.taxyear || props.tax_year || null,
      lastSaleDate: props.saledt || props.sale_date || null,
      lastSalePrice: props.price || props.saleprice || null,
      schoolDistrict: props.schooldist || null,
      fireDistrict: props.firedist || null,
      waterDistrict: props.waterdist || null,
      rawRegridData: props,  // Store the COMPLETE raw Regrid API response
    }

    console.log('✅ Returning parcel data with', Object.keys(props).length, 'raw Regrid fields')
    return parcelData
    
  } catch (error) {
    console.error('❌ Regrid API error:', error)
    return null
  }
}

export async function getMaricopaParcelByAddress(address: string): Promise<ParcelData | null> {
  return searchRegridParcel(address)
}

export async function getSubdivisionPlat(apn: string) {
  try {
    if (!REGRID_API_TOKEN) return null
    
    const searchUrl = `https://app.regrid.com/api/v1/search.json?query=${encodeURIComponent(apn)}&token=${REGRID_API_TOKEN}`
    
    const response = await fetch(searchUrl)
    if (!response.ok) return null
    
    const results = await response.json()
    if (!results.results || results.results.length === 0) return null
    
    const result = results.results[0]
    const props = result.properties?.fields || {}
    
    if (!props.subdivision) {
      return null
    }
    
    return {
      subdivision: props.subdivision,
      subdivisionId: null,
      book: props.book || null,
      page: props.page || null,
      platBook: props.book || null,
      platPage: props.page || null,
      mcrweblink: props.mcrweblink || null
    }
    
  } catch (error) {
    console.error('❌ Error fetching subdivision from Regrid:', error)
    return null
  }
}