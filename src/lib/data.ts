import { dataJson } from './rawData';
import type { RawCountryData, Country, DualCitizenshipStatus } from './types';
import { REGION_NAMES } from './types';

// Parse the raw "Allows_dual" field into normalized status
function parseDualCitizenshipStatus(
  allowsDual: string,
  column1: string | null
): DualCitizenshipStatus {
  const normalized = allowsDual.trim().toLowerCase();

  if (normalized === 'yes') {
    return { allowed: true, conditional: false };
  }

  if (normalized === 'no') {
    return { allowed: false };
  }

  if (normalized.includes('no, but yes with') || normalized.includes('no but yes with')) {
    const countries = column1
      ? column1.split(',').map((c) => c.trim()).filter(Boolean)
      : [];
    return { allowed: true, conditional: true, withCountries: countries };
  }

  if (normalized === '???' || normalized === '') {
    return { allowed: null, uncertain: true };
  }

  // Default to uncertain for any other weird values
  return { allowed: null, uncertain: true };
}

// Parse the raw "Status" field into data quality indicator
function parseDataQuality(status: string | null): 'verified' | 'overridden' | 'uncertain' {
  if (!status) return 'verified';

  const normalized = status.trim().toLowerCase();

  if (normalized.includes('overrid') || normalized.includes('overrrid')) {
    return 'overridden';
  }

  if (normalized === '???') {
    return 'uncertain';
  }

  return 'verified';
}

// Combine urls and documents into legal documents array
function parseLegalDocuments(
  urls: (string | null)[],
  documents: string[]
): { title: string; url: string | null }[] {
  const maxLength = Math.max(urls.length, documents.length);
  const result: { title: string; url: string | null }[] = [];

  for (let i = 0; i < maxLength; i++) {
    const title = documents[i] || `Document ${i + 1}`;
    const url = urls[i] || null;
    result.push({ title, url });
  }

  return result;
}

// Transform raw data to cleaned Country type
function normalizeCountry(raw: RawCountryData): Country {
  return {
    iso3: raw.ISO3,
    iso2: raw.ISO2,
    name: raw.country,
    countryCode: raw.country_code,
    worldRegion: raw.world_region,
    regionName: REGION_NAMES[raw.world_region] || 'Unknown',
    dualCitizenship: parseDualCitizenshipStatus(raw.Allows_dual, raw.Column1),
    dataQuality: parseDataQuality(raw.Status),
    dataYear: raw.Year || 2020,
    comment: raw.Comment,
    legalDocuments: parseLegalDocuments(raw.urls, raw.documents),
    visaFreeAccess: raw.visaFreeAccess || [],
  };
}

// Export normalized countries
export const countries: Country[] = (dataJson as RawCountryData[]).map(normalizeCountry);

// Create lookup maps for quick access
export const countriesByIso3 = new Map<string, Country>(
  countries.map((c) => [c.iso3, c])
);

export const countriesByIso2 = new Map<string, Country>(
  countries.map((c) => [c.iso2, c])
);

export const countriesByName = new Map<string, Country>(
  countries.map((c) => [c.name.toLowerCase(), c])
);

// Helper to find a country by any identifier
export function findCountry(query: string): Country | undefined {
  const normalized = query.trim();
  const upper = normalized.toUpperCase();
  const lower = normalized.toLowerCase();

  return (
    countriesByIso3.get(upper) ||
    countriesByIso2.get(upper) ||
    countriesByName.get(lower) ||
    countries.find((c) => c.name.toLowerCase().includes(lower))
  );
}

// Get all countries that allow dual citizenship
export function getCountriesAllowingDual(): Country[] {
  return countries.filter(
    (c) => c.dualCitizenship.allowed === true
  );
}

// Get countries with visa-free data
export function getCountriesWithVisaData(): Country[] {
  return countries.filter((c) => c.visaFreeAccess.length > 0);
}
