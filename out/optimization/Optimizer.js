"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const optimizers = [];
function optimize(dp, ctx) {
    let allFailed;
    let passes = 0;
    do {
        allFailed = true;
        for (let opt of optimizers) {
            let res = opt(dp, ctx);
            if (res.success) {
                allFailed = false;
                passes++;
            }
        }
    } while (!allFailed);
    return {
        meta: {
            passes
        }
    };
}
exports.optimize = optimize;
//# sourceMappingURL=Optimizer.js.map