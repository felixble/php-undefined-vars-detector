import {UndefinedVariablesConsumer} from '../analyze-view-scripts/undefined-variables-consumer';

export class ModelGenerator implements UndefinedVariablesConsumer {

    private attributes = [];

    constructor(private readonly name: string, private readonly namespace: string) {
    }

    public addUndefinedVariable(variable: Array<string>): void {
        this.attributes = this.attributes.concat(variable);
    }

    private static generateGetterSetterFor(name: string) {
        const nameWithCapitalLetter = name.charAt(0).toUpperCase() + name.slice(1);
        return `public function get${nameWithCapitalLetter}() {
        return $this->${name};        
    }

    public function set${nameWithCapitalLetter}($${name}) {
        $this->${name} = $${name};        
    }`;
    }

    public generateView(): string {
        const generatedAttributes = this.attributes
            .map((attr) => `private $${attr};`)
            .join('\n\t');

        const generateGettersSetters = this.attributes
            .map(ModelGenerator.generateGetterSetterFor)
            .join('\n\n\t');

        return `<?php
        
namespace ${this.namespace};

class ${this.name} {

    ${generatedAttributes}

    ${generateGettersSetters}

}

`;
    }

}
