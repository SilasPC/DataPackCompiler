"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Instructions_1 = require("../codegen/Instructions");
const other_1 = require("../toolbox/other");
function replaceInt(target, replacee, instrs) {
    for (let instr of instrs) {
        switch (instr.type) {
            case Instructions_1.InstrType.INT_OP:
                if (instr.from == target)
                    instr.from == replacee;
                if (instr.into == target)
                    instr.into = replacee;
                break;
            case Instructions_1.InstrType.CMD:
                console.log('warning: need cmd esr interface');
                break;
            case Instructions_1.InstrType.LOCAL_INVOKE:
                replaceInt(target, replacee, instr.fn.get());
                break;
            case Instructions_1.InstrType.INVOKE:
                break;
            default:
                return other_1.exhaust(instr);
        }
    }
}
exports.replaceInt = replaceInt;
function findLocalIntLifeSpans(instrs) {
    // Find all IntESR mutations on temporary variables
    let tmps = instrs.flatMap((I, i) => {
        let esr = extractIntESRs(I);
        if (esr)
            return [[...esr, i]];
        return [];
    });
    // Find alias lifespan (in case var is reused / overwritten later)
    let lifespans = tmps.map(([into, from, i]) => {
        let indices = tmps.filter(([esr2, _, j]) => into == esr2 && j > i).map(x => x[2]);
        let j = Math.min(...indices, instrs.length - 1);
        return [into, from, i, j];
    });
    // Filter out ones that get mutated during lifespan
    let aliases = lifespans.filter(([into, from, i, j]) => !isMutated(into, instrs.slice(i + 1, j)));
    // console.log(tmps,lifespans)
    return aliases;
}
exports.findLocalIntLifeSpans = findLocalIntLifeSpans;
function isMutated(esr, instrs) {
    for (let instr of instrs) {
        switch (instr.type) {
            case Instructions_1.InstrType.INT_OP:
                if (instr.into == esr)
                    return true;
                break;
            case Instructions_1.InstrType.LOCAL_INVOKE:
                if (isMutated(esr, instr.fn.get()))
                    return true;
                break;
            case Instructions_1.InstrType.CMD:
                console.log('warning: cmds need an esr interface');
            case Instructions_1.InstrType.INVOKE:
                break;
            default:
                return other_1.exhaust(instr);
        }
    }
    return false;
}
function extractIntESRs(I) {
    if (I.type == Instructions_1.InstrType.INT_OP && I.into.tmp && I.op == '=')
        return [I.into, I.from];
    return null;
}
//# sourceMappingURL=helpers.js.map