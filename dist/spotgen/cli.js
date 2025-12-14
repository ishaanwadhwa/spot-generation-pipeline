"use strict";
/**
 * spotgen/cli.ts
 *
 * Minimal TS CLI (no deps) to orchestrate generation + validation.
 *
 * Commands:
 * - validate-seed: validate generatedSpots in seed.ts
 * - generate: generate N spots of a given type and append to seed.ts
 *
 * Later:
 * - difficulty ramp + more templates
 */
Object.defineProperty(exports, "__esModule", { value: true });
const validate_seed_runner_1 = require("./validate_seed_runner");
const seedWriter_1 = require("./util/seedWriter");
const ids_1 = require("./util/ids");
const srp_universal_1 = require("./templates/srp_universal");
const repair_seed_1 = require("./repair/repair_seed");
const auditSpot_1 = require("./audit/auditSpot");
const validator_1 = require("./validator");
const auditors_1 = require("./audit/auditors");
const logger_1 = require("./util/logger");
const classify_1 = require("./poker/classify");
const handFeatures_1 = require("./poker/handFeatures");
const intent_1 = require("./poker/intent");
const turnClassify_1 = require("./poker/turnClassify");
const llmAuditPacket_1 = require("./audit/llmAuditPacket");
function usage() {
    // eslint-disable-next-line no-console
    console.error([
        "Usage:",
        "  spotgen validate-seed",
        "  spotgen repair-seed",
        "  spotgen audit-spot --id s502",
        "  spotgen llm-audit --id s527              ← LLM audit packet for existing spot",
        "  spotgen preview-spot --type srp_universal --hero BTN --villain BB --street t --id s505 [--seed 123]",
        "  spotgen commit-spot  (reads spot JSON from stdin)",
        "  spotgen generate --type srp_universal --hero BTN --villain BB --street t --count N --startId s501 [--seed 123]",
        "",
        "Workflow (with LLM audit):",
        "  1. spotgen preview-spot ... > spot.json   # Generate preview",
        "  2. spotgen llm-audit --id s527            # Get LLM audit packet",
        "  3. [LLM reviews and replies APPROVE/REJECT/REFINE]",
        "  4. spotgen commit-spot < spot.json        # Commit if approved",
        "",
        "Options:",
        "  --type       Template type (srp_universal)",
        "  --hero       Hero position (UTG, MP, CO, BTN, SB, BB)",
        "  --villain    Villain position (UTG, MP, CO, BTN, SB, BB)",
        "  --street     Street (f=flop, t=turn, r=river)",
        "  --difficulty Difficulty 1-10 (default 6)",
        "",
        "Notes:",
        "  This CLI is compiled via `npm run build` and run from dist/.",
    ].join("\n"));
    process.exit(1);
}
function argValue(flag) {
    const idx = process.argv.indexOf(flag);
    if (idx === -1)
        return undefined;
    return process.argv[idx + 1];
}
function parsePosition(pos) {
    const valid = ["UTG", "MP", "CO", "BTN", "SB", "BB"];
    const upper = (pos || "").toUpperCase();
    if (!valid.includes(upper)) {
        throw new Error(`Invalid position: ${pos}. Must be one of: ${valid.join(", ")}`);
    }
    return upper;
}
function parseStreet(s) {
    if (s === "f" || s === "flop")
        return "f";
    if (s === "t" || s === "turn")
        return "t";
    if (s === "r" || s === "river")
        return "r";
    throw new Error(`Invalid street: ${s}. Must be f, t, r (or flop, turn, river)`);
}
function isHeroIP(hero, villain) {
    // POSTFLOP position order (who acts LAST is IP)
    // SB acts first, then BB, then UTG...BTN acts last (most IP)
    const postflopOrder = ["SB", "BB", "UTG", "MP", "CO", "BTN"];
    // Higher index = acts later = more in position
    return postflopOrder.indexOf(hero) > postflopOrder.indexOf(villain);
}
async function main() {
    const cmd = process.argv[2];
    if (!cmd)
        usage();
    if (cmd === "validate-seed") {
        const res = (0, validate_seed_runner_1.validateSeed)();
        process.exit(res.bad === 0 ? 0 : 1);
    }
    if (cmd === "repair-seed") {
        const repoRoot = process.cwd();
        const res = (0, repair_seed_1.repairSeedInPlace)(repoRoot);
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(res));
        process.exit(0);
    }
    if (cmd === "audit-spot") {
        const id = argValue("--id");
        if (!id)
            usage();
        const repoRoot = process.cwd();
        const packet = (0, auditSpot_1.auditSpotById)(repoRoot, id);
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(packet, null, 2));
        process.exit(0);
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // LLM AUDIT COMMAND
    // ═══════════════════════════════════════════════════════════════════════════
    // This command outputs a formatted packet for LLM review.
    // The LLM (Cursor Agent) reviews and replies: APPROVE / REJECT / REFINE
    // ═══════════════════════════════════════════════════════════════════════════
    if (cmd === "llm-audit") {
        const id = argValue("--id");
        if (!id)
            usage();
        const repoRoot = process.cwd();
        const spot = (0, validate_seed_runner_1.extractSpotById)(id);
        if (!spot) {
            // eslint-disable-next-line no-console
            console.error(`Spot ${id} not found in seed.ts`);
            process.exit(1);
        }
        const packet = (0, llmAuditPacket_1.buildLLMAuditPacket)(repoRoot, spot);
        const formatted = (0, llmAuditPacket_1.formatLLMAuditPacket)(packet);
        // eslint-disable-next-line no-console
        console.log(formatted);
        process.exit(0);
    }
    if (cmd === "preview-spot") {
        const type = argValue("--type") || "srp_universal";
        const id = argValue("--id");
        const seedStr = argValue("--seed");
        const maxAttemptsStr = argValue("--maxAttempts");
        const difficultyStr = argValue("--difficulty");
        const heroStr = argValue("--hero") || "BTN";
        const villainStr = argValue("--villain") || "BB";
        const streetStr = argValue("--street") || "t";
        if (!id)
            usage();
        const base = seedStr ? parseInt(seedStr, 10) : Date.now();
        const maxAttempts = maxAttemptsStr ? parseInt(maxAttemptsStr, 10) : 50;
        const difficulty = difficultyStr ? parseInt(difficultyStr, 10) : 6;
        const repoRoot = process.cwd();
        // Parse positions
        const heroPosition = parsePosition(heroStr);
        const villainPosition = parsePosition(villainStr);
        const street = parseStreet(streetStr);
        const heroIsIP = isHeroIP(heroPosition, villainPosition);
        // Supported types
        if (type !== "srp_universal") {
            throw new Error(`Unknown type: ${type}. Supported: srp_universal`);
        }
        // Pre-audit loop: generate → rule-based audit → retry if needed
        const auditor = new auditors_1.RuleBasedAuditor();
        let spot = null;
        let linePattern = "unknown";
        let constraints = {};
        let attempts = 0;
        let lastRejection = "";
        for (attempts = 1; attempts <= maxAttempts; attempts++) {
            const result = (0, srp_universal_1.tryGenerateUniversalSpot)({
                repoRoot,
                id,
                seed: base + attempts - 1,
                street,
                heroPosition,
                villainPosition,
                heroIsIP,
                difficulty,
            });
            if (!result.spot) {
                lastRejection = result.reason || "Generation failed";
                continue;
            }
            // Validate math
            const validation = (0, validator_1.validateSpotOutput)(result.spot);
            if (!validation.ok) {
                lastRejection = `Math validation failed: ${validation.errors.join(", ")}`;
                continue;
            }
            // Run rule-based audit
            const packet = (0, auditSpot_1.buildAuditPacketFromSpot)(repoRoot, result.spot);
            const auditResult = auditor.audit(packet);
            if (Object.keys(auditResult).length === 0) {
                spot = result.spot;
                linePattern = result.linePattern || "unknown";
                break;
            }
            constraints = auditor.merge(constraints, auditResult);
            lastRejection = `Audit constraints: ${JSON.stringify(auditResult)}`;
        }
        if (!spot) {
            // eslint-disable-next-line no-console
            console.error(JSON.stringify({
                error: "Failed to generate valid spot",
                attempts,
                lastRejection,
                constraintsAccumulated: constraints,
            }, null, 2));
            process.exit(1);
        }
        // Build final audit packet for display
        const packet = (0, auditSpot_1.buildAuditPacketFromSpot)(repoRoot, spot);
        const validation = (0, validator_1.validateSpotOutput)(spot);
        // eslint-disable-next-line no-console
        console.log(JSON.stringify({
            spot,
            features: packet.features,
            linePattern,
            validation: { ok: validation.ok, errors: validation.errors },
            generationStats: { attempts, constraintsUsed: constraints },
        }, null, 2));
        process.exit(validation.ok ? 0 : 1);
    }
    if (cmd === "commit-spot") {
        const repoRoot = process.cwd();
        // Read spot JSON from stdin
        let input = "";
        const stdin = process.stdin;
        stdin.setEncoding("utf8");
        for await (const chunk of stdin) {
            input += chunk;
        }
        const spot = JSON.parse(input.trim());
        const validation = (0, validator_1.validateSpotOutput)(spot);
        if (!validation.ok) {
            // eslint-disable-next-line no-console
            console.error("Spot failed validation:");
            for (const e of validation.errors)
                console.error("  -", e);
            process.exit(1);
        }
        (0, seedWriter_1.appendSpotsToSeed)(repoRoot, [spot]);
        // eslint-disable-next-line no-console
        console.log(JSON.stringify({ committed: spot.id }));
        process.exit(0);
    }
    if (cmd === "generate") {
        const type = argValue("--type") || "srp_universal";
        const countStr = argValue("--count");
        const startId = argValue("--startId");
        const seedStr = argValue("--seed");
        const difficultyStr = argValue("--difficulty");
        const heroStr = argValue("--hero") || "BTN";
        const villainStr = argValue("--villain") || "BB";
        const streetStr = argValue("--street") || "t";
        if (!countStr || !startId)
            usage();
        const count = parseInt(countStr, 10);
        const base = seedStr ? parseInt(seedStr, 10) : Date.now();
        const difficulty = difficultyStr ? parseInt(difficultyStr, 10) : 6;
        const startN = (0, ids_1.parseSpotId)(startId);
        // Parse positions
        const heroPosition = parsePosition(heroStr);
        const villainPosition = parsePosition(villainStr);
        const street = parseStreet(streetStr);
        const heroIsIP = isHeroIP(heroPosition, villainPosition);
        const repoRoot = process.cwd();
        const spots = [];
        // Initialize logger
        const logFile = (0, logger_1.initLogger)(repoRoot, `generate_${type}`);
        (0, logger_1.log)(`Starting generation of ${count} spots (type: ${type})`);
        (0, logger_1.log)(`Hero: ${heroPosition}, Villain: ${villainPosition}, Street: ${street}`);
        (0, logger_1.log)(`Start ID: ${startId}, Seed base: ${base}`);
        let passed = 0;
        let failed = 0;
        for (let i = 0; i < count; i++) {
            const id = (0, ids_1.formatSpotId)(startN + i);
            const seed = base + i;
            if (type !== "srp_universal") {
                throw new Error(`Unknown type: ${type}`);
            }
            const result = (0, srp_universal_1.tryGenerateUniversalSpot)({
                repoRoot,
                id,
                seed,
                street,
                heroPosition,
                villainPosition,
                heroIsIP,
                difficulty,
            });
            if (result.spot) {
                const spot = result.spot;
                const validation = (0, validator_1.validateSpotOutput)(spot);
                // Extract classifications for logging
                const brd = spot.data.brd;
                const flop = [brd[0], brd[1], brd[2]];
                const turn = brd.length > 3 ? brd[3] : null;
                const hero = spot.data.hero.hand;
                // Compute turnType first (needed for Phase 1.1 aware classification)
                const turnType = turn ? (0, turnClassify_1.classifyTurn)(flop, turn) : "blank_turn";
                const heroClass = (0, classify_1.classifyHeroHandOnBoard)(hero, brd, turnType);
                const feats = (0, handFeatures_1.computeHandFeatures)(hero, brd);
                const pairQuality = (0, classify_1.getPairQuality)(hero, brd);
                const handIntent = (0, intent_1.classifyHandIntentWithContext)(heroClass, feats, pairQuality, turnType);
                const nodeIntent = (0, intent_1.inferNodeIntent)(spot);
                // Format options for logging
                const optStrings = spot.data.opts.map((o) => {
                    if (o[0] === "x")
                        return "check";
                    if (o[0] === "b")
                        return `bet ${o[1]}%`;
                    return String(o[0]);
                });
                (0, logger_1.logSpotGeneration)(id, {
                    seed,
                    attempts: 1,
                    heroHand: hero,
                    board: brd,
                    heroClass,
                    handIntent,
                    turnType,
                    nodeIntent,
                    frequencies: spot.data.meta?.freq || [],
                    options: optStrings,
                    bestIdx: spot.data.sol.b,
                    difficulty: spot.difficulty,
                    concepts: spot.data.meta?.concept || [],
                    validationOk: validation.ok,
                    validationErrors: validation.errors,
                });
                if (validation.ok) {
                    spots.push(spot);
                    passed++;
                }
                else {
                    failed++;
                    (0, logger_1.log)(`  ⚠️ Spot ${id} failed validation, not appending`);
                }
            }
            else {
                failed++;
                (0, logger_1.log)(`  ⚠️ Spot ${id} generation failed: ${result.reason}`);
            }
        }
        // Log summary
        (0, logger_1.logSummary)(count, passed, failed, startId, (0, ids_1.formatSpotId)(startN + count - 1));
        // Append valid spots
        if (spots.length > 0) {
            (0, seedWriter_1.appendSpotsToSeed)(repoRoot, spots);
        }
        (0, logger_1.flushLog)();
        // eslint-disable-next-line no-console
        console.log(JSON.stringify({
            appended: spots.length,
            passed,
            failed,
            startId,
            endId: (0, ids_1.formatSpotId)(startN + count - 1),
            logFile,
        }));
        return;
    }
    usage();
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
