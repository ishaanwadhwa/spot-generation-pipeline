import fs from "fs";
import path from "path";
import { validateSpotOutput, type SpotOutputLike } from "../validator";
import { repairSpotMath } from "./repairSpot";

function findGeneratedSpotsArrayLiteralRange(seedText: string): { start: number; end: number } {
  const anchor = seedText.indexOf("export const generatedSpots");
  if (anchor === -1) throw new Error('Could not find "export const generatedSpots" in seed.ts');

  const eq = seedText.indexOf("=", anchor);
  if (eq === -1) throw new Error('Could not find "=" after "export const generatedSpots"');

  const start = seedText.indexOf("[", eq);
  if (start === -1) throw new Error("Could not find '[' starting generatedSpots array");

  let i = start;
  let depth = 0;
  let inS = false;
  let inD = false;
  let inT = false;
  let inLineComment = false;
  let inBlockComment = false;
  let esc = false;

  for (; i < seedText.length; i++) {
    const c = seedText[i];
    const n = seedText[i + 1];

    if (inLineComment) {
      if (c === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (c === "*" && n === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (inS || inD || inT) {
      if (esc) {
        esc = false;
        continue;
      }
      if (c === "\\") {
        esc = true;
        continue;
      }
      if (inS && c === "'") inS = false;
      else if (inD && c === '"') inD = false;
      else if (inT && c === "`") inT = false;
      continue;
    }

    if (c === "/" && n === "/") {
      inLineComment = true;
      i++;
      continue;
    }
    if (c === "/" && n === "*") {
      inBlockComment = true;
      i++;
      continue;
    }

    if (c === "'") {
      inS = true;
      continue;
    }
    if (c === '"') {
      inD = true;
      continue;
    }
    if (c === "`") {
      inT = true;
      continue;
    }

    if (c === "[") depth++;
    if (c === "]") {
      depth--;
      if (depth === 0) return { start, end: i + 1 };
      if (depth < 0) throw new Error("Bracket matching went negative while parsing seed.ts");
    }
  }

  throw new Error("Unterminated generatedSpots array literal (no matching ']')");
}

export function repairSeedInPlace(repoRoot: string): { repaired: number; total: number } {
  const seedPath = path.join(repoRoot, "seed.ts");
  const txt = fs.readFileSync(seedPath, "utf8");
  const { start, end } = findGeneratedSpotsArrayLiteralRange(txt);
  const arrayLiteral = txt.slice(start, end);

  // eslint-disable-next-line no-new-func
  const existing = Function(`"use strict"; return (${arrayLiteral});`)() as unknown;
  if (!Array.isArray(existing)) throw new Error("generatedSpots is not an array");

  let repaired = 0;
  const fixed = existing.map((s: any) => {
    const before = validateSpotOutput(s);
    if (before.ok) return s;
    repaired++;
    return repairSpotMath(s as SpotOutputLike);
  });

  const replacement = JSON.stringify(fixed, null, 2);
  const out = txt.slice(0, start) + replacement + txt.slice(end);
  fs.writeFileSync(seedPath, out, "utf8");

  return { repaired, total: fixed.length };
}


