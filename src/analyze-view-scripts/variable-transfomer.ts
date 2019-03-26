import {Statement, Variable} from '../parser/statements';

export interface VariableTransfomer {

    transformVariable(variable: Variable): Statement;

}
