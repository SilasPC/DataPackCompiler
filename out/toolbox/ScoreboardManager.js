"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ScoreboardManager {
    constructor() {
        this.globalStatic = 'globals';
        this.globalConst = 'constants';
        this.constants = new Map();
    }
    getStatic() {
        return {
            scoreboard: this.globalStatic,
            selector: Math.random().toString(16).substr(2, 8)
        };
    }
    getConstant(n) {
        if (n === false)
            n = 0;
        else if (n === true)
            n = 1;
        if (this.constants.has(n))
            return this.constants.get(n);
        if (!Number.isInteger(n))
            throw new Error('Can only use integer constant scores');
        let score = {
            scoreboard: this.globalConst,
            selector: Math.random().toString(16).substr(2, 8)
        };
        this.constants.set(n, score);
        return score;
    }
}
exports.ScoreboardManager = ScoreboardManager;
//# sourceMappingURL=ScoreboardManager.js.map