import { GithubService } from "./services/github-service";
import chalk from "chalk";
import dotenv from "dotenv";
import ora from "ora";

async function main(): Promise<void> {
  const log = console.log;
  console.clear();

  // Capture the result of dotenv.config()
  const configResult = dotenv.config();

  if (configResult.error) {
    throw configResult.error;
  }

  if (!process.env.GITHUB_ACCESS_TOKEN) {
    throw new Error("GITHUB_ACCESS_TOKEN Environment Variable is not defined");
  }

  const org: string = "ramda";

  const spinner = ora({
    text:
      chalk.white.bgRed("Loading data for ") +
      chalk.white.bgGreen.bold(org) +
      chalk.white.bgRed(" organization"),
    spinner: "dots",
  }).start();

  const service = new GithubService(process.env.GITHUB_ACCESS_TOKEN);

  try {
    const repositories = await service.getRepositoriesAndPullRequestsForOrg(
      org
    );

    spinner.succeed("Data loaded successfully");

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
  } catch (error) {
    // Type error as Error (or handle as unknown)
    const errorMessage = error instanceof Error ? error.message : String(error);
    spinner.fail(`Failed to load data: ${errorMessage}`);
    throw error;
  }
}

main();
