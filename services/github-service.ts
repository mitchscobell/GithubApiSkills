import axios, { AxiosRequestConfig } from "axios";
import { GithubRepository } from "../models/github-repository.model";
import { PullRequest } from "../models/pull-request.model";
const parse = require("parse-link-header");

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
    const allRepos: GithubRepository[] = [];

    const fetchRepos = async (url: string): Promise<void> => {
      try {
        const response = await axios.get(url, this.getRequestOptions());
        allRepos.push(...response.data);

        const linkHeaders = response.headers.link;
        if (linkHeaders) {
          const parsedLinkHeaders = parse(linkHeaders);
          if (parsedLinkHeaders.next) {
            await fetchRepos(parsedLinkHeaders.next.url);
          }
        }
      } catch (error) {
        console.error(error);
        throw new Error(`Failed to get repositories for ${org}`);
      }
    };

    await fetchRepos(`${this.urlRoot}/orgs/${org}/repos`);
    return allRepos;
  }

  /// Builds URL and gets pull requests for an Orgs Repo
  public async getPullRequestsForOrgAndRepo(
    org: string,
    repo: string
  ): Promise<PullRequest[]> {
    try {
      //TODO parameterize state into an enum of the states
      const url = `${this.urlRoot}/repos/${org}/${repo}/pulls?state=all`;
      const response = await this.getPullRequests(url);

      return response;
    } catch (error) {
      console.error(error);
      throw new Error(`Failed to get pull requests for ${org}/${repo}`);
    }
  }

  /// Recursively gets the pull requests iterating through the pagination
  private async getPullRequests(url: string): Promise<PullRequest[]> {
    try {
      const response = await axios.get(url, this.getRequestOptions());
      const linkHeaders = response.headers.link;

      //TODO parameterize state into an enum of the states

      // iterate through the pages recursively
      if (linkHeaders) {
        let parsedLinkHeaders = parse(linkHeaders);
        if (parsedLinkHeaders.next) {
          const nextPage = await this.getPullRequests(
            parsedLinkHeaders.next.url + "&state=all"
          );
          response.data.push(...nextPage);
        }
      }

      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error(`Failed to get pull requests for ${url}`);
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
