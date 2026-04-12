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

// List of maintainers who can trigger the Copilot review workflow.
// Keep in sync with the owners list in dapr_bot.js.
const owners = [
  "yaron2",
  "youngbupark",
  "Haishi2016",
  "lukekim",
  "amanbha",
  "msfussell",
  "shalabhms",
  "LMWF",
  "artursouza",
  "vinayada1",
  "mukundansundar",
  "wcs1only",
  "orizohar",
  "pruthvidhodda",
  "mchmarny",
  "tcnghia",
  "berndverst",
  "halspang",
  "tanvigour",
  "dmitsh",
  "pkedy",
  "CodeMonkeyLeet",
  "XavierGeerinck",
  "amulyavarote",
  "shubham1172",
  "whitwaldo",
];

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

  // Only process comments starting with "review:" (case-insensitive)
  const reviewMatch = commentBody.match(/^review:\s*([\s\S]+)/i);
  if (!reviewMatch) {
    return;
  }

  // Only allow maintainers to trigger reviews
  if (!owners.includes(actor)) {
    console.log(`[copilot-review-request] ${actor} is not a maintainer, skipping.`);
    return;
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
    return;
  } catch (e) {
    if (e.status !== 404) throw e;
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

  // Create the mirror PR
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

  // Attempt to request Copilot as a reviewer
  try {
    await github.rest.pulls.requestReviewers({
      owner,
      repo,
      pull_number: mirrorPrNumber,
      reviewers: ["copilot"],
    });
    console.log("[copilot-review-request] Requested copilot as reviewer.");
  } catch (e) {
    console.log(`[copilot-review-request] Could not add copilot as reviewer: ${e.message}`);
  }

  // Post the maintainer's review text as a comment directed at @copilot
  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: mirrorPrNumber,
    body: `<!-- copilot-review-request -->\n@copilot ${reviewText}`,
  });

  // Acknowledge the request on the original PR
  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: `🔍 Copilot review requested in mirror PR #${mirrorPrNumber}. Results will be posted here when available.\n*(Mirror branch: \`${mirrorBranch}\` — auto-deleted after 3 hours.)*`,
  });
};
