import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { countries } from '../lib/data';
import { useAppStore } from '../stores/appStore';
import type { Country } from '../lib/types';

// Get flag emoji from ISO2 code
function getFlagEmoji(iso2: string): string {
  const codePoints = iso2
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function SearchInput() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const { selectCountry, selectedPassports } = useAppStore();

  // Filter countries based on query
  const filteredCountries = query.trim()
    ? countries
        .filter(
          (c) =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.iso2.toLowerCase() === query.toLowerCase() ||
            c.iso3.toLowerCase() === query.toLowerCase()
        )
        .slice(0, 8)
    : [];

  // Handle selection
  const handleSelect = useCallback(
    (country: Country) => {
      selectCountry(country);
      setQuery('');
      setIsOpen(false);
      setHighlightedIndex(0);
    },
    [selectCountry]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || filteredCountries.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((i) =>
            i < filteredCountries.length - 1 ? i + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((i) =>
            i > 0 ? i - 1 : filteredCountries.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          handleSelect(filteredCountries[highlightedIndex]);
          break;
        case 'Escape':
          setIsOpen(false);
          setQuery('');
          break;
      }
    },
    [isOpen, filteredCountries, highlightedIndex, handleSelect]
  );

  // Open dropdown when typing
  useEffect(() => {
    setIsOpen(query.trim().length > 0);
    setHighlightedIndex(0);
  }, [query]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && highlightedIndex >= 0) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const placeholderText =
    selectedPassports.length === 0
      ? 'Select your nationality...'
      : selectedPassports.length < 3
      ? 'Add another passport...'
      : 'Maximum 3 passports';

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder={placeholderText}
          disabled={selectedPassports.length >= 3}
          className="w-full px-4 py-3 text-lg bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg
                     text-slate-800 placeholder:text-slate-400
                     focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && filteredCountries.length > 0 && (
          <motion.ul
            ref={listRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-lg overflow-hidden"
          >
            {filteredCountries.map((country, index) => {
              const isSelected = selectedPassports.some(
                (p) => p.iso3 === country.iso3
              );
              const isHighlighted = index === highlightedIndex;
              const isConditional = 'conditional' in country.dualCitizenship && country.dualCitizenship.conditional;

              return (
                <motion.li
                  key={country.iso3}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(country)}
                    disabled={isSelected}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors
                              ${isHighlighted ? 'bg-blue-50' : 'hover:bg-slate-50'}
                              ${isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <span className="text-2xl">{getFlagEmoji(country.iso2)}</span>
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">{country.name}</div>
                      <div className="text-sm text-slate-500">
                        {country.dualCitizenship.allowed === true
                          ? isConditional
                            ? 'Dual citizenship: Conditional'
                            : 'Dual citizenship: Yes'
                          : country.dualCitizenship.allowed === false
                          ? 'Dual citizenship: No'
                          : 'Dual citizenship: Unknown'}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-xs text-slate-400 font-medium">Selected</span>
                    )}
                  </button>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
