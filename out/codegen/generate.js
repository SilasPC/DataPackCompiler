"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const other_1 = require("../toolbox/other");
const Instructions_1 = require("./Instructions");
function generate(fn) {
    let output = [];
    for (let instr of fn.get()) {
        switch (instr.type) {
            case Instructions_1.InstrType.INT_OP:
                if (!['=', '+=', '-=', '*=', '/=', '%='])
                    throw new Error('invalid int op');
                output.push(`scoreboard players operation ${instr.into.scoreboard.selector} ${instr.into.scoreboard.scoreboard} ${instr.op} ${instr.from.scoreboard.selector} ${instr.from.scoreboard.scoreboard}`);
                break;
            case Instructions_1.InstrType.INVOKE:
                output.push(`function tmp:${instr.fn.name}`);
                break;
            case Instructions_1.InstrType.LOCAL_INVOKE:
                output.push(`function tmp:${instr.fn.name}`);
                break;
            case Instructions_1.InstrType.CMD:
                output.push('#cmd');
                // TODO
                break;
            default:
                return other_1.exhaust(instr);
        }
    }
    return output;
}
exports.generate = generate;
function generateTest(fn, ctx) {
    let output = [];
    for (let instr of fn.fn.get()) {
        switch (instr.type) {
            case Instructions_1.InstrType.INT_OP:
                if (!['=', '+=', '-=', '*=', '/=', '%='])
                    throw new Error('invalid int op');
                output.push(`scoreboard players operation ${instr.into.scoreboard.selector} ${instr.into.scoreboard.scoreboard} ${instr.op} ${instr.from.scoreboard.selector} ${instr.from.scoreboard.scoreboard}`);
                break;
            case Instructions_1.InstrType.INVOKE:
                output.push(`function tmp:${instr.fn.name}`);
                break;
            case Instructions_1.InstrType.LOCAL_INVOKE:
                output.push(`function tmp:${instr.fn.name}`);
                break;
            case Instructions_1.InstrType.CMD:
                output.push('#cmd');
                // TODO
                break;
            default:
                return other_1.exhaust(instr);
        }
    }
    return output;
}
exports.generateTest = generateTest;
//# sourceMappingURL=generate.js.map