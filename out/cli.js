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
    .option('-t --target-version <version>', 'target Minecraft version', 'latest')
    .option('-e --emit [path]', 'directory to emit datapack (defaults to source folder)')
    .option('-v --verbose [level]', 'set verbosity level', Number, 1)
    .parse(process.argv);
const datapack = new Datapack_1.Datapack(cli.args[0] || './', cli.args[1] || './');
datapack.compile()
    //.then(()=>datapack.emit())
    .then(() => console.log('done!'))
    .catch(e => {
    console.error(e);
    console.trace();
});
setInterval(() => 0, 1000);
//# sourceMappingURL=cli.js.map