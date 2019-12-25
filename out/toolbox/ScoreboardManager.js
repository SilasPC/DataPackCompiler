"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const other_1 = require("./other");
class ScoreboardManager {
    constructor(options) {
        this.options = options;
        this.constants = new Map();
        this.globals = new Set();
        [this.globalStatic, this.globalConst] =
            options.obscureNames ?
                [this.generateObscure(), this.generateObscure()] :
                [this.generateName(['globals']), this.generateName(['constants'])];
    }
    getStatic(names, scope) {
        let resNames;
        if (Array.isArray(names)) {
            resNames = [...names];
        }
        else {
            if (!scope)
                throw new Error('scope arg should be provided in overload ??');
            resNames = [...scope.getScopeNames(), names];
        }
        let ret = {
            scoreboard: this.globalStatic,
            selector: this.options.obscureNames ?
                this.generateObscure() :
                this.generateName(resNames)
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
        let name = other_1.getObscureName(this.globals);
        this.globals.add(name);
        return name;
    }
    generateName(names) {
        let name = other_1.getQualifiedName(names, this.globals, 16);
        this.globals.add(name);
        return name;
    }
}
exports.ScoreboardManager = ScoreboardManager;
//# sourceMappingURL=ScoreboardManager.js.map