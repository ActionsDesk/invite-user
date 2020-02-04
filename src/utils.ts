import * as core from '@actions/core';
import {GitHub} from '@actions/github';
import {Config, Issue, UserRole, ActionInputs, IssueFeedbackInputs} from './interfaces';
import * as Octokit from '@octokit/rest';
import {WebhookPayload} from '@actions/github/lib/interfaces';

export function getClient(): GitHub {
  if (process.env.ADMIN_TOKEN) {
    return new GitHub(process.env.ADMIN_TOKEN);
  } else {
    throw new Error('ADMIN_TOKEN not found.');
  }
}

export function validEmail(email: string, emailRegex: string): boolean {
  return new RegExp(emailRegex, 'i').test(email);
}

export function isTrustedUser(issue: Issue, trustedUserRegex: string): boolean {
  return new RegExp(trustedUserRegex).test(issue.user.login);
}
function getFileContent(
  data: Octokit.ReposGetContentsResponse | Array<Octokit.ReposGetContentsResponseItem>
): string | undefined {
  if ('content' in data) {
    return data.content;
  }
  return undefined;
}

export async function getConfig(github: GitHub, owner: string, repo: string, path: string): Promise<Config> {
  const result: Octokit.Response<Octokit.ReposGetContentsResponse> = await github.repos.getContents({
    owner,
    repo,
    path
  });

  core.debug('in getConfig');

  const content: string | undefined = getFileContent(result.data);

  const decodedContent = Buffer.from(content || '', 'base64').toString('ascii');

  core.debug(JSON.stringify(decodedContent));
  const config: Config = JSON.parse(decodedContent);

  return config;
}

export function getContextRepo(): string[] {
  if (process.env.GITHUB_REPOSITORY) {
    return process.env.GITHUB_REPOSITORY.split('/');
  } else {
    throw new Error('There was an error getting the repository name from the Action context.');
  }
}

export function handleError(error: Error): void {
  core.debug(error.message);
  core.debug(error.stack || '');

  core.setOutput('message', error.message);
  core.setOutput('stepStatus', 'failed');

  core.setFailed(error.message);
}

export function getInputs(): ActionInputs {
  const email = core.getInput('EMAIL');
  const role: UserRole = core.getInput('USER_ROLE') as UserRole;
  const configPath = core.getInput('CONFIG_PATH');
  const owners = (core.getInput('OWNERS') || '').split(',').map(element => `@${element.trim()}`);

  return {
    email,
    role,
    configPath,
    owners
  };
}

export function getIssueData(payload: WebhookPayload): Issue {
  const issue: Issue | undefined = payload.issue;
  if (!issue) {
    throw new Error('No issue was found in the Action context.');
  }
  return issue;
}

export async function writeIssueFeedback(github: GitHub, input: IssueFeedbackInputs): Promise<void> {
  await github.issues.addLabels({
    owner: input.owner,
    repo: input.repo,
    issue_number: input.issue_number,
    labels: input.labels
  });
  await github.issues.createComment({
    owner: input.owner,
    repo: input.repo,
    issue_number: input.issue_number,
    body: input.body
  });
}
