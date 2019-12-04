"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const path_1 = require("path");
const lexer_1 = require("../lexing/lexer");
//import { generateCode } from "./generate";
const fileSyntaxParser_1 = require("../syntax/fileSyntaxParser");
const config_1 = require("../toolbox/config");
const semanticsParser_1 = require("../semantics/semanticsParser");
class Datapack {
    constructor(name, srcDir, emitDir) {
        this.name = name;
        this.srcDir = srcDir;
        this.emitDir = emitDir;
        this.config = null;
        this.tickFile = [];
        this.loadFile = [];
        //public readonly publicVariableScoreboard = generateIdentifier()
        this.files = [];
        this.addLoadCode(`tellraw @a Loaded my first compiled datapack!`);
    }
    addLoadCode(...lines) { this.loadFile.push(...lines); }
    addTickCode(...lines) { this.tickFile.push(...lines); }
    addFnFile(f) { this.files.push(f); }
    async compile() {
        const files = await recursiveSearch(this.srcDir);
        let packJson = path_1.join(this.srcDir, 'pack.json');
        if (!files.includes(packJson))
            throw new Error('pack.json not found');
        this.setConfigDefaults(JSON.parse((await fs_1.promises.readFile(packJson)).toString()));
        let pfiles = files
            .filter(f => f.endsWith('.txt'))
            .sort()
            .map(lexer_1.lexer);
        pfiles.forEach(fileSyntaxParser_1.fileSyntaxParser);
        pfiles.forEach(semanticsParser_1.semanticsParser);
        throw new Error('no generator');
        //pfiles.forEach(pf=>generateCode(pf,this))
    }
    async emit() {
        if (this.config == null)
            throw new Error('Config not set');
        let delPath = path_1.resolve(this.emitDir);
        let cmd = 'rmdir /Q /S ' + delPath;
        await execp(cmd); // this is vulnerable to shell code injection
        await fs_1.promises.mkdir(this.emitDir);
        await fs_1.promises.writeFile(this.emitDir + '/pack.mcmeta', JSON.stringify({
            pack: {
                description: this.config.description
            }
        }));
        await fs_1.promises.mkdir(this.emitDir + '/data');
        let ns = this.emitDir + '/data/tmp';
        await fs_1.promises.mkdir(ns);
        let fns = ns + '/functions';
        await fs_1.promises.mkdir(fns);
        await Promise.all(this.files.map(f => fs_1.promises.writeFile(fns + '/' + f.name + '.mcfunction', f.getCode().join('\n'))));
        await fs_1.promises.writeFile(fns + '/tick', this.tickFile.join('\n'));
        await fs_1.promises.writeFile(fns + '/load', this.loadFile.join('\n'));
        ns = this.emitDir + '/data/minecraft';
        await fs_1.promises.mkdir(ns);
        await fs_1.promises.mkdir(ns + '/tags');
        await fs_1.promises.mkdir(ns + '/tags/functions');
        await fs_1.promises.writeFile(ns + '/tags/functions/tick.json', JSON.stringify({
            values: ['tmp/tick']
        }));
        await fs_1.promises.writeFile(ns + '/tags/functions/load.json', JSON.stringify({
            values: ['tmp/load']
        }));
    }
    setConfigDefaults(cfg) {
        this.config = {
            name: def(cfg.name, 'A compiled datapack'),
            description: def(cfg.description, 'A description'),
            compilerOptions: config_1.compilerOptionDefaults(cfg.compilerOptions),
            debugMode: def(cfg.debugMode, false)
        };
    }
}
exports.Datapack = Datapack;
function def(val, def) { return val == undefined ? def : val; }
function execp(cmd) {
    return new Promise((resolve, reject) => {
        child_process_1.exec(cmd, (err => {
            if (err)
                reject(err);
            else
                resolve();
        }));
    });
}
async function recursiveSearch(path) {
    let files = await fs_1.promises.readdir(path);
    let stats = await Promise.all(files.map(f => fs_1.promises.stat(path_1.join(path, f))));
    let dirs = stats
        .map((d, i) => [d, i])
        .filter(([s]) => s.isDirectory())
        .map(([_, i]) => files[i]);
    return files
        .filter(f => !dirs.includes(f))
        .map(f => path_1.join(path, f))
        .concat((await Promise.all(dirs.map(d => recursiveSearch(path_1.join(path, d)))))
        .reduce((a, c) => a.concat(c), [])
        .map(v => v));
}
//# sourceMappingURL=Datapack.js.map