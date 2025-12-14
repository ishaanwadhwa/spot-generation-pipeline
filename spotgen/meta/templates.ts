/**
 * spotgen/meta/templates.ts
 *
 * Deterministic meta templates by handIntent.
 * No mixing of concepts across different hand types.
 *
 * FIXED: Now accepts bettingMode to align explanations with option semantics.
 */

import type { HandIntent } from "../poker/intent";
import type { TurnType } from "../poker/turnClassify";
import type { HandFeatures } from "../poker/handFeatures";
import type { HeroHandClass } from "../poker/classify";
import type { BettingMode } from "../poker/leverage";

export interface MetaTemplate {
  concepts: string[];
  summary: string;
  solverNotes: string[];
}

/**
 * Get the meta template for a given hand intent.
 * This is fully deterministic - no mixing.
 *
 * FIXED: Now accepts bettingMode to ensure explanations match option semantics.
 * - overbet mode → polar/aggressive explanations
 * - standard mode → value/protection explanations
 */
export function getMetaTemplate(
  handIntent: HandIntent,
  heroClass: HeroHandClass,
  feats: HandFeatures,
  turnType: TurnType,
  bettingMode: BettingMode = "standard",
): MetaTemplate {
  // Get base template
  let template: MetaTemplate;
  switch (handIntent) {
    case "made_value":
      template = getMadeValueTemplate(heroClass, feats, turnType);
      break;
    case "thin_value":
      template = getThinValueTemplate(feats, turnType);
      break;
    case "combo_draw":
      template = getComboDrawTemplate(feats, turnType);
      break;
    case "draw":
      template = getDrawTemplate(feats, turnType);
      break;
    case "pure_bluff":
      template = getPureBluffTemplate(turnType);
      break;
    case "give_up":
      template = getGiveUpTemplate(turnType);
      break;
    default:
      template = getThinValueTemplate(feats, turnType);
  }

  // FIXED: Adjust template based on bettingMode
  if (bettingMode === "overbet") {
    return adjustForOverbetMode(template, handIntent, heroClass);
  }

  return template;
}

/**
 * Adjust template for overbet mode.
 * Overbet explanations should emphasize range collapse and polarization.
 */
function adjustForOverbetMode(
  baseTemplate: MetaTemplate,
  handIntent: HandIntent,
  heroClass: HeroHandClass
): MetaTemplate {
  // Add overbet-specific concepts
  const concepts = [...baseTemplate.concepts];
  if (!concepts.includes("polar-bet")) {
    concepts.push("polar-bet");
  }
  if (!concepts.includes("range-collapse")) {
    concepts.push("range-collapse");
  }

  // Adjust summary for overbet context
  let summary = baseTemplate.summary;
  if (heroClass === "monster" && handIntent === "made_value") {
    summary = `With the nuts or near-nuts, hero can apply maximum pressure. The overbet targets villain's bluffcatchers and forces a commit-or-fold decision.`;
  }

  // Add overbet-specific solver note
  const solverNotes = [...baseTemplate.solverNotes];
  solverNotes.unshift("Overbet sizing polarizes hero's range to nuts + bluffs only.");

  return {
    concepts,
    summary,
    solverNotes: solverNotes.slice(0, 4),
  };
}

function getMadeValueTemplate(
  heroClass: HeroHandClass,
  feats: HandFeatures,
  turnType: TurnType,
): MetaTemplate {
  const handDesc = heroClass === "monster" ? "a very strong hand" : "a strong made hand";
  
  const turnDesc = turnType === "blank_turn" 
    ? "a relatively blank turn" 
    : turnType === "overcard_turn"
      ? "an overcard turn"
      : turnType === "straight_completer"
        ? "a straight-completing turn"
        : turnType === "flush_completer"
          ? "a flush-completing turn"
          : "a paired turn";

  return {
    concepts: ["value-max", "bet-sizing", "range-advantage"],
    summary: `With ${handDesc} on ${turnDesc}, focus on extracting value. Choose a sizing that keeps villain's calling range wide while building the pot.`,
    solverNotes: [
      `Hero has ${heroClass} strength.`,
      "Value sizing should target villain's medium-strength calling range.",
      turnType !== "blank_turn" 
        ? `The ${turnType.replace("_", " ")} may narrow villain's continuing range.`
        : "Board texture favors continued aggression.",
      "Avoid overbetting which folds out calls.",
    ],
  };
}

function getThinValueTemplate(
  feats: HandFeatures,
  turnType: TurnType,
): MetaTemplate {
  const hasExtraEquity = feats.hasFlushDraw || feats.straightDraw !== "none" || feats.comboDraw;
  const equityNote = hasExtraEquity
    ? "Hero also has backdoor/draw equity as backup."
    : "Hero has showdown value but limited equity if raised.";

  const turnRisk = turnType === "overcard_turn"
    ? "The overcard may have hit villain's range."
    : turnType === "straight_completer"
      ? "The straight-completing card adds caution."
      : turnType === "flush_completer"
        ? "The flush-completing turn warrants smaller sizing."
        : turnType === "paired_turn"
          ? "The paired board increases vulnerability to boats and trips."
          : "";

  // Special handling for vulnerable two pair on paired boards
  const isPairedBoard = turnType === "paired_turn";
  const vulnerabilityNote = isPairedBoard
    ? "Two pair on a paired board is vulnerable to many better hands."
    : "Medium-strength hands are vulnerable to stronger holdings.";

  return {
    concepts: ["thin-value", "protection-bet", "pot-control"],
    summary: isPairedBoard
      ? `With two pair on a paired board, hero should favor small protection bets or checking back. The hand is vulnerable but still benefits from denying equity.`
      : `With a medium-strength made hand, bet for thin value and protection. A smaller sizing keeps worse hands in while controlling the pot.`,
    solverNotes: [
      vulnerabilityNote,
      equityNote,
      turnRisk || "Board texture supports a protection bet.",
      "Large bets risk folding out worse and getting called only by better.",
    ].filter(Boolean) as string[],
  };
}

function getComboDrawTemplate(
  feats: HandFeatures,
  turnType: TurnType,
): MetaTemplate {
  const drawType = feats.isNutFlushDraw
    ? "nut flush draw"
    : feats.hasFlushDraw
      ? "flush draw"
      : "straight draw";

  const extraDraw = feats.comboDraw
    ? feats.straightDraw === "oesd"
      ? " combined with an open-ended straight draw"
      : " combined with a gutshot"
    : "";

  const turnNote = turnType === "straight_completer"
    ? "The turn increases straight density in IP's perceived range."
    : turnType === "flush_completer"
      ? "The turn increases flush density in IP's perceived range."
      : turnType === "overcard_turn"
        ? "The overcard strengthens IP's range perception on this runout."
        : turnType === "paired_turn"
          ? "The paired turn creates more nutted combos in IP's range."
          : "Continue applying range-based pressure on this runout.";

  return {
    concepts: ["high-equity-combo-draw", "semi-bluff", "range-advantage", "barrel-geometry"],
    summary: `With a ${drawType}${extraDraw}, leverage high equity to apply pressure. Betting builds fold equity while maintaining equity realization when called.`,
    solverNotes: [
      "Hero has a strong combo draw with multiple outs.",
      "Semi-bluffing with high equity is +EV even when called.",
      "Denying villain's equity realization is a key benefit.",
      turnNote,
    ],
  };
}

function getDrawTemplate(
  feats: HandFeatures,
  turnType: TurnType,
): MetaTemplate {
  const isNFD = feats.isNutFlushDraw;
  const isOESD = feats.straightDraw === "oesd";
  const isGutshot = feats.straightDraw === "gutshot";

  let drawDesc = "";
  if (feats.hasFlushDraw && isOESD) {
    drawDesc = isNFD ? "nut flush draw and open-ended straight draw" : "flush draw and open-ended straight draw";
  } else if (feats.hasFlushDraw) {
    drawDesc = isNFD ? "nut flush draw" : "flush draw";
  } else if (isOESD) {
    drawDesc = "open-ended straight draw";
  } else if (isGutshot) {
    drawDesc = "gutshot straight draw";
  } else {
    drawDesc = "drawing hand";
  }

  const sizingAdvice = isNFD || isOESD
    ? "can barrel with various sizes"
    : "should prefer smaller sizings";

  const equityDesc = isNFD || isOESD || feats.comboDraw
    ? "Hero has strong draw equity with multiple outs."
    : isGutshot
      ? "Hero has limited draw equity with few outs."
      : "Hero has some draw equity.";

  return {
    concepts: ["semi-bluff", "equity-realization", "barrel-geometry"],
    summary: `With a ${drawDesc}, hero ${sizingAdvice}. The goal is to win the pot now or realize equity when called.`,
    solverNotes: [
      `Hero has a ${drawDesc}.`,
      equityDesc,
      isGutshot && !feats.hasPair
        ? "Weak draws prefer checking or minimal sizing."
        : "Drawing hands benefit from fold equity.",
      turnType !== "blank_turn"
        ? `The ${turnType.replace("_", " ")} affects both ranges.`
        : "Continue with a sizing that balances risk and reward.",
    ],
  };
}

function getPureBluffTemplate(turnType: TurnType): MetaTemplate {
  // This should rarely be used since we filter out pure bluffs
  return {
    concepts: ["bluff", "range-leverage"],
    summary: `With no made hand and no draw, this is a pure bluff. Consider checking or giving up unless range advantage supports aggression.`,
    solverNotes: [
      "Hero has air with no meaningful equity.",
      "Pure bluffs require strong range advantage to be profitable.",
      turnType === "blank_turn"
        ? "Blank turns support continued aggression."
        : "Non-blank turns reduce bluffing profitability.",
      "Prefer checking with pure air.",
    ],
  };
}

/**
 * PHASE 1.1: Give up template for weak hands on dangerous boards.
 *
 * WHY THIS EXISTS:
 * - Bottom pair on straight completers / paired turns has minimal showdown value
 * - "Protection betting" is a strategic error here
 * - The correct play is check-fold or check-call depending on pot odds
 *
 * NOTE: Give up hands should be filtered before spot generation.
 * This template is a fallback if one somehow gets through.
 */
function getGiveUpTemplate(turnType: TurnType): MetaTemplate {
  return {
    concepts: ["pot-control", "showdown-value"],
    summary: `With a weak holding on a dangerous board, hero should check and evaluate. Betting risks building a pot we cannot win.`,
    solverNotes: [
      "Hero's hand has marginal showdown value at best.",
      "The board texture favors villain's range.",
      turnType !== "blank_turn"
        ? `The ${turnType.replace("_", " ")} makes aggression unprofitable.`
        : "Check and reassess on the river.",
      "Prefer check-fold to aggression with weak holdings.",
    ],
  };
}

