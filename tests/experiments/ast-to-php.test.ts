import {expect} from 'chai';
import {describe, it, xit, beforeEach} from 'mocha';
import * as engine from 'php-parser';
import * as unparse from 'php-unparser';
import {ViewScriptAnalyzer} from '../../src/analyze-view-scripts/view-script-analyzer';
import {VariableToAttributeTransformer} from '../../src/generate-model/variable-to-attribute-transformer';

describe('As to PHP - simple manual test case', () => {

    const options = {
        indent: true,
    };

    let parser;

    beforeEach(() => {
        parser = new engine({
            parser: {
                extractDoc: false,
                php7: true,
            },
        });
    });

    it('should make sth. different', () => {
        const source = '<h1><?="Hallo $name;"?></h1><?php $i=1; echo $i;';

        const transformer = new VariableToAttributeTransformer();

        const analyzer = new ViewScriptAnalyzer(parser, transformer);
        analyzer.analyzeScript(source);

        console.log(unparse(analyzer.getAST(), options));
    });

});
