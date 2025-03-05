import axios from "axios";
import { GithubRepository } from "../models/github-repository.model";
import { PullRequest } from "../models/pull-request.model";
const parse = require("parse-link-header");
const MILLISECONDS = 1000;
const SECONDS = 60;

/**
 * Github service class to interact with the GitHub API for fetching repository and pull request data.
 */
export class GithubService {
  private readonly urlRoot: string = "https://api.github.com";

  /**
   * Constructs a new GithubService instance with the passed authentication token.
   * @param token - GitHub API access token for authentication (example: 'ghp_xxx')
   */
  constructor(private token: string) {}

  /**
   * Fetches all repositories and their associated pull requests for a given organization.
   * @param org - The GitHub organization name (e.g., "ramda").
   * @param onProgress - Optional callback to report progress as repos and PRs are fetched.
   * @returns A promise resolving to an array of GithubRepository objects with pull requests.
   */
  public async getRepositoriesAndPullRequestsForOrg(
    org: string,
    onProgress?: (fetchedRepos: number, fetchedPRs: number) => void
  ): Promise<GithubRepository[]> {
    const repositories = await this.getRepositoriesForOrg(org, (repos) => {
      if (onProgress) onProgress(repos, 0);
    });

    let totalPRs = 0;
    for (const repo of repositories) {
      repo.pullRequests = await this.getPullRequestsForOrgAndRepo(
        org,
        repo.name,
        (prs) => {
          totalPRs += prs;
          if (onProgress) onProgress(repositories.length, totalPRs);
        }
      );
    }
    return repositories;
  }

  /**
   * Retrieves all repositories for a specified GitHub organization, handling pagination.
   * @param org - The GitHub organization name (e.g., "ramda").
   * @param onProgress - Optional callback to report the number of fetched repositories.
   * @returns A promise resolving to an array of GithubRepository objects.
   * @throws {Error} If the API request fails.
   */
  public async getRepositoriesForOrg(
    org: string,
    onProgress?: (fetchedRepos: number) => void
  ): Promise<GithubRepository[]> {
    const allRepos: GithubRepository[] = [];

    const fetchRepos = async (url: string): Promise<void> => {
      const response = await axios.get<GithubRepository[]>(
        url,
        this.getRequestOptions()
      );
      allRepos.push(...response.data);
      if (onProgress) onProgress(allRepos.length);

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

  /**
   * Fetches all pull requests for a specific repository within an organization.
   * @param org - The GitHub organization name.
   * @param repo - The repository name within the organization.
   * @param onPRProgress - Optional callback to report the number of fetched pull requests.
   * @returns A promise resolving to an array of PullRequest objects.
   * @throws {Error} If the API request fails.
   */
  public async getPullRequestsForOrgAndRepo(
    org: string,
    repo: string,
    onPRProgress?: (fetchedPRs: number) => void
  ): Promise<PullRequest[]> {
    const url = `${this.urlRoot}/repos/${org}/${repo}/pulls?state=all`;
    return await this.getPullRequests(url, onPRProgress);
  }

  /**
   * Recursively fetches pull requests from a given URL, handling pagination.
   * @param url - The API URL to fetch pull requests from.
   * @param onPRProgress - Optional callback to report the number of fetched pull requests per page.
   * @returns A promise resolving to an array of PullRequest objects with calculated open-to-merge time.
   * @throws {Error} If the API request fails.
   */
  private async getPullRequests(
    url: string,
    onPRProgress?: (fetchedPRs: number) => void
  ): Promise<PullRequest[]> {
    const response = await axios.get<PullRequest[]>(
      url,
      this.getRequestOptions()
    );
    const prs: PullRequest[] = response.data.map((pr) => ({
      ...pr,
      openToMergeTime: pr.merged_at
        ? (new Date(pr.merged_at).getTime() -
            new Date(pr.created_at).getTime()) /
          (MILLISECONDS * SECONDS)
        : null, // Minutes or null if not merged
    }));
    if (onPRProgress) onPRProgress(prs.length);

    const linkHeaders = response.headers.link;
    if (linkHeaders) {
      const parsed = parse(linkHeaders);
      if (parsed.next) {
        const nextPage = await this.getPullRequests(
          parsed.next.url + "&state=all",
          onPRProgress
        );
        prs.push(...nextPage);
      }
    }
    return prs;
  }

  /**
   * Generates the request options for GitHub API calls, including authentication headers.
   * @returns An object containing the headers with the authorization token.
   */
  private getRequestOptions(): { headers: { Authorization: string } } {
    return {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    };
  }

  /**
   * Estimates the total number of repositories for an organization based on the first API response.
   * @param org - The GitHub organization name.
   * @returns A promise resolving to the estimated total number of repositories.
   * @throws {Error} If the API request fails.
   */
  public async getRepoCountForOrg(org: string): Promise<number> {
    const response = await axios.get<GithubRepository[]>(
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
