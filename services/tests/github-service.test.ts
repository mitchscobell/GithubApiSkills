import { GithubService } from "../github-service";
import axios from "axios";
import { mocked } from "jest-mock";

jest.mock("axios"); // Mock axios
const mockedAxios = mocked(axios);

describe("Testing GithubService", () => {
  let service: GithubService;

  beforeEach(() => {
    service = new GithubService("fake-token");
    mockedAxios.get.mockClear(); // Reset mocks between tests
  });

  describe("Testing getRepositoriesForOrg(...)", () => {
    it("should fetch repositories without pagination", async () => {
      const mockRepos = [{ name: "repo1" }, { name: "repo2" }];
      mockedAxios.get.mockResolvedValueOnce({
        data: mockRepos,
        headers: {}, // No Link header means no pagination
      });

      const result = await service.getRepositoriesForOrg("test-org");

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://api.github.com/orgs/test-org/repos",
        expect.objectContaining({
          headers: { Authorization: "Bearer fake-token" },
        })
      );
      expect(result).toEqual(mockRepos);
    });

    it("should fetch repositories with pagination", async () => {
      const page1 = [{ name: "repo1" }, { name: "repo2" }];
      const page2 = [{ name: "repo3" }];
      mockedAxios.get
        .mockResolvedValueOnce({
          data: page1,
          headers: {
            link: '<https://api.github.com/orgs/test-org/repos?page=2>; rel="next", <https://api.github.com/orgs/test-org/repos?page=2>; rel="last"',
          },
        })
        .mockResolvedValueOnce({
          data: page2,
          headers: {},
        });

      const result = await service.getRepositoriesForOrg("test-org");

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://api.github.com/orgs/test-org/repos",
        expect.any(Object)
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://api.github.com/orgs/test-org/repos?page=2",
        expect.any(Object)
      );
      expect(result).toEqual([...page1, ...page2]);
    });

    it("should fetch repositories with link header but no next page", async () => {
      const mockRepos = [{ name: "repo1" }, { name: "repo2" }];
      mockedAxios.get.mockResolvedValueOnce({
        data: mockRepos,
        headers: {
          link: '<https://api.github.com/orgs/test-org/repos?page=1>; rel="last"',
        },
      });

      const result = await service.getRepositoriesForOrg("test-org");

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRepos);
    });

    it("should call onProgress with repo count", async () => {
      const mockRepos = [{ name: "repo1" }];
      mockedAxios.get.mockResolvedValueOnce({ data: mockRepos, headers: {} });
      const onProgress = jest.fn();

      await service.getRepositoriesForOrg("test-org", onProgress);

      expect(onProgress).toHaveBeenCalledWith(1);
    });

    it("should throw an error on fetch failure", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("API error"));

      await expect(service.getRepositoriesForOrg("test-org")).rejects.toThrow(
        "Failed to get repositories for test-org"
      );
    });
  });

  describe("Testing getPullRequestsForOrgAndRepo(...)", () => {
    it("should fetch PRs without pagination", async () => {
      const mockPRs = [
        {
          id: 1,
          title: "PR1",
          nodeId: "PR_1",
          body: "Body",
          number: 1,
          state: "closed",
          created_at: "2023-01-01T12:00:00Z",
          merged_at: "2023-01-01T12:30:00Z",
        },
      ];
      mockedAxios.get.mockResolvedValueOnce({ data: mockPRs, headers: {} });

      const result = await service.getPullRequestsForOrgAndRepo(
        "test-org",
        "test-repo"
      );

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://api.github.com/repos/test-org/test-repo/pulls?state=all",
        expect.any(Object)
      );
      expect(result).toEqual([
        {
          ...mockPRs[0],
          openToMergeTime: 30, // (12:30 - 12:00) = 30 minutes
        },
      ]);
    });

    it("should fetch PRs with pagination and updates progress", async () => {
      const page1 = [
        {
          id: 1,
          title: "PR1",
          nodeId: "PR_1",
          body: "Body1",
          number: 1,
          state: "closed",
          created_at: "2023-01-01T12:00:00Z",
          merged_at: "2023-01-01T12:30:00Z",
        },
      ];
      const page2 = [
        {
          id: 2,
          title: "PR2",
          nodeId: "PR_2",
          body: "Body2",
          number: 2,
          state: "open",
          created_at: "2023-01-02T12:00:00Z",
          merged_at: null,
        },
      ];
      mockedAxios.get
        .mockResolvedValueOnce({
          data: page1,
          headers: {
            link: '<https://api.github.com/repos/test-org/test-repo/pulls?state=all&page=2>; rel="next"',
          },
        })
        .mockResolvedValueOnce({ data: page2, headers: {} });
      const onPRProgress = jest.fn();

      const result = await service.getPullRequestsForOrgAndRepo(
        "test-org",
        "test-repo",
        onPRProgress
      );

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(onPRProgress).toHaveBeenCalledWith(1); // First page
      expect(result).toEqual([
        { ...page1[0], openToMergeTime: 30 }, // 30 minutes
        { ...page2[0], openToMergeTime: null }, // Not merged
      ]);
    });

    it("should fetch PRs with link header but no next page", async () => {
      const mockPRs = [
        {
          id: 1,
          title: "PR1",
          nodeId: "PR_1",
          body: "Body",
          number: 1,
          state: "closed",
          created_at: "2023-01-01T12:00:00Z",
          merged_at: "2023-01-01T13:00:00Z",
        },
      ];
      mockedAxios.get.mockResolvedValueOnce({
        data: mockPRs,
        headers: {
          link: '<https://api.github.com/repos/test-org/test-repo/pulls?page=1>; rel="last"',
        },
      });

      const result = await service.getPullRequestsForOrgAndRepo(
        "test-org",
        "test-repo"
      );

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual([{ ...mockPRs[0], openToMergeTime: 60 }]); // 60 minutes
    });
  });

  describe("Testing getRepositoriesAndPullRequestsForOrg(...)", () => {
    it("should fetch repos and PRs with progress", async () => {
      const mockRepos = [{ name: "repo1", pullRequests: [] }];
      const mockPRs = [
        {
          id: 1,
          title: "PR1",
          nodeId: "PR_1",
          body: "Body",
          number: 1,
          state: "closed",
          created_at: "2023-01-01T12:00:00Z",
          merged_at: "2023-01-01T12:45:00Z",
        },
      ];
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockRepos, headers: {} }) // Repos
        .mockResolvedValueOnce({ data: mockPRs, headers: {} }); // PRs
      const onProgress = jest.fn();

      const result = await service.getRepositoriesAndPullRequestsForOrg(
        "test-org",
        onProgress
      );

      expect(onProgress).toHaveBeenCalledWith(1, 0); // After repos
      expect(onProgress).toHaveBeenCalledWith(1, 1); // After PRs
      expect(result).toEqual([
        {
          name: "repo1",
          pullRequests: [{ ...mockPRs[0], openToMergeTime: 45 }],
        },
      ]); // 45 minutes
    });
  });

  describe("Testing getRepoCountForOrg(...)", () => {
    it("should estimate repo count without pagination", async () => {
      const mockRepos = [{ name: "repo1" }, { name: "repo2" }];
      mockedAxios.get.mockResolvedValueOnce({ data: mockRepos, headers: {} });

      const count = await service.getRepoCountForOrg("test-org");

      expect(count).toBe(2);
    });

    it("should estimate repo count with pagination", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: Array(30).fill({ name: "repo" }), // 30 per page
        headers: {
          link: '<https://api.github.com/orgs/test-org/repos?page=3>; rel="last"',
        },
      });

      const count = await service.getRepoCountForOrg("test-org");

      expect(count).toBe(90); // 3 pages * 30
    });

    it("should estimate repo count with link header but no last page", async () => {
      const mockRepos = [{ name: "repo1" }, { name: "repo2" }];
      mockedAxios.get.mockResolvedValueOnce({
        data: mockRepos,
        headers: {
          link: '<https://api.github.com/orgs/test-org/repos?page=2>; rel="next"',
        },
      });

      const count = await service.getRepoCountForOrg("test-org");

      expect(count).toBe(2);
    });
  });
});
