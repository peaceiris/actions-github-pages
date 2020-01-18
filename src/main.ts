import * as core from '@actions/core';
import {Inputs} from './interfaces';
import {getInputs} from './get-inputs';

export async function run(): Promise<number> {
  try {
    const inps: Inputs = getInputs();

    core.debug(`PublishBranch: ${inps.PublishBranch}`);

    return 0;
  } catch (e) {
    core.setFailed(`Action failed with error ${e}`);
    return e;
  }
}
