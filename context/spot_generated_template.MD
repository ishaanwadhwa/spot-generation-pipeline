# Spot Generation Template (for Cursor Ultra)

When generating a poker training spot:

1. Read:
   - Preflop ranges under /preflop/charts
   - Facing-RFI charts
   - flop_matrix.json (for flop behavior)
   - turn_matrix.json
   - river_matrix.json
   - postflop_core.md (explanatory theory)

2. Select:
   - Hero position
   - Villain position(s)
   - Preflop action path (use chart buckets)
   - Board category (use flop_matrix)
   - Realistic bet sizing (use matrix sizing ranges)

3. Produce:
   - Full action history `hist[]`
   - Hero-facing decision options `opts[]`
   - EV array `sol.ev[]` (heuristic, not solver-precise)
   - Best action index `sol.b`

4. Write final spot in EXACT format from spot_output_format.md.

5. Ensure:
   - No hallucinated ranges
   - No impossible stacks
   - Pot math correct
   - Street markers included
   - All non-active players explicitly folded preflop

The output MUST be a single JSON object ready to be inserted into the database.
