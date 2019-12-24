"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CMDNode {
    constructor(token, restOptional, children) {
        this.token = token;
        this.restOptional = restOptional;
        this.children = children;
    }
    test(cmd, i = 0) {
        let j = cmd.indexOf(' ', i);
        if (j == -1)
            j = cmd.length;
        if (!this.token.startsWith(cmd.slice(i, j)))
            return false;
        if (cmd.length == j)
            return this.restOptional || this.children.length == 0;
        let [s, ...d] = this.children.filter(c => c.testShallow(cmd, j + 1));
        if (d.length)
            [s, ...d] = this.children.filter(c => c.testShallow(cmd, j + 1, true)); // try strict equal
        if (d.length)
            return false; // cannot have more than one match
        if (!s)
            return false;
        return s.test(cmd, j + 1);
    }
    testShallow(cmd, i = 0, se = false) {
        if (cmd.length <= i)
            return this.restOptional;
        let x = cmd.slice(i).split(' ')[0];
        return se ? this.token.startsWith(x) : this.token == x;
    }
}
exports.CMDNode = CMDNode;
class RootCMDNode extends CMDNode {
    test(cmd, i = 0) {
        let [s, ...d] = this.children.filter(c => c.testShallow(cmd, i));
        if (d.length)
            return false; // cannot have more than one match
        if (!s)
            return false;
        return s.test(cmd, i);
    }
    testShallow() {
        return true;
    }
}
exports.RootCMDNode = RootCMDNode;
//# sourceMappingURL=CMDNode.js.map