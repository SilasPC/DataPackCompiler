"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AST_1 = require("../syntax/AST");
const Declaration_1 = require("./Declaration");
const Types_1 = require("./Types");
function hoist(pfile) {
    let symbols = pfile.getSymbolTable();
    let ast = pfile.getAST();
    for (let node of ast) {
        let shouldExport = false;
        if (node.type == AST_1.ASTNodeType.EXPORT) {
            shouldExport = true;
            node = node.node;
        }
        switch (node.type) {
            case AST_1.ASTNodeType.EXPORT:
                throw new Error('invalid ast structure');
            case AST_1.ASTNodeType.FUNCTION:
                let fndecl = {
                    type: Declaration_1.DeclarationType.FUNCTION,
                    node: node,
                    returnType: Types_1.tokenToType(node.returnType, symbols)
                };
                symbols.declare(node.identifier, fndecl);
                pfile.addExport(node.identifier.value, fndecl);
                break;
            case AST_1.ASTNodeType.DEFINE:
                let vardecl = {
                    type: Declaration_1.DeclarationType.VARIABLE,
                    node: node,
                    varType: Types_1.tokenToType(node.varType, symbols)
                };
                symbols.declare(node.identifier, vardecl);
                pfile.addExport(node.identifier.value, vardecl);
                break;
            case AST_1.ASTNodeType.COMMAND:
            case AST_1.ASTNodeType.CONDITIONAL:
            case AST_1.ASTNodeType.IDENTIFIER:
            case AST_1.ASTNodeType.INVOKATION:
            case AST_1.ASTNodeType.LIST:
            case AST_1.ASTNodeType.OPERATION:
            case AST_1.ASTNodeType.PRIMITIVE:
                throw new Error('invalid ast structure in hoisting');
            default:
                const exhaust = node;
        }
    }
}
exports.hoist = hoist;
//# sourceMappingURL=hoister.js.map