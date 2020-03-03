import * as main from '../src/main';

describe('Main tests', () => {
  beforeEach(() => {
    process.env.ADMIN_TOKEN = 'not-a-token';
    process.env.GITHUB_REPOSITORY = 'ActionsDesk/invite-user';
    octomock.resetMocks();
    octomock.loadIssueLabeledContext({
      issueBody: 'Test',
      issueNumber: 1,
      issueAuthorLogin: 'devops-bot'
    });
    octomock.mockFunctions.repos.getContents.mockReturnValue({
      data: {
        content: Buffer.from(
          `{
                        "emailDomainRule": {
                            "regex": ".*@email.com$"
                        },
                        "trustedUserRule": {
                            "regex": "^devops-bot$"
                        }
                }`
        ).toString('base64')
      }
    });

    octomock.mockFunctions.orgs.createInvitation.mockReturnValue({
      data: {
        id: 1,
        created_on: 'Now'
      }
    });
    octomock.mockFunctions.core.getInput
      .mockReturnValueOnce('user@email.com')
      .mockReturnValueOnce('user_role')
      .mockReturnValueOnce('./notUsed')
      .mockReturnValueOnce('user');
  });

  test('Main should invite user', async () => {
    await main.run();
    expect(octomock.mockFunctions.orgs.createInvitation).toHaveBeenCalledTimes(1);
  });

  test('Rate Limit error applies retry label', async () => {
    octomock.mockFunctions.orgs.createInvitation.mockReturnValue(
      Promise.reject({
        name: 'HttpError',
        status: 422,
        headers: {},
        request: {},
        errors: [
          {
            resource: 'OrganizationInvitation',
            code: 'unprocessable',
            field: 'data',
            message: 'Over invitation rate limit'
          }
        ],
        documentation_url: 'https://developer.github.com/v3/orgs/members/#create-organization-invitation'
      })
    );
    await main.run();
    expect(octomock.mockFunctions.issues.addLabels).toHaveBeenCalledWith({
      owner: 'ActionsDesk',
      repo: 'invite-user',
      issue_number: 1,
      labels: ['retry']
    });
    expect(octomock.mockFunctions.issues.createComment).toHaveBeenCalledTimes(1);
  });
  test('Failed invite error applies automation-failed label', async () => {
    octomock.mockFunctions.orgs.createInvitation.mockReturnValue(
      Promise.reject({
        name: 'HttpError',
        status: 422,
        headers: {},
        request: {},
        errors: [
          {
            resource: 'OrganizationInvitation',
            code: 'unprocessable',
            field: 'data',
            message: 'Some Other Error'
          }
        ],
        documentation_url: 'https://developer.github.com/v3/orgs/members/#create-organization-invitation'
      })
    );
    await main.run();
    expect(octomock.mockFunctions.issues.addLabels).toHaveBeenCalledWith({
      owner: 'ActionsDesk',
      repo: 'invite-user',
      issue_number: 1,
      labels: ['automation-failed']
    });
    expect(octomock.mockFunctions.issues.createComment).toHaveBeenCalledTimes(1);
  });
});
