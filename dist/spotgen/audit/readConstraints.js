"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readConstraintsFile = readConstraintsFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function readConstraintsFile(repoRoot, p) {
    if (!p)
        return undefined;
    const abs = path_1.default.isAbsolute(p) ? p : path_1.default.join(repoRoot, p);
    const txt = fs_1.default.readFileSync(abs, "utf8");
    return JSON.parse(txt);
}
