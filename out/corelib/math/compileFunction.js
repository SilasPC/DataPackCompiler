"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Declaration_1 = require("../../semantics/Declaration");
const lexer_1 = require("../../lexing/lexer");
const fileSyntaxParser_1 = require("../../syntax/fileSyntaxParser");
const semanticsParser_1 = require("../../semantics/semanticsParser");
function compileCoreFunction(fn, fnName, ctx) {
    let pf = ctx.loadFromSource(fn);
    lexer_1.lexer(pf, ctx);
    fileSyntaxParser_1.fileSyntaxParser(pf, ctx);
    semanticsParser_1.semanticsParser(pf, ctx);
    let decl = pf.getSymbolTable().getDeclaration(fnName);
    if (!decl || decl.type != Declaration_1.DeclarationType.FUNCTION)
        throw new Error('failed to compile corelib function');
    return decl;
}
exports.compileCoreFunction = compileCoreFunction;
//# sourceMappingURL=compileFunction.js.map