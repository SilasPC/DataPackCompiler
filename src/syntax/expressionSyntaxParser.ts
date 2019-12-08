
import { Token, TokenType } from "../lexing/Token";
import { ASTNode, ASTNodeType, ASTIdentifierNode, ASTPrimitiveNode, ASTOpNode, ASTCallNode, ASTListNode } from "./AST";
import { TokenIterator } from "../lexing/TokenIterator";
import { CompilerOptions } from "../toolbox/config";
import { exhaust } from "../toolbox/other";

enum OpType {
    INFIX,
    PREFIX,
    POSTFIX
}

type Op = {
    token: Token
    op: string
    precedency: number
    leftToRight: boolean
    type: OpType
    operands: number
    popable: boolean
}

export function expressionSyntaxParser(tokens:TokenIterator) {

    let ops: Op[] = []
    let que: ASTNode[] = []
    let postfix: string[] = []

    let fncalls: boolean[] = [] // store astnodes instead?

    let lastWasOperand = false
    for (let t of tokens) {
        switch (t.type) {
            case TokenType.OPERATOR:
                let opop = opInfo(t,!lastWasOperand)
                pushOperator(opop)
                lastWasOperand = opop.type == OpType.POSTFIX
                break
            case TokenType.MARKER:
                switch (t.value) {
                    case '(':
                        let isFn = lastWasOperand
                        if (isFn) {
                            let next = tokens.peek()
                            if (next.type == TokenType.MARKER && next.value == ')') {
                                if (!que.length) t.throwDebug('no fn on queue?')
                                let invnode: ASTCallNode = {
                                    type: ASTNodeType.INVOKATION,
                                    function: que.pop() as ASTNode,
                                    parameters: {
                                        type: ASTNodeType.LIST,
                                        list: []
                                    }
                                }
                                que.push(invnode)
                                postfix.push(',0','$')
                                tokens.skip(1)
                                lastWasOperand = true
                                break
                            }
                        }
                        fncalls.push(isFn)
                        pushOperator({
                            token: t,
                            op: t.value,
                            precedency: 20 + (isFn?0:1),
                            leftToRight: true,
                            type: OpType.PREFIX, // make sure we don't expect an operator
                            operands: 0,
                            popable: false
                        })
                        if (isFn) pushOperator({
                            token: t, // change this
                            op: ',',
                            precedency: 1,
                            leftToRight: false, // this may break later
                            type: OpType.INFIX,
                            operands: 1,
                            popable: true
                        })
                        lastWasOperand = false
                        break
                    case ')':
                        if (!fncalls.length) t.throwDebug('fncall mismatch')
                        let openOp: Op
                        if (!ops.length) t.throwDebug('not matched')
                        do {
                            openOp = ops.pop() as Op
                            if (!openOp.popable) break
                            applyOperator(openOp)
                        } while (ops.length)
                        if (openOp.op != '(') t.throwDebug('cuts off other paren thing')
                        if (fncalls.pop()) {
                            if (que.length<2) t.throwDebug('wth') // this doesn't work so well when there are no parameters xd
                            let argnode = que.pop() as ASTNode
                            if (argnode.type != ASTNodeType.LIST) {
                                let argAsList: ASTListNode = {
                                    type: ASTNodeType.LIST,
                                    list: [argnode]
                                }
                                argnode = argAsList
                                postfix.push(',1')
                            }
                            let invnode: ASTCallNode = {
                                type: ASTNodeType.INVOKATION,
                                function: que.pop() as ASTNode,
                                parameters: argnode as ASTListNode
                            }
                            que.push(invnode)
                            postfix.push('$')
                        }
                        lastWasOperand = true
                        break
                    case '.':
                        ops.push(opInfo(t,false))
                        lastWasOperand = false
                        break
                    case ',':
                        let coptopush = opInfo(t,false)
                        pushOperator(coptopush,false)
                        let cop = opTop()
                        if (cop && cop.token.type == TokenType.MARKER && cop.op == ',')
                            cop.operands++
                        else
                            ops.push(coptopush)
                        lastWasOperand = false
                        break
                    case ';':
                        return finish()
                    default:
                        t.throwDebug('marker not implemented')
                }
                break
            case TokenType.SYMBOL:
                if (lastWasOperand) t.throwDebug('Unexpected operand')
                let symnode: ASTIdentifierNode = {type:ASTNodeType.IDENTIFIER,identifier:t}
                que.push(symnode)
                postfix.push(t.value)
                lastWasOperand = true
                break
            case TokenType.PRIMITIVE:
                if (lastWasOperand) t.throwDebug('Unexpected operand')
                let prinode: ASTPrimitiveNode = {type:ASTNodeType.PRIMITIVE,value:t}
                que.push(prinode)
                postfix.push(t.value)
                lastWasOperand = true
                break
            default:
                //return exhaust(t.type)
                t.throwDebug('tokentype not implemented')
        }
    }

    throw new Error('no end here thanks')

    function finish() {
        for (let op of ops.reverse()) {
            if (!op.popable) op.token.throwDebug('possible parenthesis mismatch')
            applyOperator(op)
        }
    
        if (que.length > 1) throw 'hmm'
    
        return {ast:que[0],meta:{postfix}}
    }

    function opTop() {return ops[ops.length-1]}

    function pushOperator(op:Op,doPush=true) {
        // console.log('push out',postfix.join(' '))
        // console.log('push ops',ops.map(o=>o.token.value).join(' '))
        while (ops.length) {
            let l = ops[ops.length-1]
            if (!l.popable) break
            if (l.type == OpType.INFIX && op.type != OpType.INFIX) break
            let d = op.precedency - l.precedency
            if (d > 0) break
            else if (d == 0) {
                if (op.leftToRight != l.leftToRight) throw new Error('associativity must match: '+op.op+' '+l.op)
                if (!op.leftToRight) break
                // there is a bug where unaries can be applied before
                // the occurance of the actual operand.
                // the unary is popped and applied even though it is a
                // prefix, and the operand is not on the queue yet
                // fix: prefix unaries must be sorted rather than popped
            }
            ops.pop()
            // console.log('push apply',l.token.value)
            applyOperator(l)
        }
        if (doPush) ops.push(op)
        // console.log('push ops2',ops.map(o=>o.token.value).join(' '))
        // console.log('push out2',postfix.join(' '))
    }

    function applyOperator(op:Op) {
        if (que.length < op.operands) throw new Error('operator expected more operands on queue than available')
        switch (op.token.type) {
            case TokenType.OPERATOR:
                let node: ASTOpNode = {
                    type: ASTNodeType.OPERATION,
                    operator: op.token,
                    operands: que.splice(-op.operands,op.operands)
                }
                const map = {[OpType.POSTFIX]:':post',[OpType.PREFIX]:':pre',[OpType.INFIX]:''}
                que.push(node)
                postfix.push(op.op+map[op.type])
                break
            case TokenType.MARKER:
                switch (op.op) {
                    case ',':
                        let list: ASTListNode = {
                            type: ASTNodeType.LIST,
                            list: que.splice(-op.operands,op.operands)
                        }
                        que.push(list)
                        postfix.push(','+op.operands)
                        break
                    default:
                        throw new Error('could not use marker value '+op.op)
                }
                break
            default:
                throw new Error('could not apply operator token type')
        }   
    }

}

function opInfo(token:Token,prefix:boolean): Op {
    let [precedency,leftToRight,type] = p(token,prefix)
    if (prefix && type != OpType.PREFIX) token.throwDebug('Operator cannot be prefixed')
    // console.log('opinfo',token.value,precedency,leftToRight,OpType[type])
    return {
        token,
        op: token.value,
        precedency,
        leftToRight,
        type,
        operands: type == OpType.INFIX ? 2 : 1,
        popable: true
    }
}

function p(t:Token,prefix:boolean): [number,boolean,OpType] {
    switch (t.value) {

        case '.':
            return [20,true,OpType.INFIX]

        case '++':
        case '--':
            return [
                prefix ? 17 : 18,
                false,
                prefix ? OpType.PREFIX : OpType.POSTFIX
            ]

        case '!':
            return [17,false,OpType.PREFIX]

        case '**': return [16,false,OpType.INFIX]

        case '*':
        case '/':
        case '%':
            return [15,true,OpType.INFIX]

        case '+':
        case '-':
            return [prefix?17:14,!prefix,prefix?OpType.PREFIX:OpType.INFIX]

        case '<':
        case '<=':
        case '>':
        case '>=':
            return [12,true,OpType.INFIX]

        case '==':
        case '!=':
            return [11,true,OpType.INFIX]

        case '&&': return [6,true,OpType.INFIX]
        case '||': return [5,true,OpType.INFIX]

        case '=':
        case '+=':
        case '-=':
        case '*=':
        case '/=':
        case '%=':
            return [3,false,OpType.INFIX]

        case ',':
            // right to left to avoid pop and apply
            // we should add an exception rule instead
            return [1,false,OpType.INFIX]

        default:
            console.error(t)
            return t.throwDebug('op no precedency')

    }
}
