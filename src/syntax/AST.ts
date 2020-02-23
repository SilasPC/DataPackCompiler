
import { TokenI, OpToken, GenericToken, DirectiveToken } from "../lexing/Token";
import { SourceLine } from "../lexing/SourceLine";
import { CMDNode } from "../commands/CMDNode";
import { SourceCodeError } from "../toolbox/CompileErrors";
import { Interspercer } from "../toolbox/Interspercer";
import { ModuleFile } from "../input/InputTree";

export function astArrErr(nodes:ASTNode[],err:string) {
    return new SourceCodeError(
        nodes[0].mod,
        nodes[0].indexStart,
        nodes[nodes.length-1].indexEnd,
        err
    )
}

function astSourceMap(mod:ModuleFile,fi:number,li:number) {
    let fl = mod.getLineFromIndex(fi), ll = mod.getLineFromIndex(li)
    
    let cmts: string[] = []
	let nrLen = ll.nr.toString().length
	let ws = ' '.repeat(nrLen+2)

	let l: SourceLine | null = fl
	let lines: (string|SourceLine)[] = []
	while ((ll.next ? l != ll.next : true) && l != null) {
			lines.push(l)
			l = l.next
	}

	if (lines.length > 2) {
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

export enum ASTNodeType {
    PUBLIC,
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
    USE,
    FIELD,
    ACCESS,
    SELECTOR,
    RECIPE,
    STRUCT,
    WHILE,
    EVENT,
    ON
}

export type ASTAccess = ASTIdentifierNode | ASTDynamicAccessNode
export type ASTExpr = ASTAccess | ASTSelectorNode | ASTPrimitiveNode | ASTIdentifierNode | ASTOpNode | ASTListNode | ASTCallNode
export type ASTStatement = ASTWhileNode | ASTExpr | ASTReturnNode | ASTLetNode | ASTIfNode | ASTCMDNode
export type ASTStaticFieldDeclaration = ASTFieldNode
export type ASTStaticDeclaration = ASTEventNode | ASTOnNode | ASTRecipeNode | ASTLetNode | ASTModuleNode | ASTFnNode | ASTPublicNode | ASTUseNode | ASTStructNode
export type ASTNode = ASTExpr | ASTStatement | ASTStaticDeclaration

export type ASTBody = Interspercer<ASTStatement,DirectiveToken>
export type ASTStaticFieldBody = Interspercer<ASTStaticFieldDeclaration,DirectiveToken>
export type ASTStaticBody = Interspercer<ASTStaticDeclaration,DirectiveToken>

class ASTNodeBase {

    protected constructor(
        public readonly mod: ModuleFile,
        public readonly indexStart: number,
        public readonly indexEnd: number
    ){}

    error(err:string) {return new SourceCodeError(this.mod,this.indexStart,this.indexEnd,err)}

    sourceMap() {return astSourceMap(this.mod,this.indexStart,this.indexEnd)}

}

export class ASTFieldNode extends ASTNodeBase {
    public readonly type = ASTNodeType.FIELD
    constructor(
        mod: ModuleFile,
        indexStart: number,
        indexEnd: number,
        public readonly isPublic: boolean,
        public readonly identifier: TokenI,
        public readonly fieldType: TokenI
    ){super(mod,indexStart,indexEnd)}
}

export class ASTRecipeNode extends ASTNodeBase {
    public readonly type = ASTNodeType.RECIPE
    constructor(
        mod: ModuleFile,
        indexStart: number,
        indexEnd: number,
    ){super(mod,indexStart,indexEnd)}
}

export class ASTModuleNode extends ASTNodeBase {
    public readonly type = ASTNodeType.MODULE
    constructor(
        mod: ModuleFile,
        indexStart: number,
        indexEnd: number,
        public readonly identifier: TokenI,
        public readonly body: ASTStaticBody
    ){super(mod,indexStart,indexEnd)}
}

export class ASTWhileNode extends ASTNodeBase {
    public readonly type = ASTNodeType.WHILE
    constructor(
        mod: ModuleFile,
        indexStart: number,
        indexEnd: number,
        public readonly clause: ASTExpr,
        public readonly body: ASTBody
    ){super(mod,indexStart,indexEnd)}
}

export class ASTReturnNode extends ASTNodeBase {
    public readonly type = ASTNodeType.RETURN
    constructor(
        mod: ModuleFile,
        indexStart: number,
        indexEnd: number,
        public readonly node: ASTExpr | null
    ){super(mod,indexStart,indexEnd)}
}

export class ASTCMDNode extends ASTNodeBase {
    public readonly type = ASTNodeType.COMMAND
    constructor(
        mod: ModuleFile,
        indexStart: number,
        indexEnd: number,
        public readonly token: TokenI,
        public readonly consume: {node:CMDNode,capture:string,expr:ASTExpr|null}[]
    ){super(mod,indexStart,indexEnd)}
}

export class ASTSelectorNode extends ASTNodeBase {
    public readonly type = ASTNodeType.SELECTOR
    constructor(
        mod: ModuleFile,
        indexStart: number,
        indexEnd: number,
        public readonly token: GenericToken
    ){super(mod,indexStart,indexEnd)}
}

export class ASTPublicNode extends ASTNodeBase {
    public readonly type = ASTNodeType.PUBLIC
    constructor(
        mod: ModuleFile,
        indexStart: number,
        indexEnd: number,
        public readonly node: Exclude<ASTStaticDeclaration,ASTPublicNode>
    ){super(mod,indexStart,indexEnd)}
}

export class ASTLetNode extends ASTNodeBase {
    public readonly type = ASTNodeType.DEFINE
    constructor(
        mod: ModuleFile,
        indexStart: number,
        indexEnd: number,
        public readonly isConst: boolean,
        public readonly identifier: GenericToken,
        public readonly typeToken: TokenI | null,
        public readonly initial: ASTExpr
    ){super(mod,indexStart,indexEnd)}
}

export class ASTPrimitiveNode extends ASTNodeBase {
    public readonly type = ASTNodeType.PRIMITIVE
    constructor(
        mod: ModuleFile,
        indexStart: number,
        indexEnd: number,
        public readonly value: GenericToken
    ){super(mod,indexStart,indexEnd)}
}

export class ASTIdentifierNode extends ASTNodeBase {
    public readonly type = ASTNodeType.IDENTIFIER
    constructor(
        mod: ModuleFile,
        indexStart: number,
        indexEnd: number,
        public readonly accessors: readonly GenericToken[],
    ){super(mod,indexStart,indexEnd)}
}

export class ASTOpNode extends ASTNodeBase {
    public readonly type = ASTNodeType.OPERATION
    constructor(
        mod: ModuleFile,
        indexStart: number,
        indexEnd: number,
        public readonly operator: OpToken,
        public readonly operands: readonly ASTExpr[]
    ){super(mod,indexStart,indexEnd)}
}

export class ASTListNode extends ASTNodeBase {
    public readonly type = ASTNodeType.LIST
    constructor(
        mod: ModuleFile,
        indexStart: number,
        indexEnd: number,
        public readonly list: readonly ASTExpr[]
    ){super(mod,indexStart,indexEnd)}
}

export class ASTCallNode extends ASTNodeBase {
    public readonly type = ASTNodeType.INVOKATION
    constructor(
        mod: ModuleFile,
        indexStart: number,
        indexEnd: number,
        public readonly func: ASTAccess,
        public readonly parameters: readonly (ASTRefNode|ASTExpr)[]
    ){super(mod,indexStart,indexEnd)}
}

export class ASTEventNode extends ASTNodeBase {
    public readonly type = ASTNodeType.EVENT
    constructor(
        mod: ModuleFile,
        indexStart: number,
        indexEnd: number,
        public readonly identifier: GenericToken,
        public readonly extend: ASTIdentifierNode | null,
        public readonly body: ASTBody | null
    ){super(mod,indexStart,indexEnd)}
}

export class ASTOnNode extends ASTNodeBase {
    public readonly type = ASTNodeType.ON
    constructor(
        mod: ModuleFile,
        indexStart: number,
        indexEnd: number,
        public readonly event: ASTIdentifierNode | ASTIdentifierNode,
        public readonly body: ASTBody
    ){super(mod,indexStart,indexEnd)}
}

export class ASTFnNode extends ASTNodeBase {
    public readonly type = ASTNodeType.FUNCTION
    constructor(
        mod: ModuleFile,
        indexStart: number,
        indexEnd: number,
        public readonly identifier: GenericToken,
        public readonly parameters: {ref:boolean,symbol:TokenI,type:TokenI}[],
        public readonly returnType: TokenI | null,
        public readonly body: ASTBody
    ){super(mod,indexStart,indexEnd)}

    getSignatureString() {
        return '(' + this.parameters.map(p=>`${p.ref?'ref ':''}${p.type.value}`).join(', ') + ') -> ' + (this.returnType?this.returnType.value:'infered')
    }

}

export class ASTStructNode extends ASTNodeBase {
    public readonly type = ASTNodeType.STRUCT
    constructor(
        mod: ModuleFile,
        indexStart: number,
        indexEnd: number,
        public readonly identifier: GenericToken,
        public readonly parents: readonly GenericToken[],
        public readonly body: ASTStaticFieldBody
    ){super(mod,indexStart,indexEnd)}
}

export class ASTIfNode extends ASTNodeBase {
    public readonly type = ASTNodeType.CONDITIONAL
    constructor(
        mod: ModuleFile,
        indexStart: number,
        indexEnd: number,
        public readonly expression: ASTExpr,
        public readonly primaryBranch: ASTBody,
        public readonly secondaryBranch: ASTBody
    ){super(mod,indexStart,indexEnd)}
}

export class ASTCmdNode extends ASTNodeBase {
    public readonly type = ASTNodeType.COMMAND
    constructor(
        mod: ModuleFile,
        indexStart: number,
        indexEnd: number,
        public readonly cmd: TokenI
    ){super(mod,indexStart,indexEnd)}
}

export class ASTDynamicAccessNode extends ASTNodeBase {
    public readonly type = ASTNodeType.ACCESS
    constructor(
        mod: ModuleFile,
        indexStart: number,
        indexEnd: number,
        public readonly access: GenericToken,
        public readonly accessee: ASTExpr
    ){super(mod,indexStart,indexEnd)}
}

export class ASTUseNode extends ASTNodeBase {
    public readonly type = ASTNodeType.USE
    constructor(
        mod: ModuleFile,
        indexStart: number,
        indexEnd: number,
        public readonly useToken: TokenI,
        public readonly identifier: ASTIdentifierNode
    ){super(mod,indexStart,indexEnd)}
}

export class ASTRefNode extends ASTNodeBase {
    public readonly type = ASTNodeType.REFERENCE
    constructor(
        mod: ModuleFile,
        indexStart: number,
        indexEnd: number,
        public readonly ref: ASTAccess
    ){super(mod,indexStart,indexEnd)}
}
