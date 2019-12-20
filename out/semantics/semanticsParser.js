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
const antiAlias_1 = require("../optimization/antiAlias");
function semanticsParser(pfile, ctx) {
    if (pfile.status == 'parsed')
        return;
    if (pfile.status == 'parsing')
        throw new Error('circular parsing');
    pfile.status = 'parsing';
    let symbols = pfile.getSymbolTable();
    let scope = pfile.scope;
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
                let esr = expressionParser_1.exprParser(node.initial, scope, load, ctx);
                // the above cannot be used for the variables esr
                // we must create a new esr, then assign the above to that
                // file-level declarations are assigned during init, so
                // we must add the assignations instruction to datapack init
                let res = ESR_1.copyESRToLocal(esr, ctx, scope, node.identifier.value);
                esr = res.esr;
                // do something with res.copyInstr
                // tmp test
                if (esr.type == ESR_1.ESRType.INT)
                    console.log(node.identifier.value, '=>', esr.scoreboard.selector);
                if (!Types_1.hasSharedType(ESR_1.getESRType(esr), type))
                    node.identifier.throwDebug('type mismatch');
                let decl = { type: Declaration_1.DeclarationType.VARIABLE, varType: type, node, esr };
                symbols.declare(node.identifier, decl);
                if (shouldExport)
                    pfile.addExport(node.identifier.value, decl);
                break;
            }
            case AST_1.ASTNodeType.FUNCTION: {
                let body = [];
                let parameters = [];
                let branch = scope.branch(node.identifier.value);
                let type = Types_1.tokenToType(node.returnType, symbols);
                if (!type.elementary)
                    return node.returnType.throwDebug('nop thx');
                let esr;
                switch (type.type) {
                    case Types_1.ElementaryValueType.VOID:
                        esr = { type: ESR_1.ESRType.VOID, mutable: false, const: false, tmp: false };
                        break;
                    case Types_1.ElementaryValueType.INT:
                        esr = { type: ESR_1.ESRType.INT, mutable: false, const: false, tmp: false, scoreboard: ctx.scoreboards.getStatic('return', branch) };
                        break;
                    case Types_1.ElementaryValueType.BOOL:
                        esr = { type: ESR_1.ESRType.BOOL, mutable: false, const: false, tmp: false, scoreboard: ctx.scoreboards.getStatic('return', branch) };
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
                for (let param of node.parameters) {
                    let type = Types_1.tokenToType(param.type, symbols);
                    if (!type.elementary)
                        return param.type.throwDebug('elementary only thx');
                    let esr;
                    switch (type.type) {
                        case Types_1.ElementaryValueType.VOID:
                            return param.type.throwDebug('not valid');
                        case Types_1.ElementaryValueType.INT:
                            let iesr = {
                                type: ESR_1.ESRType.INT,
                                scoreboard: ctx.scoreboards.getStatic(param.symbol.value, branch),
                                mutable: false,
                                const: false,
                                tmp: false
                            };
                            esr = iesr;
                            break;
                        case Types_1.ElementaryValueType.BOOL:
                            return param.type.throwDebug('no bool yet thx');
                        default:
                            return other_1.exhaust(type.type);
                    }
                    let decl = {
                        type: Declaration_1.DeclarationType.IMPLICIT_VARIABLE,
                        varType: type,
                        esr
                    };
                    parameters.push(esr);
                    branch.symbols.declare(param.symbol, decl);
                }
                if (shouldExport)
                    pfile.addExport(node.identifier.value, decl);
                parseBody(node.body, branch, body, ctx);
                // test anti alias optimization
                antiAlias_1.test(decl.instructions);
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
function parseBody(nodes, scope, body, ctx) {
    for (let node of nodes) {
        switch (node.type) {
            case AST_1.ASTNodeType.COMMAND:
                // here we should probably parse the command
                body.push({ type: Instructions_1.InstrType.CMD });
                break;
            case AST_1.ASTNodeType.INVOKATION:
            case AST_1.ASTNodeType.OPERATION:
                expressionParser_1.exprParser(node, scope, body, ctx);
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