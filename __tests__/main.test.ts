// import * as main from '../src/main';
import {Inputs} from '../src/interfaces';
import {getInputs} from '../src/get-inputs';

beforeEach(() => {
  jest.resetModules();
});

afterEach(() => {
  delete process.env['INPUT_DEPLOY_KEY'];
});

describe('Integration testing run()', () => {
  test('return inputs', () => {
    process.env['INPUT_DEPLOY_KEY'] = 'test_deploy_key';

    const inps: Inputs = getInputs();
    expect(inps.DeployKey).toMatch('test_deploy_key');
  });
});
