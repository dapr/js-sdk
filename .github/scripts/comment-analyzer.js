export default ({ github, context }) => {
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
}