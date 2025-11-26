// Shape template system for professional architectural drawings

export interface ShapeTemplate {
  id: string;
  name: string;
  category: 'garages' | 'adus' | 'pools' | 'outdoor' | 'sheds' | 'additions' | 'newbuilds' | 'custom';
  description: string;
  defaultWidth: number;  // feet
  defaultHeight: number; // feet
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  sizeVariants: {
    small: { width: number; height: number };
    medium: { width: number; height: number };
    large: { width: number; height: number };
  };
  getSvg: (width: number, height: number) => string;
}

// ============================================
// SVG HELPER FUNCTIONS
// ============================================

/**
 * Renders a top-down view of a car
 */
function carSvg(x: number, y: number, width: number, height: number, color: string = '#4A5568'): string {
  return `
    <g class="car">
      <!-- Car body -->
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${color}" stroke="#2D3748" stroke-width="1" rx="2"/>
      <!-- Windshield -->
      <rect x="${x + width * 0.15}" y="${y + height * 0.2}" width="${width * 0.7}" height="${height * 0.15}" fill="#CBD5E0" opacity="0.6"/>
      <!-- Rear window -->
      <rect x="${x + width * 0.15}" y="${y + height * 0.65}" width="${width * 0.7}" height="${height * 0.15}" fill="#CBD5E0" opacity="0.6"/>
      <!-- Side mirrors -->
      <circle cx="${x + width * 0.1}" cy="${y + height * 0.5}" r="${width * 0.08}" fill="#2D3748"/>
      <circle cx="${x + width * 0.9}" cy="${y + height * 0.5}" r="${width * 0.08}" fill="#2D3748"/>
    </g>
  `;
}

/**
 * Room outline with optional door
 */
function roomOutline(x: number, y: number, width: number, height: number, label?: string): string {
  return `
    <g class="room">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" stroke="#2D3748" stroke-width="2"/>
      ${label ? `<text x="${x + width / 2}" y="${y + height / 2}" text-anchor="middle" fill="#2D3748" font-size="12" font-weight="500">${label}</text>` : ''}
    </g>
  `;
}

/**
 * Door with swing arc
 */
function doorArc(x: number, y: number, width: number, side: 'left' | 'right' | 'top' | 'bottom' = 'right'): string {
  const doorWidth = width;
  let pathD = '';
  const lineX1 = x, lineY1 = y;
  let lineX2 = x, lineY2 = y;

  switch (side) {
    case 'right':
      pathD = `M ${x} ${y} Q ${x + doorWidth} ${y} ${x + doorWidth} ${y + doorWidth}`;
      lineX2 = x + doorWidth;
      lineY2 = y;
      break;
    case 'left':
      pathD = `M ${x} ${y} Q ${x - doorWidth} ${y} ${x - doorWidth} ${y + doorWidth}`;
      lineX2 = x - doorWidth;
      lineY2 = y;
      break;
    case 'bottom':
      pathD = `M ${x} ${y} Q ${x} ${y + doorWidth} ${x + doorWidth} ${y + doorWidth}`;
      lineX2 = x;
      lineY2 = y + doorWidth;
      break;
  }

  return `
    <g class="door">
      <path d="${pathD}" fill="none" stroke="#718096" stroke-width="1" stroke-dasharray="2,2"/>
      <line x1="${lineX1}" y1="${lineY1}" x2="${lineX2}" y2="${lineY2}" stroke="#2D3748" stroke-width="2"/>
    </g>
  `;
}

/**
 * Bathroom fixtures
 */
function toiletIcon(x: number, y: number, size: number): string {
  return `<rect x="${x}" y="${y}" width="${size}" height="${size * 1.2}" fill="#E2E8F0" stroke="#2D3748" stroke-width="1" rx="2"/>`;
}

function sinkIcon(x: number, y: number, size: number): string {
  return `<circle cx="${x}" cy="${y}" r="${size}" fill="#E2E8F0" stroke="#2D3748" stroke-width="1"/>`;
}

function showerIcon(x: number, y: number, width: number, height: number): string {
  return `
    <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" stroke="#2D3748" stroke-width="1.5"/>
    <line x1="${x}" y1="${y}" x2="${x + width}" y2="${y + height}" stroke="#CBD5E0" stroke-width="0.5" stroke-dasharray="1,1"/>
  `;
}

function bedIcon(x: number, y: number, width: number, height: number): string {
  return `
    <g class="bed">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#E2E8F0" stroke="#2D3748" stroke-width="1.5"/>
      <rect x="${x}" y="${y}" width="${width}" height="${height * 0.2}" fill="#CBD5E0" stroke="#2D3748" stroke-width="1"/>
    </g>
  `;
}

/**
 * Kitchen counter with sink
 */
function kitchenCounter(x: number, y: number, width: number, depth: number): string {
  return `
    <g class="kitchen">
      <rect x="${x}" y="${y}" width="${width}" height="${depth}" fill="#D1D5DB" stroke="#2D3748" stroke-width="1.5"/>
      <circle cx="${x + width * 0.3}" cy="${y + depth / 2}" r="${depth * 0.3}" fill="#E2E8F0" stroke="#2D3748" stroke-width="1"/>
      <rect x="${x + width * 0.6}" y="${y + depth * 0.2}" width="${width * 0.3}" height="${depth * 0.6}" fill="#4B5563" stroke="#2D3748" stroke-width="1"/>
    </g>
  `;
}

/**
 * Living room furniture
 */
function couchIcon(x: number, y: number, width: number, height: number): string {
  return `
    <g class="couch">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#9CA3AF" stroke="#2D3748" stroke-width="1.5"/>
      <rect x="${x}" y="${y}" width="${width * 0.1}" height="${height}" fill="#6B7280"/>
      <rect x="${x + width * 0.9}" y="${y}" width="${width * 0.1}" height="${height}" fill="#6B7280"/>
    </g>
  `;
}

function tableChairs(x: number, y: number, tableSize: number): string {
  const chairSize = tableSize * 0.3;
  return `
    <g class="dining">
      <rect x="${x}" y="${y}" width="${tableSize}" height="${tableSize}" fill="#A0AEC0" stroke="#2D3748" stroke-width="1.5"/>
      <rect x="${x + tableSize / 2 - chairSize / 2}" y="${y - chairSize - 2}" width="${chairSize}" height="${chairSize}" fill="#718096" stroke="#2D3748" stroke-width="1"/>
      <rect x="${x + tableSize / 2 - chairSize / 2}" y="${y + tableSize + 2}" width="${chairSize}" height="${chairSize}" fill="#718096" stroke="#2D3748" stroke-width="1"/>
    </g>
  `;
}

/**
 * Pool water texture
 */
function poolWater(x: number, y: number, width: number, height: number): string {
  return `
    <g class="pool-water">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#60A5FA" opacity="0.6"/>
      <path d="M ${x} ${y + height * 0.3} Q ${x + width * 0.25} ${y + height * 0.25}, ${x + width * 0.5} ${y + height * 0.3} T ${x + width} ${y + height * 0.3}"
            stroke="#3B82F6" stroke-width="1" fill="none" opacity="0.4"/>
      <path d="M ${x} ${y + height * 0.6} Q ${x + width * 0.25} ${y + height * 0.65}, ${x + width * 0.5} ${y + height * 0.6} T ${x + width} ${y + height * 0.6}"
            stroke="#3B82F6" stroke-width="1" fill="none" opacity="0.4"/>
    </g>
  `;
}

// ============================================
// SHAPE TEMPLATES
// ============================================

export const SHAPE_TEMPLATES: ShapeTemplate[] = [
  // ============================================
  // GARAGES
  // ============================================
  {
    id: 'garage-1car',
    name: '1-Car Garage',
    category: 'garages',
    description: 'Single car garage',
    defaultWidth: 12,
    defaultHeight: 20,
    minWidth: 10,
    maxWidth: 14,
    minHeight: 18,
    maxHeight: 24,
    sizeVariants: {
      small: { width: 10, height: 18 },
      medium: { width: 12, height: 20 },
      large: { width: 14, height: 22 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;
      const carWidth = 6 * scale;
      const carHeight = 15 * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#F3F4F6" stroke="#1F2937" stroke-width="3"/>
          ${carSvg((svgWidth - carWidth) / 2, (svgHeight - carHeight) / 2, carWidth, carHeight, '#4A5568')}
          <rect x="10" y="${svgHeight - 10}" width="${svgWidth - 20}" height="8" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-dasharray="4,2"/>
          <text x="${svgWidth / 2}" y="20" text-anchor="middle" fill="#1F2937" font-size="14" font-weight="600">1-CAR GARAGE</text>
          <text x="${svgWidth / 2}" y="${svgHeight - 20}" text-anchor="middle" fill="#6B7280" font-size="12">${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'garage-2car',
    name: '2-Car Garage',
    category: 'garages',
    description: 'Standard 2-car garage with vehicles',
    defaultWidth: 20,
    defaultHeight: 20,
    minWidth: 18,
    maxWidth: 24,
    minHeight: 18,
    maxHeight: 24,
    sizeVariants: {
      small: { width: 18, height: 20 },
      medium: { width: 20, height: 20 },
      large: { width: 24, height: 22 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;
      const carWidth = 6 * scale;
      const carHeight = 15 * scale;
      const spacing = 2 * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#F3F4F6" stroke="#1F2937" stroke-width="3"/>
          ${carSvg(spacing, (svgHeight - carHeight) / 2, carWidth, carHeight, '#4A5568')}
          ${carSvg(svgWidth - carWidth - spacing, (svgHeight - carHeight) / 2, carWidth, carHeight, '#6B7280')}
          <rect x="${spacing / 2}" y="${svgHeight - 10}" width="${svgWidth - spacing}" height="8" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-dasharray="4,2"/>
          <text x="${svgWidth / 2}" y="20" text-anchor="middle" fill="#1F2937" font-size="14" font-weight="600">2-CAR GARAGE</text>
          <text x="${svgWidth / 2}" y="${svgHeight - 20}" text-anchor="middle" fill="#6B7280" font-size="12">${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'garage-3car',
    name: '3-Car Garage',
    category: 'garages',
    description: 'Large 3-car garage',
    defaultWidth: 30,
    defaultHeight: 20,
    minWidth: 28,
    maxWidth: 36,
    minHeight: 18,
    maxHeight: 24,
    sizeVariants: {
      small: { width: 28, height: 20 },
      medium: { width: 30, height: 20 },
      large: { width: 36, height: 22 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;
      const carWidth = 6 * scale;
      const carHeight = 15 * scale;
      const spacing = 1.5 * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#F3F4F6" stroke="#1F2937" stroke-width="3"/>
          ${carSvg(spacing, (svgHeight - carHeight) / 2, carWidth, carHeight, '#4A5568')}
          ${carSvg((svgWidth - carWidth) / 2, (svgHeight - carHeight) / 2, carWidth, carHeight, '#6B7280')}
          ${carSvg(svgWidth - carWidth - spacing, (svgHeight - carHeight) / 2, carWidth, carHeight, '#4A5568')}
          <text x="${svgWidth / 2}" y="20" text-anchor="middle" fill="#1F2937" font-size="14" font-weight="600">3-CAR GARAGE</text>
          <text x="${svgWidth / 2}" y="${svgHeight - 20}" text-anchor="middle" fill="#6B7280" font-size="12">${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'carport',
    name: 'Carport',
    category: 'garages',
    description: 'Open carport with corner posts',
    defaultWidth: 20,
    defaultHeight: 20,
    minWidth: 12,
    maxWidth: 24,
    minHeight: 18,
    maxHeight: 24,
    sizeVariants: {
      small: { width: 12, height: 18 },
      medium: { width: 20, height: 20 },
      large: { width: 24, height: 22 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#E5E7EB" opacity="0.3" stroke="#1F2937" stroke-width="2" stroke-dasharray="8,4"/>
          <circle cx="15" cy="15" r="10" fill="#78350F" stroke="#1F2937" stroke-width="2"/>
          <circle cx="${svgWidth - 15}" cy="15" r="10" fill="#78350F" stroke="#1F2937" stroke-width="2"/>
          <circle cx="15" cy="${svgHeight - 15}" r="10" fill="#78350F" stroke="#1F2937" stroke-width="2"/>
          <circle cx="${svgWidth - 15}" cy="${svgHeight - 15}" r="10" fill="#78350F" stroke="#1F2937" stroke-width="2"/>
          <line x1="15" y1="15" x2="${svgWidth - 15}" y2="15" stroke="#92400E" stroke-width="3"/>
          <line x1="15" y1="${svgHeight - 15}" x2="${svgWidth - 15}" y2="${svgHeight - 15}" stroke="#92400E" stroke-width="3"/>
          <text x="${svgWidth / 2}" y="${svgHeight / 2 - 10}" text-anchor="middle" fill="#1F2937" font-size="14" font-weight="600">CARPORT</text>
          <text x="${svgWidth / 2}" y="${svgHeight / 2 + 15}" text-anchor="middle" fill="#6B7280" font-size="12">${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'rv-pad',
    name: 'RV Pad',
    category: 'garages',
    description: 'RV parking pad',
    defaultWidth: 14,
    defaultHeight: 45,
    minWidth: 12,
    maxWidth: 16,
    minHeight: 35,
    maxHeight: 50,
    sizeVariants: {
      small: { width: 12, height: 35 },
      medium: { width: 14, height: 45 },
      large: { width: 16, height: 50 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#D1D5DB" stroke="#1F2937" stroke-width="3"/>
          <rect x="10" y="30" width="${svgWidth - 20}" height="${svgHeight - 60}" fill="#FFFFFF" stroke="#2D3748" stroke-width="2" rx="4"/>
          <rect x="15" y="${svgHeight * 0.15}" width="${svgWidth - 30}" height="15" fill="#CBD5E0" stroke="#2D3748" stroke-width="1.5"/>
          <circle cx="25" cy="${svgHeight - 20}" r="8" fill="#1F2937" stroke="#2D3748" stroke-width="2"/>
          <circle cx="${svgWidth - 25}" cy="${svgHeight - 20}" r="8" fill="#1F2937" stroke="#2D3748" stroke-width="2"/>
          <text x="${svgWidth / 2}" y="${svgHeight / 2}" text-anchor="middle" fill="#1F2937" font-size="14" font-weight="600">RV PAD</text>
          <text x="${svgWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" fill="#6B7280" font-size="12">${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  // ============================================
  // ADUs
  // ============================================
  {
    id: 'adu-studio',
    name: 'Studio ADU',
    category: 'adus',
    description: 'Compact studio with kitchenette and bath',
    defaultWidth: 20,
    defaultHeight: 16,
    minWidth: 16,
    maxWidth: 24,
    minHeight: 14,
    maxHeight: 20,
    sizeVariants: {
      small: { width: 16, height: 14 },
      medium: { width: 20, height: 16 },
      large: { width: 24, height: 18 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#FFFFFF" stroke="#1F2937" stroke-width="3"/>
          <rect x="${svgWidth * 0.65}" y="0" width="${svgWidth * 0.35}" height="${svgHeight * 0.35}" fill="#F9FAFB" stroke="#2D3748" stroke-width="2"/>
          ${toiletIcon(svgWidth * 0.72, svgHeight * 0.05, 8)}
          ${sinkIcon(svgWidth * 0.85, svgHeight * 0.15, 6)}
          ${showerIcon(svgWidth * 0.7, svgHeight * 0.2, 20, 25)}
          ${kitchenCounter(10, svgHeight * 0.1, svgWidth * 0.25, 20)}
          ${couchIcon(svgWidth * 0.15, svgHeight * 0.5, 40, 20)}
          ${bedIcon(svgWidth * 0.6, svgHeight * 0.65, 50, 30)}
          ${doorArc(svgWidth * 0.5, 0, 15, 'bottom')}
          <text x="${svgWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" fill="#1F2937" font-size="12" font-weight="600">STUDIO ADU • ${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'adu-1br',
    name: '1-Bedroom ADU',
    category: 'adus',
    description: 'One bedroom with separate living area',
    defaultWidth: 24,
    defaultHeight: 20,
    minWidth: 20,
    maxWidth: 30,
    minHeight: 18,
    maxHeight: 24,
    sizeVariants: {
      small: { width: 20, height: 18 },
      medium: { width: 24, height: 20 },
      large: { width: 28, height: 22 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#FFFFFF" stroke="#1F2937" stroke-width="3"/>
          ${roomOutline(svgWidth * 0.5, 0, svgWidth * 0.5, svgHeight * 0.6, 'BEDROOM')}
          ${bedIcon(svgWidth * 0.6, svgHeight * 0.15, 60, 40)}
          <rect x="0" y="0" width="${svgWidth * 0.35}" height="${svgHeight * 0.4}" fill="#F9FAFB" stroke="#2D3748" stroke-width="2"/>
          ${toiletIcon(svgWidth * 0.05, svgHeight * 0.05, 10)}
          ${sinkIcon(svgWidth * 0.2, svgHeight * 0.15, 8)}
          ${showerIcon(svgWidth * 0.05, svgHeight * 0.22, 25, 30)}
          <text x="${svgWidth * 0.175}" y="${svgHeight * 0.35}" text-anchor="middle" fill="#6B7280" font-size="10">BATH</text>
          ${kitchenCounter(10, svgHeight * 0.45, svgWidth * 0.3, 25)}
          ${couchIcon(svgWidth * 0.1, svgHeight * 0.7, 50, 25)}
          ${tableChairs(svgWidth * 0.3, svgHeight * 0.72, 30)}
          <text x="${svgWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" fill="#1F2937" font-size="12" font-weight="600">1BR ADU • ${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'adu-2br',
    name: '2-Bedroom ADU',
    category: 'adus',
    description: 'Two bedrooms with full amenities',
    defaultWidth: 30,
    defaultHeight: 24,
    minWidth: 28,
    maxWidth: 36,
    minHeight: 22,
    maxHeight: 28,
    sizeVariants: {
      small: { width: 28, height: 22 },
      medium: { width: 30, height: 24 },
      large: { width: 36, height: 26 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#FFFFFF" stroke="#1F2937" stroke-width="3"/>
          ${roomOutline(svgWidth * 0.55, 0, svgWidth * 0.45, svgHeight * 0.45, 'BR 1')}
          ${bedIcon(svgWidth * 0.62, svgHeight * 0.1, 55, 35)}
          ${roomOutline(0, 0, svgWidth * 0.4, svgHeight * 0.45, 'BR 2')}
          ${bedIcon(svgWidth * 0.05, svgHeight * 0.1, 50, 35)}
          <rect x="${svgWidth * 0.4}" y="0" width="${svgWidth * 0.15}" height="${svgHeight * 0.3}" fill="#F9FAFB" stroke="#2D3748" stroke-width="2"/>
          ${toiletIcon(svgWidth * 0.42, svgHeight * 0.05, 8)}
          ${sinkIcon(svgWidth * 0.47, svgHeight * 0.18, 6)}
          ${kitchenCounter(10, svgHeight * 0.5, svgWidth * 0.35, 25)}
          <text x="${svgWidth * 0.2}" y="${svgHeight * 0.58}" text-anchor="middle" fill="#6B7280" font-size="10">KITCHEN</text>
          ${couchIcon(svgWidth * 0.15, svgHeight * 0.7, 60, 25)}
          ${tableChairs(svgWidth * 0.5, svgHeight * 0.68, 35)}
          <text x="${svgWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" fill="#1F2937" font-size="12" font-weight="600">2BR ADU • ${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'casita',
    name: 'Casita',
    category: 'adus',
    description: 'Simple guest house',
    defaultWidth: 20,
    defaultHeight: 20,
    minWidth: 16,
    maxWidth: 24,
    minHeight: 16,
    maxHeight: 24,
    sizeVariants: {
      small: { width: 16, height: 16 },
      medium: { width: 20, height: 20 },
      large: { width: 24, height: 24 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#FEFCE8" stroke="#1F2937" stroke-width="3"/>
          ${bedIcon(svgWidth * 0.1, svgHeight * 0.6, 60, 35)}
          <rect x="${svgWidth * 0.7}" y="${svgHeight * 0.1}" width="${svgWidth * 0.25}" height="${svgHeight * 0.35}" fill="#F9FAFB" stroke="#2D3748" stroke-width="2"/>
          ${toiletIcon(svgWidth * 0.75, svgHeight * 0.15, 8)}
          ${sinkIcon(svgWidth * 0.85, svgHeight * 0.25, 6)}
          ${couchIcon(svgWidth * 0.6, svgHeight * 0.15, 35, 20)}
          ${doorArc(svgWidth * 0.5, 0, 15, 'bottom')}
          <text x="${svgWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" fill="#1F2937" font-size="12" font-weight="600">CASITA • ${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  // ============================================
  // POOLS
  // ============================================
  {
    id: 'pool-rectangle',
    name: 'Rectangle Pool',
    category: 'pools',
    description: 'Classic rectangular pool',
    defaultWidth: 16,
    defaultHeight: 32,
    minWidth: 12,
    maxWidth: 20,
    minHeight: 24,
    maxHeight: 40,
    sizeVariants: {
      small: { width: 12, height: 24 },
      medium: { width: 16, height: 32 },
      large: { width: 20, height: 40 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;
      const coping = 8;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#CBD5E0" stroke="#1F2937" stroke-width="3"/>
          ${poolWater(coping, coping, svgWidth - coping * 2, svgHeight - coping * 2)}
          <text x="${coping + 10}" y="${coping + 20}" fill="#1E40AF" font-size="11" font-weight="500">3'</text>
          <text x="${coping + 10}" y="${svgHeight - coping - 10}" fill="#1E40AF" font-size="11" font-weight="500">8'</text>
          <line x1="${svgWidth / 2}" y1="${coping}" x2="${svgWidth / 2}" y2="${svgHeight - coping}" stroke="#2563EB" stroke-width="1" stroke-dasharray="8,4" opacity="0.4"/>
          <text x="${svgWidth / 2}" y="${svgHeight - 15}" text-anchor="middle" fill="#1F2937" font-size="12" font-weight="600">POOL • ${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'pool-kidney',
    name: 'Kidney Pool',
    category: 'pools',
    description: 'Freeform kidney-shaped pool',
    defaultWidth: 18,
    defaultHeight: 28,
    minWidth: 14,
    maxWidth: 24,
    minHeight: 22,
    maxHeight: 36,
    sizeVariants: {
      small: { width: 14, height: 22 },
      medium: { width: 18, height: 28 },
      large: { width: 22, height: 34 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="${svgWidth * 0.5}" cy="${svgHeight * 0.4}" rx="${svgWidth * 0.45}" ry="${svgHeight * 0.35}" fill="#CBD5E0" stroke="#1F2937" stroke-width="3"/>
          <ellipse cx="${svgWidth * 0.5}" cy="${svgHeight * 0.7}" rx="${svgWidth * 0.35}" ry="${svgHeight * 0.25}" fill="#CBD5E0" stroke="#1F2937" stroke-width="3"/>
          <ellipse cx="${svgWidth * 0.5}" cy="${svgHeight * 0.4}" rx="${svgWidth * 0.42}" ry="${svgHeight * 0.32}" fill="#60A5FA" opacity="0.6"/>
          <ellipse cx="${svgWidth * 0.5}" cy="${svgHeight * 0.7}" rx="${svgWidth * 0.32}" ry="${svgHeight * 0.22}" fill="#60A5FA" opacity="0.6"/>
          <path d="M ${svgWidth * 0.2} ${svgHeight * 0.5} Q ${svgWidth * 0.35} ${svgHeight * 0.45}, ${svgWidth * 0.5} ${svgHeight * 0.5}"
                stroke="#3B82F6" stroke-width="1.5" fill="none" opacity="0.4"/>
          <text x="${svgWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" fill="#1F2937" font-size="12" font-weight="600">KIDNEY POOL • ${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'pool-lap',
    name: 'Lap Pool',
    category: 'pools',
    description: 'Narrow lap pool with lanes',
    defaultWidth: 10,
    defaultHeight: 40,
    minWidth: 8,
    maxWidth: 12,
    minHeight: 30,
    maxHeight: 50,
    sizeVariants: {
      small: { width: 8, height: 30 },
      medium: { width: 10, height: 40 },
      large: { width: 12, height: 50 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;
      const coping = 6;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#CBD5E0" stroke="#1F2937" stroke-width="3"/>
          ${poolWater(coping, coping, svgWidth - coping * 2, svgHeight - coping * 2)}
          <line x1="${svgWidth / 2}" y1="${coping}" x2="${svgWidth / 2}" y2="${svgHeight - coping}" stroke="#2563EB" stroke-width="1.5" stroke-dasharray="6,3" opacity="0.5"/>
          <text x="${svgWidth / 2}" y="20" text-anchor="middle" fill="#1E40AF" font-size="10" font-weight="500">4'</text>
          <text x="${svgWidth / 2}" y="${svgHeight / 2}" text-anchor="middle" fill="#1F2937" font-size="12" font-weight="600">LAP</text>
          <text x="${svgWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" fill="#1E40AF" font-size="10" font-weight="500">4'</text>
        </svg>
      `;
    },
  },

  {
    id: 'spa',
    name: 'Spa/Hot Tub',
    category: 'pools',
    description: 'Circular spa with jets',
    defaultWidth: 8,
    defaultHeight: 8,
    minWidth: 6,
    maxWidth: 10,
    minHeight: 6,
    maxHeight: 10,
    sizeVariants: {
      small: { width: 6, height: 6 },
      medium: { width: 8, height: 8 },
      large: { width: 10, height: 10 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;
      const centerX = svgWidth / 2;
      const centerY = svgHeight / 2;
      const radius = Math.min(svgWidth, svgHeight) * 0.45;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="#CBD5E0" stroke="#1F2937" stroke-width="3"/>
          <circle cx="${centerX}" cy="${centerY}" r="${radius - 5}" fill="#60A5FA" opacity="0.7"/>
          ${[0, 90, 180, 270].map(angle => {
            const jetX = centerX + Math.cos((angle * Math.PI) / 180) * (radius - 10);
            const jetY = centerY + Math.sin((angle * Math.PI) / 180) * (radius - 10);
            return `<circle cx="${jetX}" cy="${jetY}" r="3" fill="#FFFFFF" opacity="0.8"/>`;
          }).join('')}
          <text x="${centerX}" y="${centerY}" text-anchor="middle" fill="#1F2937" font-size="12" font-weight="600">SPA</text>
          <text x="${centerX}" y="${centerY + 15}" text-anchor="middle" fill="#6B7280" font-size="10">${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  // ============================================
  // OUTDOOR LIVING
  // ============================================
  {
    id: 'covered-patio',
    name: 'Covered Patio',
    category: 'outdoor',
    description: 'Covered patio with posts',
    defaultWidth: 20,
    defaultHeight: 15,
    minWidth: 12,
    maxWidth: 30,
    minHeight: 10,
    maxHeight: 20,
    sizeVariants: {
      small: { width: 12, height: 10 },
      medium: { width: 20, height: 15 },
      large: { width: 30, height: 20 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#E5E7EB" stroke="#1F2937" stroke-width="3"/>
          ${Array.from({ length: Math.floor(width / 2) }, (_, i) =>
            `<line x1="${i * 20}" y1="0" x2="${i * 20}" y2="${svgHeight}" stroke="#D1D5DB" stroke-width="1"/>`
          ).join('')}
          ${Array.from({ length: Math.floor(height / 2) }, (_, i) =>
            `<line x1="0" y1="${i * 20}" x2="${svgWidth}" y2="${i * 20}" stroke="#D1D5DB" stroke-width="1"/>`
          ).join('')}
          <circle cx="15" cy="15" r="8" fill="#78350F" stroke="#1F2937" stroke-width="2"/>
          <circle cx="${svgWidth - 15}" cy="15" r="8" fill="#78350F" stroke="#1F2937" stroke-width="2"/>
          <circle cx="15" cy="${svgHeight - 15}" r="8" fill="#78350F" stroke="#1F2937" stroke-width="2"/>
          <circle cx="${svgWidth - 15}" cy="${svgHeight - 15}" r="8" fill="#78350F" stroke="#1F2937" stroke-width="2"/>
          ${tableChairs(svgWidth * 0.35, svgHeight * 0.3, 40)}
          <rect x="5" y="5" width="${svgWidth - 10}" height="${svgHeight - 10}" fill="none" stroke="#92400E" stroke-width="2" stroke-dasharray="8,4" opacity="0.6"/>
          <text x="${svgWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" fill="#1F2937" font-size="12" font-weight="600">COVERED PATIO • ${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'arizona-room',
    name: 'Arizona Room',
    category: 'outdoor',
    description: 'Enclosed sunroom',
    defaultWidth: 15,
    defaultHeight: 20,
    minWidth: 12,
    maxWidth: 20,
    minHeight: 15,
    maxHeight: 25,
    sizeVariants: {
      small: { width: 12, height: 15 },
      medium: { width: 15, height: 20 },
      large: { width: 20, height: 25 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#FEF9C3" opacity="0.4" stroke="#1F2937" stroke-width="3"/>
          <rect x="10" y="10" width="${svgWidth - 20}" height="${svgHeight - 20}" fill="none" stroke="#92400E" stroke-width="2"/>
          ${Array.from({ length: 4 }, (_, i) =>
            `<line x1="10" y1="${10 + (i + 1) * ((svgHeight - 20) / 5)}" x2="${svgWidth - 10}" y2="${10 + (i + 1) * ((svgHeight - 20) / 5)}" stroke="#92400E" stroke-width="1" opacity="0.3"/>`
          ).join('')}
          ${couchIcon(svgWidth * 0.15, svgHeight * 0.6, 50, 25)}
          ${tableChairs(svgWidth * 0.5, svgHeight * 0.35, 35)}
          <text x="${svgWidth / 2}" y="${svgHeight - 15}" text-anchor="middle" fill="#1F2937" font-size="12" font-weight="600">ARIZONA ROOM • ${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'outdoor-kitchen',
    name: 'Outdoor Kitchen',
    category: 'outdoor',
    description: 'Outdoor cooking area',
    defaultWidth: 12,
    defaultHeight: 8,
    minWidth: 8,
    maxWidth: 16,
    minHeight: 6,
    maxHeight: 10,
    sizeVariants: {
      small: { width: 8, height: 6 },
      medium: { width: 12, height: 8 },
      large: { width: 16, height: 10 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#E7E5E4" stroke="#1F2937" stroke-width="3"/>
          <rect x="10" y="10" width="${svgWidth * 0.3}" height="${svgHeight - 20}" fill="#292524" stroke="#1F2937" stroke-width="2"/>
          <circle cx="${10 + svgWidth * 0.15}" cy="${svgHeight / 2}" r="12" fill="#EF4444" opacity="0.4"/>
          <rect x="${svgWidth * 0.45}" y="10" width="${svgWidth * 0.5}" height="${svgHeight - 20}" fill="#D6D3D1" stroke="#1F2937" stroke-width="2"/>
          <circle cx="${svgWidth * 0.6}" cy="${svgHeight / 2}" r="8" fill="#FFFFFF" stroke="#2D3748" stroke-width="1"/>
          <text x="${svgWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" fill="#1F2937" font-size="11" font-weight="600">OUTDOOR KITCHEN</text>
        </svg>
      `;
    },
  },

  {
    id: 'pergola',
    name: 'Pergola',
    category: 'outdoor',
    description: 'Open pergola structure',
    defaultWidth: 12,
    defaultHeight: 12,
    minWidth: 10,
    maxWidth: 20,
    minHeight: 10,
    maxHeight: 20,
    sizeVariants: {
      small: { width: 10, height: 10 },
      medium: { width: 12, height: 12 },
      large: { width: 16, height: 16 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="none" stroke="#1F2937" stroke-width="2" stroke-dasharray="6,3"/>
          <circle cx="20" cy="20" r="6" fill="#78350F" stroke="#1F2937" stroke-width="2"/>
          <circle cx="${svgWidth - 20}" cy="20" r="6" fill="#78350F" stroke="#1F2937" stroke-width="2"/>
          <circle cx="20" cy="${svgHeight - 20}" r="6" fill="#78350F" stroke="#1F2937" stroke-width="2"/>
          <circle cx="${svgWidth - 20}" cy="${svgHeight - 20}" r="6" fill="#78350F" stroke="#1F2937" stroke-width="2"/>
          ${Array.from({ length: 5 }, (_, i) =>
            `<line x1="0" y1="${(i + 1) * (svgHeight / 6)}" x2="${svgWidth}" y2="${(i + 1) * (svgHeight / 6)}" stroke="#92400E" stroke-width="2" opacity="0.4"/>`
          ).join('')}
          <text x="${svgWidth / 2}" y="${svgHeight / 2}" text-anchor="middle" fill="#1F2937" font-size="12" font-weight="600">PERGOLA</text>
          <text x="${svgWidth / 2}" y="${svgHeight / 2 + 15}" text-anchor="middle" fill="#6B7280" font-size="10">${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'sport-court',
    name: 'Sport Court',
    category: 'outdoor',
    description: 'Basketball/sport court',
    defaultWidth: 30,
    defaultHeight: 50,
    minWidth: 25,
    maxWidth: 35,
    minHeight: 40,
    maxHeight: 60,
    sizeVariants: {
      small: { width: 25, height: 40 },
      medium: { width: 30, height: 50 },
      large: { width: 35, height: 60 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#DC2626" opacity="0.2" stroke="#1F2937" stroke-width="3"/>
          <line x1="0" y1="${svgHeight / 2}" x2="${svgWidth}" y2="${svgHeight / 2}" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="${svgWidth / 2}" cy="${svgHeight / 2}" r="${svgWidth * 0.15}" fill="none" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="${svgWidth / 2}" cy="${svgHeight * 0.15}" r="${svgWidth * 0.15}" fill="none" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="${svgWidth / 2}" cy="${svgHeight * 0.85}" r="${svgWidth * 0.15}" fill="none" stroke="#FFFFFF" stroke-width="2"/>
          <text x="${svgWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" fill="#1F2937" font-size="12" font-weight="600">SPORT COURT • ${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'fire-pit',
    name: 'Fire Pit Area',
    category: 'outdoor',
    description: 'Circular fire pit with seating',
    defaultWidth: 15,
    defaultHeight: 15,
    minWidth: 12,
    maxWidth: 20,
    minHeight: 12,
    maxHeight: 20,
    sizeVariants: {
      small: { width: 12, height: 12 },
      medium: { width: 15, height: 15 },
      large: { width: 20, height: 20 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;
      const centerX = svgWidth / 2;
      const centerY = svgHeight / 2;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${centerX}" cy="${centerY}" r="${Math.min(svgWidth, svgHeight) * 0.45}" fill="#E5E7EB" stroke="#1F2937" stroke-width="2"/>
          <circle cx="${centerX}" cy="${centerY}" r="${Math.min(svgWidth, svgHeight) * 0.15}" fill="#78716C" stroke="#1F2937" stroke-width="2"/>
          <circle cx="${centerX}" cy="${centerY}" r="${Math.min(svgWidth, svgHeight) * 0.1}" fill="#EF4444" opacity="0.5"/>
          ${[0, 90, 180, 270].map(angle => {
            const seatX = centerX + Math.cos((angle * Math.PI) / 180) * (Math.min(svgWidth, svgHeight) * 0.35);
            const seatY = centerY + Math.sin((angle * Math.PI) / 180) * (Math.min(svgWidth, svgHeight) * 0.35);
            return `<rect x="${seatX - 10}" y="${seatY - 10}" width="20" height="20" fill="#92400E" stroke="#1F2937" stroke-width="1.5"/>`;
          }).join('')}
          <text x="${centerX}" y="${svgHeight - 10}" text-anchor="middle" fill="#1F2937" font-size="12" font-weight="600">FIRE PIT • ${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  // ============================================
  // SHEDS
  // ============================================
  {
    id: 'small-shed',
    name: 'Small Shed',
    category: 'sheds',
    description: 'Compact storage shed',
    defaultWidth: 8,
    defaultHeight: 10,
    minWidth: 6,
    maxWidth: 10,
    minHeight: 8,
    maxHeight: 12,
    sizeVariants: {
      small: { width: 6, height: 8 },
      medium: { width: 8, height: 10 },
      large: { width: 10, height: 12 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#D6D3D1" stroke="#1F2937" stroke-width="3"/>
          <rect x="${svgWidth * 0.35}" y="${svgHeight - 30}" width="25" height="25" fill="#A8A29E" stroke="#1F2937" stroke-width="2"/>
          <circle cx="${svgWidth * 0.35 + 5}" cy="${svgHeight - 15}" r="2" fill="#1F2937"/>
          <rect x="10" y="${svgHeight * 0.2}" width="${svgWidth * 0.3}" height="3" fill="#78716C"/>
          <rect x="10" y="${svgHeight * 0.4}" width="${svgWidth * 0.3}" height="3" fill="#78716C"/>
          <text x="${svgWidth / 2}" y="${svgHeight / 2}" text-anchor="middle" fill="#1F2937" font-size="11" font-weight="600">SHED</text>
          <text x="${svgWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" fill="#57534E" font-size="10">${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'large-shed',
    name: 'Large Shed',
    category: 'sheds',
    description: 'Spacious storage shed',
    defaultWidth: 10,
    defaultHeight: 12,
    minWidth: 8,
    maxWidth: 14,
    minHeight: 10,
    maxHeight: 16,
    sizeVariants: {
      small: { width: 8, height: 10 },
      medium: { width: 10, height: 12 },
      large: { width: 12, height: 14 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#D6D3D1" stroke="#1F2937" stroke-width="3"/>
          <line x1="10" y1="${svgHeight * 0.25}" x2="${svgWidth * 0.4}" y2="${svgHeight * 0.25}" stroke="#78716C" stroke-width="2"/>
          <line x1="10" y1="${svgHeight * 0.5}" x2="${svgWidth * 0.4}" y2="${svgHeight * 0.5}" stroke="#78716C" stroke-width="2"/>
          <line x1="10" y1="${svgHeight * 0.75}" x2="${svgWidth * 0.4}" y2="${svgHeight * 0.75}" stroke="#78716C" stroke-width="2"/>
          <line x1="${svgWidth * 0.6}" y1="${svgHeight * 0.25}" x2="${svgWidth - 10}" y2="${svgHeight * 0.25}" stroke="#78716C" stroke-width="2"/>
          <line x1="${svgWidth * 0.6}" y1="${svgHeight * 0.5}" x2="${svgWidth - 10}" y2="${svgHeight * 0.5}" stroke="#78716C" stroke-width="2"/>
          <line x1="${svgWidth * 0.6}" y1="${svgHeight * 0.75}" x2="${svgWidth - 10}" y2="${svgHeight * 0.75}" stroke="#78716C" stroke-width="2"/>
          <rect x="${svgWidth * 0.4}" y="${svgHeight - 35}" width="20" height="30" fill="#A8A29E" stroke="#1F2937" stroke-width="2"/>
          <rect x="${svgWidth * 0.7}" y="${svgHeight * 0.3}" width="15" height="15" fill="#CBD5E0" stroke="#1F2937" stroke-width="1.5"/>
          <text x="${svgWidth / 2}" y="${svgHeight / 2}" text-anchor="middle" fill="#1F2937" font-size="12" font-weight="600">STORAGE</text>
          <text x="${svgWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" fill="#57534E" font-size="10">${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'workshop',
    name: 'Workshop',
    category: 'sheds',
    description: 'Workshop with workbench',
    defaultWidth: 16,
    defaultHeight: 12,
    minWidth: 12,
    maxWidth: 24,
    minHeight: 10,
    maxHeight: 16,
    sizeVariants: {
      small: { width: 12, height: 10 },
      medium: { width: 16, height: 12 },
      large: { width: 20, height: 14 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#E7E5E4" stroke="#1F2937" stroke-width="3"/>
          <rect x="10" y="10" width="${svgWidth - 20}" height="25" fill="#92400E" stroke="#1F2937" stroke-width="2"/>
          <rect x="${svgWidth * 0.3}" y="15" width="${svgWidth * 0.4}" height="15" fill="#57534E" stroke="#1F2937" stroke-width="1"/>
          <rect x="10" y="${svgHeight - 40}" width="${svgWidth * 0.3}" height="35" fill="#78716C" stroke="#1F2937" stroke-width="2"/>
          <rect x="${svgWidth * 0.65}" y="${svgHeight - 40}" width="${svgWidth * 0.3}" height="35" fill="#78716C" stroke="#1F2937" stroke-width="2"/>
          <circle cx="${svgWidth / 2}" cy="${svgHeight * 0.6}" r="15" fill="#A8A29E" stroke="#1F2937" stroke-width="1.5"/>
          <text x="${svgWidth / 2}" y="${svgHeight / 2}" text-anchor="middle" fill="#1F2937" font-size="12" font-weight="600">WORKSHOP</text>
          <text x="${svgWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" fill="#57534E" font-size="10">${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  // ============================================
  // ADDITIONS
  // ============================================
  {
    id: 'primary-bedroom',
    name: 'Primary Bedroom',
    category: 'additions',
    description: 'Primary bedroom with closet',
    defaultWidth: 14,
    defaultHeight: 16,
    minWidth: 12,
    maxWidth: 18,
    minHeight: 14,
    maxHeight: 20,
    sizeVariants: {
      small: { width: 12, height: 14 },
      medium: { width: 14, height: 16 },
      large: { width: 16, height: 18 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#FFFFFF" stroke="#1F2937" stroke-width="3"/>
          ${bedIcon(svgWidth * 0.2, svgHeight * 0.3, 70, 45)}
          <rect x="${svgWidth * 0.7}" y="${svgHeight * 0.1}" width="${svgWidth * 0.25}" height="${svgHeight * 0.3}" fill="#F3F4F6" stroke="#2D3748" stroke-width="2"/>
          <text x="${svgWidth * 0.825}" y="${svgHeight * 0.25}" text-anchor="middle" fill="#6B7280" font-size="10">CLOSET</text>
          ${doorArc(svgWidth * 0.5, 0, 15, 'bottom')}
          <text x="${svgWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" fill="#1F2937" font-size="12" font-weight="600">PRIMARY BEDROOM • ${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'standard-bedroom',
    name: 'Standard Bedroom',
    category: 'additions',
    description: 'Standard bedroom with closet',
    defaultWidth: 12,
    defaultHeight: 12,
    minWidth: 10,
    maxWidth: 14,
    minHeight: 10,
    maxHeight: 14,
    sizeVariants: {
      small: { width: 10, height: 10 },
      medium: { width: 12, height: 12 },
      large: { width: 14, height: 14 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#FFFFFF" stroke="#1F2937" stroke-width="3"/>
          ${bedIcon(svgWidth * 0.25, svgHeight * 0.35, 55, 35)}
          <rect x="${svgWidth * 0.7}" y="${svgHeight * 0.15}" width="${svgWidth * 0.25}" height="${svgHeight * 0.25}" fill="#F3F4F6" stroke="#2D3748" stroke-width="2"/>
          <text x="${svgWidth * 0.825}" y="${svgHeight * 0.28}" text-anchor="middle" fill="#6B7280" font-size="9">CLOSET</text>
          ${doorArc(svgWidth * 0.5, 0, 15, 'bottom')}
          <text x="${svgWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" fill="#1F2937" font-size="11" font-weight="600">BEDROOM • ${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'primary-bathroom',
    name: 'Primary Bathroom',
    category: 'additions',
    description: 'Primary bath with dual vanity',
    defaultWidth: 10,
    defaultHeight: 12,
    minWidth: 8,
    maxWidth: 14,
    minHeight: 10,
    maxHeight: 16,
    sizeVariants: {
      small: { width: 8, height: 10 },
      medium: { width: 10, height: 12 },
      large: { width: 12, height: 14 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#F9FAFB" stroke="#1F2937" stroke-width="3"/>
          ${showerIcon(svgWidth * 0.05, svgHeight * 0.05, 30, svgHeight * 0.35)}
          <rect x="${svgWidth * 0.45}" y="${svgHeight * 0.05}" width="${svgWidth * 0.5}" height="${svgHeight * 0.35}" fill="#FFFFFF" stroke="#2D3748" stroke-width="2"/>
          <text x="${svgWidth * 0.7}" y="${svgHeight * 0.2}" text-anchor="middle" fill="#6B7280" font-size="10">TUB</text>
          ${sinkIcon(svgWidth * 0.25, svgHeight * 0.65, 8)}
          ${sinkIcon(svgWidth * 0.5, svgHeight * 0.65, 8)}
          ${toiletIcon(svgWidth * 0.75, svgHeight * 0.75, 10)}
          <text x="${svgWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" fill="#1F2937" font-size="11" font-weight="600">PRIMARY BATH • ${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'full-bathroom',
    name: 'Full Bathroom',
    category: 'additions',
    description: 'Full bath with tub/shower',
    defaultWidth: 8,
    defaultHeight: 10,
    minWidth: 6,
    maxWidth: 10,
    minHeight: 8,
    maxHeight: 12,
    sizeVariants: {
      small: { width: 6, height: 8 },
      medium: { width: 8, height: 10 },
      large: { width: 10, height: 12 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#F9FAFB" stroke="#1F2937" stroke-width="3"/>
          ${showerIcon(10, 10, svgWidth - 20, svgHeight * 0.35)}
          ${sinkIcon(svgWidth * 0.35, svgHeight * 0.65, 8)}
          ${toiletIcon(svgWidth * 0.65, svgHeight * 0.7, 10)}
          <text x="${svgWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" fill="#1F2937" font-size="11" font-weight="600">FULL BATH • ${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'half-bath',
    name: 'Half Bath',
    category: 'additions',
    description: 'Powder room',
    defaultWidth: 5,
    defaultHeight: 6,
    minWidth: 4,
    maxWidth: 6,
    minHeight: 5,
    maxHeight: 8,
    sizeVariants: {
      small: { width: 4, height: 5 },
      medium: { width: 5, height: 6 },
      large: { width: 6, height: 7 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#F9FAFB" stroke="#1F2937" stroke-width="3"/>
          ${sinkIcon(svgWidth / 2, svgHeight * 0.3, 8)}
          ${toiletIcon(svgWidth * 0.35, svgHeight * 0.6, 8)}
          <text x="${svgWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" fill="#1F2937" font-size="10" font-weight="600">½ BATH</text>
        </svg>
      `;
    },
  },

  {
    id: 'laundry-room',
    name: 'Laundry Room',
    category: 'additions',
    description: 'Washer/dryer room',
    defaultWidth: 6,
    defaultHeight: 8,
    minWidth: 5,
    maxWidth: 8,
    minHeight: 6,
    maxHeight: 10,
    sizeVariants: {
      small: { width: 5, height: 6 },
      medium: { width: 6, height: 8 },
      large: { width: 8, height: 10 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#FFFFFF" stroke="#1F2937" stroke-width="3"/>
          <rect x="10" y="10" width="${svgWidth * 0.4}" height="${svgWidth * 0.4}" fill="#E5E7EB" stroke="#2D3748" stroke-width="2" rx="2"/>
          <circle cx="10 + ${svgWidth * 0.2}" cy="10 + ${svgWidth * 0.2}" r="${svgWidth * 0.12}" fill="#FFFFFF" stroke="#2D3748" stroke-width="1"/>
          <rect x="${svgWidth * 0.55}" y="10" width="${svgWidth * 0.4}" height="${svgWidth * 0.4}" fill="#E5E7EB" stroke="#2D3748" stroke-width="2" rx="2"/>
          <circle cx="${svgWidth * 0.55 + svgWidth * 0.2}" cy="10 + ${svgWidth * 0.2}" r="${svgWidth * 0.12}" fill="#FFFFFF" stroke="#2D3748" stroke-width="1"/>
          <text x="${svgWidth / 2}" y="${svgHeight - 15}" text-anchor="middle" fill="#1F2937" font-size="10" font-weight="600">LAUNDRY</text>
          <text x="${svgWidth / 2}" y="${svgHeight - 5}" text-anchor="middle" fill="#6B7280" font-size="8">${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'home-office',
    name: 'Home Office',
    category: 'additions',
    description: 'Dedicated office space',
    defaultWidth: 10,
    defaultHeight: 12,
    minWidth: 8,
    maxWidth: 14,
    minHeight: 10,
    maxHeight: 16,
    sizeVariants: {
      small: { width: 8, height: 10 },
      medium: { width: 10, height: 12 },
      large: { width: 12, height: 14 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#FFFFFF" stroke="#1F2937" stroke-width="3"/>
          <rect x="10" y="${svgHeight * 0.3}" width="${svgWidth - 20}" height="30" fill="#92400E" stroke="#2D3748" stroke-width="2"/>
          <rect x="${svgWidth * 0.3}" y="${svgHeight * 0.35}" width="30" height="20" fill="#E5E7EB" stroke="#2D3748" stroke-width="1"/>
          <rect x="10" y="10" width="${svgWidth * 0.35}" height="${svgHeight * 0.15}" fill="#78716C" stroke="#2D3748" stroke-width="2"/>
          <text x="${svgWidth * 0.175}" y="${svgHeight * 0.085}" text-anchor="middle" fill="#F3F4F6" font-size="9">BOOKSHELF</text>
          ${doorArc(svgWidth * 0.5, 0, 15, 'bottom')}
          <text x="${svgWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" fill="#1F2937" font-size="11" font-weight="600">HOME OFFICE • ${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'living-room',
    name: 'Living Room',
    category: 'additions',
    description: 'Living area',
    defaultWidth: 16,
    defaultHeight: 20,
    minWidth: 14,
    maxWidth: 22,
    minHeight: 16,
    maxHeight: 24,
    sizeVariants: {
      small: { width: 14, height: 16 },
      medium: { width: 16, height: 20 },
      large: { width: 20, height: 24 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#FFFFFF" stroke="#1F2937" stroke-width="3"/>
          ${couchIcon(svgWidth * 0.15, svgHeight * 0.5, 70, 30)}
          <rect x="${svgWidth * 0.6}" y="${svgHeight * 0.6}" width="35" height="25" fill="#1F2937" stroke="#2D3748" stroke-width="2"/>
          <text x="${svgWidth * 0.775}" y="${svgHeight * 0.735}" text-anchor="middle" fill="#FFFFFF" font-size="10">TV</text>
          ${tableChairs(svgWidth * 0.35, svgHeight * 0.15, 40)}
          <text x="${svgWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" fill="#1F2937" font-size="12" font-weight="600">LIVING ROOM • ${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'kitchen',
    name: 'Kitchen',
    category: 'additions',
    description: 'Full kitchen',
    defaultWidth: 12,
    defaultHeight: 14,
    minWidth: 10,
    maxWidth: 16,
    minHeight: 12,
    maxHeight: 18,
    sizeVariants: {
      small: { width: 10, height: 12 },
      medium: { width: 12, height: 14 },
      large: { width: 14, height: 16 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#FFFFFF" stroke="#1F2937" stroke-width="3"/>
          ${kitchenCounter(10, 10, svgWidth - 20, 30)}
          ${kitchenCounter(10, svgHeight - 40, svgWidth - 20, 30)}
          <rect x="${svgWidth * 0.35}" y="${svgHeight * 0.4}" width="${svgWidth * 0.3}" height="35" fill="#D1D5DB" stroke="#2D3748" stroke-width="2"/>
          <text x="${svgWidth * 0.5}" y="${svgHeight * 0.475}" text-anchor="middle" fill="#1F2937" font-size="10">ISLAND</text>
          <text x="${svgWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" fill="#1F2937" font-size="12" font-weight="600">KITCHEN • ${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  // ============================================
  // NEW BUILDS
  // ============================================
  {
    id: 'small-ranch',
    name: 'Small Ranch',
    category: 'newbuilds',
    description: '~1,200 sq ft ranch home',
    defaultWidth: 40,
    defaultHeight: 30,
    minWidth: 35,
    maxWidth: 45,
    minHeight: 25,
    maxHeight: 35,
    sizeVariants: {
      small: { width: 35, height: 25 },
      medium: { width: 40, height: 30 },
      large: { width: 45, height: 35 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#FEF3C7" opacity="0.4" stroke="#1F2937" stroke-width="4"/>
          ${roomOutline(0, 0, svgWidth * 0.5, svgHeight * 0.5, 'BR 1')}
          ${roomOutline(svgWidth * 0.5, 0, svgWidth * 0.5, svgHeight * 0.5, 'BR 2')}
          ${roomOutline(0, svgHeight * 0.5, svgWidth * 0.35, svgHeight * 0.5, 'KITCHEN')}
          ${roomOutline(svgWidth * 0.35, svgHeight * 0.5, svgWidth * 0.65, svgHeight * 0.5, 'LIVING')}
          <rect x="${svgWidth * 0.5}" y="${svgHeight * 0.25}" width="${svgWidth * 0.15}" height="${svgHeight * 0.25}" fill="#F9FAFB" stroke="#2D3748" stroke-width="2"/>
          <text x="${svgWidth * 0.575}" y="${svgHeight * 0.375}" text-anchor="middle" fill="#6B7280" font-size="10">BATH</text>
          <text x="${svgWidth / 2}" y="${svgHeight - 15}" text-anchor="middle" fill="#1F2937" font-size="14" font-weight="600">~1,200 SF RANCH</text>
          <text x="${svgWidth / 2}" y="${svgHeight - 5}" text-anchor="middle" fill="#6B7280" font-size="11">${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'medium-ranch',
    name: 'Medium Ranch',
    category: 'newbuilds',
    description: '~2,000 sq ft ranch home',
    defaultWidth: 50,
    defaultHeight: 40,
    minWidth: 45,
    maxWidth: 60,
    minHeight: 35,
    maxHeight: 45,
    sizeVariants: {
      small: { width: 45, height: 35 },
      medium: { width: 50, height: 40 },
      large: { width: 55, height: 45 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#FEF3C7" opacity="0.4" stroke="#1F2937" stroke-width="4"/>
          ${roomOutline(0, 0, svgWidth * 0.35, svgHeight * 0.45, 'PRIMARY')}
          ${roomOutline(svgWidth * 0.65, 0, svgWidth * 0.35, svgHeight * 0.45, 'BR 2')}
          ${roomOutline(svgWidth * 0.35, 0, svgWidth * 0.3, svgHeight * 0.25, 'BR 3')}
          ${roomOutline(0, svgHeight * 0.45, svgWidth * 0.4, svgHeight * 0.55, 'KITCHEN')}
          ${roomOutline(svgWidth * 0.4, svgHeight * 0.45, svgWidth * 0.6, svgHeight * 0.55, 'LIVING')}
          <rect x="${svgWidth * 0.35}" y="${svgHeight * 0.25}" width="${svgWidth * 0.3}" height="${svgHeight * 0.2}" fill="#F9FAFB" stroke="#2D3748" stroke-width="2"/>
          <text x="${svgWidth * 0.5}" y="${svgHeight * 0.35}" text-anchor="middle" fill="#6B7280" font-size="11">BATHS</text>
          <text x="${svgWidth / 2}" y="${svgHeight - 15}" text-anchor="middle" fill="#1F2937" font-size="14" font-weight="600">~2,000 SF RANCH</text>
          <text x="${svgWidth / 2}" y="${svgHeight - 5}" text-anchor="middle" fill="#6B7280" font-size="11">${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'large-ranch',
    name: 'Large Ranch',
    category: 'newbuilds',
    description: '~3,000 sq ft ranch home',
    defaultWidth: 60,
    defaultHeight: 50,
    minWidth: 55,
    maxWidth: 70,
    minHeight: 45,
    maxHeight: 60,
    sizeVariants: {
      small: { width: 55, height: 45 },
      medium: { width: 60, height: 50 },
      large: { width: 65, height: 55 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#FEF3C7" opacity="0.4" stroke="#1F2937" stroke-width="4"/>
          ${roomOutline(0, 0, svgWidth * 0.3, svgHeight * 0.4, 'PRIMARY')}
          ${roomOutline(svgWidth * 0.7, 0, svgWidth * 0.3, svgHeight * 0.4, 'BR 2')}
          ${roomOutline(svgWidth * 0.7, svgHeight * 0.4, svgWidth * 0.3, svgHeight * 0.3, 'BR 3')}
          ${roomOutline(svgWidth * 0.3, 0, svgWidth * 0.2, svgHeight * 0.3, 'BR 4')}
          ${roomOutline(0, svgHeight * 0.4, svgWidth * 0.35, svgHeight * 0.6, 'KITCHEN')}
          ${roomOutline(svgWidth * 0.35, svgHeight * 0.4, svgWidth * 0.35, svgHeight * 0.6, 'LIVING')}
          <rect x="${svgWidth * 0.5}" y="0" width="${svgWidth * 0.2}" height="${svgHeight * 0.4}" fill="#F9FAFB" stroke="#2D3748" stroke-width="2"/>
          <text x="${svgWidth * 0.6}" y="${svgHeight * 0.2}" text-anchor="middle" fill="#6B7280" font-size="11">BATHS</text>
          <text x="${svgWidth * 0.7}" y="${svgHeight * 0.75}" text-anchor="middle" fill="#6B7280" font-size="10">OFFICE</text>
          <text x="${svgWidth / 2}" y="${svgHeight - 15}" text-anchor="middle" fill="#1F2937" font-size="14" font-weight="600">~3,000 SF RANCH</text>
          <text x="${svgWidth / 2}" y="${svgHeight - 5}" text-anchor="middle" fill="#6B7280" font-size="11">${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'l-shaped-ranch',
    name: 'L-Shaped Ranch',
    category: 'newbuilds',
    description: 'L-shaped floor plan',
    defaultWidth: 50,
    defaultHeight: 50,
    minWidth: 45,
    maxWidth: 60,
    minHeight: 45,
    maxHeight: 60,
    sizeVariants: {
      small: { width: 45, height: 45 },
      medium: { width: 50, height: 50 },
      large: { width: 55, height: 55 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0 0 L ${svgWidth} 0 L ${svgWidth} ${svgHeight * 0.6} L ${svgWidth * 0.6} ${svgHeight * 0.6} L ${svgWidth * 0.6} ${svgHeight} L 0 ${svgHeight} Z"
                fill="#FEF3C7" opacity="0.4" stroke="#1F2937" stroke-width="4"/>
          ${roomOutline(0, 0, svgWidth * 0.35, svgHeight * 0.4, 'PRIMARY')}
          ${roomOutline(svgWidth * 0.65, 0, svgWidth * 0.35, svgHeight * 0.35, 'BR 2')}
          ${roomOutline(svgWidth * 0.35, 0, svgWidth * 0.3, svgHeight * 0.25, 'BR 3')}
          ${roomOutline(0, svgHeight * 0.4, svgWidth * 0.3, svgHeight * 0.6, 'KITCHEN')}
          ${roomOutline(svgWidth * 0.3, svgHeight * 0.4, svgWidth * 0.3, svgHeight * 0.6, 'LIVING')}
          ${roomOutline(0, svgHeight * 0.6, svgWidth * 0.6, svgHeight * 0.4, 'GARAGE')}
          <rect x="${svgWidth * 0.65}" y="${svgHeight * 0.35}" width="${svgWidth * 0.2}" height="${svgHeight * 0.25}" fill="#F9FAFB" stroke="#2D3748" stroke-width="2"/>
          <text x="${svgWidth * 0.75}" y="${svgHeight * 0.475}" text-anchor="middle" fill="#6B7280" font-size="10">BATH</text>
          <text x="${svgWidth / 2}" y="${svgHeight - 15}" text-anchor="middle" fill="#1F2937" font-size="14" font-weight="600">L-SHAPED RANCH</text>
          <text x="${svgWidth / 2}" y="${svgHeight - 5}" text-anchor="middle" fill="#6B7280" font-size="11">${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  {
    id: 'two-story-narrow',
    name: 'Two Story (Narrow)',
    category: 'newbuilds',
    description: 'Narrow lot two-story home',
    defaultWidth: 30,
    defaultHeight: 40,
    minWidth: 25,
    maxWidth: 35,
    minHeight: 35,
    maxHeight: 50,
    sizeVariants: {
      small: { width: 25, height: 35 },
      medium: { width: 30, height: 40 },
      large: { width: 35, height: 45 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#FEF3C7" opacity="0.4" stroke="#1F2937" stroke-width="4"/>
          <rect x="5" y="5" width="${svgWidth - 10}" height="${svgHeight - 10}" fill="none" stroke="#1F2937" stroke-width="2" stroke-dasharray="8,4"/>
          ${roomOutline(svgWidth * 0.1, svgHeight * 0.1, svgWidth * 0.8, svgHeight * 0.35, 'LIVING')}
          ${roomOutline(svgWidth * 0.1, svgHeight * 0.45, svgWidth * 0.8, svgHeight * 0.45, 'KITCHEN/DINING')}
          <text x="${svgWidth / 2}" y="${svgHeight / 2 - 10}" text-anchor="middle" fill="#1F2937" font-size="16" font-weight="700">2-STORY</text>
          <text x="${svgWidth / 2}" y="${svgHeight / 2 + 10}" text-anchor="middle" fill="#6B7280" font-size="11">3BR UPSTAIRS</text>
          <text x="${svgWidth / 2}" y="${svgHeight - 15}" text-anchor="middle" fill="#1F2937" font-size="12" font-weight="600">FOOTPRINT: ${width}' × ${height}'</text>
        </svg>
      `;
    },
  },

  // CUSTOM
  {
    id: 'custom-rectangle',
    name: 'Custom Rectangle',
    category: 'custom',
    description: 'Simple rectangular shape',
    defaultWidth: 20,
    defaultHeight: 15,
    minWidth: 5,
    maxWidth: 100,
    minHeight: 5,
    maxHeight: 100,
    sizeVariants: {
      small: { width: 10, height: 10 },
      medium: { width: 20, height: 15 },
      large: { width: 30, height: 25 },
    },
    getSvg: (width: number, height: number) => {
      const scale = 10;
      const svgWidth = width * scale;
      const svgHeight = height * scale;

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#F3F4F6" stroke="#1F2937" stroke-width="3" stroke-dasharray="8,4"/>
          <line x1="${svgWidth / 2}" y1="0" x2="${svgWidth / 2}" y2="${svgHeight}" stroke="#9CA3AF" stroke-width="1" opacity="0.5"/>
          <line x1="0" y1="${svgHeight / 2}" x2="${svgWidth}" y2="${svgHeight / 2}" stroke="#9CA3AF" stroke-width="1" opacity="0.5"/>
          <text x="${svgWidth / 2}" y="${svgHeight / 2 - 10}" text-anchor="middle" fill="#1F2937" font-size="14" font-weight="600">CUSTOM</text>
          <text x="${svgWidth / 2}" y="${svgHeight / 2 + 15}" text-anchor="middle" fill="#6B7280" font-size="12">${width}' × ${height}'</text>
        </svg>
      `;
    },
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const SHAPE_CATEGORIES = [
  { id: 'garages', name: 'Garages', icon: '🚗' },
  { id: 'adus', name: 'ADUs', icon: '🏠' },
  { id: 'pools', name: 'Pools', icon: '🏊' },
  { id: 'outdoor', name: 'Outdoor Living', icon: '☀️' },
  { id: 'sheds', name: 'Sheds', icon: '🛠️' },
  { id: 'additions', name: 'Additions', icon: '🏗️' },
  { id: 'newbuilds', name: 'New Builds', icon: '🏘️' },
  { id: 'custom', name: 'Custom', icon: '📐' },
];

export function getTemplatesByCategory(category: string): ShapeTemplate[] {
  return SHAPE_TEMPLATES.filter(t => t.category === category);
}

export function getTemplateById(id: string): ShapeTemplate | undefined {
  return SHAPE_TEMPLATES.find(t => t.id === id);
}
