/**
 * spotgen/validate_seed_runner.ts
 *
 * Exposes validateSeed() for the CLI.
 */

import fs from "fs";
import path from "path";
import { validateSpotOutput } from "./validator";

function findGeneratedSpotsArrayLiteral(seedText: string): string {
  const anchor = seedText.indexOf("const generatedSpots");
  if (anchor === -1) throw new Error('Could not find "const generatedSpots" in seed.ts');

  const eq = seedText.indexOf("=", anchor);
  if (eq === -1) throw new Error('Could not find "=" after "const generatedSpots"');

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
      if (depth === 0) return seedText.slice(start, i + 1);
      if (depth < 0) throw new Error("Bracket matching went negative while parsing seed.ts");
    }
  }

  throw new Error("Unterminated generatedSpots array literal (no matching ']')");
}

function extractGeneratedSpots(seedText: string): unknown[] {
  const literal = findGeneratedSpotsArrayLiteral(seedText);
  // eslint-disable-next-line no-new-func
  const arr = Function(`"use strict"; return (${literal});`)() as unknown;
  if (!Array.isArray(arr)) throw new Error("generatedSpots is not an array");
  return arr;
}

export function validateSeed(): { total: number; ok: number; bad: number } {
  const seedPath = path.join(__dirname, "..", "..", "seed.ts");
  const txt = fs.readFileSync(seedPath, "utf8");
  const spots = extractGeneratedSpots(txt);

  let ok = 0;
  let bad = 0;
  for (const s of spots) {
    const res = validateSpotOutput(s);
    if (res.ok) ok++;
    else {
      bad++;
      // eslint-disable-next-line no-console
      console.error(`Spot ${(s as any)?.id || "<no id>"} invalid:`);
      for (const e of res.errors) console.error("  -", e);
    }
  }

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ total: spots.length, ok, bad }));
  return { total: spots.length, ok, bad };
}

/**
 * Extract a single spot by ID from seed.ts
 */
export function extractSpotById(id: string): unknown | null {
  const seedPath = path.join(__dirname, "..", "..", "seed.ts");
  const txt = fs.readFileSync(seedPath, "utf8");
  const spots = extractGeneratedSpots(txt);
  return spots.find((s: any) => s?.id === id) || null;
}


