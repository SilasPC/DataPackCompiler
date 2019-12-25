"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AST_1 = require("../syntax/AST");
const Instructions_1 = require("../codegen/Instructions");
const ESR_1 = require("./ESR");
const Declaration_1 = require("./Declaration");
const Types_1 = require("./Types");
const other_1 = require("../toolbox/other");
function exprParser(node, scope, ctx) {
    let symbols = scope.symbols;
    switch (node.type) {
        case AST_1.ASTNodeType.IDENTIFIER: {
            let decl = symbols.getDeclaration(node.identifier);
            switch (decl.type) {
                case Declaration_1.DeclarationType.IMPLICIT_VARIABLE:
                // fallthrough
                case Declaration_1.DeclarationType.VARIABLE:
                    let esr = decl.esr;
                    if (decl.varType.elementary) {
                        switch (decl.varType.type) {
                            case Types_1.ElementaryValueType.INT:
                                if (esr.type != ESR_1.ESRType.INT)
                                    return node.identifier.throwDebug('ESR type assertion failed');
                                let res = { type: ESR_1.ESRType.INT, mutable: true, const: false, tmp: true, scoreboard: esr.scoreboard };
                                return res;
                            case Types_1.ElementaryValueType.BOOL:
                                return node.identifier.throwDebug('no bools rn');
                            case Types_1.ElementaryValueType.VOID:
                                return node.identifier.throwDebug('void var type wtf?');
                            default:
                                return other_1.exhaust(decl.varType.type);
                        }
                    }
                    else {
                        return node.identifier.throwDebug('non-elementary ref not implemented');
                    }
                case Declaration_1.DeclarationType.FUNCTION:
                    return node.identifier.throwDebug('non-invocation fn ref not implemented');
                default:
                    return other_1.exhaust(decl);
            }
            throw new Error('should be unreachable?');
        }
        case AST_1.ASTNodeType.BOOLEAN: {
            if (node.value.value == 'true')
                return { type: ESR_1.ESRType.BOOL, mutable: false, const: true, tmp: false, scoreboard: ctx.scoreboards.getConstant(1) };
            if (node.value.value == 'false')
                return { type: ESR_1.ESRType.BOOL, mutable: false, const: true, tmp: false, scoreboard: ctx.scoreboards.getConstant(0) };
        }
        case AST_1.ASTNodeType.NUMBER: {
            let n = Number(node.value.value);
            if (Number.isNaN(n) || !Number.isInteger(n))
                node.value.throwDebug('kkk only int primitives');
            return { type: ESR_1.ESRType.INT, mutable: false, const: true, tmp: false, scoreboard: ctx.scoreboards.getConstant(n) };
        }
        case AST_1.ASTNodeType.OPERATION:
            return operator(node, scope, ctx);
        case AST_1.ASTNodeType.INVOKATION: {
            if (node.function.type != AST_1.ASTNodeType.IDENTIFIER)
                throw new Error('only direct calls for now');
            let params = node.parameters.list.map(p => exprParser(p, scope, ctx));
            let decl = symbols.getDeclaration(node.function.identifier.value);
            if (!decl)
                return node.function.identifier.throwDebug('fn not declared');
            if (decl.type != Declaration_1.DeclarationType.FUNCTION)
                return node.function.identifier.throwDebug('not a fn');
            let paramTypes = decl.parameters.map(ESR_1.getESRType);
            if (params.length != paramTypes.length)
                return node.function.identifier.throwDebug('param length unmatched');
            for (let i = 0; i < params.length; i++) {
                let param = params[i];
                let esr = decl.parameters[i];
                if (!Types_1.hasSharedType(ESR_1.getESRType(param), ESR_1.getESRType(esr)))
                    node.function.identifier.throwDebug('param type mismatch');
                switch (esr.type) {
                    case ESR_1.ESRType.BOOL:
                        throw new Error('no impl');
                    case ESR_1.ESRType.INT:
                        let instr = {
                            type: Instructions_1.InstrType.INT_OP,
                            from: param,
                            into: esr,
                            op: '='
                        };
                        scope.push(instr);
                        break;
                    case ESR_1.ESRType.VOID:
                        throw new Error(`this can't happen`);
                    default:
                        return other_1.exhaust(esr);
                }
            }
            let returnType = ESR_1.getESRType(decl.returns);
            let invokeInstr = { type: Instructions_1.InstrType.INVOKE, fn: decl.fn };
            if (returnType.elementary) {
                switch (returnType.type) {
                    case Types_1.ElementaryValueType.INT: {
                        let into = { type: ESR_1.ESRType.INT, mutable: false, const: false, tmp: true, scoreboard: ctx.scoreboards.getStatic('tmp', scope) };
                        if (decl.returns.type != ESR_1.ESRType.INT)
                            throw new Error('ESR error');
                        let copyRet = { type: Instructions_1.InstrType.INT_OP, into, from: decl.returns, op: '=' };
                        scope.push(invokeInstr, copyRet);
                        return into;
                    }
                    case Types_1.ElementaryValueType.VOID: {
                        scope.push(invokeInstr);
                        return { type: ESR_1.ESRType.VOID, mutable: false, const: false, tmp: false };
                    }
                    case Types_1.ElementaryValueType.BOOL:
                        throw new Error('no bool ret rn');
                    default:
                        return other_1.exhaust(returnType.type);
                }
            }
            else {
                throw new Error('non elementary return value not supported yet');
            }
        }
        case AST_1.ASTNodeType.STRING:
            throw new Error('no strings in expressions for now I guess');
        // Invalid cases. These should never occur
        case AST_1.ASTNodeType.CONDITIONAL:
        case AST_1.ASTNodeType.RETURN:
        case AST_1.ASTNodeType.DEFINE:
        case AST_1.ASTNodeType.EXPORT:
        case AST_1.ASTNodeType.FUNCTION:
        case AST_1.ASTNodeType.COMMAND:
        case AST_1.ASTNodeType.LIST:
            throw new Error('ohkayy');
        default:
            return other_1.exhaust(node);
    }
}
exports.exprParser = exprParser;
function operator(node, scope, ctx) {
    let symbols = scope.symbols;
    switch (node.operator.value) {
        case '+':
        case '-':
        case '*':
        case '/':
        case '%': {
            console.assert(node.operands.length == 2, 'two operands');
            let [o0, o1] = node.operands.map(o => exprParser(o, scope, ctx));
            if (o0.type != ESR_1.ESRType.INT)
                return node.operator.throwDebug('only int op for now');
            if (o0.type != o1.type)
                return node.operator.throwDebug('no op casting for now');
            let res = { type: ESR_1.ESRType.INT, mutable: false, const: false, tmp: true, scoreboard: ctx.scoreboards.getStatic('tmp', scope) };
            // ???
            let op1 = { type: Instructions_1.InstrType.INT_OP, into: res, from: o0, op: '=' };
            let op2 = { type: Instructions_1.InstrType.INT_OP, into: res, from: o1, op: node.operator.value + '=' };
            scope.push(op1, op2);
            return res;
        }
        case '=': {
            console.assert(node.operands.length == 2, 'two operands');
            let [o0, o1] = node.operands.map(o => exprParser(o, scope, ctx));
            if (!o0.mutable)
                throw new Error('left hand side immutable');
            if (o0.type != ESR_1.ESRType.INT)
                return node.operator.throwDebug('only int op for now');
            if (o0.type != o1.type)
                return node.operator.throwDebug('no op casting for now');
            let res = { type: ESR_1.ESRType.INT, mutable: false, const: false, tmp: true, scoreboard: ctx.scoreboards.getStatic('tmp', scope) };
            let op = { type: Instructions_1.InstrType.INT_OP, into: res, from: o1, op: '=' };
            scope.push(op);
            return res;
        }
        case '+=':
        case '-=':
        case '*=':
        case '/=':
        case '%=': {
            console.assert(node.operands.length == 2, 'two operands');
            let [o0, o1] = node.operands.map(o => exprParser(o, scope, ctx));
            if (!o0.mutable)
                throw new Error('left hand side immutable');
            if (o0.type != ESR_1.ESRType.INT)
                return node.operator.throwDebug('only int op for now');
            if (o0.type != o1.type)
                return node.operator.throwDebug('no op casting for now');
            let res = { type: ESR_1.ESRType.INT, mutable: false, const: false, tmp: true, scoreboard: ctx.scoreboards.getStatic('tmp', scope) };
            let op1 = { type: Instructions_1.InstrType.INT_OP, into: o0, from: o1, op: node.operator.value };
            let op2 = { type: Instructions_1.InstrType.INT_OP, into: res, from: o0, op: '=' };
            scope.push(op1, op2);
            return res;
        }
        case '&&':
        case '||':
        case '!':
        case '++':
        case '--':
        case '>':
        case '<':
        case '>=':
        case '<=':
        case '==':
        case '!=':
        default:
            throw new Error('i rly h8 boilerplate');
    }
    throw new Error('unreachable');
}
//# sourceMappingURL=expressionParser.js.map