# Bengaluru Maps - Claude Code Instructions

## Workflow: PLAN.mdx (source of truth)

When a task is presented:
1. Produce a numbered checklist of all checkpoints needed to complete it. Include only necessary context for each checkpoint. Avoid code unless strictly required.
2. For the next checkpoint, explain the step and suggested approach in one short paragraph. Wait for explicit user approval ("Proceed" or "Approved") before executing.
3. After implementing a checkpoint, report concise bullet points of what changed and show modified files or commands run. Do not commit.
4. Only perform commits after explicit user approval ("Commit" or "Approve commit"). Committing without explicit approval is forbidden.
5. If uncertain, make a best-effort assumption and continue if safe.

Note: Small steps that are self-explanatory (e.g., renaming variables, installing dependencies) can be bundled together and treated as one checkpoint.

## Git Commit Rules

- Never add "Generated with Claude Code" footer
- Never add "Co-Authored-By: Claude" line
- Use format: `type: description`
  - Types: feat, fix, refactor, docs, test, chore
  - Example: `fix: resolve auth race condition`
- Keep messages concise, focus on the "why" not the "what"
- Use lowercase for descriptions

## Code Standards

- Use TypeScript with strict types
- Prefer functional components with hooks
- Use `useCallback` and `useMemo` for performance optimization
- Handle loading and error states explicitly
- Use upsert patterns for database operations to prevent race conditions

## Security Practices

- Always validate user input
- Use server actions for sensitive operations (like auth)
- Never expose secrets in client-side code
- Use RLS policies in Supabase

## Project Context

- Next.js 16 with React 19
- Supabase for auth and database
- Tailwind CSS + shadcn/ui components
- Two Supabase clients: `supabaseClient.ts` (browser) and `supabaseServer.ts` (server)
