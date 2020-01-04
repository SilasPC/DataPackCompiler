"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chokidar_1 = require("chokidar");
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
    constructor(packDir, packJson) {
        this.packDir = packDir;
        this.packJson = packJson;
        this.ctx = null;
        this.errorIgnoreEmit = false;
        this.fnMap = null;
    }
    static async initialize(path) {
        await fs_1.promises.writeFile(path_1.join(path, 'pack.json'), JSON.stringify(Datapack.getDefaultConfig({}), null, 2));
    }
    static async load(path) {
        return new Datapack(path, await Datapack.loadPackJson(path_1.join(path, 'pack.json')));
    }
    static async loadPackJson(path) {
        let weakPack = JSON.parse((await fs_1.promises.readFile(path)).toString());
        // if (!weakPack.compilerOptions) weakPack.compilerOptions = {}
        // merge(weakPack.compilerOptions,cfgOverride)
        return Datapack.getDefaultConfig(weakPack);
    }
    static getDefaultConfig(cfg) {
        return {
            name: def(cfg.name, 'A compiled datapack'),
            description: def(cfg.description, 'A description'),
            compilerOptions: config_1.compilerOptionDefaults(cfg.compilerOptions),
            srcDir: def(cfg.srcDir, './'),
            emitDir: def(cfg.emitDir, './'),
            debugMode: def(cfg.debugMode, false)
        };
    }
    watchSourceDir(h) {
        const watcher = chokidar_1.watch(path_1.join(this.packDir, this.packJson.srcDir), {});
        watcher.once('ready', () => {
            watcher.on('all', (_e, f) => {
                if (f.endsWith('.dpl'))
                    h();
            });
        });
        return watcher;
    }
    async compile(cfgOverride = {}) {
        const files = await recursiveSearch(path_1.join(this.packDir, this.packJson.srcDir));
        const srcFiles = files.filter(f => f.endsWith('.dpl'));
        let cfg = Datapack.getDefaultConfig({
            ...this.packJson,
            compilerOptions: merge(// override compileroptions:
            cfgOverride, // override options
            this.packJson.compilerOptions // use normal if nullish on override
            )
        });
        const ctx = this.ctx = new CompileContext_1.CompileContext(cfg.compilerOptions, await SyntaxSheet_1.SyntaxSheet.load(cfg.compilerOptions.targetVersion));
        let err = new CompileErrors_1.ReturnWrapper();
        let errCount = 0;
        ctx.log2(1, 'inf', `Begin compilation`);
        let start = moment_1.default();
        const pfiles = srcFiles
            .sort() // ensure same load order every run
            .map(srcFile => ctx.loadFile(srcFile));
        ctx.log2(1, 'inf', `Loaded ${srcFiles.length} file(s)`);
        pfiles.forEach(pf => lexer_1.lexer(pf, ctx));
        ctx.log2(1, 'inf', `Lexical analysis complete`);
        pfiles.forEach(pf => fileSyntaxParser_1.fileSyntaxParser(pf, ctx));
        ctx.log2(1, 'inf', `Syntax analysis complete`);
        errCount = err.getErrorCount();
        pfiles.forEach(pf => err.merge(semanticsParser_1.semanticsParser(pf, ctx)));
        ctx.log2(1, 'inf', `Semantic analysis complete`);
        if (errCount < err.getErrorCount()) {
            ctx.log2(1, 'err', `Got ${err.getErrorCount() - errCount} error(s)`);
            errCount = err.getErrorCount();
        }
        let optres = instructionOptimizer_1.optimize(ctx);
        ctx.log2(1, 'inf', `Optimization complete`);
        ctx.log2(2, 'inf', `Successful passes: ${optres.meta.passes}`);
        this.fnMap = new Map(ctx.getFnFiles()
            .map(fn => [fn.name, generate_1.generate(fn)]));
        ctx.log2(1, 'inf', `Generation complete`);
        ctx.log2(0, 'wrn', `No verifier function yet`);
        ctx.log2(1, 'inf', `Verification complete`);
        ctx.log2(1, 'inf', `Compilation complete`);
        ctx.log2(2, 'inf', `Elapsed time: ${moment_1.default.duration(moment_1.default().diff(start)).format()}`);
        if (err.hasErrors()) {
            this.errorIgnoreEmit = true;
            ctx.log2(1, 'err', `Found a total of ${err.getErrorCount()} errors:`);
            ctx.logErrors(err);
        }
        else
            this.errorIgnoreEmit = false;
        if (err.hasWarnings()) {
            ctx.log2(1, 'wrn', `Found a total of ${err.getWarningCount()} warnings:`);
            ctx.logWarns(err);
        }
    }
    canEmit() {
        return Boolean(this.fnMap && this.ctx && !this.errorIgnoreEmit);
    }
    async emit() {
        if (!this.fnMap || !this.ctx)
            throw new Error('Nothing to emit. Use .compile() first.');
        if (this.errorIgnoreEmit)
            throw new Error('Datapack contains errors, ignoring emit.');
        let emitDir = path_1.join(this.packDir, this.packJson.emitDir);
        // I hate fs right now. Hence the caps.
        await MKDIRP(emitDir + '/data');
        await RIMRAF(emitDir + '/data/*');
        await fs_1.promises.writeFile(emitDir + '/pack.mcmeta', JSON.stringify({
            pack: {
                description: this.packJson.description
            }
        }, null, 2));
        let ns = emitDir + '/data/tmp';
        await fs_1.promises.mkdir(ns);
        let fns = ns + '/functions';
        await fs_1.promises.mkdir(fns);
        await Promise.all([...this.fnMap.entries()].map(([fn, code]) => fs_1.promises.writeFile(fns + '/' + fn + '.mcfunction', code.join('\n'))));
        await fs_1.promises.writeFile(fns + '/tick.mcfunction', '' /*this.tickFile.join('\n')*/);
        await fs_1.promises.writeFile(fns + '/load.mcfunction', '' /*this.loadFile.join('\n')*/);
        await fs_1.promises.writeFile(fns + '/init.mcfunction', '' /*this.loadFile.join('\n')*/);
        ns = emitDir + '/data/minecraft';
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
}
exports.Datapack = Datapack;
function def(val, def) { return val == undefined ? def : val; }
function merge(target, source) {
    let obj = { ...target };
    for (let key in obj)
        if ([null, undefined].includes(obj[key]))
            obj[key] = source[key];
    return obj;
}
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
const mkdirp_1 = __importDefault(require("mkdirp"));
function MKDIRP(path) {
    return new Promise(($, $r) => {
        mkdirp_1.default(path, err => {
            if (err)
                $r(err);
            else
                $();
        });
    });
}
const rimraf_1 = __importDefault(require("rimraf"));
const CompileErrors_1 = require("../toolbox/CompileErrors");
function RIMRAF(path) {
    return new Promise(($, $r) => {
        rimraf_1.default(path, {}, err => {
            if (err)
                $r(err);
            else
                $();
        });
    });
}
//# sourceMappingURL=Datapack.js.map