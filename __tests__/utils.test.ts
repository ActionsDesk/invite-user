import {getClient, getContextRepo, isTrustedUser, validEmail} from '../src/utils';
import {GitHub} from '@actions/github';
import {Issue} from '../src/interfaces';

describe('Utils tests', () => {
  beforeEach(() => {
    process.env.ADMIN_TOKEN = 'not-a-token';
    process.env.GITHUB_REPOSITORY = 'ActionsDesk/invite-user';
  });
  test('getClient should return a GitHub client', () => {
    const client: GitHub = getClient();
    expect(client).toBeInstanceOf(GitHub);
  });
  test('validEmail returns true', () => {
    expect(validEmail('mona@domain.com', '.*@domain.com$')).toBe(true);
  });
  test('validEmail returns false', () => {
    expect(validEmail('mona@notdomain.com', '.*@domain.com$')).toBe(false);
  });
  test('isTrustedUser returns true', () => {
    const mockIssue: Issue = {
      user: {
        login: 'mona'
      },
      number: 1
    };
    expect(isTrustedUser(mockIssue, 'mona')).toBe(true);
  });
  test('isTrustedUser returns false', () => {
    const mockIssue: Issue = {
      user: {
        login: 'NotMona'
      },
      number: 1
    };
    expect(isTrustedUser(mockIssue, 'mona')).toBe(false);
  });
  test('getContextRepo should return owner and repo values', () => {
    const [owner, repo] = getContextRepo();
    expect(owner).toBe('ActionsDesk');
    expect(repo).toBe('invite-user');
  });
  test('getContextRepo should throw error', () => {
    delete process.env.GITHUB_REPOSITORY;
    expect(getContextRepo).toThrowError();
  });
});
