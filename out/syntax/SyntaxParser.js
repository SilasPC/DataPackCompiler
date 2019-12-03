"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Token_1 = require("../lexing/Token");
class SyntaxParser {
    constructor(name) {
        this.name = name;
        this.handles = new Map();
        this.fallbacks = new Map();
        this.finalFallback = null;
    }
    usingType(type) {
        let handles = this.handles.get(type) || this.handles.set(type, new Map()).get(type);
        let self = this;
        return {
            case(val, handle) {
                if (handles.has(val))
                    throw new Error(`Cannot assign multiple handles for ${Token_1.TokenType[type]} -> '${val}'`);
                handles.set(val, handle);
                return this;
            },
            fallback(handle) {
                if (self.fallbacks.has(type))
                    throw new Error('Cannot assign multiple fallbacks to same tokentype (' + Token_1.TokenType[type] + ')');
                self.fallbacks.set(type, handle);
                return this;
            }
        };
    }
    fallback(handle) {
        if (this.finalFallback)
            throw new Error('cannot redeclare a final fallback');
        this.finalFallback = handle;
        return this;
    }
    consume(iter, context) {
        for (let token of iter) {
            if (!this.handles.has(token.type)) {
                token.throwDebug(`SyntaxParse unassigned type (parser:${this.name})`);
            }
            else {
                let map = this.handles.get(token.type);
                if (!map.has(token.value)) {
                    if (!this.fallbacks.has(token.type)) {
                        if (this.finalFallback)
                            this.finalFallback(iter, context);
                        else
                            token.throwDebug(`SyntaxParse unassigned fallback (parser:${this.name})`);
                    }
                    else if (this.fallbacks.get(token.type)(iter, context))
                        break;
                }
                else {
                    let handle = map.get(token.value);
                    if (handle(iter, context))
                        break;
                }
            }
            if (iter.isDone())
                break;
        }
    }
}
exports.SyntaxParser = SyntaxParser;
//# sourceMappingURL=SyntaxParser.js.map