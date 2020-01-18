
import { TokenI, TokenType } from "../lexing/Token";
import { ASTNodeType, ASTIdentifierNode, ASTOpNode, ASTCallNode, ASTListNode, ASTExpr, ASTRefNode, ASTDynamicAccessNode, ASTStaticAccessNode, ASTPrimitiveNode } from "./AST";
import { TokenIteratorI } from "../lexing/TokenIterator";
import { CompileContext } from "../toolbox/CompileContext";
import { parseSelector } from "./structures/selector";

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

export function expressionSyntaxParser(tokens:TokenIteratorI,ctx:CompileContext,asi:boolean): ExprReturn {

    let pfile = tokens.file

    let ops: Op[] = []
    let que: ASTExpr[] = []
    let postfix: string[] = []

    let refs: boolean[] = []
    let fncalls: boolean[] = [] // store astnodes instead?

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
                        if (isFn) {
                            pushOperator(opInfo(t,!lastWasOperand),false)
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
                            }
                        }
                        fncalls.push(isFn)
                        pushOperator({
                            token: t,
                            op: t.value,
                            precedency: 30 + (isFn?0:1), // does this make a difference?
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
                        if (!lastWasOperand) t.throwDebug('unexpected')
                        if (!fncalls.length) 
                            if (!asi||!tokens.currentFollowsNewline()) t.throwDebug('fncall mismatch')
                            else {tokens.skip(-1);return finish()}
                        if (!ops.length)
                            if (!asi||!tokens.currentFollowsNewline()) t.throwDebug('not matched')
                            else {tokens.skip(-1);return finish()}
                        let openOp: Op
                        do {
                            openOp = ops.pop() as Op
                            if (!openOp.popable) break
                            applyOperator(openOp)
                        } while (ops.length)
                        if (openOp.op != '(') t.throwDebug('cuts off other paren thing')
                        if (fncalls.pop()) {
                            if (que.length<2) t.throwDebug('wth') // this doesn't work so well when there are no parameters xd
                                                                  // note to self: make better comments
                            let argnode = que.pop() as ASTExpr
                            if (argnode.type != ASTNodeType.LIST) {
                                argnode = new ASTListNode(pfile,openOp.token.indexStart,t.indexEnd,[argnode])
                                postfix.push(',1')
                            }
                            let fn = que.pop() as ASTExpr
                            if (fn.type != ASTNodeType.IDENTIFIER && fn.type != ASTNodeType.ACCESS)
                                return t.throwDebug('not static fn: '+ASTNodeType[fn.type])
                            que.push(new ASTCallNode(pfile,fn.indexStart,t.indexEnd,fn,argnode.list.map(a=>{
                                let x = refs.pop()
                                if (typeof x == 'undefined') throw new Error('refs not filled')
                                if (!x) return a
                                if (a.type != ASTNodeType.ACCESS && a.type != ASTNodeType.IDENTIFIER)
                                    throw new Error('ref non access')
                                return new ASTRefNode(pfile,a.indexStart,a.indexEnd,a)
                            })))
                            postfix.push('$')
                        }
                        lastWasOperand = true
                        break
                    case '::':
                    case '.':
                        pushOperator(opInfo(t,!lastWasOperand))
                        lastWasOperand = false
                        break
                    case ',':
                        if (fncalls[fncalls.length-1])
                            if (tokens.peek().value != 'ref')
                                refs.push(false)
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
                que.push(parseSelector(tokens,ctx))
                postfix.push(t.value)
                lastWasOperand = true
                break
            }
            case TokenType.SYMBOL:
                if (lastWasOperand)
                    if (!asi||!tokens.currentFollowsNewline()) t.throwDebug('unexpected operand')
                    else {tokens.skip(-1);return finish()}
                que.push(new ASTIdentifierNode(pfile,t.indexStart,t.indexEnd,t))
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
                        if (lastWasOperand||!fncalls[fncalls.length-1]) t.throwDebug('unexpected keyword')
                        refs.push(true)
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
                    case ',':
                        let ops = que.splice(-op.operands,op.operands)
                        let list = new ASTListNode(pfile,ops[0].indexStart,ops[ops.length-1].indexEnd,ops)
                        que.push(list)
                        postfix.push(','+op.operands)
                        break
                    case '::': {
                        let [o0,o1] = que.splice(-2,2)
                        if (o1.type != ASTNodeType.IDENTIFIER) return op.token.throwDebug('unexpected '+ASTNodeType[o1.type])
                        if (o0.type != ASTNodeType.IDENTIFIER && (o0.type != ASTNodeType.ACCESS || o0.isStatic == false))
                            return op.token.throwDebug('unexpected')
                        que.push(new ASTStaticAccessNode(pfile,o0.indexStart,o1.indexEnd,o1.identifier,o0))
                        postfix.push(op.token.value)
                        break
                    }
                    case '.': {
                        let [o0,o1] = que.splice(-2,2)
                        if (o1.type != ASTNodeType.IDENTIFIER) return op.token.throwDebug('unexpected '+ASTNodeType[o1.type])
                        que.push(new ASTDynamicAccessNode(pfile,o0.indexStart,o1.indexEnd,o1.identifier,o0))
                        postfix.push(op.token.value)
                        break
                    }
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

        case '::':
            return [21,true,OpType.INFIX]
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
