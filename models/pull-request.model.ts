export interface PullRequest {
    id: number;
    nodeId: string;
    title: string;
    body: string;
    number: number;
    state: string;
}