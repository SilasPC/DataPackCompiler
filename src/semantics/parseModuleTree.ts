
import { ModDeclaration } from "../semantics/declarations/Declaration";
import { ProgramManager } from "./managers/ProgramManager";
import { CompileContext } from "../toolbox/CompileContext";
import { Scope, ModScope } from "./Scope";
import { parseModule } from "./parseModule";
import { InputTree } from "../input/InputTree";
import { ResultWrapper, EmptyResult } from "../toolbox/Result";

export function parseInputTree(ft:InputTree,program:ProgramManager,ctx:CompileContext): EmptyResult {
	let res = recurseParse(program.rootModule,null,ft,program,ctx)
    return res

	function recurseParse(self:ModDeclaration,parent:ModDeclaration|null,ft:InputTree,program:ProgramManager,ctx:CompileContext): EmptyResult {

		const result = new ResultWrapper()

		if (ft.module)
			result.mergeCheck(parseModule(self,ft.module.ast,ctx,program))

		if (parent) self.setModuleUnsafe('super',parent)

		let modMap = new Map<string,ModDeclaration>()

		for (let [cname,child] of ft.modules) {
			let childMod = self.branchUnsafe(cname,program)
			modMap.set(cname,childMod)
			result.mergeCheck(recurseParse(childMod,self,child,program,ctx))
			self.setModuleUnsafe(cname,childMod)
			if (parent) parent.setModuleUnsafe(cname,childMod)
		}

		for (let [name,mod] of modMap) {
			for (let [sibName,sib] of modMap) {
				if (name == sibName) continue
				mod.setModuleUnsafe(sibName,sib)
			}
		}

		return result.empty()

	}

}
