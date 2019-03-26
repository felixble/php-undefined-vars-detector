import {
    Assign,
    Bin, Block,
    Call,
    Echo,
    Empty, Encapsed, For, Identifier,
    If,
    Isset,
    OffsetLookup, RetIf,
    Statement,
    Unary,
    Variable,
    Function
} from '../parser/statements';
import * as data from '../../res/php-builtin-functions.json';
import {UndefinedVariablesConsumer} from './undefined-variables-consumer';
import {VariableTransfomer} from './variable-transfomer';

const phpBuiltinFunctions: Array<string> = data['internal'];

class DetectedVariable {

    constructor(public name: string, public isDeclared: boolean) {
    }
}

class DetectedFunction {

    constructor(public name: string, public isDeclared: boolean) {
    }
}

export class ViewScriptAnalyzer {

    private inputVarsMap: {[name: string]: DetectedVariable} = {};

    private requiredFunctions: {[name: string]: DetectedFunction} = {};

    private isCall = false;
    private program: any;

    constructor(private readonly parser, private readonly variableTransformer: VariableTransfomer = null) {}

    public analyzeScript(source: string) {
        this.program = this.parser.parseCode(source);
        this.traverseStatements(this.program.children);
    }

    public getInputVariables(): Array<string> {
        return Object.keys(this.inputVarsMap).filter(key => !this.inputVarsMap[key].isDeclared);
    }

    public getRequiredFunctions(): Array<string> {
        return Object.keys(this.requiredFunctions).filter(key => !this.requiredFunctions[key].isDeclared);
    }

    public writeUndefindeVariablesTo(consumer: UndefinedVariablesConsumer): void {
        consumer.addUndefinedVariable(this.getInputVariables());
    }

    public getAST() {
        return this.program;
    }

    private traverseStatements(stmts: Array<Statement|null>): Array<Statement> {
        if (!stmts) {
            return;
        }
        return stmts.map((stmt: Statement|null) => {
            if (stmt === null) {
                return;
            }

            if (stmt.kind === 'identifier' && this.isCall) {
                const idStmt = stmt as Identifier;
                this.foundFunctionCall(idStmt.name);
            }

            if (stmt.kind === 'function') {
                const funStmt = stmt as Function;
                this.foundFunctionDeclaration(funStmt.name);
            }

            if (stmt.kind === 'echo') {
                const echoStmt = stmt as Echo;
                echoStmt.arguments = this.traverseStatements(echoStmt.arguments);
            }

            if (stmt.kind === 'encapsed') {
                const encapsedStmt = stmt as Encapsed;
                encapsedStmt.value = this.traverseStatements(encapsedStmt.value);
            }

            if (stmt.kind === 'bin') {
                const binStmt = stmt as Bin;
                // TODO: check execution order of binary statments
                binStmt.right = this.traverseStatements([binStmt.right])[0];
                binStmt.left = this.traverseStatements([binStmt.left])[0];
            }

            if (stmt.kind === 'if') {
                const ifStmt = stmt as If;
                ifStmt.test = this.traverseStatements([ifStmt.test])[0];
                ifStmt.body = this.traverseStatements([ifStmt.body])[0];
                ifStmt.alternate = this.traverseStatements([ifStmt.alternate])[0];
            }

            if (stmt.kind === 'retif') {
                const refifStmt = stmt as RetIf;
                refifStmt.test = this.traverseStatements([refifStmt.test])[0];
                refifStmt.trueExpr = this.traverseStatements([refifStmt.trueExpr])[0];
                refifStmt.falseExpr = this.traverseStatements([refifStmt.falseExpr])[0];
            }

            if (stmt.kind === 'for') {
                const forStmt = stmt as For;
                // TODO: check execution order of for statments

                forStmt.init = this.traverseStatements(forStmt.init);
                forStmt.test = this.traverseStatements(forStmt.test);
                forStmt.increment = this.traverseStatements(forStmt.increment);
                forStmt.body = this.traverseStatements([forStmt.body])[0];
            }

            if (stmt.kind === 'block') {
                const blockStmt = stmt as Block;
                blockStmt.children = this.traverseStatements(blockStmt.children);
            }

            if (stmt.kind === 'isset') {
                const issetStmt = stmt as Isset;
                issetStmt.arguments = this.traverseStatements(issetStmt.arguments);
            }

            if (stmt.kind === 'empty') {
                const emptyStmt = stmt as Empty;
                emptyStmt.arguments = this.traverseStatements(emptyStmt.arguments);
            }

            if (stmt.kind === 'unary') {
                const unaryStmt = stmt as Unary;
                unaryStmt.what = this.traverseStatements([unaryStmt.what])[0];
            }

            if (stmt.kind === 'call') {
                const callStmt = stmt as Call;
                callStmt.arguments = this.traverseStatements(callStmt.arguments);
                this.isCall = true;
                callStmt.what = this.traverseStatements([callStmt.what])[0];
                this.isCall = false;
            }

            if (stmt.kind === 'variable') {
                stmt = this.foundVariableAccess(stmt as Variable);
            }

            if (stmt.kind === 'assign') {
                const assignStmt = stmt as Assign;
                assignStmt.right = this.traverseStatements([assignStmt.right])[0];
                if (assignStmt.left.kind === 'variable') {
                    stmt = this.foundVariableAssignment(assignStmt.left as Variable);
                }
            }

            if (stmt.kind === 'offsetlookup') {
                const offsetLookupStmt = stmt as OffsetLookup;
                offsetLookupStmt.what = this.traverseStatements([offsetLookupStmt.what])[0];
            }

            return stmt;
        });
    }

    private foundVariableAccess(variable: Variable): Statement {
        this.inputVarsMap[variable.name] = this.inputVarsMap[variable.name] || new DetectedVariable(variable.name, false);

        if (this.variableTransformer && !this.inputVarsMap[variable.name].isDeclared) {
            return this.variableTransformer.transformVariable(variable);
        }
        return variable;
    }

    private foundVariableAssignment(variable: Variable): Statement {
        this.inputVarsMap[variable.name] = this.inputVarsMap[variable.name] || new DetectedVariable(variable.name, true);

        if (this.variableTransformer && !this.inputVarsMap[variable.name].isDeclared) {
            return this.variableTransformer.transformVariable(variable);
        }
        return variable;
    }

    private foundFunctionDeclaration(name: string): void {
        this.requiredFunctions[name] = this.requiredFunctions[name] || new DetectedFunction(name, true);
    }

    private foundFunctionCall(name: string): void {
        if (!phpBuiltinFunctions.find((x) => x === name)) {
            this.requiredFunctions[name] = this.requiredFunctions[name] || new DetectedFunction(name, false);
        }
    }
}
