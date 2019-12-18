"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sheetParser_1 = require("./sheetParser");
class SyntaxSheet {
    constructor(root) {
        this.root = root;
    }
    static fromString(string) {
        return new SyntaxSheet(sheetParser_1.fromString(string));
    }
    static async load(version) {
        return new SyntaxSheet(await sheetParser_1.fromSheet(version));
    }
    verifySyntax(token) {
        if (typeof token == 'string')
            return this.root.test(token.slice(1));
        return this.root.test(token.value.slice(1));
    }
    verifySemantics(token) {
    }
}
exports.SyntaxSheet = SyntaxSheet;
//# sourceMappingURL=SyntaxSheet.js.map