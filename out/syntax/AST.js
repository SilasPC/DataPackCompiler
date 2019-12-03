"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Add expression wrapper?
var ASTNodeType;
(function (ASTNodeType) {
    ASTNodeType[ASTNodeType["EXPORT"] = 0] = "EXPORT";
    ASTNodeType[ASTNodeType["DEFINE"] = 1] = "DEFINE";
    ASTNodeType[ASTNodeType["FUNCTION"] = 2] = "FUNCTION";
    ASTNodeType[ASTNodeType["INVOKATION"] = 3] = "INVOKATION";
    ASTNodeType[ASTNodeType["CONDITIONAL"] = 4] = "CONDITIONAL";
    ASTNodeType[ASTNodeType["IDENTIFIER"] = 5] = "IDENTIFIER";
    ASTNodeType[ASTNodeType["PRIMITIVE"] = 6] = "PRIMITIVE";
    ASTNodeType[ASTNodeType["OPERATION"] = 7] = "OPERATION";
    ASTNodeType[ASTNodeType["COMMAND"] = 8] = "COMMAND";
    ASTNodeType[ASTNodeType["LIST"] = 9] = "LIST";
})(ASTNodeType = exports.ASTNodeType || (exports.ASTNodeType = {}));
//# sourceMappingURL=AST.js.map