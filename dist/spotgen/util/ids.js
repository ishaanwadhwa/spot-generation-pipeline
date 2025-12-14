"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSpotId = parseSpotId;
exports.formatSpotId = formatSpotId;
function parseSpotId(id) {
    const m = id.match(/^s(\d+)$/);
    if (!m)
        throw new Error(`Invalid spot id: ${id}`);
    return parseInt(m[1], 10);
}
function formatSpotId(n) {
    return `s${String(n).padStart(3, "0")}`;
}
