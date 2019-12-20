"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const cli = new commander_1.Command();
cli
    .version('0.1')
    .name('dpc')
    .usage('compile <path>')
    .option('-t --target-version', 'target minecraft version')
    .option('')
    .command('compile <path>', 'compile file or folder')
    .parse(process.argv);
//# sourceMappingURL=cli.js.map