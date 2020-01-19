import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
import * as io from '@actions/io';
import path from 'path';
import fs from 'fs';
import cp from 'child_process';
import {Inputs} from './interfaces';

export function setPublishRepo(insp: Inputs): string {
  if (insp.ExternalRepository) {
    return insp.ExternalRepository;
  }
  return `${github.context.repo.owner}/${github.context.repo.repo}`;
}

export async function setTokens(inps: Inputs): Promise<string> {
  const publishRepo = setPublishRepo(inps);
  let remoteURL = '';

  if (inps.DeployKey) {
    core.info('setup SSH deploy key');

    const sshDir = path.join(`${process.env.HOME}`, '.ssh');
    await io.mkdirP(sshDir);

    const knownHosts = path.join(`${sshDir}`, 'known_hosts');
    // essh-keyscan -t rsa github.com > ~/.ssh/known_hosts
    const cmdSSHkeyscanOutput = `
github.com ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEAq2A7hRGmdnm9tUDbO9IDSwBK6TbQa+PXYPCPy6rbTrTtw7PHkccKrpp0yVhp5HdEIcKr6pLlVDBfOLX9QUsyCOV0wzfjIJNlGEYsdlLJizHhbn2mUjvSAHQqZETYP81eFzLQNnPHt4EVVUh7VfDESU84KezmD5QlWpXLmvU31/yMf+Se8xhHTvKSCZIFImWwoG6mbUoWf9nzpIoaSjB+weqqUUmpaaasXVal72J+UX2B+2RPW3RcT0eOzQgqlJL3RKrTJvdsjE3JEAvGq3lGHSZXy28G3skua2SmVi/w4yCE6gbODqnTWlg7+wC604ydGXA8VJiS5ap43JXiUFFAaQ==
`;
    fs.writeFile(knownHosts, cmdSSHkeyscanOutput, err => {
      if (err) {
        throw err;
      } else {
        core.info(`wrote ${knownHosts}`);
      }
    });

    const idRSA = path.join(`${sshDir}`, 'github');
    fs.writeFile(idRSA, inps.DeployKey, err => {
      if (err) {
        throw err;
      } else {
        core.info(`wrote ${idRSA}`);
      }
    });
    await exec.exec('chmod', ['400', `${idRSA}`]);

    const sshConfigPath = path.join(`${sshDir}`, 'config');
    const sshConfigContent = `
Host github
  HostName github.com
  IdentityFile ~/.ssh/github
  User git
`;
    fs.writeFile(sshConfigPath, sshConfigContent, err => {
      if (err) {
        throw err;
      } else {
        core.info(`wrote ${sshConfigPath}`);
      }
    });
    await exec.exec('chmod', ['400', `${sshConfigPath}`]);

    // TODO: remove
    await exec.exec('ls', ['-la', `${sshDir}`]);
    await exec.exec('cat', [`${knownHosts}`]);
    await exec.exec('cat', [`${sshConfigPath}`]);

    remoteURL = `git@github.com:${publishRepo}.git`;
    return remoteURL;
  } else if (inps.GithubToken) {
    core.info('setup GITHUB_TOKEN');
    const isPrivateRepo = `${github.context.payload.event.repository.private}`;
    if (isPrivateRepo === 'false') {
      core.warning(
        'GITHUB_TOKEN does not support to trigger the GitHub Pages build event.'
      );
    }
    if (inps.ExternalRepository) {
      core.error(
        'GITHUB_TOKEN does not support to push to an external repository'
      );
    }
    remoteURL = `https://x-access-token:${inps.GithubToken}@github.com/${publishRepo}.git`;
    return remoteURL;
  } else if (inps.PersonalToken) {
    core.info('setup personal access token');
    remoteURL = `https://x-access-token:${inps.PersonalToken}@github.com/${publishRepo}.git`;
    return remoteURL;
  } else {
    throw new Error('not found deploy key or tokens');
  }
}
