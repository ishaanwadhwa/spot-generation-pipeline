import type { HeroHandClass } from "../poker/classify";
import type { TurnType } from "../poker/turnClassify";
import type { SpotOutputLike } from "../validator";
import type { HandFeatures } from "../poker/handFeatures";
import type { HandIntent, NodeIntent } from "../poker/intent";

export interface RegenConstraints {
  // Example: ["monster"] to avoid sets/two-pair/flush/straight type hands for a pressure-barrel spot
  avoidHeroClasses?: HeroHandClass[];
  // Force a specific turn type for the template, e.g. "blank_turn" for classic barrel spots
  requireTurnType?: TurnType;
  // Force the intent of the node (template uses this to choose option families)
  intent?: "pressure" | "value";
}

export interface AuditFeatures {
  heroClass: HeroHandClass;
  turnType: TurnType;
  flopClassTag?: string;
  hand?: HandFeatures;
  handIntent?: HandIntent;
  nodeIntent?: NodeIntent;
}

export interface AuditPacket {
  id: string;
  spot: SpotOutputLike;
  features: AuditFeatures;
  theory: {
    // short, relevant bullets used to ground the audit
    bullets: string[];
  };
  outputFormat: {
    // AI should respond with JSON in this schema
    constraintsSchema: RegenConstraints;
    instructions: string;
  };
}


