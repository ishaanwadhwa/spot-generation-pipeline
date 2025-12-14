"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoRewrite = autoRewrite;
const validator_1 = require("../validator");
const auditSpot_1 = require("./auditSpot");
const auditors_1 = require("./auditors");
function autoRewrite(args) {
    const auditor = args.auditor ?? new auditors_1.RuleBasedAuditor();
    let constraints = {};
    let lastSpot = null;
    for (let attempt = 1; attempt <= args.maxAttempts; attempt++) {
        const spot = args.generate(constraints, args.seed + attempt);
        lastSpot = spot;
        const v = (0, validator_1.validateSpotOutput)(spot);
        if (!v.ok) {
            // If math fails, keep constraints and just try again (generator should be math-correct, so this is rare).
            continue;
        }
        const packet = (0, auditSpot_1.buildAuditPacketFromSpot)(args.repoRoot, spot);
        const newConstraints = auditor.audit(packet);
        if (Object.keys(newConstraints).length === 0) {
            return { spot, constraintsUsed: constraints, attempts: attempt };
        }
        constraints = auditor.merge(constraints, newConstraints);
    }
    if (!lastSpot)
        throw new Error("autoRewrite produced no spot");
    return { spot: lastSpot, constraintsUsed: constraints, attempts: args.maxAttempts };
}
