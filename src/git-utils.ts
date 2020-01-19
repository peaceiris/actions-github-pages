import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import * as glob from '@actions/glob';
import {Inputs, CmdResult} from './interfaces';

export async function createBranchForce(
  publishDir: string,
  branch: string
): Promise<void> {
  process.chdir(`${publishDir}`);
  await exec.exec('git', ['init']);
  await exec.exec('git', ['checkout', '--orphan', `${branch}`]);
  return;
}

export async function setGitRepo(
  inps: Inputs,
  workDir: string,
  remoteURL: string
): Promise<void> {
  if (inps.ForceOrphan) {
    core.info('ForceOrphan: true');
    await createBranchForce(inps.PublishDir, inps.PublishBranch);
    return;
  }

  const result: CmdResult = {
    exitcode: 0,
    output: ''
  };
  const options = {
    listeners: {
      stdout: (data: Buffer): void => {
        result.output += data.toString();
      }
    }
  };
  result.exitcode = await exec.exec(
    'git',
    [
      'clone',
      '--depth=1',
      '--single-branch',
      '--branch',
      `${inps.PublishBranch}`,
      `${remoteURL}`,
      `${workDir}`
    ],
    options
  );

  if (result.exitcode === 0) {
    if (inps.KeepFiles) {
      core.info('Keep existing files');
    } else {
      exec.exec('git', ['rm', '-r', '--ignore-unmatch', '*']);
    }

    const copyOpts = {recursive: true, force: false};
    const globber = await glob.create(`${inps.PublishDir}/*`);
    for await (const file of globber.globGenerator()) {
      if (file.endsWith('.git') || file.endsWith('.github')) {
        continue;
      }
      await io.cp(file, `${workDir}/`, copyOpts);
      core.info(`copy ${file}`);
    }
    return;
  } else {
    core.info(`first deployment, create new branch ${inps.PublishBranch}`);
    await createBranchForce(inps.PublishDir, inps.PublishBranch);
    return;
  }
}
