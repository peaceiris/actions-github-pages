import * as core from '@actions/core';
import * as exec from '@actions/exec';
import {Inputs} from './interfaces';
import {getInputs} from './get-inputs';
import {setTokens} from './set-tokens';
import * as git from './git-utils';

export async function run(): Promise<void> {
  const inps: Inputs = getInputs();

  await git.setConfig(inps);

  const remoteURL = await setTokens(inps);
  core.info(`[INFO] remoteURL: ${remoteURL}`); // TODO: remove

  await git.setRepo(inps, remoteURL);

  await exec.exec('git', ['remote', 'rm', 'origin']);
  await exec.exec('git', ['remote', 'add', 'origin', remoteURL]);
  await exec.exec('git', ['add', '--all']);

  await git.commit();
  await git.push(inps.PublishBranch);

  core.info('[INFO] successfully deployed');

  return;
}
