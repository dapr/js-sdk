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

const TTL_HOURS = 3;

module.exports = async ({ github, context }) => {
  const { owner, repo } = context.repo;
  const cutoff = new Date(Date.now() - TTL_HOURS * 60 * 60 * 1000);

  console.log(`[copilot-review-cleanup] Looking for mirror PRs created before ${cutoff.toISOString()}.`);

  // Fetch all open PRs (paginated)
  const openPrs = await github.paginate(github.rest.pulls.list, {
    owner,
    repo,
    state: "open",
    per_page: 100,
  });

  const mirrorPrs = openPrs.filter(
    (pr) => pr.head.ref.startsWith("copilot/pr-") && new Date(pr.created_at) < cutoff,
  );

  if (mirrorPrs.length === 0) {
    console.log("[copilot-review-cleanup] No stale mirror PRs found.");
    return;
  }

  for (const pr of mirrorPrs) {
    const mirrorBranch = pr.head.ref;
    const mirrorPrNumber = pr.number;
    const match = mirrorBranch.match(/^copilot\/pr-(\d+)$/);
    const origPrNumber = match ? parseInt(match[1], 10) : null;

    console.log(`[copilot-review-cleanup] Cleaning up mirror PR #${mirrorPrNumber} (branch: ${mirrorBranch}).`);

    // Close the mirror PR
    try {
      await github.rest.pulls.update({
        owner,
        repo,
        pull_number: mirrorPrNumber,
        state: "closed",
      });
      console.log(`[copilot-review-cleanup] Closed mirror PR #${mirrorPrNumber}.`);
    } catch (e) {
      console.log(`[copilot-review-cleanup] Failed to close PR #${mirrorPrNumber}: ${e.message}`);
    }

    // Delete the mirror branch
    try {
      await github.rest.git.deleteRef({ owner, repo, ref: `heads/${mirrorBranch}` });
      console.log(`[copilot-review-cleanup] Deleted branch ${mirrorBranch}.`);
    } catch (e) {
      console.log(`[copilot-review-cleanup] Failed to delete branch ${mirrorBranch}: ${e.message}`);
    }

    // Parse the ack comment ID from the mirror PR body and edit it with strikethrough
    if (origPrNumber && pr.body) {
      const ackIdMatch = pr.body.match(/<!--\s*copilot-review-ack-comment-id:\s*(\d+)\s*-->/);
      if (ackIdMatch) {
        const ackCommentId = parseInt(ackIdMatch[1], 10);
        try {
          const ackComment = await github.rest.issues.getComment({ owner, repo, comment_id: ackCommentId });
          // Wrap the mirror PR reference with strikethrough to show it no longer exists
          const updatedBody = ackComment.data.body.replace(
            new RegExp(`#${mirrorPrNumber}\\b`),
            `~~#${mirrorPrNumber}~~`,
          );
          await github.rest.issues.updateComment({ owner, repo, comment_id: ackCommentId, body: updatedBody });
          console.log(`[copilot-review-cleanup] Updated ack comment ${ackCommentId} on PR #${origPrNumber}.`);
        } catch (e) {
          console.log(`[copilot-review-cleanup] Failed to update ack comment on PR #${origPrNumber}: ${e.message}`);
        }
      } else {
        console.log(`[copilot-review-cleanup] No ack comment ID found in mirror PR #${mirrorPrNumber} body.`);
      }
    }
  }
};
