"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Instructions_1 = require("../codegen/Instructions");
const antiAlias_1 = require("./antiAlias");
const optimizers = [antiAlias_1.antialias];
function optimize(ctx) {
    let passes = ctx.getFnFiles().reduce((passes, fn) => passes + recurseOptimize(fn, ctx), 0);
    return {
        meta: {
            passes
        }
    };
}
exports.optimize = optimize;
function recurseOptimize(fn, ctx) {
    let allFailed;
    let passes = 0;
    do {
        allFailed = true;
        for (let opt of optimizers) {
            let res = opt(fn, ctx);
            if (res) {
                allFailed = false;
                passes++;
            }
        }
        if (allFailed) {
            let newPasses = 0;
            for (let instr of fn.get()) {
                if (instr.type != Instructions_1.InstrType.LOCAL_INVOKE)
                    continue;
                newPasses += recurseOptimize(instr.fn, ctx);
            }
            passes += newPasses;
            if (newPasses > 0)
                allFailed = false;
        }
    } while (!allFailed);
    return passes;
}
//# sourceMappingURL=instructionOptimizer.js.map