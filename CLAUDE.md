# Bengaluru Maps - Claude Code Instructions

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
