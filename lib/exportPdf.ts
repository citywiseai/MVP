import jsPDF from 'jspdf';

interface PropertyData {
  address: string;
  lotSize: number;
  zoning: string;
  setbacks: { front: number; rear: number; left: number; right: number };
  shapes: Array<{ name: string; area: number; perimeter?: number; coordinates?: any }>;
  compliance?: { status: string; violations: string[] };
  apn?: string;
  existingSqFt?: number;
  centerLat?: number;
  centerLng?: number;
  boundaryCoordinates?: any;
  setbackCoordinates?: any;
  requirements?: Array<{ name: string; status?: string; description?: string; priority?: string }>;
  coverageStats?: {
    lotSize: number;
    maxAllowed: number;
    maxPercent: number;
    zoning: string;
    existingBuildings: number;
    newStructures: number;
    totalCoverage: number;
    coveragePercent: number;
    remainingSpace: number;
    underLimit: boolean;
  };
}

export async function exportPropertyPdf(
  mapElement: HTMLElement,
  projectName: string,
  propertyData: PropertyData,
  options: { preview?: boolean; mapboxToken?: string } = {}
) {
  try {
    // Create PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Add header with branding
    pdf.setFillColor(30, 58, 95); // #1e3a5f
    pdf.rect(0, 0, pageWidth, 25, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Property Report', pageWidth / 2, 12, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('CityWise AI', pageWidth / 2, 19, { align: 'center' });

    // Reset text color for body
    pdf.setTextColor(0, 0, 0);

    // Project Information Section
    let yPos = 35;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Project Information', 15, yPos);

    yPos += 8;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Project Name: ${projectName}`, 15, yPos);

    yPos += 6;
    pdf.text(`Address: ${propertyData.address}`, 15, yPos);

    yPos += 6;
    pdf.text(`Lot Size: ${propertyData.lotSize.toLocaleString()} sq ft`, 15, yPos);

    if (propertyData.existingSqFt) {
      yPos += 6;
      pdf.text(`Existing Building: ${propertyData.existingSqFt.toLocaleString()} sq ft`, 15, yPos);
    }

    yPos += 6;
    pdf.text(`Zoning: ${propertyData.zoning}`, 15, yPos);

    if (propertyData.apn) {
      yPos += 6;
      pdf.text(`APN: ${propertyData.apn}`, 15, yPos);
    }

    // Property Map Section
    yPos += 12;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Property Map', 15, yPos);

    yPos += 5;

    // Use Mapbox Static Images API instead of html2canvas to avoid CORS issues
    console.log('📸 Fetching map from Mapbox Static API...');

    // Get Mapbox token - use passed token first, then fall back to env
    const mapboxToken = options.mapboxToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    console.log('📍 Map data:', {
      hasLat: !!propertyData.centerLat,
      hasLng: !!propertyData.centerLng,
      hasToken: !!mapboxToken,
      lat: propertyData.centerLat,
      lng: propertyData.centerLng,
      tokenLength: mapboxToken?.length
    });

    if (propertyData.centerLat && propertyData.centerLng && mapboxToken) {
      try {
        // Simple satellite image without overlays (for now)
        // TODO: Add property boundary and shapes using encoded polylines
        // Requires: npm install @mapbox/polyline
        // Example: const encoded = polyline.encode(coords.map(([lng, lat]) => [lat, lng]))
        // Then: path-2+3b82f6-0.3(${encodeURIComponent(encoded)})

        // Mapbox Static Images API URL
        // Format: /styles/v1/{username}/{style_id}/static/{lon},{lat},{zoom},{bearing}/{width}x{height}{@2x}
        const baseUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/`;
        const position = `${propertyData.centerLng},${propertyData.centerLat},18,0`;
        const size = '600x400@2x';
        const staticMapUrl = `${baseUrl}${position}/${size}?access_token=${mapboxToken}`;

        console.log('🗺️ Mapbox Static URL:', staticMapUrl.replace(mapboxToken, 'TOKEN_HIDDEN'));

        // Fetch the static map image
        console.log('📥 Fetching map image...');
        const response = await fetch(staticMapUrl);

        console.log('📥 Map response status:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Mapbox API error:', response.status, errorText);
          throw new Error(`Mapbox API error: ${response.status} - ${errorText}`);
        }

        const blob = await response.blob();
        console.log('📥 Map blob size:', blob.size, 'bytes, type:', blob.type);

        const mapImage = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        const imgWidth = 180;
        const imgHeight = 120; // Fixed aspect ratio

        // Check if we need a new page
        if (yPos + imgHeight > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
        }

        const mapX = 15;
        const mapY = yPos;

        pdf.addImage(mapImage, 'PNG', mapX, mapY, imgWidth, imgHeight);
        console.log('✅ Map image added to PDF at position', mapX, mapY, 'size', imgWidth, 'x', imgHeight);

        // Draw overlays on top of the map
        console.log('🎨 Starting overlay drawing...');
        console.log('🎨 Property boundary coords:', propertyData.boundaryCoordinates?.length || 0, 'points');
        console.log('🎨 Shapes to draw:', propertyData.shapes?.length || 0);

        // Debug: check what we actually received
        if (propertyData.boundaryCoordinates) {
          console.log('🎨 Boundary data type:', typeof propertyData.boundaryCoordinates);
          console.log('🎨 Boundary is array?:', Array.isArray(propertyData.boundaryCoordinates));
          console.log('🎨 First boundary point:', propertyData.boundaryCoordinates[0]);
        }
        if (propertyData.shapes && propertyData.shapes.length > 0) {
          console.log('🎨 First shape:', propertyData.shapes[0]);
          console.log('🎨 First shape coords:', propertyData.shapes[0].coordinates);
        }

        // Helper function to convert lat/lng to PDF coordinates
        const coordsToMapPosition = (
          lng: number,
          lat: number,
          bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number }
        ): { x: number; y: number } => {
          const x = mapX + ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * imgWidth;
          const y = mapY + ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * imgHeight;
          return { x, y };
        };

        // Calculate bounds from property boundary OR shapes
        let bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number } | null = null;

        // Try to get bounds from property boundary first
        if (propertyData.boundaryCoordinates && propertyData.boundaryCoordinates.length > 0) {
          const coords = propertyData.boundaryCoordinates;
          const lngs = coords.map((c: any) => c[0]);
          const lats = coords.map((c: any) => c[1]);
          bounds = {
            minLng: Math.min(...lngs),
            maxLng: Math.max(...lngs),
            minLat: Math.min(...lats),
            maxLat: Math.max(...lats),
          };
          console.log('🎨 Calculated bounds from property boundary');
        }
        // Otherwise, calculate bounds from shapes
        else if (propertyData.shapes && propertyData.shapes.length > 0) {
          const shapesWithCoords = propertyData.shapes.filter(
            (s: any) => s.coordinates && s.coordinates.length > 0
          );

          if (shapesWithCoords.length > 0) {
            console.log('🎨 No boundary - calculating bounds from', shapesWithCoords.length, 'shapes');

            let allLngs: number[] = [];
            let allLats: number[] = [];

            shapesWithCoords.forEach((shape: any) => {
              shape.coordinates.forEach((coord: any) => {
                allLngs.push(coord[0]);
                allLats.push(coord[1]);
              });
            });

            // Add padding around shapes for better visualization
            const padding = 0.0005;
            bounds = {
              minLng: Math.min(...allLngs) - padding,
              maxLng: Math.max(...allLngs) + padding,
              minLat: Math.min(...allLats) - padding,
              maxLat: Math.max(...allLats) + padding,
            };
            console.log('🎨 Calculated bounds from shapes with padding');
          }
        }

        if (bounds) {
          console.log('🎨 Map bounds:', bounds);

          // Draw property boundary if available
          if (propertyData.boundaryCoordinates && propertyData.boundaryCoordinates.length > 0) {
            console.log('🎨 Drawing property boundary overlay');
            pdf.setDrawColor(59, 130, 246); // Blue #3b82f6
            pdf.setLineWidth(0.8);

            const boundaryPdfCoords = propertyData.boundaryCoordinates.map((c: any) =>
              coordsToMapPosition(c[0], c[1], bounds!)
            );

            console.log('🎨 Boundary PDF coords sample:', boundaryPdfCoords.slice(0, 3));

            // Draw boundary as connected lines
            if (boundaryPdfCoords.length > 1) {
              for (let i = 0; i < boundaryPdfCoords.length; i++) {
                const current = boundaryPdfCoords[i];
                const next = boundaryPdfCoords[(i + 1) % boundaryPdfCoords.length];
                pdf.line(current.x, current.y, next.x, next.y);
              }
              console.log('✅ Property boundary drawn');
            }
          }

          // Draw shapes as filled rectangles with labels
          if (propertyData.shapes && propertyData.shapes.length > 0) {
            console.log('🎨 Drawing', propertyData.shapes.length, 'shape overlays');

            propertyData.shapes.forEach((shape, index) => {
              if (shape.coordinates && shape.coordinates.length >= 2) {
                console.log(`🎨 Processing shape ${index}: "${shape.name}" with ${shape.coordinates.length} coords`);

                // Get bounding box of shape
                const shapeLngs = shape.coordinates.map((c: any) => c[0]);
                const shapeLats = shape.coordinates.map((c: any) => c[1]);
                const shapeMinLng = Math.min(...shapeLngs);
                const shapeMaxLng = Math.max(...shapeLngs);
                const shapeMinLat = Math.min(...shapeLats);
                const shapeMaxLat = Math.max(...shapeLats);

                // Convert to PDF coordinates
                const topLeft = coordsToMapPosition(shapeMinLng, shapeMaxLat, bounds!);
                const bottomRight = coordsToMapPosition(shapeMaxLng, shapeMinLat, bounds!);

                const rectWidth = bottomRight.x - topLeft.x;
                const rectHeight = bottomRight.y - topLeft.y;

                console.log(`🎨 Shape ${index} rect: x=${topLeft.x.toFixed(1)}, y=${topLeft.y.toFixed(1)}, w=${rectWidth.toFixed(1)}, h=${rectHeight.toFixed(1)}`);

                // Different colors for different shapes
                const colors = [
                  [248, 113, 113], // Red
                  [251, 191, 36],  // Yellow
                  [52, 211, 153],  // Green
                  [96, 165, 250],  // Blue
                  [167, 139, 250], // Purple
                ];
                const color = colors[index % colors.length];

                // Draw filled rectangle with border
                pdf.setFillColor(color[0], color[1], color[2]);
                pdf.setDrawColor(0, 0, 0); // Black border
                pdf.setLineWidth(0.3);
                pdf.rect(topLeft.x, topLeft.y, rectWidth, rectHeight, 'FD'); // F=fill, D=draw border

                // Add label
                pdf.setFontSize(6);
                pdf.setTextColor(0, 0, 0);
                const labelText = shape.name || `Shape ${index + 1}`;
                pdf.text(labelText, topLeft.x + 1, topLeft.y + 3);

                console.log(`✅ Shape ${index} "${labelText}" drawn`);
              } else {
                console.warn(`⚠️ Shape ${index} has insufficient coordinates:`, shape.coordinates?.length || 0);
              }
            });
          }
        } else {
          console.warn('⚠️ No boundary or shapes with coordinates available for overlay drawing');
        }

        yPos += imgHeight + 10;
      } catch (error) {
        console.error('❌ Failed to fetch Mapbox static image:', error);
        // Add placeholder text if map fails
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        pdf.text('Map unavailable', 15, yPos);
        yPos += 10;
        pdf.setTextColor(0, 0, 0);
      }
    } else {
      // No coordinates or token available
      const reason = !propertyData.centerLat || !propertyData.centerLng
        ? 'Map coordinates not available'
        : 'Mapbox token not available';
      console.warn('⚠️ Cannot generate map:', reason);
      pdf.setFontSize(10);
      pdf.setTextColor(150, 150, 150);
      pdf.text(reason, 15, yPos);
      yPos += 10;
      pdf.setTextColor(0, 0, 0);
    }

    // Setback Requirements Section
    if (yPos > pageHeight - 60) {
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Setback Requirements', 15, yPos);

    yPos += 8;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');

    const setbackData = [
      ['Front Setback', `${propertyData.setbacks.front} ft`],
      ['Rear Setback', `${propertyData.setbacks.rear} ft`],
      ['Left Side Setback', `${propertyData.setbacks.left} ft`],
      ['Right Side Setback', `${propertyData.setbacks.right} ft`],
    ];

    setbackData.forEach(([label, value]) => {
      pdf.text(`${label}:`, 20, yPos);
      pdf.setFont('helvetica', 'bold');
      pdf.text(value, 70, yPos);
      pdf.setFont('helvetica', 'normal');
      yPos += 6;
    });

    // Coverage Statistics Section
    if (propertyData.coverageStats) {
      yPos += 6;

      if (yPos > pageHeight - 80) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Coverage Statistics', 15, yPos);

      yPos += 8;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');

      const stats = propertyData.coverageStats;
      const coverageData = [
        ['Lot Size', `${stats.lotSize.toLocaleString()} sq ft`],
        ['Max Allowed Coverage', `${stats.maxAllowed.toLocaleString()} sq ft (${stats.maxPercent}% max - ${stats.zoning})`],
        ['Existing Buildings', `${stats.existingBuildings.toLocaleString()} sq ft`],
        ['New Structures', `${stats.newStructures.toLocaleString()} sq ft`],
        ['Total Coverage', `${stats.totalCoverage.toLocaleString()} sq ft (${stats.coveragePercent}% of lot)`],
        ['Remaining Space', `${stats.remainingSpace.toLocaleString()} sq ft ${stats.underLimit ? '✓ Under limit' : '⚠ Over limit'}`],
      ];

      coverageData.forEach(([label, value]) => {
        pdf.text(`${label}:`, 20, yPos);

        // Color code the last line (remaining space)
        if (label === 'Remaining Space') {
          pdf.setFont('helvetica', 'bold');
          if (stats.underLimit) {
            pdf.setTextColor(34, 197, 94); // Green
          } else {
            pdf.setTextColor(239, 68, 68); // Red
          }
          pdf.text(value, 90, yPos);
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'normal');
        } else {
          pdf.setFont('helvetica', 'bold');
          pdf.text(value, 90, yPos);
          pdf.setFont('helvetica', 'normal');
        }

        yPos += 6;
      });
    }

    // Structures Section
    if (propertyData.shapes && propertyData.shapes.length > 0) {
      yPos += 6;

      if (yPos > pageHeight - 60) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Structures', 15, yPos);

      yPos += 8;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');

      let totalArea = 0;
      propertyData.shapes.forEach(shape => {
        if (yPos > pageHeight - 15) {
          pdf.addPage();
          yPos = 20;
        }

        pdf.text(`• ${shape.name}`, 20, yPos);
        pdf.text(`${shape.area.toLocaleString()} sq ft`, 120, yPos);

        if (shape.perimeter) {
          pdf.setFontSize(9);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`(${shape.perimeter.toFixed(1)} ft perimeter)`, 155, yPos);
          pdf.setFontSize(11);
          pdf.setTextColor(0, 0, 0);
        }

        yPos += 6;
        totalArea += shape.area;
      });

      yPos += 3;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Total Building Area:', 20, yPos);
      pdf.text(`${totalArea.toLocaleString()} sq ft`, 120, yPos);
      pdf.setFont('helvetica', 'normal');

      // Calculate lot coverage
      const lotCoverage = ((totalArea / propertyData.lotSize) * 100).toFixed(1);
      yPos += 6;
      pdf.text('Lot Coverage:', 20, yPos);
      pdf.text(`${lotCoverage}%`, 120, yPos);
    }

    // Permit Requirements Section
    if (propertyData.requirements && propertyData.requirements.length > 0) {
      yPos += 10;

      if (yPos > pageHeight - 60) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Permit Requirements', 15, yPos);

      yPos += 8;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');

      propertyData.requirements.forEach(requirement => {
        if (yPos > pageHeight - 15) {
          pdf.addPage();
          yPos = 20;
        }

        // Requirement name with status on same line
        pdf.setFont('helvetica', 'bold');
        const requirementText = requirement.status
          ? `• ${requirement.name} - ${requirement.status}`
          : `• ${requirement.name}`;
        pdf.text(requirementText, 20, yPos);
        pdf.setFont('helvetica', 'normal');

        yPos += 6;

        // Description (if available)
        if (requirement.description) {
          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          const descriptionLines = pdf.splitTextToSize(requirement.description, 170);
          descriptionLines.forEach((line: string) => {
            if (yPos > pageHeight - 15) {
              pdf.addPage();
              yPos = 20;
            }
            pdf.text(line, 25, yPos);
            yPos += 5;
          });
          pdf.setFontSize(11);
          pdf.setTextColor(0, 0, 0);
          yPos += 2;
        }
      });
    }

    // Compliance Section
    if (propertyData.compliance) {
      yPos += 10;

      if (yPos > pageHeight - 40) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Compliance Status', 15, yPos);

      yPos += 8;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');

      // Status with color coding
      const statusColor = propertyData.compliance.status === 'Compliant'
        ? [34, 197, 94]  // Green
        : [239, 68, 68]; // Red

      pdf.setTextColor(...statusColor);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Status: ${propertyData.compliance.status}`, 20, yPos);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');

      if (propertyData.compliance.violations && propertyData.compliance.violations.length > 0) {
        yPos += 8;
        pdf.text('Violations:', 20, yPos);
        yPos += 6;

        propertyData.compliance.violations.forEach(violation => {
          if (yPos > pageHeight - 15) {
            pdf.addPage();
            yPos = 20;
          }
          pdf.setTextColor(239, 68, 68);
          pdf.text(`• ${violation}`, 25, yPos);
          pdf.setTextColor(0, 0, 0);
          yPos += 6;
        });
      }
    }

    // Footer
    const footerY = pageHeight - 10;
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );

    // Save or return blob based on options
    const fileName = `${projectName.replace(/\s+/g, '_')}_property_report.pdf`;

    if (options.preview) {
      // Return blob URL for preview
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      console.log('✅ PDF blob created for preview');
      return { success: true, fileName, blobUrl, pdf };
    } else {
      // Auto-download
      pdf.save(fileName);
      console.log('✅ PDF exported successfully:', fileName);
      return { success: true, fileName };
    }

  } catch (error) {
    console.error('❌ Error exporting PDF:', error);
    throw error;
  }
}
