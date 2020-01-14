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

export type ParsedSyntax = {node:CMDNode,expr:ASTExpr|null,capture:string}[]

export class CMDNode {

	constructor(
		public readonly cmpStr: string,
		public readonly restOptional: boolean,
		public children: CMDNode[]
	) {}

	/** i is the current index. */
	protected parseSyntax(token:TokenI,i:number,ctx:CompileContext): ParsedSyntax | null {
		let l = this.tryConsume(token,i,ctx)
		let cmd = token.value
		if (l == -1) throw new Error('should not happen')
		let j = i + l
		if (cmd.length <= j) {
			if (
				!this.restOptional &&
				this.children.length > 0
			) {
				ctx.addError(token.error('match failed (expected more)'))
				return null
			}
			return [{node:this,capture:cmd.substr(i,l-1),expr:null}]
		}
		let sub = this.findNext(token,j,ctx)
		if (!sub) return null
		let res = sub.parseSyntax(token,j,ctx)
		if (!res) return null
		return [{node:this,capture:cmd.substr(i,l-1),expr:null},...res]
	}

	/** Return child. j is next index */
	protected findNext(token:TokenI,j:number,ctx:CompileContext): CMDNode | null {
		let cmd = token.value
		let [s,...d] = this.children.filter(c=>c.tryConsume(token,j,ctx) != -1)
		// if (d.length) [s,...d] = this.children.filter(c=>c.tryConsume(token,j+1,ctx)) // try strict equal
		if (d.length) {
			ctx.addError(token.error('match failed (matched too many)'))
			return null
		}
		if (!s) {
			ctx.addError(token.error('match failed (no matches)'))
			return null
		}
		return s
	}

	/** Find consumed length. -1 is failed. Includes whitespace. */
	protected tryConsume(token:TokenI,i:number,ctx:CompileContext): number {
		let cmd = token.value
		if (cmd.length <= i) return -1
		let x = cmd.slice(i).split(' ')[0]
		return this.cmpStr == x ? x.length + 1 : -1
	}

}

export class SemanticalCMDNode extends CMDNode {

	private lastAST: ASTExpr | null = null

	protected parseSyntax(token:TokenI,i:number,ctx:CompileContext) {
		let ret = super.parseSyntax(token,i,ctx)
		if (!ret) return null
		ret[ret.length-1].expr = this.lastAST
		return ret
	}

	protected tryConsume(token:TokenI,i:number,ctx:CompileContext): number {
		if (token.value.startsWith('${',i)) {
			let lexer = inlineLiveLexer(token,i+2)
			let {ast} = expressionSyntaxParser(
				lexer,ctx,true
			)
			let j = lexer
				.next()
				.expectType(TokenType.MARKER)
				.expectValue('}')
				.index
			this.lastAST = ast
			return j - token.index + 1
		}
		let spec = this.cmpStr as SheetSpecials
		switch (spec) {
			case 'player':
			case 'players':
			case 'entity':
			case 'entities':
			case 'int':
			case 'uint':
			case 'pint':
			case 'coords':
			case 'coords2':
			case 'float':
			case 'ufloat':
			case 'text':
				return token.value.length - i
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
