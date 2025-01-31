
require('source-map-support').install()
import { Datapack } from './api/Datapack'	
import yargs from 'yargs'
import { compilerVersion } from './api/Compiler'
import { verify } from './commands/verifier'
import { Logger, LogOptions } from './toolbox/Logger'
import { purgeNullishKeys } from './toolbox/other'
import { SyntaxSheet } from './commands/SyntaxSheet'
import { ResultWrapper } from './toolbox/Result'

const COMPILE_GROUP = 'Compilation overrides:'

const argv = yargs

	.scriptName('dpc')
	.version(compilerVersion)
	.epilogue('This compiler is a work in progress, expect bugs')
	.demandCommand(1)
	.alias('h','help')

	.usage('\nCompile datapacks from DataPack-Language source files')
	
	.example(
		'$0 datapack -wvv',
		'Compile source files from ./datapack into same directory with double verbosity.' +
		'Additionally, watch for source file changes, and recompile on any changes.'
	)

	/*.command('import', 'Import various things from a world', yargs => {
		yargs

			.demandCommand(1)

			.command('structure [name]', 'Import structure', yargs => {
				yargs
					.positional('name', {
						string: true,
						description: 'Name including namespace'
					})
			},importStruct)

			.option('world', {
				string: true,
				description: 'Save name to import from'
			})
	})*/

	.command('verify [path]', 'Verify a datapack', yargs => {
		yargs
			.example('$0 -t 1.15.2','Verifies the datapack in the current folder for Minecraft release 1.15.2')
			.positional('path', {
				description: 'Folder containing datapack data files',
				default: './',
				type: 'string'
			})
	}, cliVerify)

	.command('init [path]', 'Initialize pack.toml', yargs => {
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
				description: 'Path to folder containing \'pack.toml\'',
				default: './',
				type: 'string'
			})
			.option('watch', {
				alias: 'w',
				boolean: true,
				default: false,
				description: 'Watch source directory for changes',
			})
			.option('no-emit', {
				boolean: true,
				default: false,
				description: 'Compile without emitting datapack',
			})
			.option('debug', {
				alias: 'd',
				description: 'Use debug build',
				boolean: true,
				group: COMPILE_GROUP
			})
			.option('no-optimize', {
				description: 'Disable optimization',
				boolean: true,
				group: COMPILE_GROUP
			})
	}, compile)

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
	
	.option('silent', {
		description: 'Run silently (no output)',
		boolean: true,
		group: COMPILE_GROUP
	})

	.option('simple-format', {
		description: 'Output simpler format',
		boolean: true,
		default: false,
		group: COMPILE_GROUP
	})

	.option('no-warn', {
		description: 'Ignore compiler warnings',
		boolean: true,
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
		if (!argv.silent) {
			if (err instanceof Error) {
				if (argv.trace)
					console.trace(err)
				else
					console.error(err.message)
			} else console.error(err)
		}
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

			await dp.compile(logOptions(argv),{})
			if (dp.canEmit() && argv.emit !== false) await dp.emit()
			
		} catch (err) {
			if (!argv.silent) {
				if (err instanceof Error) {
					if (argv.trace)
						console.error(err.stack)
					else
						console.error(err.message)
				} else console.error(err)
			}
			return 1
		}
		return 0

	}

}

async function initialize(path:string) {
	await Datapack.initialize(path)
	process.exit(0)
}

/*async function importStruct(argv:any) {
	
}*/

async function cliVerify(argv:any): Promise<void> {
	const result = new ResultWrapper()
	const log = new Logger(logOptions(argv))
	const sheet = await SyntaxSheet.load(argv['target-version'] || 'latest')
	if (result.merge(sheet)) {
		log.raiseErrors(result)
		log.log(0,'err','Failed to parse syntax sheet')
		return process.exit(1)
	}
	const res = await verify(argv.path,log,sheet.getValue())
	if (!result.mergeCheck(res)) return process.exit(0)
	log.raiseErrors(result)
	process.exit(1)
}

function logOptions(argv:any): LogOptions {
	return {
		verbosity: argv.silent ? -1 : (argv.verbose ? argv.verbose as number : 0),
		ignoreWarnings: argv.warn === false ? true : false,
		shortFormat: Boolean(argv['simple-format']),
		useColor: argv.color === false ? false : true
	}
}
