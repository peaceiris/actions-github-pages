import * as core from '@actions/core';
import path from 'path';
import {Inputs} from './interfaces';
import {getInputs} from './get-inputs';
import {setTokens} from './set-tokens';
import {setGitRepo} from './git-utils';

export function getHomeDir(): string {
  let homedir = '';

  if (process.platform === 'win32') {
    homedir = process.env['USERPROFILE'] || 'C:\\';
  } else {
    homedir = `${process.env.HOME}`;
  }

  core.debug(`homeDir: ${homedir}`);

  return homedir;
}

export async function run(): Promise<number> {
  try {
    const inps: Inputs = getInputs();

    const remoteURL = await setTokens(inps);
    core.info(`remoteURL: ${remoteURL}`); // TODO: remove

    const workDir = path.join(getHomeDir(), 'actions_github_pages');
    await setGitRepo(inps, workDir, remoteURL);

    return 0;
  } catch (e) {
    core.setFailed(`Action failed with error ${e}`);
    return e;
  }
}
