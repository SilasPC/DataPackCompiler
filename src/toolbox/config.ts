
export type CompilerOptions = Required<WeakCompilerOptions>
export interface WeakCompilerOptions {
	obscureNames?: boolean
	obscureSeed?: string
	sourceMap?: boolean
	emitComments?: boolean
	optimize?: boolean
	noUnused?: boolean
	ignoreWarnings?: boolean
	verbosity?: number
	colorLog?: boolean
	noInference?: boolean
	noImplicitCast?: boolean
	ignoreUnreachable?: boolean
	targetVersion?: string
}

export function compilerOptionDefaults(cfg?:WeakCompilerOptions): CompilerOptions {
	if (!cfg) cfg = {}
	return {
		obscureNames: false,
		obscureSeed: '',
		noInference: true,
		noImplicitCast: true,
		ignoreUnreachable: true,
		sourceMap: false,
		emitComments: false,
		optimize: false,
		noUnused: false,
		ignoreWarnings: false,
		verbosity: 0,
		colorLog: true,
		targetVersion: 'latest',
		...cfg
	}
}
