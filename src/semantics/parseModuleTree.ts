
import { ModDeclaration, DeclarationType } from "../semantics/declarations/Declaration";
import { FileTree } from "../toolbox/FileTree";
import { ProgramManager } from "./managers/ProgramManager";
import { CompileContext } from "../toolbox/CompileContext";
import { Scope } from "./Scope";
import { parseModule } from "./parseModule";
import { SymbolTable } from "./declarations/SymbolTable";

export function parseFileTree(ft:FileTree,program:ProgramManager,ctx:CompileContext) {
	for (let [name,child] of ft.children)
		recurseParse(name,program.rootModule,child,program.rootModule.scope,program,ctx)
	
	function recurseParse(name:string,parent:ModDeclaration,ft:FileTree,scope:Scope,program:ProgramManager,ctx:CompileContext) {

		let self: ModDeclaration = parent.branchUnsafe(name)

		if (ft.self) {
			let res = parseModule(self,ft.self.getAST(),ctx,program)
			// if (!res.value) throw new Error('no soft handling now')
		}

		for (let [cname,child] of ft.children)
			recurseParse(cname,self,child,scope.branchWithNewSymbolTable(name,program),program,ctx)

		return self

	}

}
