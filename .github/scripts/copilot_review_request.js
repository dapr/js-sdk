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

// The GitHub team slug (under the repo's org) whose members may trigger Copilot reviews.
const MAINTAINERS_TEAM_SLUG = "maintainers-js-sdk";

module.exports = async ({ github, context }) => {
  const payload = context.payload;
  const actor = context.actor;
  const { owner, repo } = context.repo;

  // Only process comments on pull requests
  if (!payload.issue.pull_request) {
    console.log("[copilot-review-request] Not a PR comment, skipping.");
    return;
  }

  const commentBody = payload.comment.body || "";
  const commentId = payload.comment.id;

  // Only process comments starting with "review:" (case-insensitive)
  const reviewMatch = commentBody.match(/^review:\s*([\s\S]+)/i);
  if (!reviewMatch) {
    return;
  }

  // Only allow members of the maintainers team to trigger reviews
  try {
    const membership = await github.rest.teams.getMembershipForUserInOrg({
      org: owner,
      team_slug: MAINTAINERS_TEAM_SLUG,
      username: actor,
    });
    if (membership.data.state !== "active") {
      console.log(`[copilot-review-request] ${actor} has pending team membership, skipping.`);
      return;
    }
  } catch (e) {
    if (e.status === 404) {
      console.log(`[copilot-review-request] ${actor} is not a member of ${MAINTAINERS_TEAM_SLUG}, skipping.`);
      return;
    }
    throw e;
  }

  // Add "eyes" reaction immediately to signal that the bot is processing the request
  let eyesReactionId = null;
  try {
    const reaction = await github.rest.reactions.createForIssueComment({
      owner,
      repo,
      comment_id: commentId,
      content: "eyes",
    });
    eyesReactionId = reaction.data.id;
    console.log(`[copilot-review-request] Added eyes reaction (id: ${eyesReactionId}).`);
  } catch (e) {
    console.log(`[copilot-review-request] Could not add eyes reaction: ${e.message}`);
  }

  const reviewText = reviewMatch[1].trim();
  const prNumber = payload.issue.number;
  const mirrorBranch = `copilot/pr-${prNumber}`;

  // Guard: if mirror branch already exists, a review is in progress
  try {
    await github.rest.git.getRef({ owner, repo, ref: `heads/${mirrorBranch}` });
    console.log(`[copilot-review-request] Mirror branch ${mirrorBranch} already exists.`);
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: `⏳ A Copilot review is already in progress for this PR (branch \`${mirrorBranch}\` exists). Reviews are automatically cleaned up after 3 hours — please wait before requesting another.`,
    });
    // Remove the eyes reaction since we're not proceeding
    if (eyesReactionId !== null) {
      await github.rest.reactions.deleteForIssueComment({ owner, repo, comment_id: commentId, reaction_id: eyesReactionId }).catch(() => {});
    }
    return;
  } catch (e) {
    if (e.status !== 404) {
      console.log(`[copilot-review-request] Unexpected error checking branch: ${e.message}`);
      throw e;
    }
    // 404 means the branch doesn't exist yet — proceed
  }

  // Fetch the PR to get its head SHA and base branch
  const pr = await github.rest.pulls.get({ owner, repo, pull_number: prNumber });
  const headSha = pr.data.head.sha;
  const baseBranch = pr.data.base.ref;
  const prTitle = pr.data.title;

  // Create the mirror branch pointing at the fork's head commit.
  // GitHub makes the fork's commits available in the base repo via refs/pull/N/head,
  // so the SHA is already present in this repo's object store.
  await github.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${mirrorBranch}`,
    sha: headSha,
  });
  console.log(`[copilot-review-request] Created branch ${mirrorBranch} at ${headSha}.`);

  // Create the mirror PR (body will be updated below with the ack comment ID)
  const mirrorPr = await github.rest.pulls.create({
    owner,
    repo,
    title: `[Copilot Review] #${prNumber}: ${prTitle}`,
    head: mirrorBranch,
    base: baseBranch,
    body: [
      "<!-- copilot-review-mirror -->",
      `> **🤖 Automated mirror PR** created for Copilot review of #${prNumber}.`,
      `> This PR will be automatically closed and the branch deleted after **3 hours**.`,
      "",
      `*Original PR: #${prNumber}*`,
    ].join("\n"),
    draft: false,
  });
  const mirrorPrNumber = mirrorPr.data.number;
  console.log(`[copilot-review-request] Created mirror PR #${mirrorPrNumber}.`);

  // Post the maintainer's review text as a comment directed at @copilot on the mirror PR
  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: mirrorPrNumber,
    body: `<!-- copilot-review-request -->\n@copilot ${reviewText}`,
  });

  // Post the acknowledgement comment on the original PR and capture its ID
  const ackComment = await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: `🔍 Copilot review requested in mirror PR #${mirrorPrNumber}. Results will be posted here when available.\n*(Mirror branch: \`${mirrorBranch}\` — auto-deleted after 3 hours.)*`,
  });
  const ackCommentId = ackComment.data.id;
  console.log(`[copilot-review-request] Posted ack comment (id: ${ackCommentId}) on PR #${prNumber}.`);

  // Update the mirror PR body to embed the ack comment ID so cleanup can edit it later
  await github.rest.pulls.update({
    owner,
    repo,
    pull_number: mirrorPrNumber,
    body: [
      "<!-- copilot-review-mirror -->",
      `<!-- copilot-review-ack-comment-id: ${ackCommentId} -->`,
      `> **🤖 Automated mirror PR** created for Copilot review of #${prNumber}.`,
      `> This PR will be automatically closed and the branch deleted after **3 hours**.`,
      "",
      `*Original PR: #${prNumber}*`,
    ].join("\n"),
  });

  // Remove the eyes reaction now that the workflow has completed
  if (eyesReactionId !== null) {
    try {
      await github.rest.reactions.deleteForIssueComment({ owner, repo, comment_id: commentId, reaction_id: eyesReactionId });
      console.log("[copilot-review-request] Removed eyes reaction.");
    } catch (e) {
      console.log(`[copilot-review-request] Could not remove eyes reaction: ${e.message}`);
    }
  }
};
