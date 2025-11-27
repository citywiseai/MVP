// lib/municipal-data/index.ts
export * from './phoenix';

// Future: Add other jurisdictions
// export * from './scottsdale';
// export * from './tempe';
// export * from './mesa';

export type Jurisdiction = 'phoenix' | 'scottsdale' | 'tempe' | 'mesa' | 'chandler' | 'gilbert';

export function getJurisdictionData(jurisdiction: Jurisdiction) {
  switch (jurisdiction) {
    case 'phoenix':
      return import('./phoenix');
    default:
      return import('./phoenix'); // Default to Phoenix for now
  }
}
