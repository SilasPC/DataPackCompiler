"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ScoreboardManager {
    constructor() {
        this.scoreboard = 'the_scoreboard';
        this.constants = new Map();
    }
    getStatic(node) {
        let decl = {
            type: DeclarationType.SCORE,
            node,
            scoreboard: this.scoreboard,
            selector: generateIdentifier()
        };
        return decl;
    }
    getConstant(n) {
        if (this.constants.has(n))
            return this.constants.get(n);
        if (!Number.isInteger(n))
            throw new Error('Can only use integer constant scores');
        let decl = {
            type: DeclarationType.SCORE,
            node: null,
            scoreboard: this.scoreboard,
            selector: generateIdentifier()
        };
        this.constants.set(n, decl);
        return decl;
    }
}
exports.ScoreboardManager = ScoreboardManager;
//# sourceMappingURL=ScoreboardManager.js.map