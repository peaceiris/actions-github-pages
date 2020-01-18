import * as core from '@actions/core';
import {Inputs} from './interfaces';
import {getInputs} from './get-inputs';
import {setTokens} from './set-tokens';

export async function run(): Promise<number> {
  try {
    const inps: Inputs = getInputs();

    const remoteURL = await setTokens(inps);
    core.debug(`remoteURL: ${remoteURL}`); // TODO: remove

    return 0;
  } catch (e) {
    core.setFailed(`Action failed with error ${e}`);
    return e;
  }
}
