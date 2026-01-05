import { create } from 'zustand';
import type { Country, CountryWithSynergy, SynergyScore } from '../lib/types';
import { getTopSynergies, getAllSynergies, getCombinedVisaAccess } from '../lib/scoring';

interface AppState {
  // Selected passports (max 3)
  selectedPassports: Country[];

  // Currently hovered country on globe
  hoveredCountry: Country | null;

  // Synergy data
  synergies: Map<string, SynergyScore>;
  topSynergies: CountryWithSynergy[];

  // Combined visa access (for multi-passport)
  combinedVisaAccess: {
    total: Set<string>;
    newlyUnlocked: Map<string, string[]>;
  };

  // UI state
  isLoading: boolean;
  showInfoPanel: boolean;

  // Actions
  selectCountry: (country: Country) => void;
  removeCountry: (iso3: string) => void;
  clearSelection: () => void;
  setHoveredCountry: (country: Country | null) => void;
  toggleInfoPanel: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedPassports: [],
  hoveredCountry: null,
  synergies: new Map(),
  topSynergies: [],
  combinedVisaAccess: {
    total: new Set(),
    newlyUnlocked: new Map(),
  },
  isLoading: false,
  showInfoPanel: false,

  selectCountry: (country: Country) => {
    const current = get().selectedPassports;

    // Don't add duplicates
    if (current.some((c) => c.iso3 === country.iso3)) return;

    // Max 3 passports
    if (current.length >= 3) return;

    const newPassports = [...current, country];

    // Recalculate synergies based on first passport
    const primaryPassport = newPassports[0];
    const synergies = getAllSynergies(primaryPassport);
    const topSynergies = getTopSynergies(primaryPassport, 10);

    // Calculate combined visa access
    const visaResult = getCombinedVisaAccess(newPassports);

    set({
      selectedPassports: newPassports,
      synergies,
      topSynergies,
      combinedVisaAccess: {
        total: visaResult.total,
        newlyUnlocked: visaResult.newlyUnlocked,
      },
      showInfoPanel: true,
    });
  },

  removeCountry: (iso3: string) => {
    const current = get().selectedPassports;
    const newPassports = current.filter((c) => c.iso3 !== iso3);

    if (newPassports.length === 0) {
      set({
        selectedPassports: [],
        synergies: new Map(),
        topSynergies: [],
        combinedVisaAccess: {
          total: new Set(),
          newlyUnlocked: new Map(),
        },
        showInfoPanel: false,
      });
      return;
    }

    // Recalculate with remaining passports
    const primaryPassport = newPassports[0];
    const synergies = getAllSynergies(primaryPassport);
    const topSynergies = getTopSynergies(primaryPassport, 10);
    const visaResult = getCombinedVisaAccess(newPassports);

    set({
      selectedPassports: newPassports,
      synergies,
      topSynergies,
      combinedVisaAccess: {
        total: visaResult.total,
        newlyUnlocked: visaResult.newlyUnlocked,
      },
    });
  },

  clearSelection: () => {
    set({
      selectedPassports: [],
      synergies: new Map(),
      topSynergies: [],
      combinedVisaAccess: {
        total: new Set(),
        newlyUnlocked: new Map(),
      },
      showInfoPanel: false,
    });
  },

  setHoveredCountry: (country: Country | null) => {
    set({ hoveredCountry: country });
  },

  toggleInfoPanel: () => {
    set((state) => ({ showInfoPanel: !state.showInfoPanel }));
  },
}));
