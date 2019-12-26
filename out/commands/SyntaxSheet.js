"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CMDNode_1 = require("./CMDNode");
const sheetParser_1 = require("./sheetParser");
const AST_1 = require("../syntax/AST");
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
    static getNullSheet() {
        return new SyntaxSheet(new CMDNode_1.RootCMDNode('', false, []));
    }
    readSyntax(token, ctx) {
        let nodes = this.root.parseSyntax(token, 1, ctx);
        return {
            type: AST_1.ASTNodeType.COMMAND,
            token,
            interpolations: nodes
        };
    }
}
exports.SyntaxSheet = SyntaxSheet;
//# sourceMappingURL=SyntaxSheet.js.map