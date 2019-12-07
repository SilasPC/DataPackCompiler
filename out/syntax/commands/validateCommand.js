"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Array.prototype.flatMap = function flatMap(cb) {
    return this.map(cb).reduce((acc, v) => acc.concat(v), []);
};
function buildTree(src) {
    let lines = src
        .replace(/\r/g, '')
        .split('\n')
        .flatMap((l, i) => l.trim().length ? [{ l, i }] : []);
    let tree = new Map();
    let stack = [tree];
    for (let { l: line, i } of lines) {
        let depth = 1 + (line.length - line.trimStart().length) / 2;
        if (!Number.isInteger(depth))
            throw new Error('indentation invalid ' + (i + 1));
        if (depth > stack.length) {
            if (depth > stack.length + 1)
                throw new Error('over indentation ' + (i + 1));
            stack.push(tree = new Map());
        }
        else {
            stack = stack.slice(0, depth);
            tree = stack[stack.length - 1];
        }
        let [t, ...v] = line.trimStart().split(' ');
        if (v.some(s => !s.length))
            throw new Error('double space ' + (i + 1));
        if (tree.has(t))
            throw new Error('already defined ' + (i + 1));
        let tree0 = new Map();
        tree.set(t, [v, tree0]);
        stack.push(tree0);
    }
    return stack[0];
}
function parseSheet(src) {
    let root = new RootCMDNode('', false, []);
    let def = new Map([['', [root]]]);
    root.children.push(...parseTree(buildTree(src), [def]));
    return root;
}
exports.parseSheet = parseSheet;
function parseTree(tree, defs) {
    let localDefs = new Map();
    defs = [...defs, localDefs];
    let findDef = (str) => defs.flatMap(def => def.has(str) ? [def.get(str)] : []).pop();
    let ret = [];
    for (let [key, [vals, children]] of tree) {
        if (key.startsWith(':')) {
            key = key.slice(1);
            if (findDef(key))
                throw new Error('redefining :' + key);
            if (vals.length)
                throw new Error('definition must only have children');
            let defChildren = [];
            localDefs.set(key, defChildren);
            defChildren.push(...parseTree(children, defs));
            continue;
        }
        let nextOpt = vals[0] ? vals[0].startsWith('[') : false;
        let start = key.split('|').map(k => new CMDNode(k, nextOpt, []));
        ret.push(...start);
        let last = start;
        for (let [i, val] of vals.entries()) {
            let nextOpt = vals[i] ? vals[i].startsWith('[') : false;
            if (val.startsWith('[')) {
                val = val.slice(1);
                if (val.endsWith(']'))
                    val.slice(0, -1);
            }
            if (!val.length) {
                if (vals.length - 1 > i)
                    throw new Error('children optional "[" must be last on line');
                break;
            }
            let newLast = [];
            let subs = val.split('|');
            for (let [si, sub] of subs.entries()) {
                let ps = parseSpecial(sub, children, findDef);
                if (ps.sub || ps.spec) {
                    sub = (ps.sub || ps.spec);
                    let subnode = new CMDNode(sub, nextOpt, []);
                    newLast.push(subnode);
                    for (let n of last)
                        n.children.push(subnode);
                }
                else if (ps.nodes) {
                    for (let n of last)
                        n.children.push(...ps.nodes);
                    if (subs.length - 1 > si)
                        throw new Error('invokation must be last: ' + vals.join(' '));
                    newLast = ps.nodes;
                }
                else
                    throw new Error('should not happen');
            }
            last = newLast;
        }
        let nextChildren = parseTree(children, defs);
        last.forEach(l => l.children.push(...nextChildren));
    }
    return ret;
}
function parseSpecial(sub, children, findDef) {
    if (sub.startsWith('<') && sub.endsWith('>')) {
        let spec = sub.slice(1, -1);
        if (spec.startsWith(':<')) {
            sub = '<' + spec.slice(2) + '>';
            return { sub };
        }
        else if (spec.startsWith(':')) {
            let nodes = findDef(spec.slice(1));
            if (!nodes)
                throw new Error('invokatee not defined: ' + spec);
            console.log(children);
            if (children.size)
                throw new Error('invokation cannot be followed by children: ' + sub);
            return { nodes };
        }
        else if (spec.length) {
            return { spec };
        }
    }
    return { sub };
}
class CMDNode {
    constructor(token, restOptional, children) {
        this.token = token;
        this.restOptional = restOptional;
        this.children = children;
    }
    test(cmd, i = 0) {
        if (cmd.length <= i)
            return this.restOptional;
        if (!cmd.slice(i).startsWith(this.token))
            return false;
        if (!this.children.length)
            return cmd.endsWith(this.token);
        return this.children.some(c => c.test(cmd, i + this.token.length + 1));
    }
}
class RootCMDNode extends CMDNode {
    test(cmd, i = 0) {
        return this.children.some(c => c.test(cmd, i));
    }
}
//# sourceMappingURL=validateCommand.js.map