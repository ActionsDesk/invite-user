# GitHub Action - Add or Invite User to a GitHub Organization

This GitHub Action (written in TypeScript) uses the [organization members API](https://developer.github.com/v3/orgs/members) , specifically the [create organization invitation](https://developer.github.com/v3/orgs/members/#create-organization-invitation) and [add or update organization membership](https://developer.github.com/v3/orgs/members/#add-or-update-organization-membership) endpoints, to allow you to leverage GitHub Actions and Issues to onboard new organization members.

<!-- Add test badge once proper tests are added -->

## Usage

### Pre-requisites

Create a `workflow.yml` file in your repository's `.github/workflows` directory. An [example workflow](#example-workflow---add-new-user-to-org) is available below. For more information, reference the GitHub Help Documentation for [Creating a workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file).

### Inputs

For more information on these inputs, see the [API Documentation](https://developer.github.com/v3/repos/releases/#input-2)

- `CONFIG_PATH`: The path to the GitHub Issue config rules. For more info on the contents of this file please see the [Config Rules](#config-rules) section below.
- `USER_ROLE`: The default role to apply to the user being invited to the organization. We recommend using `direct_member`. Please use caution when changing this value, you could give users too much privileges to your organization.
- `EMAIL`: The email of the user that you are adding to the organization. This can be obtained programatically with the [Actions-Parse-Issue](https://github.com/jasonmacgowan/actions-parse-issue) action

### Outputs

This action has two output variables to help you create composable workflows.

- message: This outputs a success or failure message. This will help you use another action to post messages to an issue. See example [Actions workflow](#example-workflow---add-new-user-to-org-with-outputs) below.
- stepStatus: This outputs the status of this step. There are two possible values `success` and `failed`. With this status you can now configure your workflow file to not end the job on an error. See example [Actions workflow](#example-workflow---add-new-user-to-org-with-outputs) below.

### Environment Variables

- `ADMIN_TOKEN`: Personal Access Token (PAT) of a member of the organization that has owner privileges.

#### Why is this needed

The GitHub Actions context has access to a `GITHUB_TOKEN` environment variables that is scoped to the repository that is running the Action. Adding new users to an organization requires a token with a larger scope / privileges.

- To learn more on token scopes [click here](https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/#available-scopes).
- To learn how to create your own personal access token [click here](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line).

### Config Rules

A JSON file with the rules you need to define to parse the GitHub Issue body and extract the data needed to create an invitation to your GitHub organization as well as the valid domain from which you will accept emails.

#### Structure

The action expects the use of regular expressions with named capture groups. There are two base named capture groups that the Action expects with one additional optional group:

- **emailRule**
- **trustedUserRule**
  - Optional, validation will be ignored if this is not included

```JSON
{
  "emailDomainRule": {
    "regex": "your-regular-expression"
  },
  "trustedUserRule": {
    "regex": "your-regular-expression"
  }
}
```

Want a better example? [Click here](#example-config-file)

#### More info on regular expressions

This Action is written with Javascript, we recommend reading up on regular expressions and how to use them with the Javascript engine.

- Want to learn more about the art of regular expressions? Great, take a [look at this](https://javascript.info/regular-expressions).
- Want to learn more about named capture groups? Well then please [click here](https://javascript.info/regexp-groups#named-groups).

## Examples

### Example workflow - add new user to org

This workflow will execute the `add_invite_user` action on every `issue.labeled` event triger, in other words every time a label is added to the issue.

```yaml
name: Add User from Issues

on:
  issues:
    types: [labeled]

jobs:
  create-invite:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
      - name: Get issue data
        uses: froi/add_invite_user@release/v1
        with:
          PARSING_RULES_PATH: ".github/parsing_rules.json"
          USER_ROLE: "direct_member"
          EMAIL: ${{ steps.get_input.outputs.email }}
        env:
          ADMIN_TOKEN: ${{secrets.ADMIN_TOKEN}}
```

This will workflow will create a new organization invitation for the user information found in the issue body.

### Example workflow - add new user to org with outputs

```yaml
name: Add User from Issues

on:
  issues:
    types: [labeled]

jobs:
  create-invite:
    runs-on: ubuntu-latest
    steps:
      - name: Get User Input
        id: get_input
        uses: ActionsDesk/parse-issue@master
        with:
          extract_email: '<p>Email of Requester:\s*(.*)</p>'
      - name: Invite User
        id: get-issue-data
        uses: ActionsDesk/invite_user@release/v1
        with:
          CONFIG_PATH: ".github/config.json"
          USER_ROLE: "direct_member"
          EMAIL: ${{ steps.get_input.outputs.['email']}}
      - name: Comment on Issue
        uses: ActionsDesk/add-comment-action@v1
        with:
          message: ${{ steps.get-issue-data.message }}
          status: ${{ steps.get-issue-data.stepStatus }}
```

This will workflow will create a new organization invitation for the user information found in the issue body and will post a success or failure message as an issue comment.

### Example Config file

```JSON
{
  "emailRule": {
    "regex": ".*email@domain.com$"
  },
  "trustedUserRule": {
  "regex": "UserName"
  }
}
```

## Contributing

Want to contribute to this GitHub Action? Fantastic! Pull requests are welcome! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) for more information :heart:.

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
