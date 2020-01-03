"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const other_1 = require("../toolbox/other");
function extractToken(decl) {
    switch (decl.type) {
        case DeclarationType.FUNCTION:
        case DeclarationType.VARIABLE:
            return decl.node.identifier;
        case DeclarationType.IMPLICIT_VARIABLE:
            return decl.token;
        default:
            return other_1.exhaust(decl);
    }
}
exports.extractToken = extractToken;
var DeclarationType;
(function (DeclarationType) {
    DeclarationType[DeclarationType["VARIABLE"] = 0] = "VARIABLE";
    DeclarationType[DeclarationType["IMPLICIT_VARIABLE"] = 1] = "IMPLICIT_VARIABLE";
    DeclarationType[DeclarationType["FUNCTION"] = 2] = "FUNCTION";
})(DeclarationType = exports.DeclarationType || (exports.DeclarationType = {}));
//# sourceMappingURL=Declaration.js.map