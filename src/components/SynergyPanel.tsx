import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../stores/appStore';
import { CountUpNumber } from './CountUpNumber';
import { calculateSynergy } from '../lib/scoring';
import type { Country, CountryWithSynergy } from '../lib/types';

// Get flag emoji from ISO2 code
function getFlagEmoji(iso2: string): string {
  const codePoints = iso2
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Synergy score color
function getSynergyColor(score: number): string {
  if (score >= 70) return '#10b981'; // Green
  if (score >= 40) return '#f59e0b'; // Amber
  return '#ef4444'; // Red
}

interface SelectedPassportProps {
  country: Country;
  onRemove: () => void;
  isPrimary: boolean;
}

function SelectedPassport({ country, onRemove, isPrimary }: SelectedPassportProps) {
  const visaCount = country.visaFreeAccess.length;
  const dualStatus = country.dualCitizenship.allowed === true
    ? ('conditional' in country.dualCitizenship && country.dualCitizenship.conditional ? 'Conditional' : 'Yes')
    : country.dualCitizenship.allowed === false ? 'No' : 'Unknown';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg"
    >
      <span className="text-xl">{getFlagEmoji(country.iso2)}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-800">{country.name}</span>
          {isPrimary && (
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
              Primary
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 flex gap-2">
          <span>Dual: {dualStatus}</span>
          {visaCount > 0 && <span>• {visaCount} visa-free</span>}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="text-slate-400 hover:text-slate-600 transition-colors"
        aria-label={`Remove ${country.name}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}

interface SynergyItemProps {
  country: CountryWithSynergy;
  index: number;
  onSelect: () => void;
}

function SynergyItem({ country, index, onSelect }: SynergyItemProps) {
  const score = country.synergy.score;
  const color = getSynergyColor(score);
  const breakdown = country.synergy.breakdown;

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onSelect}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left group"
    >
      <span className="text-2xl">{getFlagEmoji(country.iso2)}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-800 truncate">{country.name}</div>
        <div className="text-sm text-slate-500">
          {'conditional' in country.dualCitizenship && country.dualCitizenship.conditional ? 'Conditional' : 'Full'} dual citizenship
        </div>
        {/* Score breakdown on hover */}
        <div className="hidden group-hover:flex gap-2 mt-1 text-xs text-slate-400">
          <span title="Visa expansion">🌍 {breakdown.visaExpansion}</span>
          <span title="Legal clarity">⚖️ {breakdown.legalClarity}</span>
          <span title="Geographic diversity">📍 {breakdown.geoDiversity}</span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <div
          className="text-2xl font-bold tabular-nums"
          style={{ color }}
        >
          <CountUpNumber value={score} />
        </div>
        <div className="text-xs text-slate-400">synergy</div>
      </div>
    </motion.button>
  );
}

export function SynergyPanel() {
  const {
    selectedPassports,
    topSynergies,
    combinedVisaAccess,
    showInfoPanel,
    removeCountry,
    selectCountry,
    clearSelection,
  } = useAppStore();

  if (!showInfoPanel || selectedPassports.length === 0) {
    return null;
  }

  const totalVisaFree = combinedVisaAccess.total.size;
  const lastPassport = selectedPassports[selectedPassports.length - 1];
  const newlyUnlocked = combinedVisaAccess.newlyUnlocked.get(lastPassport?.iso3 || '') || [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="fixed right-4 top-4 bottom-4 w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col z-20"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-800">Your Passports</h2>
          <button
            onClick={clearSelection}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Clear all
          </button>
        </div>

        {/* Selected passports */}
        <div className="flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {selectedPassports.map((passport, i) => (
              <SelectedPassport
                key={passport.iso3}
                country={passport}
                isPrimary={i === 0}
                onRemove={() => removeCountry(passport.iso3)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Synergy between selected passports */}
      {selectedPassports.length >= 2 && (() => {
        const synergy = calculateSynergy(selectedPassports[0], selectedPassports[1]);
        const color = getSynergyColor(synergy.score);
        return (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-slate-100"
          >
            <div className="text-sm text-slate-600 mb-2">Synergy between your passports</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getFlagEmoji(selectedPassports[0].iso2)}</span>
                <span className="text-slate-400">+</span>
                <span className="text-xl">{getFlagEmoji(selectedPassports[1].iso2)}</span>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold" style={{ color }}>
                  <CountUpNumber value={synergy.score} />
                </div>
                <div className="text-xs text-slate-500">
                  {synergy.compatible ? 'Compatible' : synergy.reason}
                </div>
              </div>
            </div>
            {synergy.compatible && (
              <div className="flex gap-3 mt-2 text-xs text-slate-500">
                <span>🌍 Visa: {synergy.breakdown.visaExpansion}</span>
                <span>⚖️ Legal: {synergy.breakdown.legalClarity}</span>
                <span>📍 Geo: {synergy.breakdown.geoDiversity}</span>
              </div>
            )}
          </motion.div>
        );
      })()}

      {/* Stats */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-600">Visa-free access</div>
            {totalVisaFree > 0 ? (
              <div className="text-3xl font-bold text-slate-800">
                <CountUpNumber value={totalVisaFree} /> <span className="text-lg font-normal text-slate-500">countries</span>
              </div>
            ) : (
              <div className="text-lg text-slate-500">No data available</div>
            )}
          </div>
          {newlyUnlocked.length > 0 && selectedPassports.length > 1 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-right"
            >
              <div className="text-sm text-emerald-600">Newly unlocked</div>
              <div className="text-2xl font-bold text-emerald-600">
                +<CountUpNumber value={newlyUnlocked.length} />
              </div>
            </motion.div>
          )}
        </div>
        {selectedPassports[0]?.visaFreeAccess.length === 0 && (
          <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
            Note: Visa data only available for 13 countries. Synergy scores are estimated.
          </div>
        )}
      </div>

      {/* Top synergies */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-medium text-slate-500 mb-3">
          Best pairings for {selectedPassports[0]?.name}
        </h3>
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {topSynergies.slice(0, 8).map((country, index) => (
              <SynergyItem
                key={country.iso3}
                country={country}
                index={index}
                onSelect={() => selectCountry(country)}
              />
            ))}
          </AnimatePresence>
        </div>

        {topSynergies.length === 0 && (
          <div className="text-center text-slate-500 py-8">
            <p>No compatible pairings found.</p>
            <p className="text-sm mt-1 text-slate-400">
              {selectedPassports[0]?.dualCitizenship.allowed === false
                ? "This country doesn't allow dual citizenship."
                : 'Try selecting a different primary passport.'}
            </p>
          </div>
        )}
      </div>

      {/* Score breakdown */}
      {topSynergies.length > 0 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <div className="text-xs text-slate-500">
            <div className="font-medium mb-1 text-slate-600">Synergy score factors:</div>
            <div className="grid grid-cols-2 gap-1">
              <span>Visa expansion: 40%</span>
              <span>Legal clarity: 30%</span>
              <span>Geographic diversity: 20%</span>
              <span>Data confidence: 10%</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
