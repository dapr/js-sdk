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
const reviewCopyback = require("../../../.github/scripts/copilot_review_copyback");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGithub() {
  return {
    rest: {
      pulls: {
        get: jest.fn().mockResolvedValue({ data: { head: { ref: "copilot/pr-7" } } }),
      },
      issues: {
        createComment: jest.fn().mockResolvedValue({}),
      },
    },
  };
}

function makeContext(eventName: string, payload: Record<string, unknown>) {
  return { eventName, repo: { owner: "dapr", repo: "js-sdk" }, payload };
}

// Builds a context for a pull_request_review event
function reviewEventContext(opts: {
  headRef?: string;
  reviewerLogin?: string;
  reviewBody?: string;
  prNumber?: number;
} = {}) {
  const {
    headRef = "copilot/pr-7",
    reviewerLogin = "copilot-pull-request-reviewer[bot]",
    reviewBody = "Looks good!",
    prNumber = 42,
  } = opts;
  return makeContext("pull_request_review", {
    review: { user: { login: reviewerLogin }, body: reviewBody, html_url: "https://github.com/example/review/1" },
    pull_request: { number: prNumber, head: { ref: headRef } },
  });
}

// Builds a context for a pull_request_review_comment event
function reviewCommentEventContext(opts: {
  headRef?: string;
  commenterLogin?: string;
  commentBody?: string;
  filePath?: string;
  prNumber?: number;
} = {}) {
  const {
    headRef = "copilot/pr-7",
    commenterLogin = "copilot-pull-request-reviewer[bot]",
    commentBody = "This line has an issue.",
    filePath = "src/index.ts",
    prNumber = 42,
  } = opts;
  return makeContext("pull_request_review_comment", {
    comment: { user: { login: commenterLogin }, body: commentBody, path: filePath, html_url: "https://github.com/example/comment/1" },
    pull_request: { number: prNumber, head: { ref: headRef } },
  });
}

// Builds a context for an issue_comment event (on a PR)
function issueCommentEventContext(opts: {
  commenterLogin?: string;
  commentBody?: string;
  issueNumber?: number;
} = {}) {
  const {
    commenterLogin = "copilot-pull-request-reviewer[bot]",
    commentBody = "Here is my review summary.",
    issueNumber = 42,
  } = opts;
  return makeContext("issue_comment", {
    comment: { user: { login: commenterLogin }, body: commentBody, html_url: "https://github.com/example/comment/2" },
    issue: { number: issueNumber, pull_request: {} },
  });
}

// ---------------------------------------------------------------------------
// Tests — pull_request_review
// ---------------------------------------------------------------------------

describe("copilot_review_copyback — pull_request_review", () => {
  it("skips when the PR is not a mirror branch", async () => {
    const github = makeGithub();
    await reviewCopyback({ github, context: reviewEventContext({ headRef: "feature/some-feature" }) });
    expect(github.rest.issues.createComment).not.toHaveBeenCalled();
  });

  it("skips when the reviewer is not a Copilot bot", async () => {
    const github = makeGithub();
    await reviewCopyback({ github, context: reviewEventContext({ reviewerLogin: "human-reviewer" }) });
    expect(github.rest.issues.createComment).not.toHaveBeenCalled();
  });

  it("skips when the review body is empty", async () => {
    const github = makeGithub();
    await reviewCopyback({ github, context: reviewEventContext({ reviewBody: "" }) });
    expect(github.rest.issues.createComment).not.toHaveBeenCalled();
  });

  it("copies a Copilot review summary to the original PR", async () => {
    const github = makeGithub();
    await reviewCopyback({ github, context: reviewEventContext() });

    expect(github.rest.issues.createComment).toHaveBeenCalledTimes(1);
    const call = github.rest.issues.createComment.mock.calls[0][0];
    // Posts on the ORIGINAL PR (derived from copilot/pr-7 → 7)
    expect(call.issue_number).toBe(7);
    expect(call.body).toContain("Looks good!");
    expect(call.body).toContain("mirror PR #42");
  });
});

// ---------------------------------------------------------------------------
// Tests — pull_request_review_comment
// ---------------------------------------------------------------------------

describe("copilot_review_copyback — pull_request_review_comment", () => {
  it("skips when the PR is not a mirror branch", async () => {
    const github = makeGithub();
    await reviewCopyback({ github, context: reviewCommentEventContext({ headRef: "main" }) });
    expect(github.rest.issues.createComment).not.toHaveBeenCalled();
  });

  it("skips when the commenter is not a Copilot bot", async () => {
    const github = makeGithub();
    await reviewCopyback({ github, context: reviewCommentEventContext({ commenterLogin: "human-reviewer" }) });
    expect(github.rest.issues.createComment).not.toHaveBeenCalled();
  });

  it("copies an inline review comment to the original PR with the file path as a header", async () => {
    const github = makeGithub();
    await reviewCopyback({ github, context: reviewCommentEventContext() });

    expect(github.rest.issues.createComment).toHaveBeenCalledTimes(1);
    const call = github.rest.issues.createComment.mock.calls[0][0];
    expect(call.issue_number).toBe(7);
    expect(call.body).toContain("src/index.ts");
    expect(call.body).toContain("This line has an issue.");
  });

  it("escapes special characters in the file path inside a code span", async () => {
    const github = makeGithub();
    await reviewCopyback({
      github,
      context: reviewCommentEventContext({ filePath: "src/path\\with\\backslashes.ts" }),
    });

    const body: string = github.rest.issues.createComment.mock.calls[0][0].body;
    // Backslashes must be escaped so the code span renders correctly
    expect(body).toContain("src/path\\\\with\\\\backslashes.ts");
  });
});

// ---------------------------------------------------------------------------
// Tests — issue_comment
// ---------------------------------------------------------------------------

describe("copilot_review_copyback — issue_comment", () => {
  it("skips when the issue is not a pull request", async () => {
    const github = makeGithub();
    const context = makeContext("issue_comment", {
      comment: { user: { login: "copilot-pull-request-reviewer[bot]" }, body: "x", html_url: "u" },
      issue: { number: 42 }, // no pull_request key
    });
    await reviewCopyback({ github, context });
    expect(github.rest.issues.createComment).not.toHaveBeenCalled();
  });

  it("skips when the commenter is not a Copilot bot", async () => {
    const github = makeGithub();
    await reviewCopyback({ github, context: issueCommentEventContext({ commenterLogin: "alice" }) });
    expect(github.rest.issues.createComment).not.toHaveBeenCalled();
  });

  it("skips when the mirror PR lookup returns a non-mirror branch", async () => {
    const github = makeGithub();
    github.rest.pulls.get = jest.fn().mockResolvedValue({ data: { head: { ref: "feature/regular-branch" } } });
    await reviewCopyback({ github, context: issueCommentEventContext() });
    expect(github.rest.issues.createComment).not.toHaveBeenCalled();
  });

  it("copies the comment to the original PR after looking up the mirror PR's head ref", async () => {
    const github = makeGithub();
    await reviewCopyback({ github, context: issueCommentEventContext() });

    // Must have looked up the PR to find its head ref
    expect(github.rest.pulls.get).toHaveBeenCalledWith(expect.objectContaining({ pull_number: 42 }));
    // Must post on the original PR (7, derived from copilot/pr-7)
    const call = github.rest.issues.createComment.mock.calls[0][0];
    expect(call.issue_number).toBe(7);
    expect(call.body).toContain("Here is my review summary.");
  });

  it("handles a failure to look up the mirror PR gracefully", async () => {
    const github = makeGithub();
    github.rest.pulls.get = jest.fn().mockRejectedValue(new Error("not found"));
    // Should not throw
    await expect(reviewCopyback({ github, context: issueCommentEventContext() })).resolves.toBeUndefined();
    expect(github.rest.issues.createComment).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tests — unknown event type
// ---------------------------------------------------------------------------

describe("copilot_review_copyback — other events", () => {
  it("returns without doing anything for an unrecognised event type", async () => {
    const github = makeGithub();
    await reviewCopyback({ github, context: makeContext("push", {}) });
    expect(github.rest.issues.createComment).not.toHaveBeenCalled();
  });
});
