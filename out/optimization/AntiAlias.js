"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Instructions_1 = require("../semantics/Instructions");
/** Removes local variables that act as aliases */
function test(instrs) {
    // Find int assignations to temporary variables
    let tmps = instrs.flatMap((I, i) => (I.type == Instructions_1.InstrType.INT_OP && I.into.tmp && I.op == '=') ? [[I, i]] : []);
    // Find alias lifespan (in case var is reused / overwritten later)
    let lifespans = tmps.map(([I, i]) => {
        let indices = tmps.filter(([I2, j]) => I == I2 && j > i).map(x => x[1]);
        let j = Math.min(...indices, instrs.length - 1);
        return [I, i, j];
    });
    // Filter out ones that get mutated during lifespan
    let aliases = lifespans.filter(([I, i, j]) => !instrs.slice(i + 1, j).some(I2 => I2.type == Instructions_1.InstrType.INT_OP && I2.into == I.into));
    console.log('antialias', ...aliases.map(x => [x[0].into.scoreboard.selector, x[1], x[2]]));
    return { success: aliases.length > 0 };
}
exports.test = test;
//# sourceMappingURL=antiAlias.js.map