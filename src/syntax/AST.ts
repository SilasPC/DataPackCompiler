
import { Token } from "../lexing/Token";

// Add expression wrapper?
export enum ASTNodeType {
    EXPORT,
    DEFINE,
    FUNCTION,
    INVOKATION,
    CONDITIONAL,
    IDENTIFIER,
    PRIMITIVE,
    OPERATION,
    COMMAND,
    LIST
}

export type ASTNode = ASTExportNode |ASTLetNode | ASTPrimitiveNode | ASTIdentifierNode | ASTOpNode | ASTListNode | ASTCallNode | ASTFnNode | ASTIfNode | ASTCmdNode

export interface ASTExportNode {
    type: ASTNodeType.EXPORT
    node: ASTNode
}

export interface ASTLetNode {
    type: ASTNodeType.DEFINE
    identifier: Token
    varType: Token
    initial: ASTNode
}

export interface ASTPrimitiveNode {
    type: ASTNodeType.PRIMITIVE
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
}

export interface ASTIfNode {
    type: ASTNodeType.CONDITIONAL
    expression: ASTNode
    primaryBranch: ASTNode[]
    secondaryBranch: ASTNode[]
}

export interface ASTCmdNode {
    type: ASTNodeType.COMMAND
    cmd: string
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
