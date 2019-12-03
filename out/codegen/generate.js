"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SymbolTable_1 = require("../semantics/SymbolTable");
const Declaration_1 = require("../semantics/Declaration");
const FnFile_1 = require("./FnFile");
const AST_1 = require("../syntax/AST");
function generateCode(pfile, datapack) {
    for (let decl of SymbolTable_1.SymbolTable.getAllDeclarations()) {
        switch (decl.type) {
            case Declaration_1.DeclarationType.FUNCTION:
                let fndecl = decl;
                generateFunction(fndecl, datapack);
                break;
            case Declaration_1.DeclarationType.VARIABLE:
                let vardecl = decl;
                datapack.addLoadCode(`scoreboard objectives add ${vardecl.identifier} dummy`);
                break;
            default:
                const exhaust = decl.type;
        }
    }
    pfile.status = 'generated';
}
exports.generateCode = generateCode;
function generateFunction(fn, dp) {
    let fnf = new FnFile_1.FnFile(fn.identifier);
    for (let node of fn.node.body) {
        switch (node.type) {
            case AST_1.ASTNodeType.COMMAND:
                let cmdnode = node;
                fnf.addLines(cmdnode.cmd);
                break;
            case AST_1.ASTNodeType.CONDITIONAL:
                let ifnode = node;
                generateExpression(ifnode.expression, fnf, dp);
                break;
            case AST_1.ASTNodeType.OPERATION:
                generateExpression(node, fnf, dp);
                break;
            default:
                throw 'hello hello hello';
            // const exhaust: never = node.type
        }
    }
    dp.addFnFile(fnf);
}
function generateExpression(node, fnf, dp) {
    // recursively generate code
}
//# sourceMappingURL=generate.js.map