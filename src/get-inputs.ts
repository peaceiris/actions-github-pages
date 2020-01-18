import * as core from '@actions/core';
import {Inputs} from './interfaces';

export function getInputs(): Inputs {
  const inps: Inputs = {
    DeployKey: core.getInput('deploy_key'),
    GithubToken: core.getInput('github_token'),
    PersonalToken: core.getInput('personal_token'),
    PublishBranch: core.getInput('publish_branch'),
    PublishDir: core.getInput('publish_dir'),
    ExternalRepository: core.getInput('external_repository'),
    AllowEmptyCommit: Boolean(core.getInput('allow_empty_commit')),
    KeepFiles: Boolean(core.getInput('keep_files')),
    ForceOrphan: Boolean(core.getInput('force_orphan')),
    UserName: core.getInput('user_name'),
    UserEmail: core.getInput('user_email'),
    CommitMessage: core.getInput('commit_message'),
    TagName: core.getInput('tag_name'),
    TagMessage: core.getInput('tag_message'),
    TagOverwrite: Boolean(core.getInput('tag_overwrite'))
  };

  return inps;
}
