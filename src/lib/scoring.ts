import type { Country, SynergyScore, CountryWithSynergy } from './types';
import { countries } from './data';

// Check if a country allows dual citizenship (for pairing)
export function allowsDual(country: Country): boolean {
  return country.dualCitizenship.allowed === true;
}

// Check if two countries can form a dual citizenship pair
export function canPair(a: Country, b: Country): boolean {
  if (!allowsDual(a) || !allowsDual(b)) return false;

  // Check conditional cases
  if ('conditional' in a.dualCitizenship && a.dualCitizenship.conditional) {
    const withCountries = a.dualCitizenship.withCountries;
    if (!withCountries.some((c) => c.toLowerCase().includes(b.name.toLowerCase()))) {
      return false;
    }
  }

  if ('conditional' in b.dualCitizenship && b.dualCitizenship.conditional) {
    const withCountries = b.dualCitizenship.withCountries;
    if (!withCountries.some((c) => c.toLowerCase().includes(a.name.toLowerCase()))) {
      return false;
    }
  }

  return true;
}

// Calculate visa-free expansion score (0-100)
// Higher score = more NEW countries you can access with the combo
// Returns { score, hasData } to help weight the final calculation
function calculateVisaExpansion(a: Country, b: Country): { score: number; hasData: boolean } {
  const aAccess = new Set(a.visaFreeAccess.map((c) => c.toLowerCase()));
  const bAccess = new Set(b.visaFreeAccess.map((c) => c.toLowerCase()));

  // If neither has visa data, return neutral score with no-data flag
  if (aAccess.size === 0 && bAccess.size === 0) {
    return { score: 50, hasData: false }; // Neutral - no data to compare
  }

  // If only primary (a) has no data, we can't properly score this
  // Don't give b credit just for having data - that's misleading
  if (aAccess.size === 0) {
    return { score: 50, hasData: false }; // Neutral - can't measure expansion without knowing a's coverage
  }

  // If only b has no data, also neutral (we can't measure what b adds)
  if (bAccess.size === 0) {
    return { score: 50, hasData: false };
  }

  // Both have data - calculate actual expansion
  // How many NEW countries does b add to a?
  const newFromB = [...bAccess].filter((c) => !aAccess.has(c)).length;
  // Combined coverage
  const totalCombined = new Set([...aAccess, ...bAccess]).size;
  const maxPossible = 200;

  // Score based on new countries added AND total coverage
  const expansionScore = Math.min(50, (newFromB / 50) * 50);
  const coverageScore = (totalCombined / maxPossible) * 50;

  return { score: Math.min(100, expansionScore + coverageScore), hasData: true };
}

// Calculate legal clarity score (0-100)
// Higher score = clearer, more certain legal status
function calculateLegalClarity(a: Country, b: Country): number {
  let score = 100;

  // Penalize conditional dual citizenship
  if ('conditional' in a.dualCitizenship && a.dualCitizenship.conditional) score -= 20;
  if ('conditional' in b.dualCitizenship && b.dualCitizenship.conditional) score -= 20;

  // Penalize uncertain data
  if (a.dataQuality === 'uncertain') score -= 25;
  if (b.dataQuality === 'uncertain') score -= 25;

  // Small penalty for overridden data (it's been updated, but may be stale)
  if (a.dataQuality === 'overridden') score -= 5;
  if (b.dataQuality === 'overridden') score -= 5;

  return Math.max(0, score);
}

// Calculate geographic diversity score (0-100)
// Higher score = countries are in different regions
function calculateGeoDiversity(a: Country, b: Country): number {
  // World regions: 1-6 (Africa, Asia, Europe, Americas, Oceania, etc.)
  if (a.worldRegion === b.worldRegion) {
    return 30; // Same region - low diversity
  }

  // Different regions - calculate "distance"
  const regionDiff = Math.abs(a.worldRegion - b.worldRegion);

  // Max difference is 5 (regions 1-6)
  return 50 + (regionDiff / 5) * 50;
}

// Calculate data confidence score (0-100)
// Higher score = more reliable data for both countries
function calculateDataConfidence(a: Country, b: Country): number {
  let score = 100;

  // Data quality penalties
  if (a.dataQuality === 'uncertain') score -= 40;
  else if (a.dataQuality === 'overridden') score -= 10;

  if (b.dataQuality === 'uncertain') score -= 40;
  else if (b.dataQuality === 'overridden') score -= 10;

  // Bonus for having visa data
  if (a.visaFreeAccess.length > 0) score += 5;
  if (b.visaFreeAccess.length > 0) score += 5;

  // Bonus for having legal documents with URLs
  const aHasUrls = a.legalDocuments.some((d) => d.url);
  const bHasUrls = b.legalDocuments.some((d) => d.url);
  if (aHasUrls) score += 5;
  if (bHasUrls) score += 5;

  return Math.min(100, Math.max(0, score));
}

// Calculate full synergy score between two countries
export function calculateSynergy(a: Country, b: Country): SynergyScore {
  // Check compatibility first
  if (!allowsDual(a)) {
    return {
      score: 0,
      breakdown: { visaExpansion: 0, legalClarity: 0, geoDiversity: 0, dataConfidence: 0 },
      compatible: false,
      reason: `${a.name} does not allow dual citizenship`,
    };
  }

  if (!allowsDual(b)) {
    return {
      score: 0,
      breakdown: { visaExpansion: 0, legalClarity: 0, geoDiversity: 0, dataConfidence: 0 },
      compatible: false,
      reason: `${b.name} does not allow dual citizenship`,
    };
  }

  if (!canPair(a, b)) {
    return {
      score: 0,
      breakdown: { visaExpansion: 0, legalClarity: 0, geoDiversity: 0, dataConfidence: 0 },
      compatible: false,
      reason: 'Conditional restrictions prevent this pairing',
    };
  }

  // Calculate component scores
  const visaResult = calculateVisaExpansion(a, b);
  const legalClarity = calculateLegalClarity(a, b);
  const geoDiversity = calculateGeoDiversity(a, b);
  const dataConfidence = calculateDataConfidence(a, b);

  let score: number;
  if (visaResult.hasData) {
    // Normal weighting when we have visa data
    // 40% visa, 30% legal, 20% geo, 10% confidence
    score =
      visaResult.score * 0.4 +
      legalClarity * 0.3 +
      geoDiversity * 0.2 +
      dataConfidence * 0.1;
  } else {
    // When no visa data, weight other factors more heavily
    // 20% visa (neutral 50), 40% legal, 30% geo, 10% confidence
    score =
      visaResult.score * 0.2 +
      legalClarity * 0.4 +
      geoDiversity * 0.3 +
      dataConfidence * 0.1;
  }

  return {
    score: Math.round(score),
    breakdown: {
      visaExpansion: Math.round(visaResult.score),
      legalClarity: Math.round(legalClarity),
      geoDiversity: Math.round(geoDiversity),
      dataConfidence: Math.round(dataConfidence),
    },
    compatible: true,
  };
}

// Get top synergies for a country
export function getTopSynergies(
  country: Country,
  limit: number = 10
): CountryWithSynergy[] {
  const synergies: CountryWithSynergy[] = countries
    .filter((c) => c.iso3 !== country.iso3) // Exclude self
    .map((c) => ({
      ...c,
      synergy: calculateSynergy(country, c),
    }))
    .filter((c) => c.synergy.compatible)
    .sort((a, b) => b.synergy.score - a.synergy.score);

  return synergies.slice(0, limit);
}

// Get all synergy scores for a country (for heat map)
export function getAllSynergies(country: Country): Map<string, SynergyScore> {
  const synergies = new Map<string, SynergyScore>();

  for (const other of countries) {
    if (other.iso3 !== country.iso3) {
      synergies.set(other.iso3, calculateSynergy(country, other));
    }
  }

  return synergies;
}

// Calculate combined visa-free access for multiple passports
export function getCombinedVisaAccess(passports: Country[]): {
  total: Set<string>;
  byPassport: Map<string, string[]>;
  newlyUnlocked: Map<string, string[]>;
} {
  const total = new Set<string>();
  const byPassport = new Map<string, string[]>();
  const newlyUnlocked = new Map<string, string[]>();

  // First passport establishes baseline
  if (passports.length > 0) {
    const first = passports[0];
    first.visaFreeAccess.forEach((c) => total.add(c.toLowerCase()));
    byPassport.set(first.iso3, [...first.visaFreeAccess]);
    newlyUnlocked.set(first.iso3, [...first.visaFreeAccess]);
  }

  // Additional passports add new countries
  for (let i = 1; i < passports.length; i++) {
    const passport = passports[i];
    const newCountries: string[] = [];

    for (const country of passport.visaFreeAccess) {
      const lower = country.toLowerCase();
      if (!total.has(lower)) {
        total.add(lower);
        newCountries.push(country);
      }
    }

    byPassport.set(passport.iso3, [...passport.visaFreeAccess]);
    newlyUnlocked.set(passport.iso3, newCountries);
  }

  return { total, byPassport, newlyUnlocked };
}
