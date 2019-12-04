
export type CompilerOptions = Required<WeakCompilerOptions>
export interface WeakCompilerOptions {
	obscureNames?: boolean
	obscureSeed?: string
	sourceMap?: boolean
	emitComments?: boolean
	optimize?: boolean
	noUnused?: boolean
	verbose?: boolean
	noInference?: boolean
	noImplicitCast?: boolean
	ignoreUnreachable?: boolean
}

export function compilerOptionDefaults(cfg?:WeakCompilerOptions): CompilerOptions {
	if (!cfg) cfg = {}
	return {
		obscureNames: def(cfg.obscureNames,true),
		obscureSeed: def(cfg.obscureSeed,''),
		noInference: def(cfg.noInference,true),
		noImplicitCast: def(cfg.noImplicitCast,true),
		ignoreUnreachable: def(cfg.ignoreUnreachable,true),
		sourceMap: def(cfg.sourceMap,false),
		emitComments: def(cfg.emitComments,false),
		optimize: def(cfg.optimize,false),
		noUnused: def(cfg.noUnused,false),
		verbose: def(cfg.verbose,false),
	}
}

function def<T>(val:T|undefined,def:T): T {return val == undefined ? def : val}
