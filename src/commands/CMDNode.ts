import { expressionSyntaxParser } from "../syntax/expressionSyntaxParser"
import { inlineLiveLexer } from "../lexing/lexer"
import { TokenI, TokenType } from "../lexing/Token"
import { CompileContext } from "../toolbox/CompileContext"
import { Scope } from "../semantics/Scope"
import { exprParser } from "../semantics/expressionParser"
import { ASTNode, ASTExpr } from "../syntax/AST"
import { SheetSpecials } from "./sheetParser"
import { exhaust } from "../toolbox/other"
import { Maybe, MaybeWrapper } from "../toolbox/Maybe"
import { readNumber, readSelector } from "./specialParsers"
import { CompileError } from "../toolbox/CompileErrors"

export type ParsedSyntax = {node:CMDNode,expr:ASTExpr|null,capture:string}[]

export class CMDNode {

	constructor(
		public readonly cmpStr: string,
		public readonly restOptional: boolean,
		public children: CMDNode[]
	) {}

	/** i is the current index. */
	protected parseSyntax(token:TokenI,i:number,ctx:CompileContext): ParsedSyntax | CompileError {
		let l = this.tryConsume(token,i,ctx)
		if (typeof l != 'number')
			throw new Error('should not happen')
		let cmd = token.value
		let j = i + l
		// console.log(cmd,'->',`"${cmd.substr(i,l)}"`)
		if (cmd.length <= j) {
			if (
				!this.restOptional &&
				this.children.length > 0
			) return token.error('match failed (expected more)')
			return [{node:this,capture:cmd.substr(i,l-1),expr:null}]
		}
		let sub = this.findNext(token,j,ctx)
		if (Array.isArray(sub)) return errMsgsToCompileError(token,i,sub)
		let res = sub.parseSyntax(token,j,ctx)
		if (res instanceof CompileError) return res
		return [{node:this,capture:cmd.substr(i,l-1),expr:null},...res]
	}

	/** Return child. j is next index */
	protected findNext(token:TokenI,j:number,ctx:CompileContext): CMDNode | string[] {
		let cmd = token.value
		let trys = this.children.map(c=>c.tryConsume(token,j,ctx))
		let [s,...d] = this.children.filter((_,i)=>typeof trys[i] == 'number')
		// if (d.length) [s,...d] = this.children.filter(c=>c.tryConsume(token,j+1,ctx)) // try strict equal
		if (d.length)
			return ['match failed (matched too many)']
		if (!s) {
			// console.log('failed at',token.value.slice(j))
			return trys.filter(t=>typeof t != 'number') as string[]
		}
		return s
	}

	/** Find consumed length. ErrMsg is failed. Includes whitespace. */
	protected tryConsume(token:TokenI,i:number,ctx:CompileContext): number | string {
		let cmd = token.value
		if (cmd.length <= i) return `expected '${this.cmpStr}'`
		let x = cmd.slice(i).split(' ')[0]
		return this.cmpStr == x ? x.length + 1 : `expected '${this.cmpStr}'`
	}

}

export class SemanticalCMDNode extends CMDNode {

	private lastAST: ASTExpr | null = null

	protected parseSyntax(token:TokenI,i:number,ctx:CompileContext) {
		let ret = super.parseSyntax(token,i,ctx)
		if (ret instanceof CompileError) return ret
		ret[ret.length-1].expr = this.lastAST
		return ret
	}

	protected tryConsume(token:TokenI,i:number,ctx:CompileContext): number | string {
		if (token.value.startsWith('${',i)) {
			let lexer = inlineLiveLexer(token.line.file,token,i+2)
			let {ast} = expressionSyntaxParser(
				lexer,ctx,true
			)
			let j = lexer
				.next()
				.expectType(TokenType.MARKER)
				.expectValue('}')
				.indexLine
			this.lastAST = ast
			return j - token.indexLine + 1
		}
		let spec = this.cmpStr as SheetSpecials
		switch (spec) {
			case 'text':
				return token.value.length - i
			case 'int': return readNumber(token,true,true,true,i)
			case 'uint': return readNumber(token,true,false,true,i)
			case 'pint': return readNumber(token,true,false,false,i)
			case 'player': return readSelector(token,i,false,true)
			case 'players': return readSelector(token,i,true,true)
			case 'entity': return readSelector(token,i,false,false)
			case 'entities': return readSelector(token,i,true,false)
			case 'coords':
			case 'coords2':
			case 'float':
			case 'ufloat':
				return `not implemented sheet special '${spec}'`
			default:
				return exhaust(spec)
		}
	}

}

export class RootCMDNode extends CMDNode {

	syntaxParse(token:TokenI,ctx:CompileContext) {
		return this.parseSyntax(token,1,ctx)
	}
	
	protected tryConsume() {
		return 0
	}

}

function errMsgsToCompileError(token:TokenI,i:number,errMsgs:string[]) {
	if (errMsgs.length == 1) return token.errorAt(i,errMsgs[0])
	let res = 'got multiple errors:'
	for (let msg of errMsgs) res += '\n - ' + msg
	return token.error(res)
}
