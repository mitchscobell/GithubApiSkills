import axios, { AxiosRequestConfig } from "axios";
import { GithubRepository } from "../models/github-repository.model";
import { PullRequest } from "../models/pull-request.model";
const parse = require('parse-link-header');

export class GithubService {
  private readonly urlRoot: string;

  constructor(private token: string) {
    this.urlRoot = `https://api.github.com`;
  }

  public async getRepositoriesAndPullRequestsForOrg(
    org: string
  ): Promise<GithubRepository[]> {
    const repositories = await this.getRepositoriesForOrg(org);

    // TODO parallelize this
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
      console.log(`${this.urlRoot}/orgs/${org}/repos`);
      const response = await axios.get(
        `${this.urlRoot}/orgs/${org}/repos`,
        this.getRequestOptions()
      );

      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error(`Failed to get repositories for ${org}`);
    }
  }

  public async getPullRequestsForOrgAndRepo(
    org: string,
    repo: string
  ): Promise<PullRequest[]> {
    try {
      console.log(`${this.urlRoot}/repos/${org}/${repo}/pulls`);
      const response = await axios.get(
        `${this.urlRoot}/repos/${org}/${repo}/pulls`,
        this.getRequestOptions()
      );

      const linkHeaders = response.headers.link;

      //TODO iterate through these
      if (linkHeaders) {
        let parsedLinkHeaders = parse(linkHeaders);
        console.log(parsedLinkHeaders);
      }

      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error(`Failed to get pull requests for ${org}/${repo}`);
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
