"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AST_1 = require("../syntax/AST");
const Lineals_1 = require("./Lineals");
const ESR_1 = require("./ESR");
const Declaration_1 = require("./Declaration");
const Types_1 = require("./Types");
const other_1 = require("../toolbox/other");
function exprParser(node, symbols, body) {
    switch (node.type) {
        case AST_1.ASTNodeType.IDENTIFIER: {
            let iddecl = symbols.getDeclaration(node.identifier);
            switch (iddecl.type) {
                case Declaration_1.DeclarationType.VARIABLE:
                    if (iddecl.varType.elementary) {
                        switch (iddecl.varType.type) {
                            case Types_1.ElementaryValueType.INT:
                                let res = { type: ESR_1.ESRType.INT, mutable: true, const: false, scoreboard: {} };
                                return res;
                            case Types_1.ElementaryValueType.BOOL:
                                return node.identifier.throwDebug('no bools rn');
                            case Types_1.ElementaryValueType.VOID:
                                return node.identifier.throwDebug('void var type wtf?');
                            default:
                                return other_1.exhaust(iddecl.varType.type);
                        }
                    }
                    else {
                        return node.identifier.throwDebug('non-elementary ref not implemented');
                    }
                case Declaration_1.DeclarationType.FUNCTION:
                    return node.identifier.throwDebug('non-invocation fn ref not implemented');
                default:
                    return other_1.exhaust(iddecl);
            }
            throw new Error('should be unreachable?');
        }
        case AST_1.ASTNodeType.PRIMITIVE:
            let val = node.value.value;
            if (val == 'true')
                return { type: ESR_1.ESRType.BOOL, mutable: false, const: true, scoreboard: {} };
            if (val == 'false')
                return { type: ESR_1.ESRType.BOOL, mutable: false, const: true, scoreboard: {} };
            let n = Number(val);
            if (Number.isNaN(n) || !Number.isInteger(n))
                node.value.throwDebug('kkk only int primitives');
            return { type: ESR_1.ESRType.INT, mutable: false, const: true, scoreboard: {} };
        case AST_1.ASTNodeType.OPERATION:
            return operator(node, symbols, body);
        case AST_1.ASTNodeType.INVOKATION:
            if (node.function.type != AST_1.ASTNodeType.IDENTIFIER)
                throw new Error('only direct calls for now');
            let params = node.parameters.list.map(p => exprParser(p, symbols, body));
            let fndecl = symbols.getDeclaration(node.function.identifier.value);
            if (!fndecl)
                return node.function.identifier.throwDebug('fn not declared');
            if (fndecl.type != Declaration_1.DeclarationType.FUNCTION)
                return node.function.identifier.throwDebug('not a fn');
            // compare fndecl.node.parameters and params,
            // and add lineals to copy into params
            if (fndecl.returnType.elementary) {
                switch (fndecl.returnType.type) {
                    case Types_1.ElementaryValueType.INT:
                        return { type: ESR_1.ESRType.INT, mutable: false, const: false, scoreboard: {} };
                    case Types_1.ElementaryValueType.VOID:
                        return { type: ESR_1.ESRType.VOID, mutable: false, const: false };
                    case Types_1.ElementaryValueType.BOOL:
                        throw new Error('no bool ret rn');
                    default:
                        return other_1.exhaust(fndecl.returnType.type);
                }
            }
            else {
                throw new Error('non elementary return value not supported yet');
            }
        // Invalid cases. These should never occur
        case AST_1.ASTNodeType.CONDITIONAL:
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
function operator(node, symbols, body) {
    switch (node.operator.value) {
        case '+':
        case '-':
        case '*':
        case '/':
        case '%': {
            console.assert(node.operands.length == 2, 'two operands');
            let [o0, o1] = node.operands.map(o => exprParser(o, symbols, body));
            if (o0.type != ESR_1.ESRType.INT)
                return node.operator.throwDebug('only int op for now');
            if (o0.type != o1.type)
                return node.operator.throwDebug('no op casting for now');
            let res = { type: ESR_1.ESRType.INT, mutable: false, const: false, scoreboard: {} };
            // ???
            let op1 = { type: Lineals_1.LinealType.INT_OP, into: res, from: o0, op: '=' };
            let op2 = { type: Lineals_1.LinealType.INT_OP, into: res, from: o1, op: node.operator.value + '=' };
            body.push(op1, op2);
            return res;
        }
        case '=': {
            console.assert(node.operands.length == 2, 'two operands');
            let [o0, o1] = node.operands.map(o => exprParser(o, symbols, body));
            if (!o0.mutable)
                throw new Error('left hand side immutable');
            if (o0.type != ESR_1.ESRType.INT)
                return node.operator.throwDebug('only int op for now');
            if (o0.type != o1.type)
                return node.operator.throwDebug('no op casting for now');
            let res = { type: ESR_1.ESRType.INT, mutable: false, const: false, scoreboard: {} };
            let op = { type: Lineals_1.LinealType.INT_OP, into: res, from: o1, op: '=' };
            body.push(op);
            return res;
        }
        case '+=':
        case '-=':
        case '*=':
        case '/=':
        case '%=': {
            console.assert(node.operands.length == 2, 'two operands');
            let [o0, o1] = node.operands.map(o => exprParser(o, symbols, body));
            if (!o0.mutable)
                throw new Error('left hand side immutable');
            if (o0.type != ESR_1.ESRType.INT)
                return node.operator.throwDebug('only int op for now');
            if (o0.type != o1.type)
                return node.operator.throwDebug('no op casting for now');
            let res = { type: ESR_1.ESRType.INT, mutable: false, const: false, scoreboard: {} };
            let op1 = { type: Lineals_1.LinealType.INT_OP, into: res, from: o0, op: '=' };
            let op2 = { type: Lineals_1.LinealType.INT_OP, into: res, from: o1, op: node.operator.value };
            body.push(op1, op2);
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