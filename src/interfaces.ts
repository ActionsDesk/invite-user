export interface Config {
  emailDomainRule: {
    regex: string;
  };
  trustedUserRule?: {
    regex: string;
  };
}

export interface Issue {
  [key: string]: any;
  number: number;
  html_url?: string;
  body?: string;
}

export interface ActionInputs {
  email: string;
  role: UserRole;
  configPath: string;
  owners?: string[];
}

export interface CreateInvitationInputs {
  email: string;
  issue: Issue;
  owner: string;
  repo: string;
  role: UserRole;
  owners?: string[];
}
export interface IssueFeedbackInputs {
  owner: string;
  repo: string;
  issueNumber: number;
  labels: string[];
  body: string;
}
export type UserRole = 'admin' | 'direct_member' | 'billing_manager' | undefined;
