
import { ModDeclaration, DeclarationType } from "../semantics/declarations/Declaration";
import { ProgramManager } from "./managers/ProgramManager";
import { CompileContext } from "../toolbox/CompileContext";
import { Scope, ModScope } from "./Scope";
import { parseModule } from "./parseModule";
import { InputTree } from "../input/InputTree";

export function parseInputTree(ft:InputTree,program:ProgramManager,ctx:CompileContext) {
	for (let [name,child] of ft.modules)
		recurseParse(name,program.rootModule,child,program.rootModule.scope,program,ctx)
	
	function recurseParse(name:string,parent:ModDeclaration,ft:InputTree,scope:ModScope,program:ProgramManager,ctx:CompileContext) {

		let self: ModDeclaration = parent.branchUnsafe(name,program)

		if (ft.module) {
			let res = parseModule(self,ft.module.ast,ctx,program)
			// if (!res.value) throw new Error('no soft handling now')
		}

		for (let [cname,child] of ft.modules)
			recurseParse(cname,self,child,scope.branchToMod(name,program),program,ctx)

		return self

	}

}
