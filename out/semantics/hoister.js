"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AST_1 = require("../syntax/AST");
function hoist(pfile) {
    let symbols = pfile.getSymbolTable();
    let ast = pfile.getAST();
    for (let node of ast) {
        let shouldExport = false;
        switch (node.type) {
            case AST_1.ASTNodeType.EXPORT:
                shouldExport = true;
            case AST_1.ASTNodeType.FUNCTION:
                let fnnode = node;
                let fndecl = {
                    type: DeclarationType.FUNCTION,
                    node: node,
                    identifier: generateIdentifier()
                };
                symbols.declare(fnnode.identifier, fndecl);
                break;
            case AST_1.ASTNodeType.DEFINE:
                let defnode = node;
                let vardecl = {
                    type: DeclarationType.VARIABLE,
                    node: defnode,
                    identifier: generateIdentifier()
                };
                symbols.declare(defnode.identifier, vardecl);
                break;
            default:
                const exhaust = node;
        }
    }
}
exports.hoist = hoist;
//# sourceMappingURL=hoister.js.map