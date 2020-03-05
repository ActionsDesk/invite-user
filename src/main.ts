import * as core from '@actions/core';
import {GitHub, context} from '@actions/github';
import * as utils from './utils';
import {Issue, ActionInputs, CreateInvitationInputs} from './interfaces';
import {outdent} from 'outdent';
import * as Octokit from '@octokit/rest';

async function createInvitation(
  github: GitHub,
  input: CreateInvitationInputs
): Promise<Octokit.Response<Octokit.OrgsCreateInvitationResponse>> {
  try {
    return await github.orgs.createInvitation({
      org: input.owner,
      role: input.role,
      email: input.email
    });
  } catch (error) {
    if (error.errors && error.errors.find((e: Error) => e.message === 'Over invitation rate limit')) {
      const errorMessage = 'Over invitiation rate limit';
      await utils.writeIssueFeedback(github, {
        owner: input.owner,
        repo: input.repo,
        issueNumber: input.issue.number,
        labels: ['retry'],
        body: `${errorMessage}. Retrying over-night`
      });

      throw new Error(errorMessage);
    } else {
      const ownersText = input.owners ? input.owners.join(',') : '';

      await utils.writeIssueFeedback(github, {
        owner: input.owner,
        repo: input.repo,
        issueNumber: input.issue.number,
        labels: ['automation-failed'],
        body: outdent`Automation Failed:
            Org Admins will review the request and action it manually.
            CC: ${ownersText}`
      });

      throw error;
    }
  }
}
async function run(): Promise<void> {
  let actionInputs: ActionInputs;

  try {
    core.debug(new Date().toTimeString());
    const github: GitHub = utils.getClient();

    actionInputs = utils.getInputs();
    const issue: Issue = utils.getIssueData(context.payload);

    const [owner, repo] = utils.getContextRepo();
    const {emailDomainRule, trustedUserRule} = await utils.getConfig(github, owner, repo, actionInputs.configPath);

    if (!utils.validEmail(actionInputs.email, emailDomainRule.regex)) {
      throw new Error(`Email ${actionInputs.email} not from a valid domain`);
    }
    if (trustedUserRule && !utils.isTrustedUser(issue, trustedUserRule.regex)) {
      throw new Error(`User that opened issue, ${issue.user.login} not a trusted user`);
    }

    const result = await createInvitation(github, {
      owner,
      repo,
      issue,
      role: actionInputs.role,
      email: actionInputs.email,
      owners: actionInputs.owners
    });

    const successMessage = `User with email ${actionInputs.email} has been invited into the org.`;
    core.debug(`Invite created id: ${result.data.id}, created_on: ${result.data.created_at}`);
    core.info(successMessage);
    core.setOutput('message', successMessage);
    core.setOutput('stepStatus', 'success');
  } catch (error) {
    utils.handleError(error);
  }
}

if (!module.parent) {
  run();
}

export {run};
