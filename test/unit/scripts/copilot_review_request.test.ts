/*
Copyright 2022 The Dapr Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// eslint-disable-next-line @typescript-eslint/no-var-requires
const reviewRequest = require("../../../.github/scripts/copilot_review_request");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGithub(opts: { branchExists?: boolean; membershipState?: string | null } = {}) {
  const { branchExists = false, membershipState = "active" } = opts;
  return {
    rest: {
      teams: {
        getMembershipForUserInOrg:
          membershipState === null
            ? jest.fn().mockRejectedValue({ status: 404 })
            : jest.fn().mockResolvedValue({ data: { state: membershipState } }),
      },
      reactions: {
        createForIssueComment: jest.fn().mockResolvedValue({ data: { id: 999 } }),
        deleteForIssueComment: jest.fn().mockResolvedValue({}),
      },
      git: {
        getRef: branchExists
          ? jest.fn().mockResolvedValue({ data: {} })
          : jest.fn().mockRejectedValue({ status: 404 }),
        createRef: jest.fn().mockResolvedValue({}),
      },
      pulls: {
        get: jest.fn().mockResolvedValue({
          data: { head: { sha: "abc123" }, base: { ref: "main" }, title: "My PR" },
        }),
        create: jest.fn().mockResolvedValue({ data: { number: 42 } }),
        update: jest.fn().mockResolvedValue({}),
      },
      issues: {
        createComment: jest.fn().mockResolvedValue({ data: { id: 1234 } }),
      },
    },
  };
}

function makeContext(commentBody = "review: please check error handling") {
  return {
    actor: "alice",
    repo: { owner: "dapr", repo: "js-sdk" },
    payload: {
      issue: { number: 7, pull_request: {} },
      comment: { id: 100, body: commentBody },
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("copilot_review_request", () => {
  it("skips when the comment is not on a pull request", async () => {
    const github = makeGithub();
    const context = {
      actor: "alice",
      repo: { owner: "dapr", repo: "js-sdk" },
      payload: { issue: { number: 7 }, comment: { id: 100, body: "review: x" } },
    };
    await reviewRequest({ github, context });
    expect(github.rest.teams.getMembershipForUserInOrg).not.toHaveBeenCalled();
    expect(github.rest.reactions.createForIssueComment).not.toHaveBeenCalled();
  });

  it("skips when the comment body does not start with 'review:'", async () => {
    const github = makeGithub();
    await reviewRequest({ github, context: makeContext("just a normal comment") });
    expect(github.rest.teams.getMembershipForUserInOrg).not.toHaveBeenCalled();
    expect(github.rest.reactions.createForIssueComment).not.toHaveBeenCalled();
  });

  it("skips when the actor is not a team member (404)", async () => {
    const github = makeGithub({ membershipState: null });
    await reviewRequest({ github, context: makeContext() });
    expect(github.rest.reactions.createForIssueComment).not.toHaveBeenCalled();
    expect(github.rest.git.createRef).not.toHaveBeenCalled();
  });

  it("skips when the actor has a pending (non-active) team membership", async () => {
    const github = makeGithub({ membershipState: "pending" });
    await reviewRequest({ github, context: makeContext() });
    expect(github.rest.reactions.createForIssueComment).not.toHaveBeenCalled();
    expect(github.rest.git.createRef).not.toHaveBeenCalled();
  });

  it("rethrows unexpected errors from the team membership check", async () => {
    const github = makeGithub();
    github.rest.teams.getMembershipForUserInOrg = jest.fn().mockRejectedValue({ status: 500 });
    await expect(reviewRequest({ github, context: makeContext() })).rejects.toMatchObject({ status: 500 });
  });

  it("posts an 'in progress' comment and removes the eyes reaction when the mirror branch already exists", async () => {
    const github = makeGithub({ branchExists: true });
    await reviewRequest({ github, context: makeContext() });

    // Eyes reaction should have been added and then removed
    expect(github.rest.reactions.createForIssueComment).toHaveBeenCalledWith(
      expect.objectContaining({ content: "eyes", comment_id: 100 }),
    );
    expect(github.rest.reactions.deleteForIssueComment).toHaveBeenCalledWith(
      expect.objectContaining({ reaction_id: 999, comment_id: 100 }),
    );

    // Should post the guard comment on the original PR
    expect(github.rest.issues.createComment).toHaveBeenCalledTimes(1);
    const body: string = github.rest.issues.createComment.mock.calls[0][0].body;
    expect(body).toMatch(/already in progress/i);

    // Must NOT create a mirror branch or PR
    expect(github.rest.git.createRef).not.toHaveBeenCalled();
    expect(github.rest.pulls.create).not.toHaveBeenCalled();
  });

  it("executes the full happy-path flow in the correct order", async () => {
    const callOrder: string[] = [];
    const github = makeGithub();

    github.rest.reactions.createForIssueComment = jest.fn().mockImplementation(() => {
      callOrder.push("createReaction");
      return Promise.resolve({ data: { id: 999 } });
    });
    github.rest.git.createRef = jest.fn().mockImplementation(() => {
      callOrder.push("createRef");
      return Promise.resolve({});
    });
    github.rest.pulls.create = jest.fn().mockImplementation(() => {
      callOrder.push("createMirrorPR");
      return Promise.resolve({ data: { number: 42 } });
    });
    github.rest.issues.createComment = jest
      .fn()
      .mockImplementationOnce(() => {
        callOrder.push("copilotComment");
        return Promise.resolve({ data: { id: 555 } });
      })
      .mockImplementationOnce(() => {
        callOrder.push("ackComment");
        return Promise.resolve({ data: { id: 1234 } });
      });
    github.rest.pulls.update = jest.fn().mockImplementation(() => {
      callOrder.push("updateMirrorPR");
      return Promise.resolve({});
    });
    github.rest.reactions.deleteForIssueComment = jest.fn().mockImplementation(() => {
      callOrder.push("deleteReaction");
      return Promise.resolve({});
    });

    await reviewRequest({ github, context: makeContext() });

    expect(callOrder).toEqual([
      "createReaction",
      "createRef",
      "createMirrorPR",
      "copilotComment",
      "ackComment",
      "updateMirrorPR",
      "deleteReaction",
    ]);
  });

  it("posts the @copilot comment on the mirror PR with the review text", async () => {
    const github = makeGithub();
    await reviewRequest({ github, context: makeContext("review: please check error handling") });

    const copilotCall = github.rest.issues.createComment.mock.calls.find(
      (c: any[]) => c[0].issue_number === 42,
    );
    expect(copilotCall).toBeDefined();
    expect(copilotCall[0].body).toContain("@copilot please check error handling");
  });

  it("creates the mirror branch from the fork's head SHA", async () => {
    const github = makeGithub();
    await reviewRequest({ github, context: makeContext() });

    expect(github.rest.git.createRef).toHaveBeenCalledWith(
      expect.objectContaining({
        ref: "refs/heads/copilot/pr-7",
        sha: "abc123",
      }),
    );
  });

  it("embeds the ack comment ID in the mirror PR body", async () => {
    const github = makeGithub();
    await reviewRequest({ github, context: makeContext() });

    expect(github.rest.pulls.update).toHaveBeenCalledWith(
      expect.objectContaining({
        pull_number: 42,
        body: expect.stringContaining("copilot-review-ack-comment-id: 1234"),
      }),
    );
  });

  it("removes the eyes reaction after the acknowledgement comment is posted", async () => {
    const github = makeGithub();
    await reviewRequest({ github, context: makeContext() });

    expect(github.rest.reactions.deleteForIssueComment).toHaveBeenCalledWith(
      expect.objectContaining({ reaction_id: 999, comment_id: 100 }),
    );
  });

  it("adds the eyes reaction even when a subsequent step fails", async () => {
    const github = makeGithub();
    github.rest.pulls.get = jest.fn().mockRejectedValue(new Error("network error"));

    await expect(reviewRequest({ github, context: makeContext() })).rejects.toThrow("network error");

    // The reaction must have been created before the failure
    expect(github.rest.reactions.createForIssueComment).toHaveBeenCalledWith(
      expect.objectContaining({ content: "eyes" }),
    );
  });
});
