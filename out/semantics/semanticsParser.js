"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AST_1 = require("../syntax/AST");
const ESR_1 = require("./ESR");
const Types_1 = require("./Types");
const Declaration_1 = require("./Declaration");
const Lineals_1 = require("./Lineals");
const expressionParser_1 = require("./expressionParser");
function semanticsParser(pfile) {
    if (pfile.status == 'parsed')
        return;
    if (pfile.status == 'parsing')
        throw new Error('circular parsing');
    pfile.status = 'parsing';
    let symbols = pfile.getSymbolTable();
    let ast = pfile.getAST();
    let load = [];
    for (let node of ast) {
        let shouldExport = false;
        if (node.type == AST_1.ASTNodeType.EXPORT)
            node = node.node;
        switch (node.type) {
            case AST_1.ASTNodeType.DEFINE: {
                let type = Types_1.tokenToType(node.varType, symbols);
                if (type.elementary && type.type == Types_1.ElementaryValueType.VOID)
                    node.varType.throwDebug(`Cannot declare a variable of type 'void'`);
                if (!type.elementary)
                    node.varType.throwDebug('no non-elemn rn k');
                let esr = expressionParser_1.exprParser(node.initial, symbols, load);
                ESR_1.getESRType(esr);
                if (!Types_1.hasSharedType(ESR_1.getESRType(esr), type))
                    node.identifier.throwDebug('type mismatch');
                let decl = { type: Declaration_1.DeclarationType.VARIABLE, varType: type, node };
                symbols.declare(node.identifier, decl);
                break;
            }
            case AST_1.ASTNodeType.FUNCTION: {
                let body = [];
                let decl = { type: Declaration_1.DeclarationType.FUNCTION, returnType: Types_1.tokenToType(node.returnType, symbols), node };
                symbols.declare(node.identifier, decl);
                parseBody(node.body, symbols.branch(), body);
                console.log(node.identifier.value, body);
                break;
            }
            case AST_1.ASTNodeType.IDENTIFIER:
            case AST_1.ASTNodeType.INVOKATION:
            case AST_1.ASTNodeType.OPERATION:
            case AST_1.ASTNodeType.PRIMITIVE:
            case AST_1.ASTNodeType.EXPORT:
            case AST_1.ASTNodeType.COMMAND:
            case AST_1.ASTNodeType.CONDITIONAL:
            case AST_1.ASTNodeType.LIST:
                throw new Error('wth man');
            default:
                const exhaust = node;
        }
    }
    pfile.status = 'parsed';
}
exports.semanticsParser = semanticsParser;
function parseBody(nodes, symbols, body) {
    for (let node of nodes) {
        switch (node.type) {
            case AST_1.ASTNodeType.COMMAND:
                // here we should probably parse the command
                body.push({ type: Lineals_1.LinealType.CMD });
                break;
            case AST_1.ASTNodeType.INVOKATION:
            case AST_1.ASTNodeType.OPERATION:
                expressionParser_1.exprParser(node, symbols, body);
                break;
            case AST_1.ASTNodeType.PRIMITIVE:
            case AST_1.ASTNodeType.IDENTIFIER:
                throw new Error('valid, but pointless');
            case AST_1.ASTNodeType.CONDITIONAL:
            case AST_1.ASTNodeType.DEFINE:
                throw new Error('not implemented');
            case AST_1.ASTNodeType.LIST:
            case AST_1.ASTNodeType.FUNCTION:
            case AST_1.ASTNodeType.EXPORT:
                throw new Error('invalid ast structure');
            default:
                const exhaust = node;
        }
    }
}
//# sourceMappingURL=semanticsParser.js.map