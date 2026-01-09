# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About This Project

**Bengaluru Maps** is a community-driven platform for discovering and sharing the best spots in Bengaluru. Users can create curated collections (maps) of their favorite cafes, restaurants, events, and hidden gems, share them with others, and collaborate with friends to build comprehensive guides.

### Key Features
- **Create Custom Maps**: Build curated collections with rich descriptions and markdown support
- **Contribute Locations**: Anyone can suggest new locations; map owners review and approve additions
- **One-Click Google Maps Import**: Copy-paste a Google Maps link to automatically transfer all locations
- **Interactive Maps**: Powered by OpenStreetMap with a custom rendering layer providing a Google Maps-like experience
- **Upvote Favorites**: Highlight the best spots on each map
- **Email Notifications**: Map owners stay informed when new locations are submitted
- **Secure Authentication**: Sign in with Google for simple, safe access

The platform solves the problem of curated location recommendations being scattered across WhatsApp groups and personal Google Maps lists by creating one unified, shareable directory.

## Git Commit Rules

- Never add "Generated with Claude Code" footer
- Never add "Co-Authored-By: Claude" line
- Use format: `type: description`
  - Types: feat, fix, refactor, docs, test, chore
  - Example: `fix: resolve auth race condition`
- Keep messages concise, focus on the "why" not the "what"
- Use lowercase for descriptions

## Commands

### Development
```bash
npm run dev           # Start Next.js dev server on port 3000
npm run build         # Build for production
npm start             # Start production server
npm run lint          # Run ESLint
```

### Database
```bash
supabase db push      # Apply migrations in order to Supabase
```

### Utilities
```bash
npm run check-links          # Check for broken links in deployed environment
npm run check-links:dev      # Check for broken links in development environment
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 with React 19 (App Router)
- **Language**: TypeScript (strict mode)
- **Authentication**: Supabase Auth (Google OAuth)
- **Database**: Supabase (PostgreSQL) with Row-Level Security (RLS) policies
- **Maps**: OpenStreetMap via Leaflet + custom React Leaflet components
- **Styling**: Tailwind CSS with design system tokens (custom colors, spacing, typography scales defined in `tailwind.config.ts`)
- **UI Components**: shadcn/ui (Radix UI primitives) + custom components
- **Forms**: React Hook Form + Zod validation
- **Markdown**: MDXEditor (for editing), React Markdown + remark-gfm (for rendering)
- **Email**: Resend for transactional emails

### Directory Structure
- `/app` - Next.js App Router (pages, layouts, server components)
- `/components` - UI components organized by category:
  - `/ui` - shadcn/ui components (buttons, dialogs, forms, etc.)
  - `/custom-ui` - project-specific components (Header, CafeCard, ShareButton, etc.)
  - `/map` - map-related components (OSMMap, LocationCard, dialogs)
  - `/auth` - authentication components
  - `/markdown` - markdown editor/renderer
- `/lib` - Utility functions and shared logic:
  - `/supabase` - Supabase service layer (mapsService, locationService, userService, etc.) and server actions
  - `/supabase/api` - Supabase client initialization and typed server actions
  - `/context` - React context providers (UserLocationContext, PendingCountContext)
  - `/hooks` - Custom React hooks (useUserInfo, useGeolocation, useToast)
  - `/actions` - Server actions for auth operations
  - `/auth` - Auth utility functions
  - `/services` - Business logic services (emailService, googleMapsListService)
  - `/utils` - Utilities (slugify, distance calculations, image processing, auth helpers)
  - `/validations` - Zod schemas for form validation
  - `/types` - TypeScript type definitions
  - `/constants` - Static data (onboarding content)
- `/public` - Static assets

### Key Architectural Patterns

#### 1. Supabase Clients
Two separate client instances for different contexts:
- `supabaseClient.ts` - Browser client for client-side operations (useCallback within useEffect, etc.)
- `supabaseServer.ts` - Server client for server components and server actions (securely uses auth context)

#### 2. Server Actions Pattern
Sensitive operations use server actions in `/lib/supabase/api/*Action.ts`:
- `createMapAction` - Map creation with auth check
- `createLocationAction` - Location submission with auto-approval logic
- `toggleLocationUpvoteAction` - Location voting
- `collaboratorActions` - Invitation and permission management
- `deleteLocationAction` - Permission-checked deletion
- `updateMapAction` - Map updates with ownership verification

These actions never expose user IDs to clients; they derive `user.id` from server-side auth via `supabase.auth.getUser()`.

#### 3. Service Layer
Business logic is separated in `/lib/supabase/*Service.ts`:
- `mapsService.ts` - Map CRUD, queries with joins for location counts, contributors, upvotes
- `locationService.ts` - Location operations
- `userService.ts` - User profile operations
- `votesService.ts` - Upvote/vote management
- `collaboratorService.ts` - Collaboration features
- `mapSubmissionService.ts` - Pending submissions
- `googleMapsListService.ts` - Google Maps import logic

Services perform complex queries, aggregate data across tables, and use RPC functions for calculations (e.g., `get_maps_sorted_by_upvotes`, `get_location_vote_counts`).

#### 4. Data Fetching Strategy
- **Homepage**: Uses ISR with `revalidate = 60` for cached, periodic updates
- **Map pages**: Dynamic rendering with suspense boundaries and proper error states
- **Upvote counts**: Fetched via RPC functions for efficient aggregation
- **User-specific data** (hasUpvoted, pending count): Fetched at page render with userId context

#### 5. Image Handling
`ImageProcessor` utility in `/lib/utils/images.ts` handles:
- Image upload to Supabase Storage
- URL generation with access tokens
- File type validation

Configured remote patterns in `next.config.ts` for Vercel Storage, Supabase, Google Maps, and Google User Content.

#### 6. Authentication Flow
- Google OAuth via Supabase Auth
- Server-side user fetching in layouts and pages
- Session state in cookies (managed by Supabase SSR library)
- `/app/auth/callback/route.ts` - OAuth callback handler

#### 7. Forms and Validation
- React Hook Form for form state management
- Zod schemas in `/lib/validations/auth.ts` for runtime validation
- Form submission uses server actions for security
- FormData API for file uploads (avoid JSON for binary data)

### Database Schema
Key tables (see `/supabase/migrations/` for schema details):
- `maps` - Map documents with owner, slug, description
- `locations` - Map locations with creator, coordinates, approval status
- `users` - User profiles (first_name, last_name, picture_url from OAuth)
- `map_collaborators` - Collaborators with invite tokens
- `votes` - Map upvotes
- `location_votes` - Location upvotes

All tables have RLS policies enforced at the Supabase layer. Server actions receive the supabase client to ensure RLS context applies.

### Design System
Defined in `tailwind.config.ts`:
- **Colors**: Brand orange (#FF6A00) with hover variant, slate text colors, 5-step grayscale
- **Typography**: Premium scale with h1/h2/h3 headings, body text, and captions (sizes, line heights, letter spacing)
- **Spacing**: xs/sm/md/lg/xl/2xl/3xl/4xl tokens + layout-specific sizes
- **Border radius**: card (12px), button (8px), image (8px), pill (9999px)
- **Shadows**: Subtle card/card-hover/dropdown/button shadows
- **Z-index**: header (100), modal (200), tooltip (300)
- **Animations**: fade-in/out, slide-up/down, spin-slow (defined keyframes)

### Email Service
Resend integration in `/lib/services/emailService.ts`:
- Sends HTML emails on location submission to map owners
- Email API route at `/app/api/email/route.ts`
- Includes approval/rejection links: `/api/email/approve` and `/api/email/reject`

### Google Maps Integration
- Uses Google Places API for location search and autocomplete
- Google Maps List importer extracts locations from shared Google Maps lists
- Converts to OpenStreetMap coordinates

## Code Standards

### TypeScript
- Use TypeScript with strict types (`"strict": true` in tsconfig.json)
- Types defined in `/lib/types/mapTypes.ts` and `/lib/types/userTypes.ts`
- Use explicit return types on functions

### React
- Prefer functional components with hooks
- Destructure props in component signatures
- Use `useCallback` and `useMemo` for performance optimization in client components
- Handle loading and error states explicitly
- Wrap expensive logic in Suspense boundaries (with proper fallbacks)

### Database Operations
- Use upsert patterns for database operations to prevent race conditions
- For DDL changes, use `mcp__supabase__apply_migration` tool instead of writing migration files
- Use `mcp__supabase__execute_sql` for executing raw SQL queries
- Use `mcp__supabase__get_advisors` to check for security vulnerabilities
- Use `mcp__supabase__list_tables`, `mcp__supabase__list_migrations` to inspect schema
- Always include userId in server actions and check it against the authenticated user
- RLS policies enforce row-level security; do not bypass with service role keys on client paths
- This ensures changes are applied directly to the production database and tracked properly

### Error Handling
- Return structured error objects: `{ success: boolean, error: string | null, data?: T }`
- Log errors to console but present user-friendly messages in UI
- Use toast notifications for non-critical errors
- Don't swallow auth errors; let them bubble up for redirect handling

### File Organization
- Keep related code close (component + its hooks in same folder if possible)
- Separate business logic from UI (service layer pattern)
- Use `/lib` for anything not tied to a specific page route

## Design System & Style Guide

**IMPORTANT**: Always follow the design system defined in `/docs/style-guide.md`. Refer to the full guide for comprehensive patterns.

### Colors
```
Primary Orange: #FF6A00 (hover: #E55F00) - Main CTAs only
Primary Blue:   #3b82f6 (hover: #1d4ed8) - Secondary CTAs, selected states, info
Grayscale: 900 (#111), 700 (#444), 500 (#777), 300 (#ddd), 100 (#f5f5f5)
```

### Typography Scale
```
H1: 28px semibold  (page titles)
H2: 22px semibold  (section headings)
H3: 18px medium    (card titles, subsections)
Body: 15px regular (default text)
Small: 13px regular (metadata)
Caption: 12px regular (hints)

Responsive: Use text-xs md:text-sm for responsive sizing
```

### Spacing System
```
xs: 4px, sm: 8px, md: 12px, lg: 16px, xl: 24px, 2xl: 32px, 3xl: 48px, 4xl: 64px
Responsive: Use p-3 md:p-4 lg:p-6 for padding adjustments
```

### Button System
```
PRIMARY (Orange):    h-11 px-6 rounded-lg bg-[#FF6A00] hover:bg-[#E55F00] text-white
SECONDARY (Blue):    h-11 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white
OUTLINE:             h-11 px-6 rounded-lg border border-gray-300 text-gray-700
TERTIARY:            h-11 px-6 rounded-lg text-gray-500 hover:bg-gray-100
TEXT LINK:           text-blue-600 hover:text-blue-700 (wrap in button for 44px touch target on mobile)
ICON BUTTON:         h-10 w-10 (h-11 w-11 on mobile), rounded-lg, 20x20px icon inside

CRITICAL:
  - All touch targets >= 44x44px (h-11)
  - All buttons: rounded-lg (8px), NOT rounded-xl
  - Orange for primary actions only (one per section max)
  - Blue for secondary, suggestion, and external link actions
```

### When to Use Orange vs Blue
```
ORANGE (#FF6A00):
  ✓ Primary CTA (Submit, Create, Save)
  ✓ Main action user expects
  ✗ Never more than one prominent orange per section

BLUE (#3b82f6):
  ✓ Secondary/alternative actions
  ✓ "Suggest", "Add", "Contribute" actions
  ✓ Selected/active states (bg-blue-50/50 border-blue-200)
  ✓ External links (View on Maps)
  ✓ Information boxes (bg-blue-50 border-blue-100)
```

### Mobile-First Rules
1. **Single column by default** - Add md:/lg: for multi-column on larger screens
2. **Responsive text** - Use text-xs md:text-sm for labels, text-lg md:text-xl for headings
3. **Responsive spacing** - Use p-3 md:p-4 lg:p-6 for padding adjustments
4. **Touch targets** - All interactive elements >= 44x44px
5. **Bottom sheets** - Use full-width bottom sheet on mobile instead of fixed sidebars
6. **Readable text** - Never smaller than 12px (caption), prefer 14px+ on mobile

### Common Patterns
- **Cards**: border rounded-xl p-4 md:p-6, hover shadow-md scale(1.01)
- **Images**: aspect-[16/9] rounded-lg md:rounded-xl object-cover
- **Selected state**: bg-blue-50/50 border-blue-200 shadow-sm (blue, never orange)
- **Info boxes**: bg-blue-50 border-blue-100 p-4 md:p-6 rounded-xl
- **User attribution**: [Avatar h-8 w-8] + [Name text] with gap-2

### What NOT to Do
❌ Don't hardcode text sizes (use responsive scale: text-xs md:text-sm)
❌ Don't use rounded-xl (12px) for buttons - use rounded-lg (8px)
❌ Don't make buttons smaller than h-11 (44px minimum)
❌ Don't use orange for non-primary actions
❌ Don't use orange for selected states (use blue)
❌ Don't create new colors (use grayscale + brand orange/blue)
❌ Don't forget responsive classes (sm:/md:/lg: for text and spacing)

## Security Practices

- Always validate user input on both client and server
- Use server actions for sensitive operations (like auth, data mutations, permission checks)
- Never expose secrets in client-side code (API keys, database credentials, tokens)
- Use RLS policies in Supabase to enforce row-level security at the database layer
- Verify user ownership/permissions server-side before allowing modifications
- Derive user IDs from server-side authentication (`supabase.auth.getUser()`) rather than client input
- Do not bypass RLS with service role keys on publicly accessible endpoints
- Sanitize and validate all user-submitted content before storing in database

## Environment Variables
Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_SITE_URL=
RESEND_API_KEY=  # For email sending
```

## Performance Considerations
- Map pages use dynamic rendering with suspense
- Homepage uses ISR (revalidate: 60)
- Images optimized with Next.js Image component and responsive patterns
- Prefetch first 3 maps on homepage for UX
- RPC functions for aggregations instead of client-side calculations
- Cookie-based session to avoid OAuth roundtrips

## Testing the Build
```bash
npm run build
npm start
# Test at http://localhost:3000
```

If you encounter TypeScript errors:
```bash
npx tsc --noEmit
```

## Important Patterns

### Permission Checks
Always verify ownership/permissions server-side:
```typescript
const { data: map } = await supabase.from("maps").select("owner_id").eq("id", mapId).single()
if (map.owner_id !== userId) throw new Error("Unauthorized")
```

### Slug Handling
- Generated from title via `slugify()` or `generateUniqueSlug()`
- Validated against reserved slugs (checked in both browser and server)
- Used as public URL identifier (`/maps/[slug]`)

### Collaborators
- Managed via `map_collaborators` table with invite tokens
- Collaborators can be added/removed by map owner
- Displayed alongside owner in contributor lists

### Location Approval
- Auto-approved if creator is map owner
- Pending if submitted by non-owner (requires approval email flow)
- Approval/rejection links in emails trigger database updates

## Project Context

### Key Tech Stack Details
- **Next.js 16** with React 19 and App Router
- **Supabase** for authentication and database (PostgreSQL)
- **Tailwind CSS** with shadcn/ui components for styling and UI
- **Two Supabase Clients**:
  - `supabaseClient.ts` - Browser/client-side client used in React components with hooks
  - `supabaseServer.ts` - Server-side client used in server components and server actions, has access to authenticated user context

Always use the appropriate client for the context (server vs. browser). Server actions must use the server client to ensure RLS policies are properly applied with user authentication context.
