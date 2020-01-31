
import { TokenI, OpToken, GenericToken } from "../lexing/Token";
import { SourceLine } from "../lexing/SourceLine";
import { CMDNode } from "../commands/CMDNode";
import { ParsingFile } from "../toolbox/ParsingFile";
import { CompileError, createErrorMessage } from "../toolbox/CompileErrors";

export function astArrErr(nodes:ASTNode[],err:string,warnOnly:boolean) {
    return new CompileError(
        createErrorMessage(nodes[0].pfile,nodes[0].indexStart,nodes[nodes.length-1].indexEnd,err),
        warnOnly
    )
}

function astSourceMap(pfile:ParsingFile,fi:number,li:number) {
    let fl = pfile.getLineFromIndex(fi), ll = pfile.getLineFromIndex(li)
    
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
    ACCESS,
    SELECTOR,
    RECIPE,
    STRUCT,
    WHILE
}

export type ASTAccess = ASTAccessNode | ASTIdentifierNode
export type ASTExpr = ASTAccess | ASTSelectorNode | ASTPrimitiveNode | ASTIdentifierNode | ASTOpNode | ASTListNode | ASTCallNode
export type ASTStatement = ASTWhileNode | ASTExpr | ASTReturnNode | ASTLetNode | ASTIfNode | ASTCMDNode
export type ASTStaticDeclaration = ASTRecipeNode | ASTLetNode | ASTModuleNode | ASTFnNode | ASTExportNode | ASTImportNode | ASTStructNode
export type ASTNode = ASTExpr | ASTStatement | ASTStaticDeclaration

export type ASTAccessNode = ASTStaticAccessNode | ASTDynamicAccessNode

class ASTNodeBase {

    protected constructor(
        public readonly pfile: ParsingFile,
        public readonly indexStart: number,
        public readonly indexEnd: number
    ){}

    error(err:string) {return new CompileError(createErrorMessage(this.pfile,this.indexStart,this.indexEnd,err),false)}
    warning(err:string) {return new CompileError(createErrorMessage(this.pfile,this.indexStart,this.indexEnd,err),true)}

    sourceMap() {return astSourceMap(this.pfile,this.indexStart,this.indexEnd)}

}

export class ASTRecipeNode extends ASTNodeBase {
    public readonly type = ASTNodeType.RECIPE
    constructor(
        pfile: ParsingFile,
        indexStart: number,
        indexEnd: number
    ){super(pfile,indexStart,indexEnd)}
}

export class ASTModuleNode extends ASTNodeBase {
    public readonly type = ASTNodeType.MODULE
    constructor(
        pf: ParsingFile,
        indexStart: number,
        indexEnd: number,
        public readonly identifier: TokenI,
        public readonly body: ASTStaticDeclaration[]
    ){super(pf,indexStart,indexEnd)}
}

export class ASTWhileNode extends ASTNodeBase {
    public readonly type = ASTNodeType.WHILE
    constructor(
        pf: ParsingFile,
        indexStart: number,
        indexEnd: number,
        public readonly clause: ASTExpr,
        public readonly body: ASTStatement[]
    ){super(pf,indexStart,indexEnd)}
}

export class ASTReturnNode extends ASTNodeBase {
    public readonly type = ASTNodeType.RETURN
    constructor(
        pf: ParsingFile,
        indexStart: number,
        indexEnd: number,
        public readonly node: ASTExpr | null
    ){super(pf,indexStart,indexEnd)}
}

export class ASTCMDNode extends ASTNodeBase {
    public readonly type = ASTNodeType.COMMAND
    constructor(
        pf: ParsingFile,
        indexStart: number,
        indexEnd: number,
        public readonly token: TokenI,
        public readonly consume: {node:CMDNode,capture:string,expr:ASTExpr|null}[]
    ){super(pf,indexStart,indexEnd)}
}

export class ASTSelectorNode extends ASTNodeBase {
    public readonly type = ASTNodeType.SELECTOR
    constructor(
        pf: ParsingFile,
        indexStart: number,
        indexEnd: number,
        public readonly token: GenericToken
    ){super(pf,indexStart,indexEnd)}
}

export class ASTExportNode extends ASTNodeBase {
    public readonly type = ASTNodeType.EXPORT
    constructor(
        pf: ParsingFile,
        indexStart: number,
        indexEnd: number,
        public readonly node: Exclude<ASTStaticDeclaration,ASTExportNode>
    ){super(pf,indexStart,indexEnd)}
}

export class ASTLetNode extends ASTNodeBase {
    public readonly type = ASTNodeType.DEFINE
    constructor(
        pf: ParsingFile,
        indexStart: number,
        indexEnd: number,
        public readonly isConst: boolean,
        public readonly identifier: GenericToken,
        public readonly typeToken: TokenI | null,
        public readonly initial: ASTExpr
    ){super(pf,indexStart,indexEnd)}
}

export class ASTPrimitiveNode extends ASTNodeBase {
    public readonly type = ASTNodeType.PRIMITIVE
    constructor(
        pf: ParsingFile,
        indexStart: number,
        indexEnd: number,
        public readonly value: GenericToken
    ){super(pf,indexStart,indexEnd)}
}

export class ASTIdentifierNode extends ASTNodeBase {
    public readonly type = ASTNodeType.IDENTIFIER
    constructor(
        pf: ParsingFile,
        indexStart: number,
        indexEnd: number,
        public readonly identifier: GenericToken
    ){super(pf,indexStart,indexEnd)}
}

export class ASTOpNode extends ASTNodeBase {
    public readonly type = ASTNodeType.OPERATION
    constructor(
        pf: ParsingFile,
        indexStart: number,
        indexEnd: number,
        public readonly operator: OpToken,
        public readonly operands: ASTExpr[]
    ){super(pf,indexStart,indexEnd)}
}

export class ASTListNode extends ASTNodeBase {
    public readonly type = ASTNodeType.LIST
    constructor(
        pf: ParsingFile,
        indexStart: number,
        indexEnd: number,
        public readonly list: ASTExpr[]
    ){super(pf,indexStart,indexEnd)}
}

export class ASTCallNode extends ASTNodeBase {
    public readonly type = ASTNodeType.INVOKATION
    constructor(
        pf: ParsingFile,
        indexStart: number,
        indexEnd: number,
        public readonly func: ASTAccess,
        public readonly parameters: (ASTRefNode|ASTExpr)[]
    ){super(pf,indexStart,indexEnd)}
}

export class ASTFnNode extends ASTNodeBase {
    public readonly type = ASTNodeType.FUNCTION
    constructor(
        pf: ParsingFile,
        indexStart: number,
        indexEnd: number,
        public readonly identifier: GenericToken,
        public readonly parameters: {ref:boolean,symbol:TokenI,type:TokenI}[],
        public readonly returnType: TokenI | null,
        public readonly body: ASTStatement[]
    ){super(pf,indexStart,indexEnd)}

    getSignatureString() {
        return '(' + this.parameters.map(p=>`${p.ref?'ref ':''}${p.type.value}`).join(', ') + ') -> ' + (this.returnType?this.returnType.value:'infered')
    }

}

export class ASTStructNode extends ASTNodeBase {
    public readonly type = ASTNodeType.STRUCT
    constructor(
        pf: ParsingFile,
        indexStart: number,
        indexEnd: number,
        public readonly identifier: GenericToken,
        public readonly parents: GenericToken[]
    ){super(pf,indexStart,indexEnd)}
}

export class ASTIfNode extends ASTNodeBase {
    public readonly type = ASTNodeType.CONDITIONAL
    constructor(
        pf: ParsingFile,
        indexStart: number,
        indexEnd: number,
        public readonly expression: ASTExpr,
        public readonly primaryBranch: ASTStatement[],
        public readonly secondaryBranch: ASTStatement[]
    ){super(pf,indexStart,indexEnd)}
}

export class ASTCmdNode extends ASTNodeBase {
    public readonly type = ASTNodeType.COMMAND
    constructor(
        pf: ParsingFile,
        indexStart: number,
        indexEnd: number,
        public readonly cmd: TokenI
    ){super(pf,indexStart,indexEnd)}
}


export class ASTStaticAccessNode extends ASTNodeBase {
    public readonly type = ASTNodeType.ACCESS
    public readonly isStatic = true
    constructor(
        pf: ParsingFile,
        indexStart: number,
        indexEnd: number,
        public readonly access: GenericToken,
        public readonly accessee: ASTStaticAccessNode | ASTIdentifierNode
    ){super(pf,indexStart,indexEnd)}
}

export class ASTDynamicAccessNode extends ASTNodeBase {
    public readonly type = ASTNodeType.ACCESS
    public readonly isStatic = false
    constructor(
        pf: ParsingFile,
        indexStart: number,
        indexEnd: number,
        public readonly access: GenericToken,
        public readonly accessee: ASTExpr
    ){super(pf,indexStart,indexEnd)}
}

export class ASTImportNode extends ASTNodeBase {
    public readonly type = ASTNodeType.IMPORT
    constructor(
        pf: ParsingFile,
        indexStart: number,
        indexEnd: number,
        public readonly imports: TokenI[]|TokenI,
        public readonly source: GenericToken,
    ){super(pf,indexStart,indexEnd)}
}

export class ASTRefNode extends ASTNodeBase {
    public readonly type = ASTNodeType.REFERENCE
    constructor(
        pf: ParsingFile,
        indexStart: number,
        indexEnd: number,
        public readonly ref: ASTAccess
    ){super(pf,indexStart,indexEnd)}
}
