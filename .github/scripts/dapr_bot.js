// list of owner who can control dapr-bot workflow.
// TODO: Read owners from OWNERS file.
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
    "shubham1172"
];

/**
 * Execute fn if label exists on an issue.
 * @param {*} github GitHub object reference
 * @param {*} issue GitHub issue reference
 * @param {*} label label name
 * @param {*} fn async function
 */
 async function executeIfIssueHasLabel(github, issue, label, fn) {
    const response = await github.issues.listLabelsOnIssue({
        issue_number: issue.number,
        owner: issue.owner,
        repo: issue.repo,
    });

    const labelNames = response.data.map((i) => i.name);
    if (labelNames.indexOf(label) > -1) {
        await fn();
    }
}

/**
 * Assign an issue to assignee.
 * @param {*} github GitHub object reference
 * @param {*} context GitHub action context
 * @param {boolean} isPullRequest is the workflow triggered by a pull request?
 */
async function executeAssign(github, context, isPullRequest) {
    const issue = context.issue;

    if (isPullRequest) {
        console.log("[executeAssign] pull requests unsupported, skipping command execution.");
        return;
    } else if (issue.assignees && issue.assignees.length !== 0) {
        console.log("[executeAssign] issue already has assignees, skipping command execution.");
        return;
    }

    await github.issues.addAssignees({
        owner: issue.owner,
        repo: issue.repo,
        issue_number: issue.number,
        assignees: [context.actor],
    });
}

/**
 * Add a label to the issue indicating that it needs the author's feedback.
 * @param {*} github GitHub object reference
 * @param {*} context GitHub action context
 * @param {boolean} isPullRequest is the workflow triggered by a pull request?
 * @returns 
 */
async function executePingAuthor(github, context, isPullRequest) {
    const issue = context.issue;

    if (isPullRequest) {
        console.log("[executePingAuthor] pull requests unsupported, skipping command execution.");
        return;
    } else if (owners.indexOf(context.actor) < 0) {
        console.log("[executePingAuthor] user does not have privilege, skipping command execution.");
        return;
    }

    // if there is a 'needs-team-attention' label, remove it.
    await executeIfIssueHasLabel(github, issue, 'needs-team-attention', async () => {
        await github.issues.removeLabel({
            issue_number: issue.number,
            owner: issue.owner,
            repo: issue.repo,
            name: 'needs-team-attention'
        });
    });

    // Add new label
    await github.issues.addLabels({
        issue_number: issue.number,
        owner: issue.owner,
        repo: issue.repo,
        labels: ['needs-author-feedback']
    });
}

/**
 * Trigger e2e tests for pull request
 * @param {*} github GitHub object reference
 * @param {*} context GitHub action context
 * @param {boolean} isPullRequest is the workflow triggered by a pull request?
 */
async function executeEndToEndTests(github, context, isPullRequest) {
    const issue = context.issue;

    if (!isPullRequest) {
        console.log("[executeEndToEndTests] issues unsupported, skipping command execution.");
        return;
    } else if (owners.indexOf(context.actor) < 0) {
        console.log("[executeEndToEndTests] user does not have privilege, skipping command execution.");
        return;
    }

    // Get pull request
    const pull = await github.pulls.get({
        owner: issue.owner,
        repo: issue.repo,
        pull_number: issue.number
    });

    if (pull && pull.data) {
         // Get commit id and repo from pull head
         const clientPayload = {
            pull_head_ref: pull.data.head.sha,
            pull_head_repo: pull.data.head.repo.full_name,
            command: "ok-to-e2e-test",
            issue: issue,
          };

        // Fire repository_dispatch event to trigger e2e test
        await github.repos.createDispatchEvent({
            owner: issue.owner,
            repo: issue.repo,
            event_type: "e2e-test",
            client_payload: clientPayload,
        });

        console.log(`[executeEndToEndTests] triggered E2E tests for ${JSON.stringify(clientPayload)}.`);
    }
}


module.exports = async ({ github, context }) => {
    const payload = context.payload;
    const issue = context.issue;
    const isFromPulls = !!payload.issue.pull_request;
    const commentBody = payload.comment.body;

    if (!commentBody) {
        console.log("[main] comment body not found, exiting.");
        return;
    }

    // the author of this issue is interacting with it
    if (!isFromPulls && context.actor == issue.owner) {
        // if there is a 'needs-author-feedback' label,
        // replace it with 'needs-team-attention' label.
        await executeIfIssueHasLabel(github, issue, 'needs-author-feedback', async () => {
            await github.issues.removeLabel({
                issue_number: issue.number,
                owner: issue.owner,
                repo: issue.repo,
                name: 'needs-author-feedback'
            });
            await github.issues.addLabels({
                issue_number: issue.number,
                owner: issue.owner,
                repo: issue.repo,
                labels: ['needs-team-attention']
            });
        });
    }

    switch (commentBody) {
        case "/assign":
            executeAssign(github, context, isFromPulls);
            break;
        case "/ping-author":
            executePingAuthor(github, context, isFromPulls);
            break;
        case "/ok-to-e2e-test":
            executeEndToEndTests(github, context, isFromPulls);
            break;
        default:
            console.log(`[main] command ${commentBody} not found, exiting.`);
            break;
    }
};