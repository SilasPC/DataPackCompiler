"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DeclarationType;
(function (DeclarationType) {
    DeclarationType[DeclarationType["VARIABLE"] = 0] = "VARIABLE";
    DeclarationType[DeclarationType["FUNCTION"] = 1] = "FUNCTION";
})(DeclarationType = exports.DeclarationType || (exports.DeclarationType = {}));
function generateIdentifier() {
    return Math.random().toFixed(16).substr(2, 8);
}
exports.generateIdentifier = generateIdentifier;
//# sourceMappingURL=Declaration.js.map