import axios, { AxiosRequestConfig } from "axios";
import { GithubRepository } from "../models/github-repository.model";
import { PullRequest } from "../models/pull-request.model";

export class GithubService {
  private readonly token: string;
  private readonly urlRoot: string;

  constructor() {
    this.token = process.env.github_access_token;
    this.urlRoot = `https://api.github.com`;
  }

  public async getRepositoriesAndPullRequestsForOrg(
    org: string
  ): Promise<GithubRepository[]> {
    const repositories = await this.getRepositoriesForOrg(org);

    for (var repo of repositories) {
      repo.pullRequests = await this.getPullRequestsForOrgAndRepo(
        org,
        repo.name
      );
    }
    return repositories;
  }

  public async getRepositoriesForOrg(org: string): Promise<GithubRepository[]> {
    try {
      const response = await axios.get(
        `${this.urlRoot}/orgs/${org}/repos`,
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
      const response = await axios.get(
        `${this.urlRoot}/repos/${org}/${repo}/pulls`,
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
