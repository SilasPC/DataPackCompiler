"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Token_1 = require("../lexing/Token");
const AST_1 = require("./AST");
var OpType;
(function (OpType) {
    OpType[OpType["INFIX"] = 0] = "INFIX";
    OpType[OpType["PREFIX"] = 1] = "PREFIX";
    OpType[OpType["POSTFIX"] = 2] = "POSTFIX";
})(OpType || (OpType = {}));
function expressionSyntaxParser(tokens) {
    let ops = [];
    let que = [];
    let postfix = [];
    let fncalls = []; // store astnodes instead?
    let lastWasOperand = false;
    tokenLoop: for (let t of tokens) {
        switch (t.type) {
            case Token_1.TokenType.OPERATOR:
                let opop = opInfo(t, !lastWasOperand);
                pushOperator(opop);
                lastWasOperand = opop.type == OpType.POSTFIX;
                break;
            case Token_1.TokenType.MARKER:
                switch (t.value) {
                    case '(':
                        let isFn = lastWasOperand;
                        fncalls.push(isFn);
                        pushOperator({
                            token: t,
                            precedency: 20 + (isFn ? 0 : 1),
                            leftToRight: true,
                            type: OpType.PREFIX,
                            operands: 0,
                            popable: false
                        });
                        lastWasOperand = false;
                        break;
                    case ')':
                        if (!fncalls.length)
                            t.throwDebug('fncall mismatch');
                        let openOp;
                        if (!ops.length)
                            t.throwDebug('not matched');
                        do {
                            openOp = ops.pop();
                            if (!openOp.popable)
                                break;
                            applyOperator(openOp);
                        } while (ops.length);
                        if (openOp.token.type != Token_1.TokenType.MARKER || openOp.token.value != '(')
                            t.throwDebug('cuts off other paren thing');
                        if (fncalls.pop()) {
                            if (que.length < 2)
                                t.throwDebug('wth');
                            let argnode = que.pop();
                            if (argnode.type != AST_1.ASTNodeType.LIST) {
                                let argAsList = {
                                    type: AST_1.ASTNodeType.LIST,
                                    list: [argnode]
                                };
                                argnode = argAsList;
                                postfix.push(',1');
                            }
                            let invnode = {
                                type: AST_1.ASTNodeType.INVOKATION,
                                function: que.pop(),
                                parameters: argnode
                            };
                            que.push(invnode);
                            postfix.push('$');
                        }
                        lastWasOperand = true;
                        break;
                    case '.':
                        ops.push(opInfo(t, false));
                        lastWasOperand = false;
                        break;
                    case ',':
                        let coptopush = opInfo(t, false);
                        pushOperator(coptopush, false);
                        let cop = opTop();
                        if (cop && cop.token.type == Token_1.TokenType.MARKER && cop.token.value == ',')
                            cop.operands++;
                        else
                            ops.push(coptopush);
                        lastWasOperand = false;
                        break;
                    case ';':
                        break tokenLoop;
                    default:
                        t.throwDebug('marker not implemented');
                }
                break;
            case Token_1.TokenType.SYMBOL:
                if (lastWasOperand)
                    t.throwDebug('Unexpected operand');
                let symnode = { type: AST_1.ASTNodeType.IDENTIFIER, identifier: t };
                que.push(symnode);
                postfix.push(t.value);
                lastWasOperand = true;
                break;
            case Token_1.TokenType.PRIMITIVE:
                if (lastWasOperand)
                    t.throwDebug('Unexpected operand');
                let prinode = { type: AST_1.ASTNodeType.PRIMITIVE, value: t };
                que.push(prinode);
                postfix.push(t.value);
                lastWasOperand = true;
                break;
            default:
                t.throwDebug('tokentype not implemented');
        }
    }
    for (let op of ops.reverse()) {
        if (!op.popable)
            op.token.throwDebug('possible parenthesis mismatch');
        applyOperator(op);
    }
    if (que.length > 1)
        throw 'hmm';
    return { ast: que[0], meta: { postfix } };
    function opTop() { return ops[ops.length - 1]; }
    function pushOperator(op, doPush = true) {
        // console.log('push out',postfix.join(' '))
        // console.log('push ops',ops.map(o=>o.token.value).join(' '))
        while (ops.length) {
            let l = ops[ops.length - 1];
            if (!l.popable)
                break;
            if (l.type == OpType.INFIX && op.type != OpType.INFIX)
                break;
            let d = op.precedency - l.precedency;
            if (d > 0)
                break;
            else if (d == 0) {
                if (op.leftToRight != l.leftToRight)
                    throw new Error('associativity must match');
                if (!op.leftToRight)
                    break;
                // there is a bug where unaries can be applied before
                // the occurance of the actual operand when associativity
                // is needed and it reads left to right
                // then the unary is popped and applied even though it is a
                // prefix, and the operand is not on the queue yet
                // fix: prefix unaries must be sorted rather than popped
            }
            ops.pop();
            // console.log('push apply',l.token.value)
            applyOperator(l);
        }
        if (doPush)
            ops.push(op);
        // console.log('push ops2',ops.map(o=>o.token.value).join(' '))
        // console.log('push out2',postfix.join(' '))
    }
    function applyOperator(op) {
        if (que.length < op.operands)
            throw new Error('operator expected more operands on queue than available');
        switch (op.token.type) {
            case Token_1.TokenType.OPERATOR:
                let node = {
                    type: AST_1.ASTNodeType.OPERATION,
                    operator: op.token,
                    operands: que.splice(-op.operands, op.operands)
                };
                const map = { [OpType.POSTFIX]: ':post', [OpType.PREFIX]: ':pre', [OpType.INFIX]: '' };
                que.push(node);
                postfix.push(op.token.value + map[op.type]);
                break;
            case Token_1.TokenType.MARKER:
                switch (op.token.value) {
                    case ',':
                        let list = {
                            type: AST_1.ASTNodeType.LIST,
                            list: que.splice(-op.operands, op.operands)
                        };
                        que.push(list);
                        postfix.push(',' + op.operands);
                        break;
                    default:
                        throw new Error('could not use marker value');
                }
                break;
            default:
                throw new Error('could not apply operator token type');
        }
    }
}
exports.expressionSyntaxParser = expressionSyntaxParser;
function opInfo(token, prefix) {
    let [precedency, leftToRight, type] = p(token, prefix);
    // console.log('opinfo',token.value,precedency,leftToRight,OpType[type])
    return {
        token,
        precedency,
        leftToRight,
        type,
        operands: type == OpType.INFIX ? 2 : 1,
        popable: true
    };
}
function p(t, prefix) {
    switch (t.value) {
        case '.':
            return [20, true, OpType.INFIX];
        case '++':
        case '--':
            return [
                prefix ? 17 : 18,
                false,
                prefix ? OpType.PREFIX : OpType.POSTFIX
            ];
        case '!':
            return [17, false, OpType.PREFIX];
        case '**': return [16, false, OpType.INFIX];
        case '*':
        case '/':
        case '%':
            return [15, true, OpType.INFIX];
        case '+':
        case '-':
            return [prefix ? 17 : 14, !prefix, prefix ? OpType.PREFIX : OpType.INFIX];
        case '<':
        case '<=':
        case '>':
        case '>=':
            return [12, true, OpType.INFIX];
        case '==':
        case '!=':
            return [11, true, OpType.INFIX];
        case '&&': return [6, true, OpType.INFIX];
        case '||': return [5, true, OpType.INFIX];
        case '=':
        case '+=':
        case '-=':
        case '*=':
        case '/=':
        case '%=':
            return [3, false, OpType.INFIX];
        case ',':
            // right to left to avoid pop and apply
            // we should add an exception rule instead
            return [1, false, OpType.INFIX];
        default:
            console.error(t);
            return t.throwDebug('op no precedency');
    }
}
//# sourceMappingURL=expressionSyntaxParser.js.map