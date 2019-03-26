import {OutputFactory} from './output/output-factory';
import {OutputEmitter} from './output/output-emitter';
import * as cli from 'commander';
import {ViewScriptAnalyzer} from './analyze-view-scripts/view-script-analyzer';
import {VariableToAttributeTransformer} from './generate-model/variable-to-attribute-transformer';
import {readFile} from './lib/read-file';
import * as engine from 'php-parser';
import {ModelGenerator} from './generate-model/model-generator';
import {writeFile} from './lib/write-file';


cli
    .arguments('<file> Path to the file which should be analyzed')
    .option('-g, --generate', 'Generate a view model')
    .option('-n, --classname [name]', 'Name of the class to generate')
    .option('-ns, --namespace [namespace]', 'Namespace of the class to generate')
    .option('-s, --save [file]', 'Save the generated view model as file')
    .parse(process.argv);

export async function main(emitter: OutputEmitter) {
    if (!process.argv.slice(2).length) {
        cli.outputHelp();
        return;
    }
    const filePath = cli.args[0];

    const parser = new engine({
        parser: {
            extractDoc: false,
            php7: true,
        },
    });
    const analyzer = new ViewScriptAnalyzer(parser, new VariableToAttributeTransformer());
    let script = await readFile(filePath);
    analyzer.analyzeScript(script);
    const vars = analyzer.getInputVariables();

    if (!vars.length) {
        emitter.stream.writeLine('No undefined variables detected');
        return;
    }

    if (cli.generate) {
        let name = cli['classname'] || 'MyClass';
        let namespace = cli.namespace || 'MyNamespace';

        const generator = new ModelGenerator(name, namespace);
        generator.addUndefinedVariable(vars);
        const viewModel = generator.generateView();

        if (cli.save) {
            const file = cli.save;
            await writeFile(file, viewModel);
            emitter.stream.writeLine(`Generated file ${file}`);
        } else {
            emitter.stream.write(viewModel);
        }

    } else {
        emitter.stream.writeLine('Detected undefined variables:');
        vars.map(variable => `- ${variable}`).forEach((v) => emitter.stream.writeLine(v));
    }


}

OutputFactory.createEmitter()
    .then((emitter: OutputEmitter) => {
        main(emitter).catch(console.error);
    });
