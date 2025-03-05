/**
 * Represents a GitHub pull request with metadata
 */
export interface PullRequest {
  /** Unique identifier for the pull request */
  id: number;

  /** Unique node ID for the pull request in GitHub's GraphQL API */
  nodeId: string;

  /** Title of the pull request */
  title: string;

  /** Body text or description of the pull request */
  body: string;

  /** Pull request number within its repository */
  number: number;

  /** Current state of the pull request (e.g., "open", "closed", "merged") */
  state: string;

  /** Creation timestamp of the pull request in ISO 8601 format (e.g., "2023-01-01T12:00:00Z") */
  created_at: string;

  /** Merge timestamp of the pull request in ISO 8601 format (e.g., "2023-01-02T14:00:00Z"), null if not merged */
  merged_at: string | null;

  /** Time from open to merge in hours, calculated as (merged_at - created_at) / (1000ms * 60mins), null if not merged. */
  openToMergeTime?: number | null;
}
