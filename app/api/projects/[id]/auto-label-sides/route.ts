import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as turf from '@turf/turf';

interface EdgeLabel {
  edgeIndex: number;
  side: 'front' | 'rear' | 'left' | 'right';
}

interface EdgeAnalysis {
  edgeIndex: number;
  midpoint: [number, number];
  bearing: number; // bearing of the edge line itself
  distanceToStreet: number;
  length: number;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const forceRecalculate = body.forceRecalculate === true;
    
    // Get project with parcel data
    const project = await prisma.project.findUnique({
      where: { id },
      include: { parcel: true }
    });

    if (!project || !project.parcel) {
      return NextResponse.json({ error: 'Project or parcel not found' }, { status: 404 });
    }

    const parcel = project.parcel;

    // Check if edge labels already exist (unless force recalculate)
    if (parcel.edgeLabels && !forceRecalculate) {
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

    // Remove duplicate closing point if exists
    if (boundaryCoords.length > 3 && 
        boundaryCoords[0][0] === boundaryCoords[boundaryCoords.length - 1][0] &&
        boundaryCoords[0][1] === boundaryCoords[boundaryCoords.length - 1][1]) {
      boundaryCoords = boundaryCoords.slice(0, -1);
    }

    // Get the geocoded point (address location - typically at the street)
    // This is where Google/Regrid places the pin when geocoding the address
    const streetPoint: [number, number] | null = 
      (parcel.longitude && parcel.latitude) 
        ? [parcel.longitude, parcel.latitude]
        : (project.longitude && project.latitude)
          ? [project.longitude, project.latitude]
          : null;

    // Calculate centroid of the parcel
    const polygon = turf.polygon([boundaryCoords.concat([boundaryCoords[0]])]);
    const centroid = turf.centroid(polygon);
    const centroidCoords = centroid.geometry.coordinates as [number, number];

    // Analyze each edge
    const edgeAnalysis: EdgeAnalysis[] = boundaryCoords.map((coord, index) => {
      const nextIndex = (index + 1) % boundaryCoords.length;
      const nextCoord = boundaryCoords[nextIndex];
      
      // Midpoint of edge
      const midpoint: [number, number] = [
        (coord[0] + nextCoord[0]) / 2,
        (coord[1] + nextCoord[1]) / 2
      ];
      
      // Bearing of the edge line (direction it runs, not faces)
      const edgeBearing = turf.bearing(coord, nextCoord);
      
      // Length of edge
      const length = turf.distance(coord, nextCoord, { units: 'feet' });
      
      // Distance from edge midpoint to street point (if available)
      let distanceToStreet = Infinity;
      if (streetPoint) {
        // Create a line segment for this edge
        const edgeLine = turf.lineString([coord, nextCoord]);
        // Find the closest point on the edge to the street point
        const nearestOnEdge = turf.nearestPointOnLine(edgeLine, streetPoint);
        distanceToStreet = turf.distance(streetPoint, nearestOnEdge, { units: 'feet' });
      }
      
      return {
        edgeIndex: index,
        midpoint,
        bearing: edgeBearing,
        distanceToStreet,
        length
      };
    });

    let edgeLabels: EdgeLabel[];

    if (streetPoint) {
      // METHOD 1: Use street point (geocoded address) to identify front
      console.log('🎯 Using geocoded address point to identify front edge');
      console.log('📍 Street point:', streetPoint);
      console.log('📐 Edge analysis:', edgeAnalysis.map(e => ({
        index: e.edgeIndex,
        distanceToStreet: Math.round(e.distanceToStreet),
        length: Math.round(e.length)
      })));

      // Find the edge closest to the street point - that's the front
      const sortedByDistance = [...edgeAnalysis].sort((a, b) => a.distanceToStreet - b.distanceToStreet);
      const frontEdge = sortedByDistance[0];
      
      // Get bearing from centroid to front edge midpoint (direction the front faces)
      const frontBearing = turf.bearing(centroidCoords, frontEdge.midpoint);
      const normalizedFrontBearing = frontBearing < 0 ? frontBearing + 360 : frontBearing;
      
      console.log('🏠 Front edge:', frontEdge.edgeIndex, 'facing bearing:', normalizedFrontBearing);

      // Label all edges based on their bearing relative to the front
      edgeLabels = edgeAnalysis.map(edge => {
        const bearingFromCentroid = turf.bearing(centroidCoords, edge.midpoint);
        const normalizedBearing = bearingFromCentroid < 0 ? bearingFromCentroid + 360 : bearingFromCentroid;
        
        // Calculate angle difference from front bearing
        let angleDiff = normalizedBearing - normalizedFrontBearing;
        if (angleDiff < 0) angleDiff += 360;
        if (angleDiff > 180) angleDiff = 360 - angleDiff;
        
        // Also check if this edge is close to the street (could be a corner lot with two fronts)
        const isCloseToStreet = edge.distanceToStreet < 50; // within 50 feet
        
        let side: 'front' | 'rear' | 'left' | 'right';
        
        if (edge.edgeIndex === frontEdge.edgeIndex) {
          side = 'front';
        } else if (angleDiff > 135) {
          // Opposite side of front (135-180 degrees away)
          side = 'rear';
        } else {
          // Determine left vs right based on bearing
          const crossProduct = Math.sin((normalizedBearing - normalizedFrontBearing) * Math.PI / 180);
          side = crossProduct > 0 ? 'right' : 'left';
        }
        
        return {
          edgeIndex: edge.edgeIndex,
          side
        };
      });

    } else {
      // METHOD 2: Fallback - use compass directions (north = front for Phoenix grid)
      console.log('⚠️ No geocoded point available, using compass directions');
      
      edgeLabels = edgeAnalysis.map(edge => {
        const bearingFromCentroid = turf.bearing(centroidCoords, edge.midpoint);
        const b = bearingFromCentroid < 0 ? bearingFromCentroid + 360 : bearingFromCentroid;
        
        let side: 'front' | 'rear' | 'left' | 'right';
        
        // Phoenix grid: streets typically run E-W, so front often faces N or S
        if (b >= 315 || b < 45) {
          side = 'front'; // North-facing
        } else if (b >= 135 && b < 225) {
          side = 'rear'; // South-facing
        } else if (b >= 45 && b < 135) {
          side = 'right'; // East-facing
        } else {
          side = 'left'; // West-facing
        }
        
        return { edgeIndex: edge.edgeIndex, side };
      });
    }

    // Log the results
    console.log('🏷️ Final edge labels:', edgeLabels);

    // Save edge labels to parcel
    await prisma.parcel.update({
      where: { id: parcel.id },
      data: {
        edgeLabels: edgeLabels as any
      }
    });

    console.log('💾 Saved edge labels to database');

    return NextResponse.json({ 
      success: true, 
      edgeLabels,
      method: streetPoint ? 'street-detection' : 'compass-fallback',
      streetPoint: streetPoint || null,
      message: streetPoint 
        ? 'Front edge identified based on street position. Adjust if needed.'
        : 'Sides identified by compass direction (no street point available).'
    });

  } catch (error) {
    console.error('Error auto-labeling sides:', error);
    return NextResponse.json({ error: 'Failed to auto-label sides' }, { status: 500 });
  }
}
