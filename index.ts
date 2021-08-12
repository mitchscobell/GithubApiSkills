import { GithubService } from "./services/github-service";

async function main(): Promise<void> {
  const org: string = "ramda";
  const service = new GithubService();

  let repositories = await service.getRepositoriesForOrg(org);

  let amountOfPullRequests = 0;

  for (let repo of repositories) {
    console.log(`Name: ${repo.name}`);
    let repoInfo = await service.getPullRequestsForOrgAndRepo(org, repo.name);
    console.log(`Amount of Pull Requests: ${repoInfo.length}\n`);
    amountOfPullRequests += repoInfo.length;
  }

  console.log(`\nTotal Amount of Pull Requests: ${amountOfPullRequests}\n\n`);
}

main();
