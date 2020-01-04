"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const other_1 = require("../toolbox/other");
const CompileErrors_1 = require("../toolbox/CompileErrors");
function astErrorMsg(node, err) {
    let [fl, ll, fi, li] = info(node);
    return CompileErrors_1.createErrorMessage(fl, ll, fi, li, err);
}
exports.astErrorMsg = astErrorMsg;
function info(node) {
    let arr = [];
    if (Array.isArray(node))
        for (let sub of node)
            getRec(sub, arr);
    else
        getRec(node, arr);
    let first = arr[0], last = arr[0];
    for (let t of arr) {
        if (t.line.startIndex + t.index < first.line.startIndex + first.index)
            first = t;
        if (t.line.startIndex + t.index > last.line.startIndex + last.index)
            last = t;
    }
    return [
        first.line,
        last.line,
        first.line.startIndex + first.index,
        last.line.startIndex + last.index + last.value.length
    ];
}
function getRec(node, arr) {
    switch (node.type) {
        case ASTNodeType.BOOLEAN:
            arr.push(node.value);
            break;
        case ASTNodeType.COMMAND:
            arr.push(node.token);
            break;
        case ASTNodeType.CONDITIONAL:
            arr.push(node.keyword);
            if (node.keywordElse)
                arr.push(node.keywordElse);
            getRec(node.expression, arr);
            for (let sub of node.primaryBranch)
                getRec(sub, arr);
            for (let sub of node.secondaryBranch)
                getRec(sub, arr);
            break;
        case ASTNodeType.DEFINE:
            arr.push(node.keyword, node.identifier, node.varType);
            getRec(node.initial, arr);
            break;
        case ASTNodeType.FUNCTION:
            arr.push(node.identifier, node.keyword, node.returnType);
            arr.push(...node.parameters.flatMap(p => Object.values(p)));
            for (let sub of node.body)
                getRec(sub, arr);
            break;
        case ASTNodeType.IDENTIFIER:
            arr.push(node.identifier);
            break;
        case ASTNodeType.INVOKATION:
            getRec(node.parameters, arr);
            break;
        case ASTNodeType.LIST:
            for (let sub of node.list)
                getRec(sub, arr);
            break;
        case ASTNodeType.NUMBER:
            arr.push(node.value);
            break;
        case ASTNodeType.OPERATION:
            arr.push(node.operator);
            for (let sub of node.operands)
                getRec(sub, arr);
            break;
        case ASTNodeType.STRING:
            arr.push(node.value);
            break;
        case ASTNodeType.RETURN:
            arr.push(node.keyword);
            if (node.node)
                getRec(node.node, arr);
            break;
        case ASTNodeType.EXPORT:
            arr.push(node.keyword);
            getRec(node.node, arr);
            break;
        default:
            return other_1.exhaust(node);
    }
    return arr;
}
// Add expression wrapper?
var ASTNodeType;
(function (ASTNodeType) {
    ASTNodeType[ASTNodeType["EXPORT"] = 0] = "EXPORT";
    ASTNodeType[ASTNodeType["DEFINE"] = 1] = "DEFINE";
    ASTNodeType[ASTNodeType["FUNCTION"] = 2] = "FUNCTION";
    ASTNodeType[ASTNodeType["INVOKATION"] = 3] = "INVOKATION";
    ASTNodeType[ASTNodeType["CONDITIONAL"] = 4] = "CONDITIONAL";
    ASTNodeType[ASTNodeType["IDENTIFIER"] = 5] = "IDENTIFIER";
    ASTNodeType[ASTNodeType["PRIMITIVE"] = 6] = "PRIMITIVE";
    ASTNodeType[ASTNodeType["NUMBER"] = 7] = "NUMBER";
    ASTNodeType[ASTNodeType["BOOLEAN"] = 8] = "BOOLEAN";
    ASTNodeType[ASTNodeType["STRING"] = 9] = "STRING";
    ASTNodeType[ASTNodeType["OPERATION"] = 10] = "OPERATION";
    ASTNodeType[ASTNodeType["COMMAND"] = 11] = "COMMAND";
    ASTNodeType[ASTNodeType["LIST"] = 12] = "LIST";
    ASTNodeType[ASTNodeType["RETURN"] = 13] = "RETURN";
})(ASTNodeType = exports.ASTNodeType || (exports.ASTNodeType = {}));
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
//# sourceMappingURL=AST.js.map