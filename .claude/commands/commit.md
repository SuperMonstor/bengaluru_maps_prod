---
description: Commit changes with proper format (no Claude footer)
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(git log:*)
---

Stage and commit all changes following project conventions.

Rules:
- Do NOT add "Generated with Claude Code" footer
- Do NOT add "Co-Authored-By: Claude" line
- Use format: `type: description`
- Types: feat, fix, refactor, docs, test, chore
- Keep description lowercase and concise

Steps:
1. Run `git status` and `git diff` to understand changes
2. Stage relevant files with `git add`
3. Create commit with the message provided, or generate an appropriate one based on changes

Commit message: $ARGUMENTS
