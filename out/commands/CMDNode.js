"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expressionSyntaxParser_1 = require("../syntax/expressionSyntaxParser");
const lexer_1 = require("../lexing/lexer");
const Token_1 = require("../lexing/Token");
class CMDNode {
    constructor(cmpStr, restOptional, children) {
        this.cmpStr = cmpStr;
        this.restOptional = restOptional;
        this.children = children;
    }
    /** i is the current index. */
    parseSyntax(token, i, ctx) {
        let l = this.tryConsume(token, i, ctx);
        let cmd = token.value;
        if (l == -1)
            token.throwDebug('consume fail');
        let j = i + l;
        if (cmd.length <= j) {
            if (!this.restOptional &&
                this.children.length > 0)
                return token.throwDebug('match failed (expected more)');
            return [];
        }
        let sub = this.findNext(token, j, ctx);
        return sub.parseSyntax(token, j, ctx);
    }
    /** Return child. j is next index */
    findNext(token, j, ctx) {
        let cmd = token.value;
        let [s, ...d] = this.children.filter(c => c.tryConsume(token, j, ctx) != -1);
        // if (d.length) [s,...d] = this.children.filter(c=>c.tryConsume(token,j+1,ctx)) // try strict equal
        if (d.length)
            return token.throwDebug('match failed (too many subs)');
        if (!s)
            return token.throwDebug('match failed (no subs)');
        return s;
    }
    /** Find consumed length. -1 is failed. Includes whitespace. */
    tryConsume(token, i, ctx) {
        let cmd = token.value;
        if (cmd.length <= i)
            return -1;
        let x = cmd.slice(i).split(' ')[0];
        return this.cmpStr == x ? x.length + 1 : -1;
    }
}
exports.CMDNode = CMDNode;
class SemanticalCMDNode extends CMDNode {
    constructor() {
        super(...arguments);
        this.lastAST = null;
    }
    parseSyntax(token, i, ctx) {
        let ret = super.parseSyntax(token, i, ctx);
        if (this.lastAST)
            ret.unshift(this.lastAST);
        return ret;
    }
    tryConsume(token, i, ctx) {
        if (token.value.startsWith('${', i)) {
            let lexer = lexer_1.inlineLiveLexer(token, i + 2);
            let { ast } = expressionSyntaxParser_1.expressionSyntaxParser(lexer, ctx);
            let j = lexer
                .next()
                .expectType(Token_1.TokenType.MARKER)
                .expectValue('}')
                .index;
            this.lastAST = ast;
            return j - token.index + 1;
        }
        switch (this.cmpStr) {
            case 'player':
            case 'players':
            case 'entity':
            case 'entities':
            case 'int':
            case 'uint':
            case 'pint':
            case 'coords':
            case 'coords2':
            case 'float':
            case 'ufloat':
            case 'text':
                return token.value.length - i;
            default:
                throw new Error('NEED EXHAUSTION CHECK: ' + this.cmpStr);
        }
    }
}
exports.SemanticalCMDNode = SemanticalCMDNode;
class RootCMDNode extends CMDNode {
    tryConsume() {
        return 0;
    }
}
exports.RootCMDNode = RootCMDNode;
//# sourceMappingURL=CMDNode.js.map