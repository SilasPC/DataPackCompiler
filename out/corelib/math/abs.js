"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compileFunction_1 = require("./compileFunction");
const fn = `
fn abs(this:int): int {
	if (this < 0) this += -2 * this;
	return this;
}
`;
function createAbs(ctx) {
    compileFunction_1.compileCoreFunction(fn, 'abs', ctx);
}
exports.createAbs = createAbs;
//# sourceMappingURL=abs.js.map