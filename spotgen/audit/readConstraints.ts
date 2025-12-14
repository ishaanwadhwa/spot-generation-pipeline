import fs from "fs";
import path from "path";
import type { RegenConstraints } from "./types";

export function readConstraintsFile(repoRoot: string, p?: string): RegenConstraints | undefined {
  if (!p) return undefined;
  const abs = path.isAbsolute(p) ? p : path.join(repoRoot, p);
  const txt = fs.readFileSync(abs, "utf8");
  return JSON.parse(txt) as RegenConstraints;
}


