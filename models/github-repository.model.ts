import { PullRequest } from "./pull-request.model";

export class GithubRepository {
    public id: number;
    public nodeId: string;
    public name: string;
    public full_name: string;
    public description: string;
    public pullRequests: PullRequest[];
}