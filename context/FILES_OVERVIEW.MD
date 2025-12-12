# Files Overview for Spot Generation Pipeline

This repo contains:

- `/theory/preflop/charts/*.json` → RFI charts
- `/theory/preflop/facing/*.json` → Facing RFI defense charts
- `/theory/postflop/solver_truth/*.json` → flop_matrix, turn_matrix, river_matrix
- `/theory/postflop/heuristics/*.json` → cbet, probe, XR rules
- `/theory/postflop/explanations/*.md` → theory for building meta explanations
- `/core/*.md` → final compiled theory documents
- `/context/*.md` → agent instructions (this folder)

The agent must use these files to produce **valid Spot JSON**.