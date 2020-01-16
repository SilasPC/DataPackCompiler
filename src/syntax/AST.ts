
import { TokenI, OpToken, KeywordToken, MarkerToken, GenericToken } from "../lexing/Token";
import { exhaust } from "../toolbox/other";
import cols from 'colors/safe'
import { createErrorMessage, CompileError } from "../toolbox/CompileErrors";
import { SourceLine } from "../lexing/SourceLine";
import { CMDNode } from "../commands/CMDNode";
import { ValueType } from "../semantics/Types";

export function astError(node:ASTNode|ASTNode[],err:string): CompileError {
    return new CompileError(astErrorMsg(node,err),false)
}

export function astWarning(node:ASTNode|ASTNode[],err:string): CompileError {
    return new CompileError(astErrorMsg(node,err),true)
}

export function astErrorMsg(node:ASTNode|ASTNode[],err:string) {
    
    let [fl,ll,fi,li] = info(node)
    return createErrorMessage(fl,ll,fi,li,err)

}

export function astSourceMap(node:ASTNode) {
    let [fl,ll,fi,li] = info(node)
    
    let cmts: string[] = []
	let nrLen = ll.nr.toString().length
	let ws = ' '.repeat(nrLen+2)

	let l: SourceLine | null = fl
	let lines: (string|SourceLine)[] = []
	while ((ll.next ? l != ll.next : true) && l != null) {
			lines.push(l)
			l = l.next
	}

	if (lines.length > 3) {
			let prevLine = lines[0] as SourceLine
			let placeholder = ':'.repeat((prevLine.nr).toString().length).padStart(nrLen,' ')
			lines = lines.slice(0,1).concat(` ${placeholder} |`,lines.slice(-1))
	}

	for (let line of lines) {

			if (typeof line == 'string') {
					cmts.push(line)
					continue
			}

			let wss = line.line.length - line.line.trimLeft().length

			let c0 = Math.max(fi-line.startIndex,wss)
			let c1 = Math.min(li-line.startIndex,line.line.trimRight().length)

			cmts.push(` ${line.nr.toString().padStart(nrLen,' ')} | ${' '.repeat(c0)}${line.line.slice(c0,c1)}`)

    }
    
	return cmts
}

function info(node:ASTNode|ASTNode[]): [SourceLine,SourceLine,number,number] {
    let arr: TokenI[] = []
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

// only really need to check first and last token
function getRec(node:ASTNode,arr:TokenI[]): TokenI[] {
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
            if (node.primaryBranch.length) {
                getRec(node.primaryBranch[0],arr)
                getRec(node.primaryBranch.slice(-1)[0],arr)
            }
            if (node.secondaryBranch.length) {
                getRec(node.secondaryBranch[0],arr)
                getRec(node.secondaryBranch.slice(-1)[0],arr)
            }
            break
        case ASTNodeType.DEFINE:
            arr.push(node.keyword,node.identifier)
            getRec(node.initial,arr)
            break
        case ASTNodeType.FUNCTION:
            arr.push(node.identifier,node.keyword,node.returnType)
            arr.push(...node.parameters.flatMap(p=>[p.symbol,p.type]))
            if (node.body.length) {
                getRec(node.body[0],arr)
                getRec(node.body.slice(-1)[0],arr)
            }
            break
        case ASTNodeType.IDENTIFIER:
            arr.push(node.identifier)
            break
        case ASTNodeType.INVOKATION:
            getRec(node.parameters,arr)
            break
        case ASTNodeType.LIST:
            if (node.list.length) {
                getRec(node.list[0],arr)
                getRec(node.list.slice(-1)[0],arr)
            }
            break
        case ASTNodeType.NUMBER:
            arr.push(node.value)
            break
        case ASTNodeType.OPERATION:
            arr.push(node.operator)
            if (node.operands.length) {
                getRec(node.operands[0],arr)
                getRec(node.operands.slice(-1)[0],arr)
            }
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
        case ASTNodeType.MODULE:
            arr.push(node.keyword,node.identifier)
            if (node.body.length) {
                getRec(node.body[0],arr)
                getRec(node.body.slice(-1)[0],arr)
            }
            break
        case ASTNodeType.REFERENCE:
            arr.push(node.keyword)
            getRec(node.ref,arr)
            break
        case ASTNodeType.IMPORT:
            arr.push(node.keyword,node.source)
            break
        case ASTNodeType.STATIC_ACCESS:
            arr.push(node.access)
            getRec(node.accessee,arr)
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
    RETURN,
    MODULE,
    REFERENCE,
    IMPORT,
    STATIC_ACCESS
}

export type ASTStatic = ASTStaticAccessNode | ASTIdentifierNode
export type ASTExpr = ASTStaticAccessNode | ASTRefNode | ASTNumNode | ASTBoolNode | ASTStringNode | ASTIdentifierNode | ASTOpNode | ASTListNode | ASTCallNode
export type ASTStatement = ASTExpr | ASTReturnNode | ASTLetNode | ASTIfNode | ASTCMDNode
export type ASTStaticDeclaration = ASTLetNode | ASTModuleNode | ASTFnNode | ASTExportNode | ASTImportNode
export type ASTNode = ASTExpr | ASTStatement | ASTStaticDeclaration

export interface ASTStaticAccessNode {
    type: ASTNodeType.STATIC_ACCESS
    access: GenericToken
    accessee: ASTStatic
}

export interface ASTImportNode {
    type: ASTNodeType.IMPORT
    keyword: KeywordToken
    keyword2: KeywordToken
    imports: TokenI[]|TokenI
    source: GenericToken
}

export interface ASTRefNode {
    type: ASTNodeType.REFERENCE
    keyword: TokenI
    ref: ASTStatic
}

export interface ASTModuleNode {
    type: ASTNodeType.MODULE
    keyword: KeywordToken
    identifier: TokenI
    body: ASTStaticDeclaration[]
}

export interface ASTExportNode {
    type: ASTNodeType.EXPORT
    keyword: KeywordToken
    node: Exclude<ASTStaticDeclaration,ASTExportNode>
}

export interface ASTReturnNode {
    type: ASTNodeType.RETURN
    keyword: KeywordToken
    node: ASTExpr | null
}

export interface ASTLetNode {
    type: ASTNodeType.DEFINE
    identifier: GenericToken
    keyword: KeywordToken
    const: boolean
    typeToken: TokenI | null
    initial: ASTExpr
}

export interface ASTStringNode {
    type: ASTNodeType.STRING
    value: GenericToken
}

export interface ASTNumNode {
    type: ASTNodeType.NUMBER
    value: GenericToken
}

export interface ASTBoolNode {
    type: ASTNodeType.BOOLEAN
    value: GenericToken
}

export interface ASTIdentifierNode {
    type: ASTNodeType.IDENTIFIER
    identifier: GenericToken
}

export interface ASTOpNode {
    type: ASTNodeType.OPERATION
    operator: OpToken|MarkerToken
    operands: ASTExpr[]
}

export interface ASTListNode {
    type: ASTNodeType.LIST
    list: ASTExpr[]
}

export interface ASTCallNode {
    type: ASTNodeType.INVOKATION
    function: ASTStatic,
    parameters: ASTListNode
}

export interface ASTFnNode {
    type: ASTNodeType.FUNCTION
    identifier: GenericToken
    parameters: {ref:boolean,symbol:TokenI,type:TokenI}[]
    returnType: TokenI
    body: ASTStatement[]
    keyword: KeywordToken
}

export interface ASTIfNode {
    type: ASTNodeType.CONDITIONAL
    keyword: KeywordToken
    keywordElse: KeywordToken|null
    expression: ASTExpr
    primaryBranch: ASTStatement[]
    secondaryBranch: ASTStatement[]
}

export interface ASTCMDNode {
    type: ASTNodeType.COMMAND
    token: TokenI
    consume: {node:CMDNode,capture:string,expr:ASTExpr|null}[]
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
