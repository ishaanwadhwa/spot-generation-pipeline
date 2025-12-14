# Spot Generation Pipeline (spotgen)

This folder contains the **deterministic generator + validator** used to produce `SpotOutput` objects for your poker training app.

## Design goals
- **No hallucinated math**: pot, sizing, and stack legality are validated deterministically.
- **Theory-driven**: uses `/theory/preflop/charts/*` and `/theory/postflop/solver_truth/*` as structured inputs.
- **Extensible**: add new templates under `spotgen/templates/`.

## Conventions (critical)
- **Blinds are assumed posted** (SB=0.5bb, BB=1bb) for every hand.
- `exactAmount` is **exact math (unrounded)**. UI rounds for display.

## CLI
- Build: `npm run build`
- Validate current `seed.ts`: `npm run spotgen:validate`


