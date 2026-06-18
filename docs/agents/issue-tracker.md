# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues in **`cliftonc/drizzle-cube`**. Use the `gh` CLI for all operations.

> This clone has a single `origin` pointing at `cliftonc/drizzle-cube`, so `gh` infers the repo automatically. Passing `-R cliftonc/drizzle-cube` explicitly is still the safest habit if another remote is ever added.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

## When a skill says "publish to the issue tracker"

Create a GitHub issue in `cliftonc/drizzle-cube`.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.
