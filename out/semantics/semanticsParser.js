"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { hoist } from "./hoister"
const AST_1 = require("../syntax/AST");
const ESR_1 = require("./ESR");
const Types_1 = require("./Types");
const Declaration_1 = require("./Declaration");
const Instructions_1 = require("./Instructions");
const expressionParser_1 = require("./expressionParser");
const other_1 = require("../toolbox/other");
const generate_1 = require("../codegen/generate");
function semanticsParser(pfile, ctx) {
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
                if (shouldExport)
                    pfile.addExport(node.identifier.value, decl);
                break;
            }
            case AST_1.ASTNodeType.FUNCTION: {
                let body = [];
                let parameters = [];
                for (let param of node.parameters) {
                    let type = Types_1.tokenToType(param.type, symbols);
                    if (!type.elementary)
                        return param.type.throwDebug('elementary only thx');
                    switch (type.type) {
                        case Types_1.ElementaryValueType.VOID:
                            return param.type.throwDebug('not valid');
                        case Types_1.ElementaryValueType.INT:
                            let esr = {
                                type: ESR_1.ESRType.INT,
                                scoreboard: {},
                                mutable: false,
                                const: false
                            };
                            parameters.push(esr);
                            break;
                        case Types_1.ElementaryValueType.BOOL:
                            return param.type.throwDebug('no bool yet thx');
                        default:
                            return other_1.exhaust(type.type);
                    }
                }
                let type = Types_1.tokenToType(node.returnType, symbols);
                if (!type.elementary)
                    return node.returnType.throwDebug('nop thx');
                let esr;
                switch (type.type) {
                    case Types_1.ElementaryValueType.VOID:
                        esr = { type: ESR_1.ESRType.VOID, mutable: false, const: false };
                        break;
                    case Types_1.ElementaryValueType.INT:
                        esr = { type: ESR_1.ESRType.INT, mutable: false, const: false, scoreboard: {} };
                        break;
                    case Types_1.ElementaryValueType.BOOL:
                        esr = { type: ESR_1.ESRType.BOOL, mutable: false, const: false, scoreboard: {} };
                        break;
                    default:
                        return other_1.exhaust(type.type);
                }
                let decl = {
                    type: Declaration_1.DeclarationType.FUNCTION,
                    returns: esr,
                    node,
                    instructions: body,
                    parameters
                };
                symbols.declare(node.identifier, decl);
                if (shouldExport)
                    pfile.addExport(node.identifier.value, decl);
                parseBody(node.body, symbols.branch(), body);
                console.log(node.identifier.value);
                console.log(generate_1.generateTest(decl, ctx));
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
                return other_1.exhaust(node);
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
                body.push({ type: Instructions_1.InstrType.CMD });
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
                return other_1.exhaust(node);
        }
    }
}
//# sourceMappingURL=semanticsParser.js.map