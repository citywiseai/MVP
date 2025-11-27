// lib/municipal-data/index.ts
// Arizona Municipal Zoning Database - Master Index

// East Valley
export * from './phoenix';
export * from './scottsdale';
export * from './tempe';
export * from './mesa';
export * from './chandler';
export * from './gilbert';

// West Valley
export * from './glendale';
export * from './peoria';
export * from './surprise';
export * from './goodyear';
export * from './avondale';
export * from './buckeye';

// Smaller Maricopa
export * from './paradise-valley';
export * from './fountain-hills';
export * from './cave-creek';
export * from './queen-creek';
export * from './litchfield-park';
export * from './el-mirage';
export * from './tolleson';
export * from './youngtown';
export * from './carefree';

// Pinal County Cities
export * from './casa-grande';
export * from './maricopa-city';
export * from './apache-junction';
export * from './florence';
export * from './coolidge';
export * from './eloy';

// Tucson Metro
export * from './tucson';
export * from './oro-valley';
export * from './marana';
export * from './sahuarita';

// Northern AZ
export * from './flagstaff';
export * from './prescott';
export * from './prescott-valley';
export * from './sedona';
export * from './cottonwood';

// Other AZ Cities
export * from './yuma';
export * from './lake-havasu-city';
export * from './kingman';
export * from './bullhead-city';
export * from './sierra-vista';
export * from './show-low';
export * from './payson';

// County (Unincorporated) Fallbacks
export * from './maricopa-county';
export * from './pinal-county';

// Imports for lookup functions
import { phoenixZoning, getZoningByCode as getPhoenixZoning } from './phoenix';
import { scottsdaleZoning, getZoningByCode as getScottsdaleZoning } from './scottsdale';
import { tempeZoning, getZoningByCode as getTempeZoning } from './tempe';
import { mesaZoning, getZoningByCode as getMesaZoning } from './mesa';
import { chandlerZoning, getZoningByCode as getChandlerZoning } from './chandler';
import { gilbertZoning, getZoningByCode as getGilbertZoning } from './gilbert';
import { glendaleZoning, getZoningByCode as getGlendaleZoning } from './glendale';
import { peoriaZoning, getZoningByCode as getPeoriaZoning } from './peoria';
import { surpriseZoning, getZoningByCode as getSurpriseZoning } from './surprise';
import { goodyearZoning, getZoningByCode as getGoodyearZoning } from './goodyear';
import { avondaleZoning, getZoningByCode as getAvondaleZoning } from './avondale';
import { buckeyeZoning, getZoningByCode as getBuckeyeZoning } from './buckeye';
import { paradiseValleyZoning, getZoningByCode as getParadiseValleyZoning } from './paradise-valley';
import { fountainHillsZoning, getZoningByCode as getFountainHillsZoning } from './fountain-hills';
import { caveCreekZoning, getZoningByCode as getCaveCreekZoning } from './cave-creek';
import { queenCreekZoning, getZoningByCode as getQueenCreekZoning } from './queen-creek';
import { litchfieldParkZoning, getZoningByCode as getLitchfieldParkZoning } from './litchfield-park';
import { elMirageZoning, getZoningByCode as getElMirageZoning } from './el-mirage';
import { tollesonZoning, getZoningByCode as getTollesonZoning } from './tolleson';
import { youngtownZoning, getZoningByCode as getYoungtownZoning } from './youngtown';
import { carefreeZoning, getZoningByCode as getCarefreeZoning } from './carefree';
import { casaGrandeZoning, getZoningByCode as getCasaGrandeZoning } from './casa-grande';
import { maricopaCityZoning, getZoningByCode as getMaricopaCityZoning } from './maricopa-city';
import { apacheJunctionZoning, getZoningByCode as getApacheJunctionZoning } from './apache-junction';
import { florenceZoning, getZoningByCode as getFlorenceZoning } from './florence';
import { coolidgeZoning, getZoningByCode as getCoolidgeZoning } from './coolidge';
import { eloyZoning, getZoningByCode as getEloyZoning } from './eloy';
import { tucsonZoning, getZoningByCode as getTucsonZoning } from './tucson';
import { oroValleyZoning, getZoningByCode as getOroValleyZoning } from './oro-valley';
import { maranaZoning, getZoningByCode as getMaranaZoning } from './marana';
import { sahuaritaZoning, getZoningByCode as getSahuaritaZoning } from './sahuarita';
import { flagstaffZoning, getZoningByCode as getFlagstaffZoning } from './flagstaff';
import { prescottZoning, getZoningByCode as getPrescottZoning } from './prescott';
import { prescottValleyZoning, getZoningByCode as getPrescottValleyZoning } from './prescott-valley';
import { sedonaZoning, getZoningByCode as getSedonaZoning } from './sedona';
import { cottonwoodZoning, getZoningByCode as getCottonwoodZoning } from './cottonwood';
import { yumaZoning, getZoningByCode as getYumaZoning } from './yuma';
import { lakeHavasuCityZoning, getZoningByCode as getLakeHavasuCityZoning } from './lake-havasu-city';
import { kingmanZoning, getZoningByCode as getKingmanZoning } from './kingman';
import { bullheadCityZoning, getZoningByCode as getBullheadCityZoning } from './bullhead-city';
import { sierraVistaZoning, getZoningByCode as getSierraVistaZoning } from './sierra-vista';
import { showLowZoning, getZoningByCode as getShowLowZoning } from './show-low';
import { paysonZoning, getZoningByCode as getPaysonZoning } from './payson';
import { maricopaCountyZoning, getZoningByCode as getMaricopaCountyZoning } from './maricopa-county';
import { pinalCountyZoning, getZoningByCode as getPinalCountyZoning } from './pinal-county';
import type { ZoningDistrict } from './phoenix';

// City jurisdictions
export type CityJurisdiction =
  // East Valley
  | 'phoenix' | 'scottsdale' | 'tempe' | 'mesa' | 'chandler' | 'gilbert'
  // West Valley
  | 'glendale' | 'peoria' | 'surprise' | 'goodyear' | 'avondale' | 'buckeye'
  // Smaller Maricopa
  | 'paradise valley' | 'fountain hills' | 'cave creek' | 'queen creek'
  | 'litchfield park' | 'el mirage' | 'tolleson' | 'youngtown' | 'carefree'
  // Pinal County Cities
  | 'casa grande' | 'maricopa' | 'apache junction' | 'florence' | 'coolidge' | 'eloy'
  // Tucson Metro
  | 'tucson' | 'oro valley' | 'marana' | 'sahuarita'
  // Northern AZ
  | 'flagstaff' | 'prescott' | 'prescott valley' | 'sedona' | 'cottonwood'
  // Other AZ
  | 'yuma' | 'lake havasu city' | 'kingman' | 'bullhead city' | 'sierra vista' | 'show low' | 'payson';

// County jurisdictions (unincorporated)
export type CountyJurisdiction = 'maricopa county' | 'pinal county';

// Combined jurisdiction type
export type Jurisdiction = CityJurisdiction | CountyJurisdiction;

// Jurisdiction result with type info
export interface JurisdictionResult {
  type: 'city' | 'county';
  jurisdiction: Jurisdiction;
  displayName: string;
}

export const supportedCities: CityJurisdiction[] = [
  // East Valley
  'phoenix', 'scottsdale', 'tempe', 'mesa', 'chandler', 'gilbert',
  // West Valley
  'glendale', 'peoria', 'surprise', 'goodyear', 'avondale', 'buckeye',
  // Smaller Maricopa
  'paradise valley', 'fountain hills', 'cave creek', 'queen creek',
  'litchfield park', 'el mirage', 'tolleson', 'youngtown', 'carefree',
  // Pinal County Cities
  'casa grande', 'maricopa', 'apache junction', 'florence', 'coolidge', 'eloy',
  // Tucson Metro
  'tucson', 'oro valley', 'marana', 'sahuarita',
  // Northern AZ
  'flagstaff', 'prescott', 'prescott valley', 'sedona', 'cottonwood',
  // Other AZ
  'yuma', 'lake havasu city', 'kingman', 'bullhead city', 'sierra vista', 'show low', 'payson'
];

export const supportedCounties: CountyJurisdiction[] = [
  'maricopa county', 'pinal county'
];

export const supportedJurisdictions: Jurisdiction[] = [...supportedCities, ...supportedCounties];

// Known unincorporated areas mapped to their county
const unincorporatedAreas: Record<string, CountyJurisdiction> = {
  // Maricopa County unincorporated
  'anthem': 'maricopa county',
  'new river': 'maricopa county',
  'desert hills': 'maricopa county',
  'rio verde': 'maricopa county',
  'sun lakes': 'maricopa county',
  'gold canyon': 'maricopa county', // Actually straddles Maricopa/Pinal
  'wittmann': 'maricopa county',
  'morristown': 'maricopa county',
  'aguila': 'maricopa county',
  'tonopah': 'maricopa county',

  // Pinal County unincorporated
  'san tan valley': 'pinal county',
  'oracle': 'pinal county',
  'saddlebrooke': 'pinal county',
  'arizona city': 'pinal county',
  'picacho': 'pinal county',
  'red rock': 'pinal county',
  'mammoth': 'pinal county',
  'kearny': 'pinal county',
  'superior': 'pinal county', // Technically a town but very small
};

// County mappings for fallback
const countyMappings: Record<string, CountyJurisdiction> = {
  'maricopa': 'maricopa county',
  'maricopa county': 'maricopa county',
  'pinal': 'pinal county',
  'pinal county': 'pinal county',
};

export function getZoningByJurisdiction(
  jurisdiction: Jurisdiction | string,
  zoningCode: string
): ZoningDistrict | null {
  const normalizedJurisdiction = jurisdiction.toLowerCase().trim();

  switch (normalizedJurisdiction) {
    // East Valley
    case 'phoenix': return getPhoenixZoning(zoningCode);
    case 'scottsdale': return getScottsdaleZoning(zoningCode);
    case 'tempe': return getTempeZoning(zoningCode);
    case 'mesa': return getMesaZoning(zoningCode);
    case 'chandler': return getChandlerZoning(zoningCode);
    case 'gilbert': return getGilbertZoning(zoningCode);
    // West Valley
    case 'glendale': return getGlendaleZoning(zoningCode);
    case 'peoria': return getPeoriaZoning(zoningCode);
    case 'surprise': return getSurpriseZoning(zoningCode);
    case 'goodyear': return getGoodyearZoning(zoningCode);
    case 'avondale': return getAvondaleZoning(zoningCode);
    case 'buckeye': return getBuckeyeZoning(zoningCode);
    // Smaller Maricopa
    case 'paradise valley': return getParadiseValleyZoning(zoningCode);
    case 'fountain hills': return getFountainHillsZoning(zoningCode);
    case 'cave creek': return getCaveCreekZoning(zoningCode);
    case 'queen creek': return getQueenCreekZoning(zoningCode);
    case 'litchfield park': return getLitchfieldParkZoning(zoningCode);
    case 'el mirage': return getElMirageZoning(zoningCode);
    case 'tolleson': return getTollesonZoning(zoningCode);
    case 'youngtown': return getYoungtownZoning(zoningCode);
    case 'carefree': return getCarefreeZoning(zoningCode);
    // Pinal County Cities
    case 'casa grande': return getCasaGrandeZoning(zoningCode);
    case 'maricopa': return getMaricopaCityZoning(zoningCode);
    case 'apache junction': return getApacheJunctionZoning(zoningCode);
    case 'florence': return getFlorenceZoning(zoningCode);
    case 'coolidge': return getCoolidgeZoning(zoningCode);
    case 'eloy': return getEloyZoning(zoningCode);
    // Tucson Metro
    case 'tucson': return getTucsonZoning(zoningCode);
    case 'oro valley': return getOroValleyZoning(zoningCode);
    case 'marana': return getMaranaZoning(zoningCode);
    case 'sahuarita': return getSahuaritaZoning(zoningCode);
    // Northern AZ
    case 'flagstaff': return getFlagstaffZoning(zoningCode);
    case 'prescott': return getPrescottZoning(zoningCode);
    case 'prescott valley': return getPrescottValleyZoning(zoningCode);
    case 'sedona': return getSedonaZoning(zoningCode);
    case 'cottonwood': return getCottonwoodZoning(zoningCode);
    // Other AZ
    case 'yuma': return getYumaZoning(zoningCode);
    case 'lake havasu city': return getLakeHavasuCityZoning(zoningCode);
    case 'kingman': return getKingmanZoning(zoningCode);
    case 'bullhead city': return getBullheadCityZoning(zoningCode);
    case 'sierra vista': return getSierraVistaZoning(zoningCode);
    case 'show low': return getShowLowZoning(zoningCode);
    case 'payson': return getPaysonZoning(zoningCode);
    // County (Unincorporated)
    case 'maricopa county': return getMaricopaCountyZoning(zoningCode);
    case 'pinal county': return getPinalCountyZoning(zoningCode);
    default:
      console.warn(`Unknown jurisdiction: ${jurisdiction}, defaulting to Phoenix`);
      return getPhoenixZoning(zoningCode);
  }
}

export function getAllZoningForJurisdiction(jurisdiction: Jurisdiction): Record<string, ZoningDistrict> {
  switch (jurisdiction) {
    // East Valley
    case 'phoenix': return phoenixZoning;
    case 'scottsdale': return scottsdaleZoning;
    case 'tempe': return tempeZoning;
    case 'mesa': return mesaZoning;
    case 'chandler': return chandlerZoning;
    case 'gilbert': return gilbertZoning;
    // West Valley
    case 'glendale': return glendaleZoning;
    case 'peoria': return peoriaZoning;
    case 'surprise': return surpriseZoning;
    case 'goodyear': return goodyearZoning;
    case 'avondale': return avondaleZoning;
    case 'buckeye': return buckeyeZoning;
    // Smaller Maricopa
    case 'paradise valley': return paradiseValleyZoning;
    case 'fountain hills': return fountainHillsZoning;
    case 'cave creek': return caveCreekZoning;
    case 'queen creek': return queenCreekZoning;
    case 'litchfield park': return litchfieldParkZoning;
    case 'el mirage': return elMirageZoning;
    case 'tolleson': return tollesonZoning;
    case 'youngtown': return youngtownZoning;
    case 'carefree': return carefreeZoning;
    // Pinal County Cities
    case 'casa grande': return casaGrandeZoning;
    case 'maricopa': return maricopaCityZoning;
    case 'apache junction': return apacheJunctionZoning;
    case 'florence': return florenceZoning;
    case 'coolidge': return coolidgeZoning;
    case 'eloy': return eloyZoning;
    // Tucson Metro
    case 'tucson': return tucsonZoning;
    case 'oro valley': return oroValleyZoning;
    case 'marana': return maranaZoning;
    case 'sahuarita': return sahuaritaZoning;
    // Northern AZ
    case 'flagstaff': return flagstaffZoning;
    case 'prescott': return prescottZoning;
    case 'prescott valley': return prescottValleyZoning;
    case 'sedona': return sedonaZoning;
    case 'cottonwood': return cottonwoodZoning;
    // Other AZ
    case 'yuma': return yumaZoning;
    case 'lake havasu city': return lakeHavasuCityZoning;
    case 'kingman': return kingmanZoning;
    case 'bullhead city': return bullheadCityZoning;
    case 'sierra vista': return sierraVistaZoning;
    case 'show low': return showLowZoning;
    case 'payson': return paysonZoning;
    // County (Unincorporated)
    case 'maricopa county': return maricopaCountyZoning;
    case 'pinal county': return pinalCountyZoning;
    default: return phoenixZoning;
  }
}

/**
 * Detect jurisdiction from city name, with county fallback
 * @param city - City name from address or Regrid data
 * @param county - Optional county name for fallback
 * @returns JurisdictionResult with type and jurisdiction
 */
export function detectJurisdictionWithFallback(
  city: string,
  county?: string
): JurisdictionResult {
  const normalizedCity = city.toLowerCase().trim();
  const normalizedCounty = county?.toLowerCase().trim();

  // City mappings (direct matches)
  const cityMappings: Record<string, CityJurisdiction> = {
    'phoenix': 'phoenix',
    'scottsdale': 'scottsdale',
    'tempe': 'tempe',
    'mesa': 'mesa',
    'chandler': 'chandler',
    'gilbert': 'gilbert',
    'glendale': 'glendale',
    'peoria': 'peoria',
    'surprise': 'surprise',
    'goodyear': 'goodyear',
    'avondale': 'avondale',
    'buckeye': 'buckeye',
    'paradise valley': 'paradise valley',
    'fountain hills': 'fountain hills',
    'cave creek': 'cave creek',
    'queen creek': 'queen creek',
    'litchfield park': 'litchfield park',
    'el mirage': 'el mirage',
    'tolleson': 'tolleson',
    'youngtown': 'youngtown',
    'carefree': 'carefree',
    'casa grande': 'casa grande',
    'maricopa': 'maricopa',
    'apache junction': 'apache junction',
    'florence': 'florence',
    'coolidge': 'coolidge',
    'eloy': 'eloy',
    'tucson': 'tucson',
    'oro valley': 'oro valley',
    'marana': 'marana',
    'sahuarita': 'sahuarita',
    'flagstaff': 'flagstaff',
    'prescott': 'prescott',
    'prescott valley': 'prescott valley',
    'sedona': 'sedona',
    'cottonwood': 'cottonwood',
    'yuma': 'yuma',
    'lake havasu city': 'lake havasu city',
    'kingman': 'kingman',
    'bullhead city': 'bullhead city',
    'sierra vista': 'sierra vista',
    'show low': 'show low',
    'payson': 'payson',
  };

  // Check direct city match
  if (cityMappings[normalizedCity]) {
    const jurisdiction = cityMappings[normalizedCity];
    return {
      type: 'city',
      jurisdiction,
      displayName: jurisdiction.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    };
  }

  // Check partial city matches
  for (const [cityName, jurisdiction] of Object.entries(cityMappings)) {
    if (normalizedCity.includes(cityName)) {
      return {
        type: 'city',
        jurisdiction,
        displayName: jurisdiction.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      };
    }
  }

  // Check known unincorporated areas
  if (unincorporatedAreas[normalizedCity]) {
    const county = unincorporatedAreas[normalizedCity];
    return {
      type: 'county',
      jurisdiction: county,
      displayName: `${normalizedCity.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} (${county === 'maricopa county' ? 'Maricopa County' : 'Pinal County'})`
    };
  }

  // Fallback to county if provided
  if (normalizedCounty && countyMappings[normalizedCounty]) {
    return {
      type: 'county',
      jurisdiction: countyMappings[normalizedCounty],
      displayName: countyMappings[normalizedCounty] === 'maricopa county' ? 'Maricopa County (Unincorporated)' : 'Pinal County (Unincorporated)'
    };
  }

  // Default to Phoenix
  return {
    type: 'city',
    jurisdiction: 'phoenix',
    displayName: 'Phoenix (Default)'
  };
}

/**
 * Simple jurisdiction detection (backwards compatible)
 */
export function detectJurisdiction(city: string): Jurisdiction {
  return detectJurisdictionWithFallback(city).jurisdiction;
}

/**
 * Check if a location is in an unincorporated area
 */
export function isUnincorporated(city: string): boolean {
  const normalizedCity = city.toLowerCase().trim();
  return !!unincorporatedAreas[normalizedCity];
}

/**
 * Get the county for an unincorporated area
 */
export function getCountyForUnincorporated(city: string): CountyJurisdiction | null {
  const normalizedCity = city.toLowerCase().trim();
  return unincorporatedAreas[normalizedCity] || null;
}

export function getJurisdictionStats() {
  const cityStats = supportedCities.map(j => ({
    jurisdiction: j,
    districts: Object.keys(getAllZoningForJurisdiction(j)).length,
    type: 'city' as const
  }));

  const countyStats = supportedCounties.map(j => ({
    jurisdiction: j,
    districts: Object.keys(getAllZoningForJurisdiction(j)).length,
    type: 'county' as const
  }));

  const allStats = [...cityStats, ...countyStats];
  const totalDistricts = allStats.reduce((sum, s) => sum + s.districts, 0);

  return {
    cities: supportedCities.length,
    counties: supportedCounties.length,
    totalJurisdictions: supportedJurisdictions.length,
    totalDistricts,
    byJurisdiction: allStats,
    byRegion: {
      eastValley: cityStats.slice(0, 6),
      westValley: cityStats.slice(6, 12),
      smallerMaricopa: cityStats.slice(12, 21),
      pinalCountyCities: cityStats.slice(21, 27),
      tucsonMetro: cityStats.slice(27, 31),
      northernAZ: cityStats.slice(31, 36),
      otherAZ: cityStats.slice(36),
      counties: countyStats
    }
  };
}
