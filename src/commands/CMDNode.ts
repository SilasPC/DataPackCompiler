import { expressionSyntaxParser } from "../syntax/expressionSyntaxParser"
import { inlineLiveLexer } from "../lexing/lexer"
import { TokenI, TokenType } from "../lexing/Token"
import { CompileContext } from "../toolbox/CompileContext"
import { Scope } from "../semantics/Scope"
import { exprParser } from "../semantics/expressionParser"
import { ASTNode } from "../syntax/AST"

type Sem = {ctx:CompileContext,scope:Scope}

export class CMDNode {

	constructor(
		public readonly cmpStr: string,
		public readonly restOptional: boolean,
		public children: CMDNode[]
	) {}

	/** i is the current index. */
	parseSyntax(token:TokenI,i:number,ctx:CompileContext): ASTNode[] {
		let l = this.tryConsume(token,i,ctx)
		let cmd = token.value
		if (l == -1) token.throwDebug('consume fail')
		let j = i + l
		if (cmd.length <= j) {
			if (
				!this.restOptional &&
				this.children.length > 0
			) return token.throwDebug('match failed (expected more)')
			return []
		}
		let sub = this.findNext(token,j,ctx)
		return sub.parseSyntax(token,j,ctx)
	}

	/** Return child. j is next index */
	findNext(token:TokenI,j:number,ctx:CompileContext): CMDNode {
		let cmd = token.value
		let [s,...d] = this.children.filter(c=>c.tryConsume(token,j,ctx) != -1)
		// if (d.length) [s,...d] = this.children.filter(c=>c.tryConsume(token,j+1,ctx)) // try strict equal
		if (d.length)
			return token.throwDebug('match failed (too many subs)')
		if (!s)
			return token.throwDebug('match failed (no subs)')
		return s
	}

	/** Find consumed length. -1 is failed. Includes whitespace. */
	tryConsume(token:TokenI,i:number,ctx:CompileContext): number {
		let cmd = token.value
		if (cmd.length <= i) return -1
		let x = cmd.slice(i).split(' ')[0]
		return this.cmpStr == x ? x.length + 1 : -1
	}

}

export class SemanticalCMDNode extends CMDNode {

	private lastAST: ASTNode | null = null

	parseSyntax(token:TokenI,i:number,ctx:CompileContext): ASTNode[] {
		let ret = super.parseSyntax(token,i,ctx)
		if (this.lastAST) ret.unshift(this.lastAST)
		return ret
	}

	tryConsume(token:TokenI,i:number,ctx:CompileContext): number {
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
		switch (this.cmpStr) {
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
				throw new Error('NEED EXHAUSTION CHECK: '+this.cmpStr)
		}
	}

}

export class RootCMDNode extends CMDNode {

	tryConsume() {
		return 0
	}

}
