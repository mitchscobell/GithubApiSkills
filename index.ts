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

  const repositories = await service.getRepositoriesAndPullRequestsForOrg(org);

  const amountOfPullRequests = repositories.reduce((accumulator, repo) => {
    log(chalk.white.bgBlue("Repository Name:") + chalk.cyan(` ${repo.name}`));

    log(
      chalk.blue("Number of Pull Requests:") +
        chalk.magenta(` ${repo.pullRequests.length}`)
    );

    return accumulator + repo.pullRequests.length;
  }, 0);

  log(
    chalk.red(`\nTotal Number of Pull Requests for `) +
      chalk.black.bgGreen.bold(`${org}`) +
      chalk.red(` organization: `) +
      chalk.green(`${amountOfPullRequests}`) +
      `\n`
  );
}

main();
