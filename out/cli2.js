"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('source-map-support').install();
const Datapack_1 = require("./codegen/Datapack");
const yargs_1 = __importDefault(require("yargs"));
const argv = yargs_1.default
    .version('0.1')
    .demandCommand(1)
    // .usage('Usage: $0 [path] [path]')
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
    .command(['compile [source] [dest]', '$0'], 'Compile datapack', yargs => {
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
    });
}, argv => {
    compile({
        targetVersion: argv.targetVersion,
        verbosity: argv.verbose
    }, argv.source, argv.dest)
        .catch(err => {
        if (err instanceof Error) {
            if (argv.trace)
                console.trace(err);
            else
                console.error(err.message);
        }
        else
            console.error(err);
        process.exit(1);
    });
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
    .argv;
async function compile(opts, src, dst) {
    const datapack = new Datapack_1.Datapack(src, dst);
    await datapack.compile(opts);
    // await datapack.emit()
}
async function initialize(path) {
    await Datapack_1.Datapack.initialize(path);
}
//# sourceMappingURL=cli2.js.map