import {UndefinedVariablesConsumer} from '../analyze-view-scripts/undefined-variables-consumer';

export class ScriptCreateModelFromGlobalsGenerator implements UndefinedVariablesConsumer {

    private attributes = [];

    constructor(private readonly viewModelClassName: string) {
    }

    public addUndefinedVariable(variable: Array<string>): void {
        this.attributes = this.attributes.concat(variable);
    }

    public generateView(): string {
        const attrList = this.attributes.join(',');

        return `$viewModel = new ${this.viewModelClassName}();
$attributes = "${attrList}";        
foreach (explode(",", $attributes) as $attr) {
    $method = "set" . ucfirst($$attr);
    $viewModel->{$method}($$attr);
}     
`;
    }

}
