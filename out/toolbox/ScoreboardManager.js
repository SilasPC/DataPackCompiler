"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ScoreboardManager {
    constructor(options) {
        this.options = options;
        this.globalStatic = 'globals';
        this.globalConst = 'constants';
        this.constants = new Map();
        this.globals = new Set();
    }
    getStatic(name, scope) {
        let ret = {
            scoreboard: this.globalStatic,
            selector: this.options.obscureNames ?
                this.generateObscure() :
                this.generateName(scope.getScopeNames().concat(name))
        };
        this.globals.add(ret.selector);
        return ret;
    }
    getConstant(n) {
        if (this.constants.has(n))
            return this.constants.get(n);
        if (!Number.isInteger(n))
            throw new Error('Can only use integer constant scores');
        let score = {
            scoreboard: this.globalConst,
            selector: this.options.obscureNames ?
                this.generateObscure() :
                n.toString()
        };
        this.constants.set(n, score);
        return score;
    }
    generateObscure() {
        while (true) {
            let name = Math.random().toString(16).substr(2, 8);
            if (!this.globals.has(name))
                return name;
        }
    }
    generateName(names) {
        let name = names.join('_');
        if (name.length > 16) {
            name = name.replace(/[aeyuio]/g, '');
            names = names.slice(-16);
        }
        if (!this.globals.has(name)) {
            this.globals.add(name);
            return name;
        }
        let nr = 1;
        while (true) {
            let name2 = name + nr++;
            if (name2.length > 16)
                name2 = name2.slice(-16);
            if (!this.globals.has(name2)) {
                this.globals.add(name2);
                return name2;
            }
        }
    }
}
exports.ScoreboardManager = ScoreboardManager;
//# sourceMappingURL=ScoreboardManager.js.map