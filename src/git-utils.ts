import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import * as glob from '@actions/glob';
import path from 'path';
import {Inputs, CmdResult} from './interfaces';
import {getHomeDir} from './utils';

export async function createWorkDir(workDirName: string): Promise<void> {
  await io.mkdirP(workDirName);
  core.debug(`workDir was created: ${workDirName}`);
  return;
}

export async function createBranchForce(branch: string): Promise<void> {
  await exec.exec('git', ['init']);
  await exec.exec('git', ['checkout', '--orphan', `${branch}`]);
  return;
}

export async function copyAssets(
  publishDir: string,
  workDir: string
): Promise<void> {
  const copyOpts = {recursive: true, force: false};
  const globber = await glob.create(`${publishDir}/*`);
  for await (const file of globber.globGenerator()) {
    if (file.endsWith('.git') || file.endsWith('.github')) {
      continue;
    }
    await io.cp(file, `${workDir}/`, copyOpts);
    core.info(`copy ${file}`);
  }

  return;
}

export async function setRepo(inps: Inputs, remoteURL: string): Promise<void> {
  const workDir = path.join(getHomeDir(), 'actions_github_pages');
  const publishDir = path.join(
    `${process.env.GITHUB_WORKSPACE}`,
    inps.PublishDir
  );

  if (inps.ForceOrphan) {
    core.info('ForceOrphan: true');
    await createWorkDir(workDir);
    process.chdir(`${workDir}`);
    await createBranchForce(inps.PublishBranch);
    await copyAssets(publishDir, workDir);
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
      await exec.exec('git', ['rm', '-r', '--ignore-unmatch', '*']);
    }

    await copyAssets(publishDir, workDir);
    process.chdir(`${workDir}`);
    return;
  } else {
    core.info(`first deployment, create new branch ${inps.PublishBranch}`);
    await createWorkDir(workDir);
    process.chdir(`${workDir}`);
    await createBranchForce(inps.PublishBranch);
    await copyAssets(publishDir, workDir);
    return;
  }
}

export async function setConfig(inps: Inputs): Promise<void> {
  if (inps.UserName) {
    await exec.exec('git', ['config', 'user.name', `${inps.UserName}`]);
  } else {
    await exec.exec('git', [
      'config',
      'user.name',
      `${process.env.GITHUB_ACTOR}`
    ]);
  }

  if (inps.UserName) {
    await exec.exec('git', ['config', 'user.email', `${inps.UserEmail}`]);
  } else {
    await exec.exec('git', [
      'config',
      'user.email',
      `${process.env.GITHUB_ACTOR}@users.noreply.github.com`
    ]);
  }

  return;
}

export async function commit(): Promise<void> {
  // TODO: inps.ExternalRepository
  // TODO: inps.AllowEmptyCommit

  await exec.exec('git', ['commit', '-m', `deploy: ${process.env.GITHUB_SHA}`]);
}

export async function push(remoteBranch: string): Promise<void> {
  // TODO: inps.ForceOrphan

  await exec.exec('git', ['push', 'origin', `${remoteBranch}`]);
}
