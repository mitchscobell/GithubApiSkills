import fetch from "node-fetch";
import { GithubRepository } from "../models/github-repository.model";
import { PullRequest } from "../models/pull-request.model";

export class GithubService {
  private token: string;

  constructor() {
    // pulls access token from environment variable
    this.token = process.env.github_access_token;
  }

  public async getRepositoriesForOrg(org: string): Promise<GithubRepository[]> {
    try {
      let response = await fetch(`https://api.github.com/orgs/${org}/repos`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      return response.json();
    } catch (error) {
      console.error(error);
    }
  }

  public async getPullRequestsForOrgAndRepo(
    org: string,
    repo: string
  ): Promise<PullRequest[]> {
    try {
      let response = await fetch(
        `https://api.github.com/repos/${org}/${repo}/pulls`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      return response.json();
    } catch (error) {
      console.error(error);
    }
  }
}
