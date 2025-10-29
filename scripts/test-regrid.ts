import 'dotenv/config'
import { getMaricopaParcelByAddress } from '../lib/maricopa-gis'

async function main() {
  console.log('Testing Maricopa County GIS API by address...\n')
  
  try {
    const result = await getMaricopaParcelByAddress('4747 E REDFIELD RD')
    
    if (result) {
      console.log('✅ Parcel found!')
      console.log('APN:', result.apn)
      console.log('Address:', result.address)
      console.log('Owner:', result.owner)
      console.log('Lot Size:', result.lotSizeSqFt, 'sq ft')
      console.log('Coordinates:', result.latitude, result.longitude)
      console.log('Boundary points:', result.boundaryCoordinates.length)
    } else {
      console.log('❌ Parcel not found')
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

main()