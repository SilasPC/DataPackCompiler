"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('source-map-support').install();
const Datapack_1 = require("./codegen/Datapack");
const yargs_1 = __importDefault(require("yargs"));
const COMPILE_GROUP = 'Compilation overrides:';
const argv = yargs_1.default
    .scriptName('dpc')
    .version('0.1')
    .epilogue('This compiler is a work in progress, expect bugs')
    .demandCommand(1)
    .alias('h', 'help')
    .usage('\nCompile datapacks from DataPack-Language source files')
    .example('$0 datapack -wvv', 'Compile source files from ./datapack into same directory with double verbosity.' +
    'Additionally, watch for source file changes, and recompile on any changes.')
    .command('init [path]', 'Initialize pack.json', yargs => {
    yargs
        .positional('path', {
        description: 'Folder to intialize in',
        default: './',
        type: 'string'
    });
}, argv => {
    initialize(argv.path);
})
    .command(['compile [path]', '$0'], 'Compile datapack', yargs => {
    yargs
        .positional('path', {
        description: 'Path to folder containing \'pack.json\'',
        default: './',
        type: 'string'
    });
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
    .argv;
async function compile(argv) {
    let datapack = null;
    try {
        datapack = await Datapack_1.Datapack.load(argv.path);
    }
    catch (err) {
        if (err instanceof Error) {
            if (argv.trace)
                console.trace(err);
            else
                console.error(err.message);
        }
        else
            console.error(err);
    }
    if (datapack == null)
        return process.exit(1);
    let ret = await doCompile(datapack);
    if (!argv.watch)
        process.exit(ret);
    if (argv.watch) {
        datapack.watchSourceDir(async () => {
            await doCompile(datapack);
        });
    }
    async function doCompile(dp) {
        try {
            await dp.compile({
                targetVersion: argv.targetVersion,
                verbosity: argv.verbose ? argv.verbose : undefined,
                colorLog: argv.noColor ? false : undefined
            });
            if (!argv.noEmit)
                await dp.emit();
        }
        catch (err) {
            if (err instanceof Error) {
                if (argv.trace)
                    console.trace(err);
                else
                    console.error(err.message);
            }
            else
                console.error(err);
            return 1;
        }
        return 0;
    }
}
async function initialize(path) {
    await Datapack_1.Datapack.initialize(path);
    process.exit(0);
}
//# sourceMappingURL=cli.js.map