
import { SymbolTable } from "./SymbolTable";
import { Instruction, INT_OP, InstrType } from "../codegen/Instructions";
import { Scoreboard, ESR, ESRType } from "./ESR";
import { CompileContext } from "../toolbox/CompileContext";
import { InstrWrapper } from "../codegen/InstrWrapper";

export type ScopeType = 'FN' | 'NONE'

export class Scope {

	private instrBuffer: InstrWrapper
	private readonly stack: InstrWrapper[]

	public static createRoot(symbols:SymbolTable,name:string,ctx:CompileContext) {
		return new Scope(
			null,
			symbols,
			name,
			ctx,
			ctx.scoreboards.getStatic([name,'break']),
			null,
			'NONE'
		)
	}

	private constructor(
		private readonly parent: Scope|null,
		public readonly symbols: SymbolTable,
		private readonly name: string,
		private ctx: CompileContext,
		private readonly breakerVar: Scoreboard,
		private returnVar: ESR | null,
		public readonly type: ScopeType
	) {
		this.stack = [this.instrBuffer = new InstrWrapper()]
	}

	/**
	 * This will give the instructions needed to break
	 * all scopes down to and including the scope specified.
	 * 
	 * This also creates new flowbuffers for the scopes in question,
	 * so further code in the scopes wont run after triggering these instructions
	 * 
	 * EDIT: No longer returns instructions, just adds them and breaks
	 * 
	 */
	breakScopes(scope:Scope) {
		this.push(...this.breakScopesRec(scope))
		this.newFlowBuffer()
	}
	private breakScopesRec(scope:Scope): Instruction[] {
		// maybe this should change
		let instr: INT_OP = {
			type: InstrType.INT_OP,
			into: {type:ESRType.INT,const:false,tmp:false,mutable:false,scoreboard:this.breakerVar},
			from: {type:ESRType.INT,const:false,tmp:false,mutable:false,scoreboard:this.ctx.scoreboards.getConstant(1)},
			op: '='
		}
		if (scope == this) return [instr]
		if (!this.parent) throw new Error('attempting to break beyond root scope')
		return [...this.parent.breakScopesRec(scope),instr]
	}

	getSuperByType(type:ScopeType): Scope|null {
		if (this.type == type) return this
		if (!this.parent) return null
		return this.parent.getSuperByType(type)
	}

	getReturnVar() {
		return this.returnVar
	}

	setReturnVar(esr:ESR) {
		if (this.returnVar) throw new Error('cannot overwrite scope return var')
		this.returnVar = esr
	}

	private newFlowBuffer() {
		// we don't new a new instr buffer if the last one hasn't been used
		if (this.instrBuffer.getLength())
			this.stack.push(this.instrBuffer = new InstrWrapper())
	}

	public mergeBuffers(): InstrWrapper {
		// temporary merge function
		// we need to do some flow processing here
		// there is for now no 'if' check
		let fns = Array(this.stack.length-1)
			.fill(0)
			.map(()=>this.ctx.createFnFile([...this.getScopeNames(),'controlflow']))
		fns.forEach((fn,i)=>{
			fn.insertEnd(this.stack[i+1])
			if (fns[i+1]) fn.add({
					type: InstrType.LOCAL_INVOKE,
					fn: fns[i+1]
				})
		})
		let ret = this.stack[0].clone()
		if (fns.length) ret.add({
			type: InstrType.LOCAL_INVOKE,
			fn: fns[0]
		})
		return ret
	}

	public push(...instrs:Instruction[]) {
		this.instrBuffer.add(...instrs)
	}

	public addComments(...cmts:string[]) {
		this.instrBuffer.addComments(...cmts)
	}

	public branch(newName:string,type:ScopeType,returnVar:ESR|null) {
		return new Scope(
			this,
			this.symbols.branch(),
			newName,
			this.ctx,
			this.ctx.scoreboards.getStatic([...this.getScopeNames(),newName,'break']),
			returnVar,
			type
		)
	}

	public getScopeNames(): string[] {
		let names = [this.name]
		if (this.parent) names = this.parent.getScopeNames().concat(names)
		return names
	}

}
