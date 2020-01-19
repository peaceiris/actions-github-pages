import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import * as glob from '@actions/glob';
import path from 'path';
import {Inputs, CmdResult} from './interfaces';
import {getHomeDir} from './utils';

export async function createWorkDir(workDirName: string): Promise<string> {
  const workDir = path.join(getHomeDir(), workDirName);
  await io.mkdirP(workDir);
  core.debug(`workDir: ${workDir}`);
  return workDir;
}

export async function createBranchForce(
  workDir: string,
  branch: string
): Promise<void> {
  await createWorkDir(workDir);
  process.chdir(`${workDir}`);
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

export async function setRepo(
  inps: Inputs,
  workDir: string,
  remoteURL: string
): Promise<void> {
  if (inps.ForceOrphan) {
    core.info('ForceOrphan: true');
    await createBranchForce(workDir, inps.PublishBranch);
    await copyAssets(inps.PublishDir, workDir);
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

    await copyAssets(inps.PublishDir, workDir);
    process.chdir(`${workDir}`);
    return;
  } else {
    core.info(`first deployment, create new branch ${inps.PublishBranch}`);
    await createBranchForce(inps.PublishDir, inps.PublishBranch);
    await copyAssets(inps.PublishDir, workDir);
    return;
  }
}

export async function setConfig(inps: Inputs): Promise<void> {
  if (inps.UserName) {
    exec.exec('git', ['config', 'user.name', `${inps.UserName}`]);
  } else {
    exec.exec('git', ['config', 'user.name', `${process.env.GITHUB_ACTOR}`]);
  }

  if (inps.UserName) {
    exec.exec('git', ['config', 'user.email', `${inps.UserEmail}`]);
  } else {
    exec.exec('git', [
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

  exec.exec('git', ['commit', '-m', `deploy: ${process.env.GITHUB_SHA}`]);
}

export async function push(remoteBranch: string): Promise<void> {
  // TODO: inps.ForceOrphan

  exec.exec('git', ['push', 'origin', `${remoteBranch}`]);
}
