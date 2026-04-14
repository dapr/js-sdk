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
const reviewCleanup = require("../../../.github/scripts/copilot_review_cleanup");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FOUR_HOURS_AGO = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
const THIRTY_MIN_AGO = new Date(Date.now() - 30 * 60 * 1000).toISOString();

function staleMirrorPr(number: number, origPrNumber: number, ackCommentId?: number) {
  const body = ackCommentId
    ? `<!-- copilot-review-mirror -->\n<!-- copilot-review-ack-comment-id: ${ackCommentId} -->\n`
    : `<!-- copilot-review-mirror -->\n`;
  return {
    number,
    head: { ref: `copilot/pr-${origPrNumber}` },
    created_at: FOUR_HOURS_AGO,
    body,
  };
}

function freshMirrorPr(number: number, origPrNumber: number) {
  return {
    number,
    head: { ref: `copilot/pr-${origPrNumber}` },
    created_at: THIRTY_MIN_AGO,
    body: `<!-- copilot-review-mirror -->`,
  };
}

const ACK_COMMENT_BODY =
  "🔍 Copilot review requested in mirror PR #42. Results will be posted here when available.\n*(Mirror branch: `copilot/pr-7` — auto-deleted after 3 hours.)*";

function makeGithub(mirrorPrs: any[] = []) {
  return {
    paginate: jest.fn().mockResolvedValue(mirrorPrs),
    rest: {
      pulls: {
        update: jest.fn().mockResolvedValue({}),
      },
      git: {
        deleteRef: jest.fn().mockResolvedValue({}),
      },
      issues: {
        getComment: jest.fn().mockResolvedValue({ data: { body: ACK_COMMENT_BODY } }),
        updateComment: jest.fn().mockResolvedValue({}),
      },
    },
  };
}

const BASE_CONTEXT = { repo: { owner: "dapr", repo: "js-sdk" } };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("copilot_review_cleanup", () => {
  it("is a no-op when there are no open PRs", async () => {
    const github = makeGithub([]);
    await reviewCleanup({ github, context: BASE_CONTEXT });
    expect(github.rest.pulls.update).not.toHaveBeenCalled();
    expect(github.rest.git.deleteRef).not.toHaveBeenCalled();
  });

  it("is a no-op when open PRs are not stale mirror PRs", async () => {
    const github = makeGithub([
      // A regular (non-mirror) PR that is old
      { number: 1, head: { ref: "feature/my-feature" }, created_at: FOUR_HOURS_AGO, body: "" },
      // A mirror PR that is still fresh
      freshMirrorPr(2, 10),
    ]);
    await reviewCleanup({ github, context: BASE_CONTEXT });
    expect(github.rest.pulls.update).not.toHaveBeenCalled();
  });

  it("closes a stale mirror PR and deletes its branch", async () => {
    const github = makeGithub([staleMirrorPr(42, 7, 1234)]);
    await reviewCleanup({ github, context: BASE_CONTEXT });

    expect(github.rest.pulls.update).toHaveBeenCalledWith(
      expect.objectContaining({ pull_number: 42, state: "closed" }),
    );
    expect(github.rest.git.deleteRef).toHaveBeenCalledWith(
      expect.objectContaining({ ref: "heads/copilot/pr-7" }),
    );
  });

  it("edits the ack comment on the original PR with strikethrough around the mirror PR number", async () => {
    const github = makeGithub([staleMirrorPr(42, 7, 1234)]);
    await reviewCleanup({ github, context: BASE_CONTEXT });

    expect(github.rest.issues.getComment).toHaveBeenCalledWith(
      expect.objectContaining({ comment_id: 1234 }),
    );
    expect(github.rest.issues.updateComment).toHaveBeenCalledWith(
      expect.objectContaining({
        comment_id: 1234,
        body: expect.stringContaining("~~#42~~"),
      }),
    );
    // The original #42 plain reference should be replaced, not duplicated
    const updatedBody: string = github.rest.issues.updateComment.mock.calls[0][0].body;
    expect(updatedBody).not.toMatch(/(?<!~)#42(?!~)/);
  });

  it("does not post a new comment — only updates the existing ack comment", async () => {
    // Ensure there's no createComment call (we only updateComment)
    const github = makeGithub([staleMirrorPr(42, 7, 1234)]) as any;
    github.rest.issues.createComment = jest.fn();
    await reviewCleanup({ github, context: BASE_CONTEXT });
    expect(github.rest.issues.createComment).not.toHaveBeenCalled();
  });

  it("skips the ack comment update when no ack comment ID is in the mirror PR body", async () => {
    const github = makeGithub([staleMirrorPr(42, 7)]);
    await reviewCleanup({ github, context: BASE_CONTEXT });

    // Still closes and deletes the branch
    expect(github.rest.pulls.update).toHaveBeenCalled();
    expect(github.rest.git.deleteRef).toHaveBeenCalled();
    // But does NOT attempt to update a comment
    expect(github.rest.issues.updateComment).not.toHaveBeenCalled();
  });

  it("continues to process remaining PRs when closing one fails", async () => {
    const github = makeGithub([staleMirrorPr(42, 7, 1234), staleMirrorPr(43, 8, 2345)]);
    // Make the first close fail
    github.rest.pulls.update = jest
      .fn()
      .mockRejectedValueOnce(new Error("conflict"))
      .mockResolvedValue({});

    await reviewCleanup({ github, context: BASE_CONTEXT });

    // Both PRs should have had a close attempt
    expect(github.rest.pulls.update).toHaveBeenCalledTimes(2);
    // Second PR should still have its branch deleted
    expect(github.rest.git.deleteRef).toHaveBeenCalledWith(
      expect.objectContaining({ ref: "heads/copilot/pr-8" }),
    );
  });

  it("handles multiple stale mirror PRs in a single run", async () => {
    const github = makeGithub([staleMirrorPr(42, 7, 1234), staleMirrorPr(43, 8, 2345)]);
    await reviewCleanup({ github, context: BASE_CONTEXT });

    expect(github.rest.pulls.update).toHaveBeenCalledTimes(2);
    expect(github.rest.git.deleteRef).toHaveBeenCalledTimes(2);
    expect(github.rest.issues.updateComment).toHaveBeenCalledTimes(2);
  });
});
