
import { TokenI, TokenType, GenericToken } from "../lexing/Token";
import { ASTNodeType, ASTIdentifierNode, ASTOpNode, ASTCallNode, ASTListNode, ASTExpr, ASTDynamicAccessNode, ASTPrimitiveNode } from "./AST";
import { TokenIteratorI } from "../lexing/TokenIterator";
import { parseSelector } from "./structures/selector";
import { parseStaticAccess } from "./structures/staticAccess";

enum OpType {
    INFIX,
    PREFIX,
    POSTFIX
}

type Op = {
    token: TokenI
    op: string
    precedency: number
    leftToRight: boolean
    type: OpType
    operands: number
    popable: boolean
}

type ExprReturn = {meta:{postfix:string[]},ast:ASTExpr}

export function expressionSyntaxParser(tokens:TokenIteratorI,asi:boolean) {
    return recurse(tokens,asi,false,true)
}

export function exprParseNoList(tokens:TokenIteratorI,asi:boolean) {
    return recurse(tokens,asi,false,false)
}

function recurse(tokens:TokenIteratorI,asi:boolean,inFn:boolean,allowList:boolean): ExprReturn {

    let pfile = tokens.file

    let ops: Op[] = []
    let que: ASTExpr[] = []
    let queList = [que]
    let postfix: string[] = []

    let lastWasOperand = false
    for (let t of tokens) {
        switch (t.type) {
            case TokenType.OPERATOR:
                let opop = opInfo(t,!lastWasOperand)
                pushOperator(opop)

                // exception for ++ and -- postfix operators,
                // to allow automatic semicolon insertion in 'x++ \n y()'
                if (
                    asi &&
                    tokens.newLineFollows() &&
                    lastWasOperand &&
                    (t.value == '++' || t.value == '--')
                ) return finish()

                lastWasOperand = opop.type == OpType.POSTFIX
                break
            case TokenType.MARKER:
                switch (t.value) {
                    case '(':
                        let isFn = lastWasOperand
                        pushOperator(opInfo(t,false),false)
                        if (isFn) {
                            let next = tokens.peek()
                            if (next.type == TokenType.MARKER && next.value == ')') {
                                if (!que.length) t.throwDebug('no fn on queue?')
                                let fn = que.pop() as ASTExpr
                                if (fn.type != ASTNodeType.IDENTIFIER && fn.type != ASTNodeType.ACCESS)
                                    return t.throwDebug('not static fn')
                                que.push(new ASTCallNode(pfile,fn.indexStart,next.indexEnd,fn,[]))
                                postfix.push(',0','$')
                                tokens.skip(1)
                                lastWasOperand = true
                                break
                            } {
                                let rec = recurse(tokens,asi,isFn,true)
                                postfix.push(...rec.meta.postfix)
                                if (!que.length) t.throwDebug('no fn on queue?')
                                let fn = que.pop() as ASTExpr
                                if (fn.type != ASTNodeType.IDENTIFIER && fn.type != ASTNodeType.ACCESS)
                                    return t.throwDebug('not static fn: '+ASTNodeType[fn.type])
                                lastWasOperand = true
                                let argnode = rec.ast
                                if (argnode.type != ASTNodeType.LIST)
                                    throw new Error('should not happen')
                                que.push(new ASTCallNode(pfile,fn.indexStart,t.indexEnd,fn,argnode.list))
                                postfix.push('$')
                                break
                            }
                        } else {
                            let rec = recurse(tokens,asi,isFn,true)
                            postfix.push(...rec.meta.postfix)
                            que.push(rec.ast)
                            lastWasOperand = true
                            break
                        }
                    case ')':
                        if (!lastWasOperand) t.throwDebug('unexpected')
                        return finish()
                    case '.':
                        pushOperator(opInfo(t,!lastWasOperand),false)
                        let o = que.pop()
                        if (!o) return t.throwDebug('unexpected')
                        let access = tokens.next().expectType(TokenType.SYMBOL) as GenericToken
                        que.push(new ASTDynamicAccessNode(pfile,o.indexStart,t.indexEnd,access,o))
                        postfix.push(access.value,'.')
                        lastWasOperand = false
                        break
                    case ',':
                        /*if (fncalls[fncalls.length-1])
                            if (tokens.peek().value != 'ref')
                                refs.push(false)*/
                        let coptopush = opInfo(t,false)
                        pushOperator(coptopush,false) // reduce completely
                        if (que.length == 0) t.throwDebug('unexpected') // double comma
                        queList.push(que=[])
                        lastWasOperand = false
                        break
                    case ';':
                        return finish()
                    case '}':
                        if (!asi) t.throwDebug('no automatic semicolon insertion >:)')
                        tokens.skip(-1)
                        return finish()
                    default:
                        if (!asi||!tokens.currentFollowsNewline()) t.throwDebug('marker not implemented')
                        tokens.skip(-1)
                        return finish()
                }
                break
            case TokenType.SELECTOR: {
                if (lastWasOperand)
                    if (!asi||!tokens.currentFollowsNewline()) t.throwDebug('unexpected operand')
                    else {tokens.skip(-1);return finish()}
                que.push(parseSelector(tokens))
                postfix.push(t.value)
                lastWasOperand = true
                break
            }
            case TokenType.SYMBOL:
                if (lastWasOperand)
                    if (!asi||!tokens.currentFollowsNewline()) t.throwDebug('unexpected operand')
                    else {tokens.skip(-1);return finish()}
                que.push(parseStaticAccess(tokens.skip(-1)))
                postfix.push(t.value)
                lastWasOperand = true
                break
            case TokenType.PRIMITIVE: {
                if (lastWasOperand)
                    if (!asi||!tokens.currentFollowsNewline()) t.throwDebug('unexpected operand')
                    else {tokens.skip(-1);return finish()}
                que.push(new ASTPrimitiveNode(pfile,t.indexStart,t.indexEnd,t))
                postfix.push(t.value)
                lastWasOperand = true
                break
            }
            case TokenType.KEYWORD: {
                switch (t.value) {
                    case 'ref':
                        throw new Error('ref disabled')
                        //if (lastWasOperand||!fncalls[fncalls.length-1]) t.throwDebug('unexpected keyword')
                        // refs.push(true)
                        break
                    default:
                        if (!asi||!tokens.currentFollowsNewline())
                        return t.throwUnexpectedKeyWord()
                        tokens.skip(-1)
                        return finish()
                }
                break
            }
            default:
                //return exhaust(t.type)
                if (!asi||!tokens.currentFollowsNewline())
                    return t.throwDebug('tokentype not implemented')
                tokens.skip(-1)
                return finish()
        }
    }

    return finish()

    function finish(): ExprReturn {
        for (let op of ops.reverse()) {
            if (!op.popable) op.token.throwDebug('possible parenthesis mismatch')
            applyOperator(op)
        }

        if (queList.some(q=>q.length != 1))
            throw new Error('hmm... exprs not reduced or empty')
    
        if (queList.length > 1 || inFn) {
            if (!allowList) throw new Error('no list here thx')
            postfix.push(`,${queList.length}`)
            que = [new ASTListNode(pfile,queList[0][0].indexStart,queList[queList.length-1][0].indexEnd,queList.map(q=>q[0]))]
        }

        return {ast:que[0],meta:{postfix}}
    }

    function opTop() {return ops[ops.length-1]}

    function pushOperator(op:Op,doPush=true) {
        // console.log('push out',postfix.join(' '))
        // console.log('push ops',ops.map(o=>o.token.value).join(' '))
        while (ops.length) {
            let l = ops[ops.length-1]
            if (!l.popable) break
            if (l.type == OpType.INFIX && op.type == OpType.PREFIX) break
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
                // actually this should not be a problem, as binary doesn't directly follow prefix
            }
            ops.pop()
            // console.log('push apply',l.token.value)
            applyOperator(l)
        }
        if (doPush) ops.push(op)
        // console.log('push ops2',ops.map(o=>o.token.value).join(' '))
        // console.log('push out2',postfix.join(' '))
    }

    function applyOperator(op:Op): void {
        if (que.length < op.operands) throw new Error('operator expected more operands on queue than available')
        switch (op.token.type) {
            case TokenType.OPERATOR: {
                let ops = que.splice(-op.operands,op.operands)
                let node = new ASTOpNode(
                    pfile,
                    Math.min(ops[0].indexStart,op.token.indexStart),
                    Math.max(ops[ops.length-1].indexEnd,op.token.indexEnd),
                    op.token,
                    ops
                )
                const map = {[OpType.POSTFIX]:':post',[OpType.PREFIX]:':pre',[OpType.INFIX]:''}
                que.push(node)
                postfix.push(op.op+map[op.type])
                break
            }
            case TokenType.MARKER:
                switch (op.op) {
                    case '.':
                    case '::': return op.token.throwDebug('unexpected')
                    default:
                        throw new Error('could not use marker value '+op.op)
                }
                break
            default:
                throw new Error('could not apply operator token type')
        }   
    }

}

function opInfo(token:TokenI,prefix:boolean): Op {
    let [precedency,leftToRight,type] = p(token,prefix)
    if (prefix && type != OpType.PREFIX) token.throwDebug('Operator cannot be prefixed')
    if (!prefix && type == OpType.PREFIX) token.throwDebug('Operator can only be prefixed')
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

function p(t:TokenI,prefix:boolean): [number,boolean,OpType] {
    switch (t.value) {

        // '(' has been set to 30 precedence for now

        case '.':
            return [20,true,OpType.INFIX]

        case '(':
            return [20,true,OpType.POSTFIX]

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
