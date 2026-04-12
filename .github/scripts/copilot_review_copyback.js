//
// Copyright 2022 The Dapr Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

/**
 * Escapes backslashes and backticks in a string so it is safe to use inside a markdown code span.
 */
function escapeCodeSpan(str) {
  return str.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
}

/**
 * Returns true when the given GitHub login belongs to Copilot.
 * Copilot's bot account name may vary (e.g. "copilot-pull-request-reviewer[bot]"),
 * so we use a case-insensitive substring match on "copilot".
 */
function isCopilotUser(login) {
  return login.toLowerCase().includes("copilot");
}

/**
 * Extracts the original PR number from a mirror branch name of the form
 * "copilot/pr-{N}". Returns null if the branch doesn't match.
 */
function originalPrNumber(headRef) {
  const match = headRef.match(/^copilot\/pr-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

module.exports = async ({ github, context }) => {
  const { owner, repo } = context.repo;
  const eventName = context.eventName;
  const payload = context.payload;

  let headRef, mirrorPrNumber, copyBody, sourceUrl;

  if (eventName === "pull_request_review") {
    // A review was submitted on a pull request
    const review = payload.review;
    const pr = payload.pull_request;
    headRef = pr.head.ref;

    if (!headRef.startsWith("copilot/pr-")) return;
    if (!isCopilotUser(review.user.login)) {
      console.log(`[copilot-review-copyback] Skipping review from ${review.user.login}.`);
      return;
    }
    if (!review.body || review.body.trim() === "") {
      // No review summary body; inline comments arrive via pull_request_review_comment
      console.log("[copilot-review-copyback] Review body is empty, skipping.");
      return;
    }

    mirrorPrNumber = pr.number;
    copyBody = review.body;
    sourceUrl = review.html_url;
  } else if (eventName === "pull_request_review_comment") {
    // A single inline review comment was posted
    const comment = payload.comment;
    const pr = payload.pull_request;
    headRef = pr.head.ref;

    if (!headRef.startsWith("copilot/pr-")) return;
    if (!isCopilotUser(comment.user.login)) {
      console.log(`[copilot-review-copyback] Skipping comment from ${comment.user.login}.`);
      return;
    }

    mirrorPrNumber = pr.number;
    // Include the file path so the comment makes sense without diff context
    copyBody = `**\`${escapeCodeSpan(comment.path)}\`**\n\n${comment.body}`;
    sourceUrl = comment.html_url;
  } else if (eventName === "issue_comment") {
    // A regular (non-review) comment was posted on a PR
    const comment = payload.comment;
    const issue = payload.issue;

    if (!issue.pull_request) return; // Not a PR
    if (!isCopilotUser(comment.user.login)) {
      console.log(`[copilot-review-copyback] Skipping comment from ${comment.user.login}.`);
      return;
    }

    // Look up the PR's head branch to confirm it is a mirror PR
    let pr;
    try {
      pr = await github.rest.pulls.get({ owner, repo, pull_number: issue.number });
    } catch (e) {
      console.log(`[copilot-review-copyback] Could not fetch PR #${issue.number}: ${e.message}`);
      return;
    }
    headRef = pr.data.head.ref;
    if (!headRef.startsWith("copilot/pr-")) return;

    mirrorPrNumber = issue.number;
    copyBody = comment.body;
    sourceUrl = comment.html_url;
  } else {
    return;
  }

  const origPrNumber = originalPrNumber(headRef);
  if (!origPrNumber) {
    console.log(`[copilot-review-copyback] Could not parse original PR number from ${headRef}.`);
    return;
  }

  // Post Copilot's content to the original PR with attribution
  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: origPrNumber,
    body: [
      `**🤖 Copilot Review** *(via [mirror PR #${mirrorPrNumber}](${sourceUrl}))*`,
      "",
      copyBody,
    ].join("\n"),
  });
  console.log(
    `[copilot-review-copyback] Copied ${eventName} from mirror PR #${mirrorPrNumber} to original PR #${origPrNumber}.`,
  );
};
