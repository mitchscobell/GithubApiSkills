import { GithubService } from "./services/github-service";
import chalk from "chalk";
import dotenv from "dotenv";
import ora from "ora";

/**
 * Main entry point for the GitHub API Test application.
 * Fetches and displays pull request data for the Ramda organization from the GitHub API.
 * @returns A promise that resolves when the operation completes successfully.
 * @throws {Error} If environment setup fails or API requests encounter errors.
 */
async function main(): Promise<void> {
  const log = console.log;
  console.clear();

  const configResult = dotenv.config();
  if (configResult.error) throw configResult.error;
  if (!process.env.GITHUB_ACCESS_TOKEN)
    throw new Error("GITHUB_ACCESS_TOKEN missing");

  const org: string = "ramda";
  const service = new GithubService(process.env.GITHUB_ACCESS_TOKEN);

  const totalRepos = await service.getRepoCountForOrg(org);
  let fetchedRepos = 0;
  let fetchedPRs = 0;

  const spinner = ora({
    text: `Fetching ${fetchedRepos} of ${totalRepos} repos (${fetchedPRs} PRs) for ${chalk.white.bgGreen.bold(
      org
    )}`,
    spinner: "dots",
  }).start();

  try {
    console.time(`Fetching data for ${org}`);
    const repositories = await service.getRepositoriesAndPullRequestsForOrg(
      org,
      (repos, prs) => {
        fetchedRepos = repos;
        fetchedPRs = prs;
        spinner.text = `Fetching ${fetchedRepos} of ${totalRepos} repos (${fetchedPRs} PRs) for ${chalk.white.bgGreen.bold(
          org
        )}`;
      }
    );

    spinner.succeed(
      `Fetched ${fetchedRepos} of ${totalRepos} repos (${fetchedPRs} PRs) for ${org}`
    );
    console.timeEnd(`Fetching data for ${org}`);

    log(chalk.white.bgBlue("Repository Details:"));
    repositories.forEach((repo) => {
      log(chalk.white.bgBlue("Repository Name:") + chalk.cyan(` ${repo.name}`));
      log(
        chalk.blue("Number of Pull Requests:") +
          chalk.magenta(` ${repo.pullRequests.length}`)
      );
    });

    log(
      chalk.red(`\nTotal Number of Pull Requests for `) +
        chalk.black.bgGreen.bold(`${org}`) +
        chalk.red(` organization: `) +
        chalk.green(`${fetchedPRs}`) +
        `\n`
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    spinner.fail(`Failed: ${errorMessage}`);
    throw error;
  }
}

main();
