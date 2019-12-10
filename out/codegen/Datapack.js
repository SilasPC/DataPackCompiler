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
const ParsingFile_1 = require("../lexing/ParsingFile");
const CompileContext_1 = require("../toolbox/CompileContext");
const SyntaxSheet_1 = require("../commands/SyntaxSheet");
class Datapack {
    constructor(name, srcDir, emitDir) {
        this.name = name;
        this.srcDir = srcDir;
        this.emitDir = emitDir;
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
        const packJson = path_1.join(this.srcDir, 'pack.json');
        if (!files.includes(packJson))
            throw new Error('pack.json not found');
        const cfg = this.configDefaults(JSON.parse((await fs_1.promises.readFile(packJson)).toString()));
        const ctx = new CompileContext_1.CompileContext(cfg.compilerOptions, await SyntaxSheet_1.SyntaxSheet.load(cfg.compilerOptions.targetVersion));
        const pfiles = files
            .filter(f => f.endsWith('.txt'))
            .sort()
            .map(ParsingFile_1.ParsingFile.loadFile);
        pfiles.forEach(lexer_1.lexer);
        pfiles.forEach(fileSyntaxParser_1.fileSyntaxParser);
        pfiles.forEach(semanticsParser_1.semanticsParser);
        throw new Error('no generator');
        //pfiles.forEach(pf=>generateCode(pf,this))
    }
    async emit() {
        let delPath = path_1.resolve(this.emitDir);
        let cmd = 'rmdir /Q /S ' + delPath;
        await execp(cmd); // this is vulnerable to shell code injection
        await fs_1.promises.mkdir(this.emitDir);
        await fs_1.promises.writeFile(this.emitDir + '/pack.mcmeta', JSON.stringify({
            pack: {
                description: 'hello' //this.config.description
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
    configDefaults(cfg) {
        return {
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