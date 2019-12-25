"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const path_1 = require("path");
const lexer_1 = require("../lexing/lexer");
//import { generateCode } from "./generate";
const fileSyntaxParser_1 = require("../syntax/fileSyntaxParser");
const config_1 = require("../toolbox/config");
const semanticsParser_1 = require("../semantics/semanticsParser");
const CompileContext_1 = require("../toolbox/CompileContext");
const SyntaxSheet_1 = require("../commands/SyntaxSheet");
const instructionOptimizer_1 = require("../optimization/instructionOptimizer");
const moment_1 = __importDefault(require("moment"));
require("moment-duration-format");
const generate_1 = require("./generate");
class Datapack {
    constructor(srcDir, emitDir = srcDir) {
        this.srcDir = srcDir;
        this.emitDir = emitDir;
        this.packJson = null;
        this.ctx = null;
        this.fnMap = null;
        /*this.addInit(
            // `tellraw @a Loaded my first compiled datapack!`,
            //`scoreboard objectives add ${this.publicVariableScoreboard} dummy`
        )*/
    }
    // addInit(...instrs:Instruction[]) {this.init.push(...instrs)}
    async compile() {
        const files = await recursiveSearch(this.srcDir);
        const packJson = path_1.join(this.srcDir, 'pack.json');
        let cfg;
        if (!files.includes(packJson))
            cfg = this.configDefaults({});
        else
            cfg = this.configDefaults(JSON.parse((await fs_1.promises.readFile(packJson)).toString()));
        this.packJson = cfg;
        const srcFiles = files.filter(f => f.endsWith('.txt'));
        const ctx = new CompileContext_1.CompileContext(cfg.compilerOptions, await SyntaxSheet_1.SyntaxSheet.load(cfg.compilerOptions.targetVersion));
        this.ctx = ctx;
        ctx.log(1, `Begin compilation`);
        let start = moment_1.default();
        const pfiles = srcFiles
            .sort() // ensure same load order every run
            .map(srcFile => ctx.loadFile(srcFile));
        ctx.log(1, `Loaded ${srcFiles.length} file(s)`);
        pfiles.forEach(pf => lexer_1.lexer(pf, ctx));
        ctx.log(1, `Lexical analysis complete`);
        pfiles.forEach(pf => fileSyntaxParser_1.fileSyntaxParser(pf, ctx));
        ctx.log(1, `Syntax analysis complete`);
        pfiles.forEach(pf => semanticsParser_1.semanticsParser(pf, ctx));
        ctx.log(1, `Semantic analysis complete`);
        let optres = instructionOptimizer_1.optimize(this, ctx);
        ctx.log(1, `Optimization complete`);
        ctx.log(2, `Sucessful passes: ${optres.meta.passes}`);
        this.fnMap = new Map(ctx.getFnFiles()
            .map(fn => [fn.name, generate_1.generate(fn)]));
        ctx.log(1, `Generation complete`);
        ctx.log(0, `WARNING! No verifier function yet`);
        ctx.log(1, `Verification complete`);
        ctx.log(1, `Compilation complete`);
        ctx.log(2, `Elapsed time: ${moment_1.default.duration(moment_1.default().diff(start)).format()}`);
    }
    async emit() {
        if (!this.packJson || !this.fnMap || !this.ctx)
            throw new Error('Nothing to emit. Use .compile() first.');
        try {
            await fs_1.promises.access(this.emitDir, fs_1.constants.F_OK);
            let delPath = path_1.resolve(this.emitDir);
            let cmd = 'rmdir /Q /S ' + delPath;
            // await execp(cmd) // this is vulnerable to shell code injection
        }
        catch { }
        await fs_1.promises.mkdir(this.emitDir);
        await fs_1.promises.writeFile(this.emitDir + '/pack.mcmeta', JSON.stringify({
            pack: {
                description: this.packJson.description
            }
        }));
        await fs_1.promises.mkdir(this.emitDir + '/data');
        let ns = this.emitDir + '/data/tmp';
        await fs_1.promises.mkdir(ns);
        let fns = ns + '/functions';
        await fs_1.promises.mkdir(fns);
        await Promise.all([...this.fnMap.entries()].map(([fn, code]) => fs_1.promises.writeFile(fns + '/' + fn + '.mcfunction', code.join('\n'))));
        await fs_1.promises.writeFile(fns + '/tick.mcfunction', '' /*this.tickFile.join('\n')*/);
        await fs_1.promises.writeFile(fns + '/load.mcfunction', '' /*this.loadFile.join('\n')*/);
        await fs_1.promises.writeFile(fns + '/init.mcfunction', '' /*this.loadFile.join('\n')*/);
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