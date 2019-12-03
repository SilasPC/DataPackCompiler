
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
