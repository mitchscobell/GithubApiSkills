import axios, { AxiosRequestConfig } from "axios";
import { GithubRepository } from "../models/github-repository.model";
import { PullRequest } from "../models/pull-request.model";

export class GithubService {
  private token: string;

  constructor() {
    // pulls access token from environment variable
    this.token = process.env.github_access_token;
  }

  public async getRepositoriesAndPullRequestsForOrg(
    org: string
  ): Promise<GithubRepository[]> {
    const repos = await this.getRepositoriesForOrg(org);

    for (var repo of repos) {
      repo.pullRequests = await this.getPullRequestsForOrgAndRepo(
        org,
        repo.name
      );
    }

    return repos;
  }

  public async getRepositoriesForOrg(org: string): Promise<GithubRepository[]> {
    try {
      let response = await axios.get(
        `https://api.github.com/orgs/${org}/repos`,
        this.getRequestOptions()
      );

      return response.data;
    } catch (error) {
      console.error(error);
    }
  }

  public async getPullRequestsForOrgAndRepo(
    org: string,
    repo: string
  ): Promise<PullRequest[]> {
    try {
      let response = await axios.get(
        `https://api.github.com/repos/${org}/${repo}/pulls`,
        this.getRequestOptions()
      );

      return response.data;
    } catch (error) {
      console.error(error);
    }
  }

  private getRequestOptions(): AxiosRequestConfig {
    return {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    };
  }
}
