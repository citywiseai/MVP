import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';;
import * as turf from '@turf/turf';



interface EdgeLabel {
  edgeIndex: number;
  side: 'front' | 'rear' | 'left' | 'right';
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get project with parcel data
    const project = await prisma.project.findUnique({
      where: { id },
      include: { parcel: true }
    });

    if (!project || !project.parcel) {
      return NextResponse.json({ error: 'Project or parcel not found' }, { status: 404 });
    }

    const parcel = project.parcel;

    // Check if edge labels already exist
    if (parcel.edgeLabels) {
      console.log('✅ Edge labels already exist, returning saved labels');
      return NextResponse.json({
        success: true,
        edgeLabels: parcel.edgeLabels as EdgeLabel[],
        message: 'Loaded saved edge labels',
        fromCache: true
      });
    }

    // Parse boundary coordinates
    let boundaryCoords: number[][];
    if (typeof parcel.boundaryCoordinates === 'string') {
      boundaryCoords = JSON.parse(parcel.boundaryCoordinates);
    } else {
      boundaryCoords = parcel.boundaryCoordinates as number[][];
    }

    // Handle nested GeoJSON format
    if (Array.isArray(boundaryCoords[0]) && Array.isArray(boundaryCoords[0][0])) {
      boundaryCoords = boundaryCoords[0];
    }

    if (!boundaryCoords || boundaryCoords.length < 3) {
      return NextResponse.json({ error: 'Invalid boundary coordinates' }, { status: 400 });
    }

    // Remove duplicate last point if exists
    if (boundaryCoords.length > 3 && 
        boundaryCoords[0][0] === boundaryCoords[boundaryCoords.length - 1][0] &&
        boundaryCoords[0][1] === boundaryCoords[boundaryCoords.length - 1][1]) {
      boundaryCoords = boundaryCoords.slice(0, -1);
    }

    // Calculate centroid of the parcel
    const polygon = turf.polygon([boundaryCoords.concat([boundaryCoords[0]])]);
    const centroid = turf.centroid(polygon);
    const centroidCoords = centroid.geometry.coordinates;

    // For each edge, calculate its bearing from centroid and midpoint
    const edgeAnalysis = boundaryCoords.map((coord, index) => {
      const nextIndex = (index + 1) % boundaryCoords.length;
      const nextCoord = boundaryCoords[nextIndex];
      
      // Midpoint of edge
      const midLng = (coord[0] + nextCoord[0]) / 2;
      const midLat = (coord[1] + nextCoord[1]) / 2;
      
      // Bearing from centroid to midpoint (tells us which direction this edge faces)
      const bearing = turf.bearing(centroidCoords, [midLng, midLat]);
      
      // Normalize bearing to 0-360
      const normalizedBearing = bearing < 0 ? bearing + 360 : bearing;
      
      return {
        edgeIndex: index,
        bearing: normalizedBearing,
        midpoint: [midLng, midLat]
      };
    });

    // Identify sides based on bearing:
    // North (0°/360°): bearing 315-45
    // East (90°): bearing 45-135
    // South (180°): bearing 135-225
    // West (270°): bearing 225-315
    
    const edgeLabels: EdgeLabel[] = edgeAnalysis.map(edge => {
      const b = edge.bearing;
      let side: 'front' | 'rear' | 'left' | 'right';
      
      // Assume front faces north (toward street at bottom of map in typical Phoenix orientation)
      // Bearing from centroid to edge: north=0°, east=90°, south=180°, west=270°
      if (b >= 315 || b < 45) {
        side = 'front';
      } else if (b >= 135 && b < 225) {
        side = 'rear';
      } else if (b >= 45 && b < 135) {
        side = 'right';
      } else {
        side = 'left';
      }
      
      return {
        edgeIndex: edge.edgeIndex,
        side
      };
    });

    // Save edge labels to parcel
    await prisma.parcel.update({
      where: { id: parcel.id },
      data: {
        edgeLabels: edgeLabels as any
      }
    });

    console.log('💾 Saved edge labels to database:', edgeLabels);

    return NextResponse.json({ 
      success: true, 
      edgeLabels,
      message: 'Sides automatically identified. You can manually adjust if needed.'
    });
  } catch (error) {
    console.error('Error auto-labeling sides:', error);
    return NextResponse.json({ error: 'Failed to auto-label sides' }, { status: 500 });
  }
}
