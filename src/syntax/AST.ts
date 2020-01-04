
import { Token, SourceLine } from "../lexing/Token";
import { exhaust } from "../toolbox/other";
import cols from 'colors/safe'
import { createErrorMessage } from "../toolbox/CompileErrors";

export function astErrorMsg(node:ASTNode|ASTNode[],err:string) {
    
    let [fl,ll,fi,li] = info(node)
    return createErrorMessage(fl,ll,fi,li,err)

}

function info(node:ASTNode|ASTNode[]): [SourceLine,SourceLine,number,number] {
    let arr: Token[] = []
    if (Array.isArray(node))
        for (let sub of node)
            getRec(sub,arr)
    else getRec(node,arr)
    let first = arr[0], last = arr[0]
    for (let t of arr) {
        if (t.line.startIndex + t.index < first.line.startIndex + first.index) first = t
        if (t.line.startIndex + t.index > last.line.startIndex + last.index) last = t
    }
    return [
        first.line,
        last.line,
        first.line.startIndex + first.index,
        last.line.startIndex + last.index + last.value.length
    ]
}

function getRec(node:ASTNode,arr:Token[]): Token[] {
    switch (node.type) {
        case ASTNodeType.BOOLEAN:
            arr.push(node.value)
            break
        case ASTNodeType.COMMAND:
            arr.push(node.token)
            break
        case ASTNodeType.CONDITIONAL:
            arr.push(node.keyword)
            if (node.keywordElse) arr.push(node.keywordElse)
            getRec(node.expression,arr)
            for (let sub of node.primaryBranch) getRec(sub,arr)
            for (let sub of node.secondaryBranch) getRec(sub,arr)
            break
        case ASTNodeType.DEFINE:
            arr.push(node.keyword,node.identifier,node.varType)
            getRec(node.initial,arr)
            break
        case ASTNodeType.FUNCTION:
            arr.push(node.identifier,node.keyword,node.returnType)
            arr.push(...node.parameters.flatMap(p=>Object.values(p)))
            for (let sub of node.body) getRec(sub,arr)
            break
        case ASTNodeType.IDENTIFIER:
            arr.push(node.identifier)
            break
        case ASTNodeType.INVOKATION:
            getRec(node.parameters,arr)
            break
        case ASTNodeType.LIST:
            for (let sub of node.list) getRec(sub,arr)
            break
        case ASTNodeType.NUMBER:
            arr.push(node.value)
            break
        case ASTNodeType.OPERATION:
            arr.push(node.operator)
            for (let sub of node.operands) getRec(sub,arr)
            break
        case ASTNodeType.STRING:
            arr.push(node.value)
            break
        case ASTNodeType.RETURN:
            arr.push(node.keyword)
            if (node.node) getRec(node.node,arr)
            break
        case ASTNodeType.EXPORT:
            arr.push(node.keyword)
            getRec(node.node,arr)
            break
        default:
            return exhaust(node)
    }
    return arr
}

// Add expression wrapper?
export enum ASTNodeType {
    EXPORT,
    DEFINE,
    FUNCTION,
    INVOKATION,
    CONDITIONAL,
    IDENTIFIER,
    PRIMITIVE,
    NUMBER,
    BOOLEAN,
    STRING,
    OPERATION,
    COMMAND,
    LIST,
    RETURN
}

export type ASTNode = ASTReturnNode | ASTExportNode | ASTLetNode | ASTNumNode | ASTBoolNode | ASTStringNode | ASTIdentifierNode | ASTOpNode | ASTListNode | ASTCallNode | ASTFnNode | ASTIfNode | ASTCMDNode

export interface ASTExportNode {
    type: ASTNodeType.EXPORT
    keyword: Token
    node: ASTNode
}

export interface ASTReturnNode {
    type: ASTNodeType.RETURN
    keyword: Token
    node: ASTNode | null
}

export interface ASTLetNode {
    type: ASTNodeType.DEFINE
    identifier: Token
    keyword: Token
    varType: Token
    initial: ASTNode
}

export interface ASTStringNode {
    type: ASTNodeType.STRING
    value: Token
}

export interface ASTNumNode {
    type: ASTNodeType.NUMBER
    value: Token
}

export interface ASTBoolNode {
    type: ASTNodeType.BOOLEAN
    value: Token
}

export interface ASTIdentifierNode {
    type: ASTNodeType.IDENTIFIER
    identifier: Token
}

export interface ASTOpNode {
    type: ASTNodeType.OPERATION
    operator: Token
    operands: ASTNode[]
}

export interface ASTListNode {
    type: ASTNodeType.LIST
    list: ASTNode[]
}

export interface ASTCallNode {
    type: ASTNodeType.INVOKATION
    function: ASTNode,
    parameters: ASTListNode
}

export interface ASTFnNode {
    type: ASTNodeType.FUNCTION
    identifier: Token
    parameters: {symbol:Token,type:Token}[]
    returnType: Token
    body: ASTNode[]
    keyword: Token
}

export interface ASTIfNode {
    type: ASTNodeType.CONDITIONAL
    keyword: Token
    keywordElse: Token|null
    expression: ASTNode
    primaryBranch: ASTNode[]
    secondaryBranch: ASTNode[]
}

export interface ASTCMDNode {
    type: ASTNodeType.COMMAND
    token: Token,
    interpolations: ASTNode[]
}

/*

class ASTNodeBase {

    constructor(
        public readonly sourceLines: SourceLine
    ){}

    throwTest(msg:string): never {throw new Error(msg)}

}

export class ASTExportNode extends ASTNodeBase {
    public readonly type = ASTNodeType.EXPORT
    constructor(
        sourceLines: SourceLine,
        public readonly node: ASTNode
    ){super(sourceLines)}
}

export class ASTLetNode extends ASTNodeBase {
    public readonly type = ASTNodeType.DEFINE
    constructor(
        sourceLines: SourceLine,
        public readonly identifier: Token,
        public readonly varType: Token,
        public readonly initial: ASTNode
    ){super(sourceLines)}
}

export class ASTPrimitiveNode extends ASTNodeBase {
    public readonly type = ASTNodeType.PRIMITIVE
    constructor(
        sourceLines: SourceLine,
        public readonly value: Token
    ){super(sourceLines)}
}

export class ASTIdentifierNode extends ASTNodeBase {
    public readonly type = ASTNodeType.IDENTIFIER
    constructor(
        sourceLines: SourceLine,
        public readonly identifier: Token
    ){super(sourceLines)}
}

export class ASTOpNode extends ASTNodeBase {
    public readonly type = ASTNodeType.OPERATION
    constructor(
        sourceLines: SourceLine,
        public readonly operator: Token,
        public readonly operands: ASTNode[]
    ){super(sourceLines)}
}

export class ASTListNode extends ASTNodeBase {
    public readonly type = ASTNodeType.LIST
    constructor(
        sourceLines: SourceLine,
        public readonly list: ASTNode[]
    ){super(sourceLines)}
}

export class ASTCallNode extends ASTNodeBase {
    public readonly type = ASTNodeType.INVOKATION
    constructor(
        sourceLines: SourceLine,
        public readonly func: ASTFnNode,
        public readonly parameters: ASTListNode
    ){super(sourceLines)}
}

export class ASTFnNode extends ASTNodeBase {
    public readonly type = ASTNodeType.FUNCTION
    constructor(
        sourceLines: SourceLine,
        public readonly identifier: Token,
        public readonly parameters: {symbol:Token,type:Token}[],
        public readonly returnType: Token,
        public readonly body: ASTNode[]
    ){super(sourceLines)}
}

export class ASTIfNode extends ASTNodeBase {
    public readonly type = ASTNodeType.CONDITIONAL
    constructor(
        sourceLines: SourceLine,
        public readonly expression: ASTNode,
        public readonly primaryBranch: ASTNode[],
        public readonly secondaryBranch: ASTNode[]
    ){super(sourceLines)}
}

export class ASTCmdNode extends ASTNodeBase {
    public readonly type = ASTNodeType.COMMAND
    constructor(
        sourceLines: SourceLine,
        public readonly cmd: Token
    ){super(sourceLines)}
}

*/
