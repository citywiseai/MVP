import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteCorruptedCircles() {
  console.log('Finding corrupted circle shapes...');

  // Find all circle shapes
  const circles = await prisma.drawnShape.findMany({
    where: {
      shapeType: 'circle'
    }
  });

  console.log(`Found ${circles.length} total circles`);

  const corruptedCircles = circles.filter(circle => {
    const coords = circle.coordinates;

    // Check if coordinates is invalid
    if (!coords) return true;
    if (typeof coords === 'string') return true;
    if (!Array.isArray(coords)) return true;
    if (coords.length === 0) return true;

    // Check if it's a nested array [[lng, lat]]
    if (Array.isArray(coords[0]) && coords[0].length === 2) {
      return false; // Valid nested format
    }

    // Check if it's a flat array [lng, lat]
    if (coords.length === 2 &&
        typeof coords[0] === 'number' &&
        typeof coords[1] === 'number') {
      return false; // Valid flat format
    }

    return true; // Invalid
  });

  console.log(`Found ${corruptedCircles.length} corrupted circles:`);
  corruptedCircles.forEach(circle => {
    console.log(`  - Circle ${circle.id}: coordinates = ${JSON.stringify(circle.coordinates)}`);
  });

  if (corruptedCircles.length > 0) {
    console.log('\nDeleting corrupted circles...');
    const result = await prisma.drawnShape.deleteMany({
      where: {
        id: {
          in: corruptedCircles.map(c => c.id)
        }
      }
    });

    console.log(`✅ Deleted ${result.count} corrupted circles`);
  } else {
    console.log('✅ No corrupted circles found');
  }

  await prisma.$disconnect();
}

deleteCorruptedCircles()
  .catch(console.error);
