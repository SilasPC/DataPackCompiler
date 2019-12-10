"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CMDNode_1 = require("./CMDNode");
const sheetParser_1 = require("./sheetParser");
class SyntaxSheet {
    constructor(root) {
        this.root = root;
    }
    static async load(version) {
        let root = new CMDNode_1.RootCMDNode('', false, []);
        let def = new Map([['', [root]]]);
        root.children.push(...sheetParser_1.parseTree(await sheetParser_1.buildTree('./sheets/' + version + '.txt'), [def]));
        return new SyntaxSheet(root);
    }
    verifySyntax(token) {
    }
    verifySemantics(token) {
    }
}
exports.SyntaxSheet = SyntaxSheet;
//# sourceMappingURL=SyntaxSheet.js.map