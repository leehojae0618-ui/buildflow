# RECIPE-FIRST-BUILD-PACKAGE-001 Task

## Contract

```text
Recipe recommendation -> user selection -> engine recommendation or choice
-> BuildPackage -> Connection / Configuration / Test Plan -> future Live E2E.
```

BuildPackage statuses are only `DRAFT`, `CONNECTION_REQUIRED`, and
`READY_FOR_BUILD`. No deployed, running, connected, credential-stored, or
externally-executed state is produced by this Sprint.

## Acceptance Cases

1. Daily AI news summary to Slack.
2. Important email alert to Slack.
3. Meeting summary to Notion.
4. New customer inquiry classification to Google Sheets.

Each must support Recipe selection, an engine candidate, BuildPackage,
ConnectionPlan, missing-information, TestPlan, and no external action.
