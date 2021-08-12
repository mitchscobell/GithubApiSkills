import { GithubService } from "./services/github-service";

async function main(): Promise<void> {
  const org: string = "ramda";
  const service = new GithubService();

  let repositories = await service.getRepositoriesForOrg(org);

  let amountOfPullRequests = 0;

  for (let repo of repositories) {
    console.log(`Repository Name: ${repo.name}`);
    let repoInfo = await service.getPullRequestsForOrgAndRepo(org, repo.name);
    console.log(`Number of Pull Requests: ${repoInfo.length}\n`);
    amountOfPullRequests += repoInfo.length;
  }

  console.log(`\nTotal Number of Pull Requests for ${org} organization: ${amountOfPullRequests}\n\n`);
}

main();
