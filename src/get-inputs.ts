import * as core from '@actions/core';
import {Inputs} from './interfaces';

function showInputs(inps: Inputs): void {
  if (inps.DeployKey) {
    core.info(`DeployKey: true`);
  } else if (inps.GithubToken) {
    core.info(`GithubToken: true`);
  } else if (inps.PersonalToken) {
    core.info(`PersonalToken: true`);
  }

  core.info(`PublishBranch: ${inps.PublishBranch}`);
  core.info(`PublishDir: ${inps.PublishDir}`);
  core.info(`ExternalRepository: ${inps.ExternalRepository}`);
  core.info(`AllowEmptyCommit: ${inps.AllowEmptyCommit}`);
  core.info(`KeepFiles: ${inps.KeepFiles}`);
  core.info(`ForceOrphan: ${inps.ForceOrphan}`);
  core.info(`UserEmail: ${inps.UserEmail}`);
  core.info(`UserEmail: ${inps.UserEmail}`);
  core.info(`CommitMessage: ${inps.CommitMessage}`);
  core.info(`TagName: ${inps.TagName}`);
  core.info(`TagMessage: ${inps.TagMessage}`);
  core.info(`TagOverwrite: ${inps.TagOverwrite}`);
}

export function getInputs(): Inputs {
  const inps: Inputs = {
    DeployKey: String(core.getInput('deploy_key')),
    GithubToken: String(core.getInput('github_token')),
    PersonalToken: String(core.getInput('personal_token')),
    PublishBranch: String(core.getInput('publish_branch')),
    PublishDir: String(core.getInput('publish_dir')),
    ExternalRepository: String(core.getInput('external_repository')),
    AllowEmptyCommit: Boolean(core.getInput('allow_empty_commit')),
    KeepFiles: Boolean(core.getInput('keep_files')),
    ForceOrphan: Boolean(core.getInput('force_orphan')),
    UserName: String(core.getInput('user_name')),
    UserEmail: String(core.getInput('user_email')),
    CommitMessage: String(core.getInput('commit_message')),
    TagName: String(core.getInput('tag_name')),
    TagMessage: String(core.getInput('tag_message')),
    TagOverwrite: Boolean(core.getInput('tag_overwrite'))
  };

  showInputs(inps);

  return inps;
}
