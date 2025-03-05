import { GithubService } from "../github-service";
import axios from "axios";
import { mocked } from "jest-mock";

// Mock axios
jest.mock("axios");
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
      const mockPRs = [{ id: 1, title: "PR1" }];
      mockedAxios.get.mockResolvedValueOnce({ data: mockPRs, headers: {} });

      const result = await service.getPullRequestsForOrgAndRepo(
        "test-org",
        "test-repo"
      );

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://api.github.com/repos/test-org/test-repo/pulls?state=all",
        expect.any(Object)
      );
      expect(result).toEqual(mockPRs);
    });

    it("should fetch PRs with pagination and updates progress", async () => {
      const page1 = [{ id: 1, title: "PR1" }];
      const page2 = [{ id: 2, title: "PR2" }];
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
      expect(result).toEqual([...page1, ...page2]);
    });
  });

  describe("Testing getRepositoriesAndPullRequestsForOrg(...)", () => {
    it("should fetch repos and PRs with progress", async () => {
      const mockRepos = [{ name: "repo1", pullRequests: [] }];
      const mockPRs = [{ id: 1, title: "PR1" }];
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
      expect(result).toEqual([{ name: "repo1", pullRequests: mockPRs }]);
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
  });
});
