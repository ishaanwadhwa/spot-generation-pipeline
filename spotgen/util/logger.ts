/**
 * spotgen/util/logger.ts
 *
 * Simple file logger for spot generation process.
 * Logs to a timestamped file in the logs/ directory.
 */

import fs from "fs";
import path from "path";

let logFilePath: string | null = null;
let logBuffer: string[] = [];

/**
 * Initialize the logger with a new log file.
 */
export function initLogger(repoRoot: string, prefix: string = "generation"): string {
  const logsDir = path.join(repoRoot, "logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  logFilePath = path.join(logsDir, `${prefix}_${timestamp}.log`);
  logBuffer = [];

  log("=".repeat(60));
  log(`Spot Generation Log - ${new Date().toISOString()}`);
  log("=".repeat(60));
  log("");

  return logFilePath;
}

/**
 * Log a message to the current log file.
 */
export function log(message: string): void {
  const line = message;
  logBuffer.push(line);

  // Also print to console for visibility
  // eslint-disable-next-line no-console
  console.log(`[LOG] ${message}`);
}

/**
 * Log a spot generation result.
 */
export function logSpotGeneration(spotId: string, data: {
  seed: number;
  attempts: number;
  heroHand: string[];
  board: string[];
  heroClass: string;
  handIntent: string;
  turnType: string;
  nodeIntent: string;
  frequencies: number[];
  options: string[];
  bestIdx: number;
  difficulty: number;
  concepts: string[];
  validationOk: boolean;
  validationErrors?: string[];
}): void {
  log("");
  log("-".repeat(60));
  log(`SPOT: ${spotId}`);
  log("-".repeat(60));
  log(`  Seed: ${data.seed}`);
  log(`  Attempts: ${data.attempts}`);
  log("");
  log(`  Hero: ${data.heroHand.join(" ")}`);
  log(`  Board: ${data.board.join(" ")}`);
  log("");
  log(`  Classifications:`);
  log(`    heroClass:  ${data.heroClass}`);
  log(`    handIntent: ${data.handIntent}`);
  log(`    turnType:   ${data.turnType}`);
  log(`    nodeIntent: ${data.nodeIntent}`);
  log("");
  log(`  Options: ${data.options.join(" | ")}`);
  log(`  Frequencies: ${data.frequencies.map(f => f.toFixed(2)).join(" | ")}`);
  log(`  Best: index ${data.bestIdx}`);
  log("");
  log(`  Difficulty: ${data.difficulty}`);
  log(`  Concepts: ${data.concepts.join(", ")}`);
  log("");
  log(`  Validation: ${data.validationOk ? "✓ PASS" : "✗ FAIL"}`);
  if (data.validationErrors && data.validationErrors.length > 0) {
    for (const err of data.validationErrors) {
      log(`    - ${err}`);
    }
  }
  log("-".repeat(60));
}

/**
 * Log a summary of the generation run.
 */
export function logSummary(total: number, passed: number, failed: number, startId: string, endId: string): void {
  log("");
  log("=".repeat(60));
  log("GENERATION SUMMARY");
  log("=".repeat(60));
  log(`  Total generated: ${total}`);
  log(`  Passed: ${passed}`);
  log(`  Failed: ${failed}`);
  log(`  ID range: ${startId} - ${endId}`);
  log("=".repeat(60));
}

/**
 * Flush the log buffer to file.
 */
export function flushLog(): void {
  if (logFilePath && logBuffer.length > 0) {
    fs.writeFileSync(logFilePath, logBuffer.join("\n") + "\n", "utf8");
    // eslint-disable-next-line no-console
    console.log(`\n[LOG] Written to: ${logFilePath}`);
  }
}

/**
 * Get the current log file path.
 */
export function getLogFilePath(): string | null {
  return logFilePath;
}

