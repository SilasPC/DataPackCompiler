
require('source-map-support').install()
import { Datapack } from './codegen/Datapack'	
import yargs from 'yargs'
import { WeakCompilerOptions } from './toolbox/config'

const COMPILE_GROUP = 'Compilation overrides:'

const argv = yargs

	.scriptName('dpc')
	.version('0.1')
	.epilogue('This compiler is a work in progress, expect bugs')
	.demandCommand(1)
	.alias('h','help')

	.usage('\nCompile datapacks from DataPack-Language source files')
	
	.example(
		'$0 datapack -wvv',
		'Compile source files from ./datapack into same directory with double verbosity.' +
		'Additionally, watch for source file changes, and recompile on any changes.'
	)

	.command('init [path]', 'Initialize pack.json', yargs => {
		yargs
			.positional('path', {
				description: 'Folder to intialize in',
				default: './',
				type: 'string'
			})
	}, argv => {
		initialize(argv.path as string)
	})
	.command(['compile [path]','$0'], 'Compile datapack', yargs => {
		yargs
			.positional('path', {
				description: 'Path to folder containing \'pack.json\'',
				default: './',
				type: 'string'
			})
	}, compile)

	.option('no-emit', {
		boolean: true,
		default: false,
		description: 'Compile without emitting datapack',
	})

	.option('watch', {
		alias: 'w',
		boolean: true,
		default: false,
		description: 'Watch source directory for changes',
	})

	.option('trace', {
		boolean: true,
		default: false,
		description: 'Trace errors. Mostly for debugging'
	})

	.option('verbose', {
		alias: 'v',
		description: 'Increase verbosity',
		count: true,
		group: COMPILE_GROUP
	})

	// this flag is actually hijacked by 'colors' module...
	.option('no-color', {
		description: 'Disable color logging',
		boolean: true,
		group: COMPILE_GROUP
	})

	.option('target-version', {
		alias: 't',
		type: 'string',
		description: 'Set the target Minecraft version',
		group: COMPILE_GROUP
	})

	.argv

async function compile(argv:any): Promise<void> {
	
	let datapack: Datapack | null = null
	try {
		datapack = await Datapack.load(argv.path)
	} catch (err) {
		if (err instanceof Error) {
			if (argv.trace)
				console.trace(err)
			else
				console.error(err.message)
		} else console.error(err)
	}

	if (datapack == null) return process.exit(1)

	let ret = await doCompile(datapack)
	if (!argv.watch) process.exit(ret)

	if (argv.watch) {
		datapack.watchSourceDir(async ()=>{
			await doCompile(datapack as Datapack)
		})
	}

	async function doCompile(dp:Datapack): Promise<number> {
		try {

			await dp.compile({
				targetVersion: argv.targetVersion as string|undefined,
				verbosity: argv.verbose ? argv.verbose as number : undefined,
				colorLog: argv.noColor ? false : undefined
			})
			if (!argv.noEmit) await dp.emit()
			
		} catch (err) {
			if (err instanceof Error) {
				if (argv.trace)
					console.trace(err)
				else
					console.error(err.message)
			} else console.error(err)
			return 1
		}
		return 0

	}

}

async function initialize(path:string) {
	await Datapack.initialize(path)
	process.exit(0)
}
