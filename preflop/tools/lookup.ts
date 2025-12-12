import fs from "fs";
import path from "path";
import { expandPattern } from "./expandRanges";

export function loadJSON(p: string) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "..", p), "utf8"));
}

export function lookupRFI(pos: string) {
  const json = loadJSON(`rfi/${pos}.json`);
  return json;
}

export function getFacing(matchup: string) {
  const json = loadJSON(`facing/${matchup}.json`);
  return json;
}

export function getExpandedHandsForBucket(obj: any, bucket: string) {
  const list = obj.hands[bucket];
  if (!list) return [];
  const acc = [];
  for (const p of list) {
    const expanded = expandPattern(p);
    acc.push(...expanded);
  }
  return acc;
}
