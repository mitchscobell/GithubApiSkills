import { GithubService } from "./services/github-service";
const chalk = require("chalk");

async function main(): Promise<void> {
  // initialize the console
  const log = console.log;
  console.clear();

  const org: string = "ramda";

  log(
    chalk.white.bgRed("Loading data for ") +
      chalk.white.bgGreen.bold(org) +
      chalk.white.bgRed(" organization") +
      "\n"
  );

  const service = new GithubService();

  const repositories = await service.getRepositoriesForOrg(org);

  let amountOfPullRequests = 0;

  for (var repo of repositories) {
    log(chalk.white.bgBlue("Repository Name:") + chalk.cyan(` ${repo.name}`));

    const repoInfo = await service.getPullRequestsForOrgAndRepo(org, repo.name);

    log(
      chalk.blue("Number of Pull Requests:") +
        chalk.magenta(` ${repoInfo.length}`)
    );

    amountOfPullRequests += repoInfo.length;
  }

  log(
    chalk.red(`\nTotal Number of Pull Requests for `) +
      chalk.black.bgGreen.bold(`${org}`) +
      chalk.red(` organization: `) +
      chalk.green(`${amountOfPullRequests}`) +
      `\n`
  );
}

main();
