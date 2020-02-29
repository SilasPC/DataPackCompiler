import { expressionSyntaxParser } from "../syntax/expressionSyntaxParser"
import { inlineLiveLexer } from "../lexing/lexer"
import { TokenI, TokenType } from "../lexing/Token"
import { ASTNode, ASTExpr } from "../syntax/AST"
import { SheetSpecial } from "./sheetParser"
import { exhaust } from "../toolbox/other"
import { readNumber, readSelector, readId, readCoords, read2Coords, readJSON, readNbtPath, readRange, readScore, readTime } from "./specialParsers"
import { CompileError } from "../toolbox/CompileErrors"
import { ValueType, Type } from "../semantics/types/Types"
import { PTExpr, ptExprToType } from "../semantics/ParseTree"
import { Scope } from "../semantics/Scope"
import { parseExpression } from "../semantics/expressionParser"
import { ResultWrapper, Result } from "../toolbox/Result"
import { SemanticsInterpretor } from "./interpolation"

export type ParsedSyntax = {expr:ASTExpr,spec:SheetSpecial} | string
type TryReturn = {read:number,expr:ASTExpr,spec:SheetSpecial} | {read:number} | string

export class CMDNode {

	constructor(
		public readonly cmpStr: string,
		public readonly restOptional: boolean,
		public children: CMDNode[]
	) {}

	/** i is the current index. */
	protected parseSyntax(token:TokenI,i:number): ParsedSyntax[] | CompileError {
		let l = this.tryConsume(token,i)
		if (typeof l == 'string')
			throw new Error('should not happen')
		let j = i + l.read
		// console.log(cmd,'->',`"${cmd.substr(i,l)}"`)
		let ps: ParsedSyntax
		if ('expr' in l) ps = {expr:l.expr,spec:l.spec}
		else ps = token.value.substr(i,l.read)
		if (token.value.length <= j) {
			if (
				!this.restOptional &&
				this.children.length > 0
			) return token.error('match failed (expected more)')
			return [ps]
		}
		let sub = this.findNext(token,j)
		if (Array.isArray(sub)) return errMsgsToCompileError(token,j,sub)
		let res = sub.parseSyntax(token,j)
		if (res instanceof CompileError) return res
		return [ps,...res]
	}

	/** Return child. j is next index */
	protected findNext(token:TokenI,j:number): CMDNode | string[] {
		let trys = this.children.map(c=>c.tryConsume(token,j))
		let [s,...d] = this.children.filter((_,i)=>typeof trys[i] != 'string')
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
	protected tryConsume(token:TokenI,i:number): TryReturn {
		let cmd = token.value
		if (cmd.length <= i) return `expected '${this.cmpStr}'`
		let x = cmd.slice(i).split(' ')[0]
		return this.cmpStr == x ? {read:x.length + 1} : `expected '${this.cmpStr}'`
	}

	getSubstituteType(): ValueType {
		throw new Error('non-semantical cmd-node asked for subtitute type')
	}

}

export class SemanticalCMDNode extends CMDNode {

	protected tryConsume(token:TokenI,i:number): TryReturn {
		let spec = this.cmpStr as SheetSpecial
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
			return {read:j - i + 1,expr:ast,spec}
		}
		let read = readSpecial()
		if (typeof read == 'string') return read
		return {read}
		
		function readSpecial() {
			switch (spec) {
				case 'id': return readId(token,i,true)
				case 'name': return readId(token,i,false)
				case 'text': return token.value.length - i
				case 'range': return readRange(token,i)
				case 'int': return readNumber(token,true,true,true,i)
				case 'uint': return readNumber(token,true,false,true,i)
				case 'pint': return readNumber(token,true,false,false,i)
				case 'float': return readNumber(token,false,true,true,i)
				case 'ufloat': return readNumber(token,false,false,true,i)
				case 'player': return readSelector(token,i,false,true,true)
				case 'players': return readSelector(token,i,true,true,true)
				case 'entity': return readSelector(token,i,false,false,true)
				case 'entities': return readSelector(token,i,true,false,true)
				case 'coords': return readCoords(token,i)
				case 'coords2': return read2Coords(token,i)
				case 'json': return readJSON(token,i)
				case 'nbtpath': return readNbtPath(token,i)
				case 'score': return readScore(token,i)
				case 'time': return readTime(token,i)
				case 'nbt':
				case 'block':
				case 'item':
					console.log('sheet spec not yet: '+spec)
					return token.value.length
				default:
					return exhaust(spec)
			}
		}
	}
	
	getSubstituteType(): ValueType {
		return {type:Type.VOID}
	}

}

export class RootCMDNode extends CMDNode {

	syntaxParse(token:TokenI): SemanticsInterpretor | CompileError {
		let res = this.parseSyntax(token,1)
		if (res instanceof CompileError) return res
		return new SemanticsInterpretor(res)
	}

	syntaxParseNoSlash(token:TokenI): SemanticsInterpretor | CompileError {
		let res = this.parseSyntax(token,0)
		if (res instanceof CompileError) return res
		return new SemanticsInterpretor(res)
	}
	
	protected tryConsume() {
		return {read:0}
	}

}

function errMsgsToCompileError(token:TokenI,i:number,errMsgs:string[]) {
	if (errMsgs.length == 1) return token.errorAt(i,errMsgs[0])
	let res = 'got multiple errors:'
	for (let msg of errMsgs) res += '\n - ' + msg
	return token.errorAt(i,res)
}
