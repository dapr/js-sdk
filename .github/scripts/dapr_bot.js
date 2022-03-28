export default async ({github, context}) => {
    // list of owner who can control dapr-bot workflow
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

    const payload = context.payload;
    const issue = context.issue;
    const isFromPulls = !!payload.issue.pull_request;
    const commentBody = payload.comment.body;
    if (!isFromPulls && commentBody && commentBody.indexOf("/assign") == 0) {
        if (!issue.assignees || issue.assignees.length === 0) {
            await github.issues.addAssignees({
                owner: issue.owner,
                repo: issue.repo,
                issue_number: issue.number,
                assignees: [context.actor],
            })
        }
        return;
    }

    // the author of this issue is interacting with it
    if (!isFromPulls && context.actor == issue.owner) {
        // if there is a 'needs-author-feedback' label,
        // replace it with 'needs-team-attention' label.
        var labels = await github.issues.listLabelsOnIssue({
            issue_number: issue.number,
            owner: issue.owner,
            repo: issue.repo,
        });
        labels.forEach(label => {
            if (label.name == 'needs-author-feedback') {
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
                })
            }
        });
    }

    // actions above this check are enabled for everyone.
    if (owners.indexOf(context.actor) < 0) {
        return;
    }

    // Pollyfill: register createDispatchEvent because actions/github-script@0.3.0 
    // does not have createDispatchEvent.
    github.registerEndpoints({
        repos: {
            createDispatchEvent: {
                "headers": { "accept": "application/vnd.github.everest-preview+json" },
                "method": "POST",
                "params": {
                    "client_payload": { "type": "object" },
                    "event_type": { "type": "string" },
                    "owner": { "required": true, "type": "string" },
                    "repo": { "required": true, "type": "string" }
                },
                "url": "/repos/:owner/:repo/dispatches"
            }
        }
    });

    if (!isFromPulls && commentBody) {
        if (commentBody.indexOf("/ok-to-e2e-test") == 0) {
            // Get pull request
            const pull = await github.pulls.get({
                owner: issue.owner,
                repo: issue.repo,
                pull_number: issue.number
            });
            if (pull && pull.data) {
                // Get commit id and repo from pull head
                const testPayload = {
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
                    client_payload: testPayload,
                });

                console.log(`Trigger E2E test for ${JSON.stringify(testPayload)}`);
            }
        } else if (commentBody.indexOf("/ping-author") == 0) {
            // Delete the label if exists
            await github.issues.removeLabel({
                issue_number: issue.number,
                owner: issue.owner,
                repo: issue.repo,
                name: 'needs-team-attention'
            });
            // Add new label
            await github.issues.addLabels({
                issue_number: issue.number,
                owner: issue.owner,
                repo: issue.repo,
                labels: ['needs-author-feedback']
            })
            return;
        }
    }
}