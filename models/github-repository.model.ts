import { PullRequest } from "./pull-request.model";

export interface GithubRepository {
    id: number;
    nodeId: string;
    name: string;
    full_name: string;
    description: string;
    pullRequests: PullRequest[];
}