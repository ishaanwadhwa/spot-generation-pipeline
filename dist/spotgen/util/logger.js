"use strict";
/**
 * spotgen/util/logger.ts
 *
 * Simple file logger for spot generation process.
 * Logs to a timestamped file in the logs/ directory.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initLogger = initLogger;
exports.log = log;
exports.logSpotGeneration = logSpotGeneration;
exports.logSummary = logSummary;
exports.flushLog = flushLog;
exports.getLogFilePath = getLogFilePath;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
let logFilePath = null;
let logBuffer = [];
/**
 * Initialize the logger with a new log file.
 */
function initLogger(repoRoot, prefix = "generation") {
    const logsDir = path_1.default.join(repoRoot, "logs");
    if (!fs_1.default.existsSync(logsDir)) {
        fs_1.default.mkdirSync(logsDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    logFilePath = path_1.default.join(logsDir, `${prefix}_${timestamp}.log`);
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
function log(message) {
    const line = message;
    logBuffer.push(line);
    // Also print to console for visibility
    // eslint-disable-next-line no-console
    console.log(`[LOG] ${message}`);
}
/**
 * Log a spot generation result.
 */
function logSpotGeneration(spotId, data) {
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
function logSummary(total, passed, failed, startId, endId) {
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
function flushLog() {
    if (logFilePath && logBuffer.length > 0) {
        fs_1.default.writeFileSync(logFilePath, logBuffer.join("\n") + "\n", "utf8");
        // eslint-disable-next-line no-console
        console.log(`\n[LOG] Written to: ${logFilePath}`);
    }
}
/**
 * Get the current log file path.
 */
function getLogFilePath() {
    return logFilePath;
}
