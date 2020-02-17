import { compilerVersion } from "../api/Compiler"

export type CompilerOptions = Required<WeakCompilerOptions>
export interface WeakCompilerOptions {
	sourceDir?: string
	emitDir?: string
	minimumVersion?: string
	obscureNames?: boolean
	sourceMap?: boolean
	optimize?: boolean
	noUnused?: boolean
	noInference?: boolean
	noImplicitCast?: boolean // unused
	ignoreUnreachable?: boolean // unused
	targetVersion?: string
	debugBuild?: boolean // unused
}

export function compilerOptionDefaults(cfg?:WeakCompilerOptions): CompilerOptions {
	if (!cfg) cfg = {}
	return {
		sourceDir: './src',
		emitDir: './',
		minimumVersion: compilerVersion,
		obscureNames: false,
		noInference: true,
		noImplicitCast: true,
		ignoreUnreachable: true,
		sourceMap: false,
		optimize: false,
		noUnused: false,
		targetVersion: 'latest',
		debugBuild: false,
		...cfg
	}
}
