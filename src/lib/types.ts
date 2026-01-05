// Raw data types (as imported from the messy dataset)
export interface RawCountryData {
  Status: string | null;
  Comment: string | null;
  ISO3: string;
  ISO2: string;
  country: string;
  country_code: number;
  dependency_code: number | null;
  world_region: number;
  Year: number;
  Dualcit_cat: number;
  Dualcit_grouped: number;
  Dualcit_binary: number;
  Allows_dual: string;
  Column1: string | null;
  urls: (string | null)[];
  documents: string[];
  visaFreeAccess?: string[];
}

// Normalized dual citizenship status
export type DualCitizenshipStatus =
  | { allowed: true; conditional: false }
  | { allowed: true; conditional: true; withCountries: string[] }
  | { allowed: false }
  | { allowed: null; uncertain: true };

// Cleaned country data
export interface Country {
  iso3: string;
  iso2: string;
  name: string;
  countryCode: number;
  worldRegion: number;
  dualCitizenship: DualCitizenshipStatus;
  dataQuality: 'verified' | 'overridden' | 'uncertain';
  comment: string | null;
  legalDocuments: {
    title: string;
    url: string | null;
  }[];
  visaFreeAccess: string[];
}

// Synergy calculation result
export interface SynergyScore {
  score: number; // 0-100
  breakdown: {
    visaExpansion: number;
    legalClarity: number;
    geoDiversity: number;
    dataConfidence: number;
  };
  compatible: boolean;
  reason?: string;
}

// Country with synergy (for ranked lists)
export interface CountryWithSynergy extends Country {
  synergy: SynergyScore;
}
