import {VariableTransfomer} from '../analyze-view-scripts/variable-transfomer';
import {ConstRef, PropertyLookup, Statement, Variable} from '../parser/statements';

export class VariableToAttributeTransformer implements VariableTransfomer {

    private excludes = ['_SERVER'];

    public transformVariable(variable: Variable): Statement {
        if (this.excludes.find((name) => name === variable.name)) {
            return variable;
        }

        const $this = {
            kind: 'variable',
            name: 'this',
        } as Variable;
        const attribute = {
            kind: 'constref',
            name: variable.name,
        } as ConstRef;
        return {
            kind: 'propertylookup',
            what: $this,
            offset: attribute,
        } as PropertyLookup;
    }

}
