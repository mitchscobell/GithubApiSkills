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
    org: string,
    onProgress?: (fetchedRepos: number, fetchedPRs: number) => void
  ): Promise<GithubRepository[]> {
    const repositories = await this.getRepositoriesForOrg(org, (repos) => {
      if (onProgress) onProgress(repos, 0); // Update repo count
    });

    let totalPRs = 0;
    for (const repo of repositories) {
      repo.pullRequests = await this.getPullRequestsForOrgAndRepo(
        org,
        repo.name,
        (prs) => {
          totalPRs += prs; // Increment PRs per page
          if (onProgress) onProgress(repositories.length, totalPRs);
        }
      );
    }
    return repositories;
  }

  public async getRepositoriesForOrg(
    org: string,
    onProgress?: (fetchedRepos: number) => void
  ): Promise<GithubRepository[]> {
    const allRepos: GithubRepository[] = [];

    const fetchRepos = async (url: string): Promise<void> => {
      const response = await axios.get(url, this.getRequestOptions());
      allRepos.push(...response.data);
      if (onProgress) onProgress(allRepos.length); // Update after each page

      const linkHeaders = response.headers.link;
      if (linkHeaders) {
        const parsed = parse(linkHeaders);
        if (parsed.next) {
          await fetchRepos(parsed.next.url);
        }
      }
    };

    try {
      await fetchRepos(`${this.urlRoot}/orgs/${org}/repos`);
      return allRepos;
    } catch (error) {
      throw new Error(`Failed to get repositories for ${org}`);
    }
  }

  public async getPullRequestsForOrgAndRepo(
    org: string,
    repo: string,
    onPRProgress?: (fetchedPRs: number) => void
  ): Promise<PullRequest[]> {
    const url = `${this.urlRoot}/repos/${org}/${repo}/pulls?state=all`;
    return await this.getPullRequests(url, onPRProgress);
  }

  private async getPullRequests(
    url: string,
    onPRProgress?: (fetchedPRs: number) => void
  ): Promise<PullRequest[]> {
    const response = await axios.get(url, this.getRequestOptions());
    if (onPRProgress) onPRProgress(response.data.length); // Update per page

    const linkHeaders = response.headers.link;
    if (linkHeaders) {
      const parsed = parse(linkHeaders);
      if (parsed.next) {
        const nextPage = await this.getPullRequests(
          parsed.next.url + "&state=all",
          onPRProgress
        );
        response.data.push(...nextPage);
      }
    }
    return response.data;
  }

  private getRequestOptions(): AxiosRequestConfig {
    return {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    };
  }

  public async getRepoCountForOrg(org: string): Promise<number> {
    const response = await axios.get(
      `${this.urlRoot}/orgs/${org}/repos`,
      this.getRequestOptions()
    );
    const linkHeaders = response.headers.link;
    if (linkHeaders) {
      const parsed = parse(linkHeaders);
      if (parsed.last) {
        const lastPage = parseInt(parsed.last.page, 10);
        const perPage = response.data.length;
        return lastPage * perPage;
      }
    }
    return response.data.length;
  }
}
