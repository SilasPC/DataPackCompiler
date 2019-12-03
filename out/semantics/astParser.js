"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AST_1 = require("../syntax/AST");
const Declaration_1 = require("../toolbox/Declaration");
const hoister_1 = require("./hoister");
function astParser(pfile) {
    if (pfile.status == 'parsed')
        return;
    if (pfile.status == 'parsing')
        throw new Error('circular parsing');
    pfile.status = 'parsing';
    let symbols = pfile.getSymbolTable();
    let ast = pfile.getAST();
    hoister_1.hoist(pfile);
    for (let node of ast) {
        let shouldExport = false;
        if (node.type == AST_1.ASTNodeType.EXPORT) {
            let expnode = node;
            node = expnode.node;
        }
        switch (node.type) {
            case AST_1.ASTNodeType.DEFINE:
                let defnode = node;
                break;
            case AST_1.ASTNodeType.FUNCTION:
                let fnnode = node;
                populateBody(fnnode.body, symbols.branch());
                break;
            default:
                throw new Error('not implemented');
            // const exhaust: never = node.type
        }
    }
    pfile.status = 'parsed';
}
exports.astParser = astParser;
function populateBody(ast, symbols) {
    for (let node of ast) {
        switch (node.type) {
            case AST_1.ASTNodeType.CONDITIONAL:
                let cndnode = node;
                populateBody(cndnode.primaryBranch, symbols.branch());
                populateBody(cndnode.secondaryBranch, symbols.branch());
                break;
            case AST_1.ASTNodeType.DEFINE:
                let defnode = node;
                let defdecl = {
                    type: Declaration_1.DeclarationType.VARIABLE,
                    node,
                    identifier: Declaration_1.generateIdentifier()
                };
                populateRecursive(defnode.initial, symbols);
                symbols.declare(defnode.identifier, defdecl);
                break;
            case AST_1.ASTNodeType.OPERATION:
                populateRecursive(node, symbols);
                break;
            case AST_1.ASTNodeType.COMMAND:
                break;
            default:
                console.error(node);
                throw new Error('exhaust');
            // const exhaust: never = node.type
        }
    }
}
function populateRecursive(node, symbols) {
    switch (node.type) {
        case AST_1.ASTNodeType.IDENTIFIER:
            let idnode = node;
            let decl = symbols.getDeclaration(idnode.identifier.value);
            if (!decl)
                return idnode.identifier.throwNotDefined();
            if (decl.type != Declaration_1.DeclarationType.VARIABLE)
                idnode.identifier.throwDebug('tmp');
            idnode.declaration = decl;
            break;
        case AST_1.ASTNodeType.OPERATION:
            let opnode = node;
            for (let operand of opnode.operands)
                populateRecursive(operand, symbols);
            break;
        case AST_1.ASTNodeType.PRIMITIVE:
            break;
        default:
            console.error(node);
            throw new Error('exhaust');
        // const exhaust: never = node.type
    }
}
//# sourceMappingURL=astParser.js.map