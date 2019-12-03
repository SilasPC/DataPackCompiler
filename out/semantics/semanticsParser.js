"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AST_1 = require("../syntax/AST");
const ESR_1 = require("./ESR");
const Types_1 = require("./Types");
const Declaration_1 = require("./Declaration");
const Lineals_1 = require("./Lineals");
function parse(pfile) {
    if (pfile.status == 'parsed')
        return;
    if (pfile.status == 'parsing')
        throw new Error('circular parsing');
    pfile.status = 'parsing';
    let symbols = pfile.getSymbolTable();
    let ast = pfile.getAST();
    let load = [];
    for (let node of ast) {
        let shouldExport = false;
        if (node.type == AST_1.ASTNodeType.EXPORT)
            node = node.node;
        switch (node.type) {
            case AST_1.ASTNodeType.DEFINE:
                {
                    let type = Types_1.tokenToType(node.varType, symbols);
                    if (Types_1.ValueTypes.is.ELEMENTARY(type) && type.type == Types_1.ElementaryValueType.VOID)
                        node.varType.throwDebug(`Cannot declare a variable of type 'void'`);
                    let esr = exprParser(node.initial, symbols, load);
                }
                break;
            case AST_1.ASTNodeType.FUNCTION:
                {
                }
                break;
            case AST_1.ASTNodeType.IDENTIFIER:
            case AST_1.ASTNodeType.INVOKATION:
            case AST_1.ASTNodeType.OPERATION:
            case AST_1.ASTNodeType.PRIMITIVE:
                {
                    // expr parse
                }
                break;
            case AST_1.ASTNodeType.EXPORT:
            case AST_1.ASTNodeType.COMMAND:
            case AST_1.ASTNodeType.CONDITIONAL:
            case AST_1.ASTNodeType.LIST:
                throw new Error('wth man');
            default:
                const exhaust = node;
        }
    }
    pfile.status = 'parsed';
}
exports.parse = parse;
function parseBody(nodes, symbols, body) {
    for (let node of nodes) {
        switch (node.type) {
            case AST_1.ASTNodeType.COMMAND:
                // here we should probably parse the command
                body.push(Lineals_1.Lineals.CMD({}));
                break;
            case AST_1.ASTNodeType.INVOKATION:
            case AST_1.ASTNodeType.OPERATION:
                exprParser(node, symbols, body);
                break;
            case AST_1.ASTNodeType.PRIMITIVE:
            case AST_1.ASTNodeType.IDENTIFIER:
                throw new Error('valid, but pointless');
            case AST_1.ASTNodeType.CONDITIONAL:
            case AST_1.ASTNodeType.DEFINE:
                throw new Error('not implemented');
            case AST_1.ASTNodeType.LIST:
            case AST_1.ASTNodeType.FUNCTION:
            case AST_1.ASTNodeType.EXPORT:
                throw new Error('invalid ast structure');
            default:
                const exhaust = node;
        }
    }
}
function exprParser(node, symbols, body) {
    switch (node.type) {
        case AST_1.ASTNodeType.IDENTIFIER:
            let idnode = node;
            let iddecl = symbols.getDeclaration(idnode.identifier.value);
            if (!iddecl)
                return idnode.identifier.throwDebug('Identifier undefined');
            Declaration_1.Declarations.match(iddecl, {
                VARIABLE: ({ type }) => {
                    Types_1.ValueTypes.match(type, {
                        ELEMENTARY: type => {
                            switch (type) {
                                case Types_1.ElementaryValueType.INT:
                                    return ESR_1.ESRs.SCORE({ mutable: true, const: false, scoreboard: 'test', selector: 'test' });
                                case Types_1.ElementaryValueType.VOID:
                                    throw new Error('void var?');
                                default:
                                    const exhuast = type;
                            }
                        },
                        NON_ELEMENTARY: () => { throw new Error('not implemented'); }
                    });
                },
                FUNCTION: () => {
                    throw new Error('non-invocation fn ref not implemented');
                }
            });
            throw new Error('??');
        case AST_1.ASTNodeType.PRIMITIVE:
            let val = node.value.value;
            if (val == 'true')
                return ESR_1.ESRs.SCORE({ mutable: false, const: true, scoreboard: 'const', selector: '1' });
            if (val == 'false')
                return ESR_1.ESRs.SCORE({ mutable: false, const: true, scoreboard: 'const', selector: '0' });
            let n = Number(val);
            if (Number.isNaN(n) || !Number.isInteger(n))
                node.value.throwDebug('kkk only int primitives');
            return ESR_1.ESRs.SCORE({ mutable: false, const: true, scoreboard: 'const', selector: val });
        case AST_1.ASTNodeType.OPERATION:
            let operands = node.operands.map(o => exprParser(o, symbols, body));
            switch (node.operator.value) {
                case '+':
                case '-':
                case '*':
                case '/':
                case '%':
                    if (operands.length != 2)
                        throw new Error('hmm');
                    let [o0_1, o1_1] = operands.map(ESR_1.ESRs.as.SCORE);
                    switch (node.operator.value) {
                        case '+':
                            body.push(Lineals_1.Lineals.ADD_SCORE());
                            break;
                        case '-':
                            body.push(Lineals_1.Lineals.SUB_SCORE());
                            break;
                        case '*':
                            body.push(Lineals_1.Lineals.MULT_SCORE());
                            break;
                        case '/':
                            body.push(Lineals_1.Lineals.DIV_SCORE());
                            break;
                        case '%':
                            body.push(Lineals_1.Lineals.MOD_SCORE());
                            break;
                    }
                    return ESR_1.ESRs.SCORE({ mutable: false, const: false, scoreboard: 'tmp', selector: 'kkk' });
                case '+=':
                case '-=':
                case '*=':
                case '/=':
                case '%=':
                    if (operands.length != 2)
                        throw new Error('hmm');
                    let [o0_2, o1_2] = operands.map(ESR_1.ESRs.as.SCORE);
                    if (!o0_2.mutable)
                        throw new Error('cannot mutate');
                    switch (node.operator.value) {
                        case '+=':
                            body.push(Lineals_1.Lineals.ADD_SCORE());
                            break;
                        case '-=':
                            body.push(Lineals_1.Lineals.SUB_SCORE());
                            break;
                        case '*=':
                            body.push(Lineals_1.Lineals.MULT_SCORE());
                            break;
                        case '/=':
                            body.push(Lineals_1.Lineals.DIV_SCORE());
                            break;
                        case '%=':
                            body.push(Lineals_1.Lineals.MOD_SCORE());
                            break;
                    }
                    return ESR_1.ESRs.SCORE({ mutable: false, const: false, scoreboard: 'tmp', selector: 'kkk' });
                case '&&':
                case '||':
                case '!':
                case '++':
                case '--':
                case '>':
                case '<':
                case '>=':
                case '<=':
                case '==':
                case '!=':
                default:
                    throw new Error('i rly h8 boilerplate');
            }
        case AST_1.ASTNodeType.INVOKATION:
            if (node.function.type != AST_1.ASTNodeType.IDENTIFIER)
                throw new Error('only direct calls for now');
            let params = node.parameters.list.map(p => exprParser(p, symbols, body));
            let fndecl = symbols.getDeclaration(node.function.identifier.value);
            if (!fndecl)
                return node.function.identifier.throwDebug('fn not declared');
            if (!Declaration_1.Declarations.is.FUNCTION(fndecl))
                return node.function.identifier.throwDebug('not a fn');
            // compare fndecl.node.parameters and params,
            // and add lineals to copy into params
            Types_1.ValueTypes.match(fndecl.type, {
                ELEMENTARY: type => {
                    switch (type) {
                        case Types_1.ElementaryValueType.INT:
                            return ESR_1.ESRs.SCORE({ mutable: false, const: false, scoreboard: 'static', selector: 'fnret' });
                        case Types_1.ElementaryValueType.VOID:
                            return ESR_1.ESRs.VOID();
                        default:
                            const exhuast = type;
                    }
                },
                NON_ELEMENTARY: () => { throw new Error('nop'); }
            });
        // Invalid cases. These should never occur
        case AST_1.ASTNodeType.CONDITIONAL:
        case AST_1.ASTNodeType.DEFINE:
        case AST_1.ASTNodeType.EXPORT:
        case AST_1.ASTNodeType.FUNCTION:
        case AST_1.ASTNodeType.COMMAND:
        case AST_1.ASTNodeType.LIST:
            throw new Error('ohkayy');
    }
    const exhuast = node;
}
//# sourceMappingURL=semanticsParser.js.map