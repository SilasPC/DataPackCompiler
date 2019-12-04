"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function compilerOptionDefaults(cfg) {
    if (!cfg)
        cfg = {};
    return {
        obscureNames: def(cfg.obscureNames, true),
        obscureSeed: def(cfg.obscureSeed, ''),
        noInference: def(cfg.noInference, true),
        noImplicitCast: def(cfg.noImplicitCast, true),
        ignoreUnreachable: def(cfg.ignoreUnreachable, true),
        sourceMap: def(cfg.sourceMap, false),
        emitComments: def(cfg.emitComments, false),
        optimize: def(cfg.optimize, false),
        noUnused: def(cfg.noUnused, false),
        verbose: def(cfg.verbose, false),
    };
}
exports.compilerOptionDefaults = compilerOptionDefaults;
function def(val, def) { return val == undefined ? def : val; }
//# sourceMappingURL=config.js.map