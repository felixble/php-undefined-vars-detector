import {expect} from 'chai';
import {describe, xit, beforeEach} from 'mocha';
import {ModelGenerator} from '../../src/generate-model/model-generator';

describe('GenerateViewModel - simple manual test case', () => {

    xit('should print ...', () => {
        const generator = new ModelGenerator('UnusedServer', 'HiOrg\\Core\\UnusedServers\\View');
        generator.addUndefinedVariable(['ov', 'lastloginTimestamp', 'createdAtTimestamp', 'adminComment']);
        const viewModel = generator.generateView();
        console.log(viewModel);
    });

});
