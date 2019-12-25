"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
/** Removes local variables that act as aliases */
function antialias(fn) {
    let aliases = helpers_1.findLocalIntLifeSpans(fn.get());
    // console.log('antialias',...aliases.map(x=>[x[0].scoreboard.selector,x[1],x[2]]))
    for (let [into, from, i, j] of aliases) {
        // replace all uses
        helpers_1.replaceInt(into, from, fn.get().slice(i, j));
        // remove assignation
        fn.get().splice(i, 1);
    }
    return aliases.length > 0;
}
exports.antialias = antialias;
//# sourceMappingURL=antiAlias.js.map