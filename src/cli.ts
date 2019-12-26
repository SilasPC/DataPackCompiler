
require('source-map-support').install()
import { Datapack } from './codegen/Datapack'	
import yargs from 'yargs'
import { WeakCompilerOptions } from './toolbox/config'

const argv = yargs

	.version('0.1')

	.demandCommand(1)

	// .usage('Usage: $0 [path] [path]')
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
	.command(['compile [source] [dest]','$0'], 'Compile datapack', yargs => {
		yargs
			.positional('source', {
				description: 'Source folder / file',
				default: './',
				type: 'string'
			})
			.positional('dest', {
				description: 'Folder to emit datapack to',
				default: './',
				type: 'string'
			})
	}, argv => {
		compile({
			targetVersion: argv.targetVersion as string|undefined,
			verbosity: argv.verbose as number
		},argv.source as string,argv.dest as string)
		.catch(err => {
			if (err instanceof Error) {
				if (argv.trace)
					console.trace(err)
				else
					console.error(err.message)
			} else console.error(err)
			process.exit(1)
		})
	})

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
		group: 'Compilation:'
	})

	.option('target-version', {
		alias: 't',
		type: 'string',
		description: 'Set the target Minecraft version',
		group: 'Compilation:'
	})

	.help('h')
	.epilogue('This compiler is a work in progress. Expect bugs.')
	.argv
	
async function compile(opts:WeakCompilerOptions,src:string,dst:string) {

	const datapack = new Datapack(src,dst)

	await datapack.compile(opts)
	// await datapack.emit()
	
}

async function initialize(path:string) {
	await Datapack.initialize(path)
}
