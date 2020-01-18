export interface Inputs {
  DeployKey: string;
  GithubToken: string;
  PersonalToken: string;
  PublishBranch: string;
  PublishDir: string;
  ExternalRepository: string;
  AllowEmptyCommit: boolean;
  KeepFiles: boolean;
  ForceOrphan: boolean;
  UserName: string;
  UserEmail: string;
  CommitMessage: string;
  TagName: string;
  TagMessage: string;
  TagOverwrite: boolean;
}
