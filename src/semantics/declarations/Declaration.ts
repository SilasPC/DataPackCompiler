
import { ValueType, typeSignature, Type } from "../types/Types";
import { TokenI } from "../../lexing/Token";
import { ReadOnlySymbolTable } from "./SymbolTable";
import { Struct } from "../types/Struct";
import { Program } from "../managers/ProgramManager";
import { ModScope } from "../Scope";
import { Logger } from "../../toolbox/Logger";
import { Result, ResultWrapper } from "../../toolbox/Result";

export type Declaration = VarDeclaration | FnDeclaration | ModDeclaration | RecipeDeclaration | StructDeclaration | EventDeclaration

export interface DeclarationWrapper {
	token: TokenI
	decl: Declaration
}

export enum DeclarationType {
	VARIABLE,
	FUNCTION,
	MODULE,
	RECIPE,
	STRUCT,
	EVENT
}

export interface StructDeclaration {
	namePath: ReadonlyArray<string>
	type: DeclarationType.STRUCT
	struct: Struct
}

export interface RecipeDeclaration {
	namePath: ReadonlyArray<string>
	type: DeclarationType.RECIPE
}

export class ModDeclaration {

	public static createRoot(program:Program) {
		return new ModDeclaration(null,ModScope.createRoot(program,'pack'))
	}

	public readonly type = DeclarationType.MODULE
	private readonly children = new Map<string,ModDeclaration>()

	public readonly namePath: readonly string[]
	public readonly symbols: ReadOnlySymbolTable

	private constructor (
		public readonly parent: ModDeclaration | null,
		public readonly scope: ModScope
	) {
		this.symbols = scope.symbols
		this.namePath = scope.getScopeNames()
	}

	fetchModule(accessors:TokenI[],log:Logger): Result<ModDeclaration,null> {
		const result = new ResultWrapper<ModDeclaration,null>()

		let mod: ModDeclaration = this

        for (let accessor of accessors) {
            if (accessor.value == 'super') {
                if (!mod.parent) {
                    log.addError(accessor.error('module not found'))
                    return result.none()
                }
                mod = mod.parent
                continue
            }
            let child = mod.getDirectChild(accessor.value)
            if (!child) {
                log.addError(accessor.error('module not found'))
                return result.none()
            }
            mod = child
        }
        
        return result.wrap(mod)
	}

	branchUnsafe(name:string,program:Program): ModDeclaration {
		let mod = new ModDeclaration(this,this.scope.branchToMod(name,program))
		if (this.children.has(name)) throw new Error('module already exists')
		this.children.set(name,mod)
		return mod
	}

	branch(name:TokenI,log:Logger,program:Program): Result<ModDeclaration,null> {
		const result = new ResultWrapper<ModDeclaration,null>()
		let mod = new ModDeclaration(this,this.scope.branchToMod(name.value,program))
		if (this.children.has(name.value)) {
			log.addError(name.error('module already exists'))
			return result.none()
		}
		this.children.set(name.value,mod)
		return result.wrap(mod)
	}

	getDirectChild(name:string) {return this.children.get(name)}
	hasDirectChild(name:string) {return this.children.has(name)}

}

export interface VarDeclaration {
	namePath: ReadonlyArray<string>
	type: DeclarationType.VARIABLE
	varType: ValueType
	mutable: boolean
}

export interface FnDeclaration {
	namePath: ReadonlyArray<string>
	type: DeclarationType.FUNCTION
	thisBinding: ValueType
	returns: ValueType
	parameters: {isRef:boolean,type:ValueType}[]
}

export interface EventDeclaration {
	namePath: ReadonlyArray<string>
	type: DeclarationType.EVENT
}

export function fnSignature(fn:FnDeclaration) {
	let params = fn.parameters.map(p=>(p.isRef?'ref ':'')+typeSignature(p.type))
	if (fn.thisBinding.type != Type.VOID)
		params.unshift(`this ${typeSignature(fn.thisBinding)}`)
	return `(${params.join(', ')}) -> ${typeSignature(fn.returns)}`
}
