import { expressionSyntaxParser } from "../syntax/expressionSyntaxParser"
import { inlineLiveLexer } from "../lexing/lexer"
import { TokenI, TokenType } from "../lexing/Token"
import { ASTNode, ASTExpr } from "../syntax/AST"
import { SheetSpecials } from "./sheetParser"
import { exhaust } from "../toolbox/other"
import { readNumber, readSelector, readId, readCoords, read2Coords, readJSON, readNbtPath } from "./specialParsers"
import { CompileError } from "../toolbox/CompileErrors"
import { ValueType, Type } from "../semantics/types/Types"

export type ParsedSyntax = {node:CMDNode,expr:ASTExpr|null,capture:string}[]

export class CMDNode {

	constructor(
		public readonly cmpStr: string,
		public readonly restOptional: boolean,
		public children: CMDNode[]
	) {}

	/** i is the current index. */
	protected parseSyntax(token:TokenI,i:number): ParsedSyntax | CompileError {
		let l = this.tryConsume(token,i)
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
		let sub = this.findNext(token,j)
		if (Array.isArray(sub)) return errMsgsToCompileError(token,j,sub)
		let res = sub.parseSyntax(token,j)
		if (res instanceof CompileError) return res
		return [{node:this,capture:cmd.substr(i,l-1),expr:null},...res]
	}

	/** Return child. j is next index */
	protected findNext(token:TokenI,j:number): CMDNode | string[] {
		let cmd = token.value
		let trys = this.children.map(c=>c.tryConsume(token,j))
		let [s,...d] = this.children.filter((_,i)=>typeof trys[i] == 'number')
		// if (d.length) [s,...d] = this.children.filter(c=>c.tryConsume(token,j+1)) // try strict equal
		if (d.length)
			return ['match failed (matched too many)']
		if (!s) {
			// console.log('failed at',token.value.slice(j))
			let errs = trys.filter(t=>typeof t != 'number') as string[]
			if (errs.length == 0) return ['failed to match any']
			return errs
		}
		return s
	}

	/** Find consumed length. ErrMsg is failed. Includes whitespace. */
	protected tryConsume(token:TokenI,i:number): number | string {
		let cmd = token.value
		if (cmd.length <= i) return `expected '${this.cmpStr}'`
		let x = cmd.slice(i).split(' ')[0]
		return this.cmpStr == x ? x.length + 1 : `expected '${this.cmpStr}'`
	}

	getSubstituteType(): ValueType {
		throw new Error('non-semantical cmd-node asked for subtitute type')
	}

}

export class SemanticalCMDNode extends CMDNode {

	private lastAST: ASTExpr | null = null

	protected parseSyntax(token:TokenI,i:number) {
		let ret = super.parseSyntax(token,i)
		if (ret instanceof CompileError) return ret
		ret[ret.length-1].expr = this.lastAST
		return ret
	}

	protected tryConsume(token:TokenI,i:number): number | string {
		if (token.value.startsWith('${',i)) {
			let lexer = inlineLiveLexer(token.line.file,token,i+2)
			let {ast} = expressionSyntaxParser(
				lexer,true
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
			case 'id': return readId(token,i)
			case 'text': return token.value.length - i
			case 'int': return readNumber(token,true,true,true,i)
			case 'uint': return readNumber(token,true,false,true,i)
			case 'pint': return readNumber(token,true,false,false,i)
			case 'float': return readNumber(token,false,true,true,i)
			case 'ufloat': return readNumber(token,false,false,true,i)
			case 'player': return readSelector(token,i,false,true)
			case 'players': return readSelector(token,i,true,true)
			case 'entity': return readSelector(token,i,false,false)
			case 'entities': return readSelector(token,i,true,false)
			case 'coords': return readCoords(token,i)
			case 'coords2': return read2Coords(token,i)
			case 'json': return readJSON(token,i)
			case 'nbtpath': return readNbtPath(token,i)
			case 'nbt':
				console.log('sheet spec not yet: '+spec)
				return token.value.length - i
			default:
				return exhaust(spec)
		}
	}
	
	getSubstituteType(): ValueType {
		return {type:Type.VOID}
	}

}

export class RootCMDNode extends CMDNode {

	syntaxParse(token:TokenI) {
		return this.parseSyntax(token,1)
	}
	
	protected tryConsume() {
		return 0
	}

}

function errMsgsToCompileError(token:TokenI,i:number,errMsgs:string[]) {
	if (errMsgs.length == 1) return token.errorAt(i,errMsgs[0])
	let res = 'got multiple errors:'
	for (let msg of errMsgs) res += '\n - ' + msg
	return token.errorAt(i,res)
}
