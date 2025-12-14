import type { RegenConstraints } from "./types";
import type { SpotOutputLike } from "../validator";
import { validateSpotOutput } from "../validator";
import { buildAuditPacketFromSpot } from "./auditSpot";
import { RuleBasedAuditor, type Auditor } from "./auditors";

export type SupportedType = "srp_universal";

export interface AutoRewriteArgs {
  repoRoot: string;
  id: string;
  type: SupportedType;
  seed: number;
  maxAttempts: number;
  generate: (constraints?: RegenConstraints, seed?: number) => SpotOutputLike;
  auditor?: Auditor;
}

export function autoRewrite(args: AutoRewriteArgs): { spot: SpotOutputLike; constraintsUsed: RegenConstraints; attempts: number } {
  const auditor = args.auditor ?? new RuleBasedAuditor();
  let constraints: RegenConstraints = {};
  let lastSpot: SpotOutputLike | null = null;

  for (let attempt = 1; attempt <= args.maxAttempts; attempt++) {
    const spot = args.generate(constraints, args.seed + attempt);
    lastSpot = spot;

    const v = validateSpotOutput(spot);
    if (!v.ok) {
      // If math fails, keep constraints and just try again (generator should be math-correct, so this is rare).
      continue;
    }

    const packet = buildAuditPacketFromSpot(args.repoRoot, spot);
    const newConstraints = auditor.audit(packet);
    if (Object.keys(newConstraints).length === 0) {
      return { spot, constraintsUsed: constraints, attempts: attempt };
    }
    constraints = auditor.merge(constraints, newConstraints);
  }

  if (!lastSpot) throw new Error("autoRewrite produced no spot");
  return { spot: lastSpot, constraintsUsed: constraints, attempts: args.maxAttempts };
}


