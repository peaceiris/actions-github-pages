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
    core.info(`[INFO] copy ${file}`);
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
    core.info('[INFO] ForceOrphan: true');
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

  process.chdir(`${workDir}`);

  if (result.exitcode === 0) {
    if (inps.KeepFiles) {
      core.info('[INFO] Keep existing files');
    } else {
      await exec.exec('git', ['rm', '-r', '--ignore-unmatch', '*']);
    }

    await copyAssets(publishDir, workDir);
    return;
  } else {
    core.info(
      `[INFO] first deployment, create new branch ${inps.PublishBranch}`
    );
    await createWorkDir(workDir);
    await createBranchForce(inps.PublishBranch);
    await copyAssets(publishDir, workDir);
    return;
  }
}

export async function setConfig(inps: Inputs): Promise<void> {
  await exec.exec('git', ['config', '--global', 'gc.auto', '0']);

  let actor = '';
  if (inps.UserName) {
    actor = inps.UserName;
  } else {
    actor = `${process.env.GITHUB_ACTOR}`;
  }
  await exec.exec('git', ['config', '--global', 'user.name', actor]);

  let email = '';
  if (inps.UserName) {
    email = inps.UserEmail;
  } else {
    email = `${process.env.GITHUB_ACTOR}@users.noreply.github.com`;
  }
  await exec.exec('git', ['config', '--global', 'user.email', email]);

  return;
}

export async function commit(): Promise<void> {
  // TODO: inps.ExternalRepository
  // TODO: inps.AllowEmptyCommit

  try {
    await exec.exec('git', [
      'commit',
      '-m',
      `deploy: ${process.env.GITHUB_SHA}`
    ]);
  } catch (e) {
    core.info('[INFO] skip commit');
    core.debug(`[INFO] skip commit ${e}`);
  }
}

export async function push(remoteBranch: string): Promise<void> {
  // TODO: inps.ForceOrphan

  await exec.exec('git', ['push', 'origin', `${remoteBranch}`]);
}
