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
  return `${github.context.repo}`;
}

export function setTokens(inps: Inputs): string {
  const publishRepo = setPublishRepo(inps);
  let remoteURL = '';

  if (inps.DeployKey) {
    core.debug('setup SSH deploy key');

    const sshDir = path.join(`${process.env.HOME}`, '.ssh');
    io.mkdirP(sshDir);

    const knownHosts = path.join(`${sshDir}`, 'known_hosts');
    // exec.exec('ssh-keyscan', ['-t', 'rsa', 'github.com', '>', `${knownHosts}`]);
    cp.exec(
      `ssh-keyscan -t rsa github.com > ${knownHosts}`,
      (error, stdout, stderr) => {
        if (error) {
          throw new Error(`exec error: ${error}`);
        }
        core.debug(`stdout: ${stdout}`);
        core.debug(`stderr: ${stderr}`);
      }
    );

    const idRSA = path.join(`${sshDir}`, 'id_rsa');
    fs.writeFile(idRSA, inps.DeployKey, err => {
      if (err) {
        throw err;
      } else {
        core.debug('wrote ~/.ssh/id_rsa');
      }
    });
    exec.exec('chmod', ['400', `${idRSA}`]);

    remoteURL = `git@github.com:${publishRepo}.git`;
    return remoteURL;
  } else if (inps.GithubToken) {
    core.debug('setup GITHUB_TOKEN');
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
    core.debug('setup personal access token');
    remoteURL = `https://x-access-token:${inps.PersonalToken}@github.com/${publishRepo}.git`;
    return remoteURL;
  } else {
    throw new Error('not found deploy key or tokens');
  }
}
