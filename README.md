# Passport Synergy Explorer

An interactive 3D globe for exploring dual citizenship combinations.

## Quick Start

```bash
bun install && bun run dev
# or
npm install && npm run dev
```

## Overview

Instead of a dry compatibility table, this tool puts the question front and center: *"What citizenship pairs best with mine?"*

Pick your nationality and the globe lights up—green for high synergy, red for incompatible. Citizenship is geographic, so seeing your "reach" across continents felt more natural than a ranked list.

The synergy score isn't just "do both allow dual?"—it blends multiple factors:

| Factor | Weight | Why |
|--------|--------|-----|
| Visa expansion | 40% | New countries you couldn't access before |
| Legal clarity | 30% | Both say "Yes" clearly, no asterisks |
| Geographic diversity | 20% | Different regions = more spread |
| Data confidence | 10% | Penalize uncertain entries |


## Assumptions & Tradeoffs

- **Sparse visa data**: Only 13 countries have visa-free lists, so the algorithm falls back to neutral scores when data is missing rather than penalizing unknowns
- **"No, but yes with X"**: Treated as conditional dual citizenship—you can pair, but only with specific countries
- **Globe over custom Three.js**: Used react-globe.gl for speed. Less control, but got a working product faster
- **On-demand scoring**: Could precompute all 39k pairs, but runtime calculation is fast enough and simpler
- **Desktop-first**: Globe works on mobile but touch controls are basic

## Limitations

- Visa-free data only covers 13 countries—scores are estimates for most pairings
- Dataset is from 2020; citizenship laws change
- No 2D fallback for devices that struggle with WebGL
- Conditional citizenship rules are simplified; real bilateral agreements are complex

## What's Next

If I kept going:

- Integrate Henley Passport Index for complete visa data
- Add 2D map fallback
- Deep-dive country views with legal docs and application info
- "What if" mode (e.g., "What if Japan allowed dual?")

## Stack

- React
- Vite
- TypeScript
- TailwindCSS
- react-globe.gl
- Framer Motion
- Zustand
