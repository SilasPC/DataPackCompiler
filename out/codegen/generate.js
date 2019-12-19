"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const other_1 = require("../toolbox/other");
const Instructions_1 = require("../semantics/Instructions");
function generate(pf, ctx) {
    // ...
}
exports.generate = generate;
function generateTest(fn, ctx) {
    let output = [];
    for (let instr of fn.instructions) {
        switch (instr.type) {
            case Instructions_1.InstrType.INT_OP:
                if (!['=', '+=', '-=', '*=', '/=', '%='])
                    throw new Error('invalid int op');
                // if (!instr.into.mutable) throw new Error('not mutable boi')
                output.push(`scoreboard players operation ${instr.into.scoreboard.selector} ${instr.into.scoreboard.scoreboard} ${instr.op} ${instr.from.scoreboard.selector} ${instr.from.scoreboard.scoreboard}`);
                break;
            case Instructions_1.InstrType.INVOKE_INT:
                // TODO
                break;
            case Instructions_1.InstrType.INVOKE_VOID:
                // TODO
                break;
            case Instructions_1.InstrType.CMD:
                // TODO
                break;
            default:
                other_1.exhaust(instr);
        }
    }
    return output;
}
exports.generateTest = generateTest;
//# sourceMappingURL=generate.js.map