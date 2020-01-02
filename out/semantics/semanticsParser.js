"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AST_1 = require("../syntax/AST");
const ESR_1 = require("./ESR");
const Types_1 = require("./Types");
const Declaration_1 = require("./Declaration");
const expressionParser_1 = require("./expressionParser");
const other_1 = require("../toolbox/other");
const Instructions_1 = require("../codegen/Instructions");
const CompileErrors_1 = require("../toolbox/CompileErrors");
function semanticsParser(pfile, ctx) {
    const err = new CompileErrors_1.CompileErrorSet();
    if (pfile.status == 'parsed')
        return err.wrap(null);
    if (pfile.status == 'parsing')
        throw new Error('circular parsing');
    pfile.status = 'parsing';
    let symbols = pfile.getSymbolTable();
    let scope = pfile.scope;
    let ast = pfile.getAST();
    tokenLoop: for (let node of ast) {
        let shouldExport = false;
        if (node.type == AST_1.ASTNodeType.EXPORT)
            node = node.node;
        switch (node.type) {
            case AST_1.ASTNodeType.DEFINE: {
                let type = Types_1.tokenToType(node.varType, symbols);
                if (type.elementary && type.type == Types_1.ElementaryValueType.VOID) {
                    err.push(node.varType.error(`Cannot declare a variable of type 'void'`));
                    continue;
                }
                if (!type.elementary)
                    node.varType.throwDebug('no non-elemn rn k');
                let esr0 = expressionParser_1.exprParser(node.initial, scope, ctx);
                // the above cannot be used for the variables esr (could mutate const)
                // we must create a new esr, then assign the above to that
                // file-level declarations are assigned during init, so
                // we must add the assignations instruction to datapack init
                if (esr0.hasError())
                    console.log(esr0.getErrors());
                if (!err.checkHasValue(esr0))
                    continue;
                let res = ESR_1.copyESRToLocal(esr0.value, ctx, scope, node.identifier.value);
                let esr = res.esr;
                // do something with res.copyInstr
                if (!Types_1.hasSharedType(ESR_1.getESRType(esr), type)) {
                    err.push(node.identifier.error('type mismatch'));
                    continue;
                }
                let decl = { type: Declaration_1.DeclarationType.VARIABLE, varType: type, node, esr };
                symbols.declare(node.identifier, decl);
                if (shouldExport)
                    pfile.addExport(node.identifier.value, decl);
                break;
            }
            case AST_1.ASTNodeType.FUNCTION: {
                let parameters = [];
                let branch = scope.branch(node.identifier.value, 'FN', null);
                let fn = ctx.createFnFile(branch.getScopeNames());
                let type = Types_1.tokenToType(node.returnType, symbols);
                if (!type.elementary) {
                    err.push(node.returnType.error('nop thx'));
                    continue;
                }
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
                branch.setReturnVar(esr);
                let decl = {
                    type: Declaration_1.DeclarationType.FUNCTION,
                    returns: esr,
                    node,
                    fn,
                    parameters
                };
                symbols.declare(node.identifier, decl);
                for (let param of node.parameters) {
                    let type = Types_1.tokenToType(param.type, symbols);
                    if (!type.elementary) {
                        err.push(param.type.error('elementary only thx'));
                        continue;
                    }
                    let esr;
                    switch (type.type) {
                        case Types_1.ElementaryValueType.VOID:
                            err.push(param.type.error('not valid'));
                            continue;
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
                            { }
                            err.push(param.type.error('no bool yet thx'));
                            continue;
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
                if (!err.checkHasValue(parseBody(node.body, branch, ctx)))
                    continue;
                fn.add(...branch.mergeBuffers());
                break;
            }
            case AST_1.ASTNodeType.RETURN:
            case AST_1.ASTNodeType.IDENTIFIER:
            case AST_1.ASTNodeType.INVOKATION:
            case AST_1.ASTNodeType.OPERATION:
            case AST_1.ASTNodeType.BOOLEAN:
            case AST_1.ASTNodeType.NUMBER:
            case AST_1.ASTNodeType.STRING:
            case AST_1.ASTNodeType.EXPORT:
            case AST_1.ASTNodeType.COMMAND:
            case AST_1.ASTNodeType.CONDITIONAL:
            case AST_1.ASTNodeType.LIST:
                throw new Error('wth man, ast invalid at file root');
            default:
                return other_1.exhaust(node);
        }
    }
    pfile.status = 'parsed';
    return err.wrap(null);
}
exports.semanticsParser = semanticsParser;
function parseBody(nodes, scope, ctx) {
    let err = new CompileErrors_1.CompileErrorSet();
    for (let node of nodes) {
        switch (node.type) {
            case AST_1.ASTNodeType.COMMAND: {
                let interpolations = node.interpolations.flatMap(n => {
                    let x = expressionParser_1.exprParser(n, scope, ctx);
                    if (err.checkHasValue(x))
                        return [x.value];
                    return [];
                });
                if (!err.isEmpty())
                    continue;
                scope.push({
                    type: Instructions_1.InstrType.CMD,
                    interpolations
                });
                break;
            }
            case AST_1.ASTNodeType.INVOKATION:
            case AST_1.ASTNodeType.OPERATION: {
                err.checkHasValue(expressionParser_1.exprParser(node, scope, ctx));
                break;
            }
            case AST_1.ASTNodeType.RETURN: {
                let fnscope = scope.getSuperByType('FN');
                if (!fnscope)
                    throw new Error('ast throw would be nice... return must be contained in fn scope');
                let fnret = fnscope.getReturnVar();
                if (!fnret)
                    throw new Error('fn scope does not have return var');
                let esr;
                if (!node.node)
                    esr = { type: ESR_1.ESRType.VOID, const: false, tmp: false, mutable: false };
                else {
                    let x = expressionParser_1.exprParser(node.node, scope, ctx);
                    if (!err.checkHasValue(x))
                        continue;
                    esr = x.value;
                }
                if (!Types_1.hasSharedType(ESR_1.getESRType(esr), ESR_1.getESRType(fnret)))
                    throw new Error('ast throw would be nice... return must match fn return type');
                // return instructions
                if (esr.type != ESR_1.ESRType.VOID)
                    scope.push(...ESR_1.assignESR(esr, fnret));
                scope.push(...scope.breakScopes(fnscope));
                break;
            }
            case AST_1.ASTNodeType.NUMBER:
            case AST_1.ASTNodeType.STRING:
            case AST_1.ASTNodeType.BOOLEAN:
            case AST_1.ASTNodeType.IDENTIFIER:
                throw new Error('valid, but pointless');
            case AST_1.ASTNodeType.CONDITIONAL: {
                let esr = expressionParser_1.exprParser(node.expression, scope, ctx);
                if (!err.checkHasValue(esr))
                    continue;
                if (esr.value.type != ESR_1.ESRType.BOOL)
                    throw new Error('if not bool esr');
                /*parseBody(node.primaryBranch,scope.branch('if','NONE',{
                    type:ESRType.VOID, mutable: false, const: false, tmp: false
                }),ctx)
                parseBody(node.secondaryBranch,scope.branch('if','NONE',{
                    type:ESRType.VOID, mutable: false, const: false, tmp: false
                }),ctx)*/
                break;
            }
            case AST_1.ASTNodeType.DEFINE: {
                let type = Types_1.tokenToType(node.varType, scope.symbols);
                if (type.elementary && type.type == Types_1.ElementaryValueType.VOID)
                    node.varType.throwDebug(`Cannot declare a variable of type 'void'`);
                if (!type.elementary)
                    node.varType.throwDebug('no non-elemn rn k');
                let esr0 = expressionParser_1.exprParser(node.initial, scope, ctx);
                // the above cannot be used for the variables esr (might mutate const)
                // we must create a new esr, then assign the above to that
                if (!err.checkHasValue(esr0))
                    continue;
                let res = ESR_1.copyESRToLocal(esr0.value, ctx, scope, node.identifier.value);
                let esr = res.esr;
                scope.push(res.copyInstr);
                if (!Types_1.hasSharedType(ESR_1.getESRType(esr), type))
                    node.identifier.throwDebug('type mismatch');
                let decl = { type: Declaration_1.DeclarationType.VARIABLE, varType: type, node, esr };
                scope.symbols.declare(node.identifier, decl);
                break;
            }
            case AST_1.ASTNodeType.LIST:
            case AST_1.ASTNodeType.FUNCTION:
            case AST_1.ASTNodeType.EXPORT:
                throw new Error('invalid ast structure');
            default:
                return other_1.exhaust(node);
        }
    }
    return err.wrap(null);
}
//# sourceMappingURL=semanticsParser.js.map