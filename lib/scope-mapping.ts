// Maps project scope types to task/requirement categories
// Used for cascade deletion when scope items are removed

export type ProjectScopeType =
  | 'adu'
  | 'addition'
  | 'remodel'
  | 'new_build'
  | 'pool'
  | 'garage'
  | 'kitchen'
  | 'bathroom'
  | 'outdoor_kitchen'
  | 'structural';

// Maps scope types to categories/keywords that identify related tasks
export const SCOPE_TO_CATEGORY_MAP: Record<ProjectScopeType, string[]> = {
  'adu': ['adu', 'accessory-dwelling', 'adu-electrical', 'adu-plumbing', 'adu-hvac'],
  'addition': ['addition', 'structural', 'foundation', 'framing'],
  'remodel': ['remodel', 'renovation', 'interior'],
  'new_build': ['new-construction', 'foundation', 'framing', 'structural'],
  'pool': ['pool', 'swimming', 'pool-electrical', 'pool-plumbing', 'pool-equipment'],
  'garage': ['garage', 'garage-electrical', 'parking'],
  'kitchen': ['kitchen', 'kitchen-electrical', 'kitchen-plumbing', 'kitchen-cabinets'],
  'bathroom': ['bathroom', 'bath-plumbing', 'bath-electrical', 'bath-fixtures'],
  'outdoor_kitchen': ['outdoor-kitchen', 'outdoor-electrical', 'outdoor-plumbing'],
  'structural': ['structural', 'load-bearing', 'engineering', 'soils']
};

// Get all category keywords for a list of scope types
export function getCategoriesForScopes(scopes: string[]): string[] {
  const categories = new Set<string>();

  scopes.forEach(scope => {
    const normalized = scope.toLowerCase().replace(/_/g, '-') as ProjectScopeType;
    const mappedCategories = SCOPE_TO_CATEGORY_MAP[normalized as ProjectScopeType] || [];
    mappedCategories.forEach(cat => categories.add(cat));
  });

  return Array.from(categories);
}

// Check if a task category matches any of the scope types
export function taskMatchesScope(taskCategory: string | null, scopes: string[]): boolean {
  if (!taskCategory) return false;

  const categories = getCategoriesForScopes(scopes);
  const normalizedTaskCategory = taskCategory.toLowerCase();

  return categories.some(cat =>
    normalizedTaskCategory.includes(cat) || cat.includes(normalizedTaskCategory)
  );
}

// Estimate cost impact (placeholder - can be refined later)
export function estimateCostImpact(removedScopes: string[]): number {
  const costMap: Record<ProjectScopeType, number> = {
    'adu': 50000,
    'addition': 30000,
    'remodel': 20000,
    'new_build': 100000,
    'pool': 40000,
    'garage': 25000,
    'kitchen': 15000,
    'bathroom': 10000,
    'outdoor_kitchen': 12000,
    'structural': 18000
  };

  return removedScopes.reduce((total, scope) => {
    const normalized = scope.toLowerCase().replace(/_/g, '-') as ProjectScopeType;
    return total + (costMap[normalized] || 15000); // Default $15k if not in map
  }, 0);
}
