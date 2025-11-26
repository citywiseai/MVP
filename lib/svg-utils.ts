/**
 * SVG transformation utilities
 * Handles flip/rotate transforms while keeping text elements readable
 */

export interface SvgTransformOptions {
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  rotation?: number; // 0, 90, 180, 270
}

/**
 * Apply flip/rotation transforms to SVG while keeping text readable
 *
 * This function:
 * 1. Wraps the entire SVG content in a transform group for flips/rotation
 * 2. Counter-transforms all text elements so they remain upright and readable
 * 3. Preserves all other SVG attributes and structure
 */
export function transformSvg(
  svgString: string,
  width: number,
  length: number,
  options: SvgTransformOptions = {}
): string {
  const { flipHorizontal = false, flipVertical = false, rotation = 0 } = options;

  // If no transforms, return original
  if (!flipHorizontal && !flipVertical && rotation === 0) {
    return svgString;
  }

  // Extract SVG content (between <svg> tags)
  const svgMatch = svgString.match(/<svg([^>]*)>([\s\S]*)<\/svg>/i);
  if (!svgMatch) return svgString;

  const svgAttributes = svgMatch[1];
  let innerContent = svgMatch[2];

  // Build main transform
  const transforms: string[] = [];

  // Center point for transforms (use actual dimensions from SVG)
  const scale = 10; // Templates use scale = 10 pattern
  const svgWidth = width * scale;
  const svgHeight = length * scale;
  const cx = svgWidth / 2;
  const cy = svgHeight / 2;

  // Apply flips (around center)
  if (flipHorizontal) {
    transforms.push(`translate(${svgWidth} 0) scale(-1 1)`);
  }
  if (flipVertical) {
    transforms.push(`translate(0 ${svgHeight}) scale(1 -1)`);
  }

  // Note: Rotation is handled by CSS on the overlay div, not here
  // because it affects positioning on the map

  const mainTransform = transforms.join(' ');

  // Build counter-transform for text elements
  const textCounterTransforms: string[] = [];

  if (flipHorizontal) {
    textCounterTransforms.push('scale(-1 1)');
  }
  if (flipVertical) {
    textCounterTransforms.push('scale(1 -1)');
  }

  const textCounterTransform = textCounterTransforms.join(' ');

  // Wrap each <text> element with counter-transform
  // This preserves text readability while the shape flips
  if (textCounterTransform) {
    // Match text elements and wrap them in counter-transform groups
    innerContent = innerContent.replace(
      /<text([^>]*)>/gi,
      (match, attributes) => {
        // Extract x and y coordinates if present
        const xMatch = attributes.match(/x="([^"]*)"/);
        const yMatch = attributes.match(/y="([^"]*)"/);

        if (xMatch && yMatch) {
          const x = xMatch[1];
          const y = yMatch[1];

          // Remove x and y from original attributes
          const cleanedAttributes = attributes
            .replace(/x="[^"]*"/, '')
            .replace(/y="[^"]*"/, '');

          // Wrap in group with counter-transform
          return `<g transform="translate(${x} ${y})"><g transform="${textCounterTransform}"><text${cleanedAttributes} x="0" y="0">`;
        }

        // If no x/y found, just wrap without translation
        return `<g transform="${textCounterTransform}"><text${attributes}>`;
      }
    );

    // Close the extra groups we added
    innerContent = innerContent.replace(/<\/text>/gi, '</text></g></g>');
  }

  // If there's a main transform, wrap everything
  if (mainTransform) {
    return `<svg${svgAttributes}><g transform="${mainTransform}">${innerContent}</g></svg>`;
  }

  return `<svg${svgAttributes}>${innerContent}</svg>`;
}

/**
 * Get CSS transform for rotating overlay on map
 * Separate from SVG transforms because rotation affects map positioning
 */
export function getOverlayTransform(rotation: number = 0): string {
  if (rotation === 0) return '';
  return `rotate(${rotation}deg)`;
}
