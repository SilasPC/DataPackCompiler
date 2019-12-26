"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('source-map-support').install();
const commander_1 = require("commander");
const Datapack_1 = require("./codegen/Datapack");
const cli = new commander_1.Command();
cli
    .version('0.1')
    .name('dpc')
    .arguments('[path] [path]')
    .option('-t --target-version <version>', 'target Minecraft version')
    // .option('-E --no-emit [path]','do not emit compiled datapack')
    .option('-v --verbosity [level]', 'set verbosity level', Number, 1)
    .option('-X --no-exit', 'do not exit process')
    .parse(process.argv);
const datapack = new Datapack_1.Datapack(cli.args[0] || './', cli.args[1] || './');
datapack.compile({
    targetVersion: cli.targetVersion,
    verbosity: cli.verbosity
})
    .then(() => cli.emit && datapack.emit())
    .catch(e => {
    console.error(e);
    console.trace();
});
if (!cli.exit)
    setInterval(() => 0, 1000);
//# sourceMappingURL=cli.js.map