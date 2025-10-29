// Regrid API Integration - Using v1 Search API Only
const REGRID_API_TOKEN = process.env.REGRID_API_TOKEN

interface ParcelData {
  apn: string
  address: string
  city: string
  zip: string
  owner: string
  subdivision?: string
  lotSizeSqFt: number
  acres: number
  latitude: number
  longitude: number
  boundaryCoordinates: number[][]
  boundaryRings: number[][][]
  zoning?: string
  yearBuilt?: number
  buildingSqFt?: number
  bedrooms?: number
  bathrooms?: number
  propertyType?: string
  platBook?: string
  platPage?: string
  mcrweblink?: string
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
      zip: props.szip5 || props.szip || '',
      owner: props.owner || '',
      subdivision: props.subdivision || null,
      lotSizeSqFt: props.sqft || (props.gisacre ? Math.round(props.gisacre * 43560) : 0),
      acres: props.gisacre || props.ll_gisacre || 0,
      latitude: parseFloat(props.lat) || 0,
      longitude: parseFloat(props.lon) || 0,
      boundaryCoordinates,
      boundaryRings,
      zoning: props.zoning || null,
      yearBuilt: props.yearbuilt || null,
      buildingSqFt: props.recrdareano || null,
      bedrooms: props.bedrooms || null,
      bathrooms: props.bathfixtures || null,
      propertyType: props.usedesc || 'Single Family',
  platBook: props.book || null,
  platPage: props.page || null,
  mcrweblink: props.mcrweblink || null
    }
    
    console.log('✅ Returning parcel data:', parcelData)
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