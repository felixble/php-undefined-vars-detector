import {expect} from 'chai';
import {describe, it, beforeEach} from 'mocha';
import * as assert from 'assert';
import * as engine from 'php-parser';
import {ViewScriptAnalyzer} from '../../src/analyze-view-scripts/view-script-analyzer';
import {VariableToAttributeTransformer} from '../../src/generate-model/variable-to-attribute-transformer';

describe('ViewScriptAnalyzer', () => {

    let analyzer: ViewScriptAnalyzer;

    beforeEach(() => {
        const parser = new engine({
            parser: {
                extractDoc: false,
                php7: true,
            },
        });

        analyzer = new ViewScriptAnalyzer(parser, new VariableToAttributeTransformer());
    });

    it('should find a variable inside a html block', () => {
        const source = '<h1><?=$headline;?></h1>';
        analyzer.analyzeScript(source);
        const vars = analyzer.getInputVariables();

        assert.strictEqual(vars.length, 1);
        assert.strictEqual(vars[0], 'headline');
    });

    it('should skip variables which are defined within the script', () => {
        const source = '<?php\n' +
            '$localVariable = \'Amazing value\';\n' +
            '?>\n' +
            '<h1><?=$localVariable;?></h1>';


        analyzer.analyzeScript(source);
        const vars = analyzer.getInputVariables();

        assert.strictEqual(vars.length, 0);
    });

    it('should handle multiple assignments and skip all variables defined in the script', () => {
        const source = '<?php\n' +
            '$localVariable = $anotherLocalVar = \'Amazing value\';\n' +
            '?>\n' +
            '<h1><?=$localVariable;?></h1>' +
            '<h1><?=$anotherLocalVar;?></h1>';


        analyzer.analyzeScript(source);
        const vars = analyzer.getInputVariables();

        assert.strictEqual(vars.length, 0);
    });

    it('should find the access to an array index', () => {
        const source = '<h1><?=$_SERVER["SCRIPT_NAME"];?></h1>';
        analyzer.analyzeScript(source);
        const vars = analyzer.getInputVariables();

        assert.strictEqual(vars.length, 1);
        assert.strictEqual(vars[0], '_SERVER');
    });

    it('should find variables in concatenated strings, too', () => {
        const source = '<h1><?=$h1 . " " . $h2 . $newline;?></h1>';
        analyzer.analyzeScript(source);
        const vars = analyzer.getInputVariables();

        assert.strictEqual(vars.length, 3);
        expect(vars).to.include('h1');
        expect(vars).to.include('h2');
        expect(vars).to.include('newline');
    });

    it('should find undefined variables inside of an if-condition', () => {
        const source = '<?php\n' +
            'if ($condition) {\n' +
            '    echo "ja";\n' +
            '}';

        analyzer.analyzeScript(source);
        const vars = analyzer.getInputVariables();
        assert.strictEqual(vars.length, 1);
        expect(vars).to.include('condition');
    });

    it('should find undefined variables inside of an isset check', () => {
        const source = '<?php\n' +
            'if (isset($condition)) {\n' +
            '    echo "ja";\n' +
            '}';

        analyzer.analyzeScript(source);
        const vars = analyzer.getInputVariables();
        assert.strictEqual(vars.length, 1);
        expect(vars).to.include('condition');
    });

    it('should find undefined variables inside of an function call', () => {
        const source = '<?php\n' +
            'array_merge($var1, $var2)';

        analyzer.analyzeScript(source);
        const vars = analyzer.getInputVariables();
        expect(vars).to.include('var1');
        expect(vars).to.include('var2');
    });

    it('should detect a callback function which was passed as global variable', () => {
        const source = '<?php\n' +
            '$call_me("yipee")';

        analyzer.analyzeScript(source);
        const vars = analyzer.getInputVariables();
        expect(vars).to.include('call_me');
    });

    it('should detect an undefined variable inside an unary operation such as !$var', () => {
        const source = '<?php\n' +
            'if (!$var) echo "hallo";';

        analyzer.analyzeScript(source);
        const vars = analyzer.getInputVariables();
        expect(vars).to.include('var');
    });

    it('should detect an undefined variable inside an empty() call', () => {
        const source = '<?php\n' +
            'if (empty($var)) echo "hallo";';

        analyzer.analyzeScript(source);
        const vars = analyzer.getInputVariables();
        expect(vars).to.include('var');
    });

    it('should find an undefined variable inside an string', () => {
        const source = '<?php\n' +
            'echo "Hallo $var {$var2}";\n' +
            '?>';
        analyzer.analyzeScript(source);
        const vars = analyzer.getInputVariables();
        expect(vars).to.include('var');
        expect(vars).to.include('var2');
    });

    it('should find an undefined variable inside an retif-Statement () ? :', () => {
        const source = '<?=($var1) ? $var2 : $var3?>';
        analyzer.analyzeScript(source);
        const vars = analyzer.getInputVariables();
        expect(vars).to.include('var1');
        expect(vars).to.include('var2');
        expect(vars).to.include('var3');
    });

    it('should find undefined variables inside an for loop', () => {
        const source = '<?php\n' +
            'for ($i=0; $i<$max; $i++) {\n' +
            '    echo $var[$i];\n' +
            '}';
        analyzer.analyzeScript(source);
        const vars = analyzer.getInputVariables();
        expect(vars).to.include('max');
        expect(vars).to.include('var');
        expect(vars).to.not.include('i');
    });

    it('should list the name of a called function', () => {
        const source = '<?php\n' +
            'my_amazing_function("such", "params", "much", "wow")';
        analyzer.analyzeScript(source);
        const requiredFunctions = analyzer.getRequiredFunctions();
        expect(requiredFunctions).to.include('my_amazing_function');

    });

    it('shuld skip php builtin functions', () => {
        const source = '<?php\n' +
            'is_array([])';
        analyzer.analyzeScript(source);
        const requiredFunctions = analyzer.getRequiredFunctions();
        expect(requiredFunctions).to.not.include('is_array');
    });

    it('should skip called functions defined within the script', () => {
        const source = '<?php\n' +
            'function hello_to($name) {\n' +
            '    echo "Hello $name";\n' +
            '}\n' +
            '\n' +
            'hello_to("Felix");';
        analyzer.analyzeScript(source);
        const requiredFunctions = analyzer.getRequiredFunctions();
        expect(requiredFunctions).to.not.include('hello_to');
    });

});
