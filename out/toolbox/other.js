"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function exhaust(v) {
    throw new Error('Exhaustion failed');
}
exports.exhaust = exhaust;
function getObscureName(vals) {
    while (true) {
        let name = Math.random().toString(16).substr(2, 8);
        if (!vals.has(name))
            return name;
    }
}
exports.getObscureName = getObscureName;
function getQualifiedName(names, vals, maxLength) {
    let name = names.join('_');
    if (name.length > maxLength) {
        name = name.replace(/[aeyuio]/g, '');
        names = names.slice(-maxLength);
    }
    if (!vals.has(name))
        return name;
    let nr = 1;
    while (true) {
        let name2 = name + nr++;
        if (name2.length > maxLength)
            name2 = name2.slice(-maxLength);
        if (!vals.has(name2))
            return name2;
    }
}
exports.getQualifiedName = getQualifiedName;
//# sourceMappingURL=other.js.map