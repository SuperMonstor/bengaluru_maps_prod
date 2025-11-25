# Slug Migration Checklist: From `/maps/[slug]/[id]` to `/maps/[slug]`

**Goal**: Migrate from dual-parameter URLs to slug-only URLs for cleaner, more SEO-friendly links.

**Estimated Time**: 7-10 days
**Risk Level**: HIGH
**Files to Change**: 20 total (13 modify, 4 move, 3 create)

---

## Phase 1: Database Preparation (Day 1)

### Data Audit
- [ ] Run SQL query to check for duplicate slugs
- [ ] Run SQL query to find NULL slugs
- [ ] Count total maps vs unique slugs

### Data Migration
- [ ] Create migration script at `scripts/migrate-slugs.ts`
- [ ] Test migration script on local/dev database
- [ ] Verify all slugs are unique after migration
- [ ] Review any slug conflicts that were auto-resolved

### Database Schema Changes
- [ ] Add unique constraint on `maps.slug` column
- [ ] Create index on `maps.slug` column for performance
- [ ] Test that constraint works (try inserting duplicate)
- [ ] Backup database before proceeding

**Risk**: HIGH - Test thoroughly on staging first

---

## Phase 2: Add Validation Functions (Day 2)

### Slug Validation
- [ ] Add `validateSlug()` function to `lib/utils/slugify.ts`
  - Check for empty slugs
  - Check length (max 100 chars)
  - Check format (lowercase, numbers, hyphens only)
  - Check no leading/trailing hyphens
- [ ] Add `isReservedSlug()` function to `lib/utils/slugify.ts`
  - List: `create-map`, `api`, `new`, `edit`, `submit`, `pending`, `admin`, `settings`

### API Endpoint
- [ ] Create `app/api/maps/check-slug/route.ts`
- [ ] Implement GET endpoint to check if slug exists
- [ ] Test endpoint returns correct availability status

**Risk**: LOW

---

## Phase 3: Service Layer Changes (Day 3)

### New Functions
- [ ] Create `getMapBySlug()` function in `lib/supabase/mapsService.ts`
  - Query by `slug` instead of `id`
  - Return same data structure as `getMapById`
  - Include error handling
- [ ] Test `getMapBySlug()` with existing maps

### Update Existing Functions
- [ ] Update `createMap()` in `lib/supabase/mapsService.ts` (line 65)
  - Fetch all existing slugs from database
  - Use `generateUniqueSlug()` instead of `slugify()`
  - Handle uniqueness conflicts
- [ ] Decide: Should `updateMap()` regenerate slug when title changes?
  - [ ] Option A: Keep original slug (recommended)
  - [ ] Option B: Regenerate slug (breaks bookmarks)
- [ ] Test map creation with duplicate titles
- [ ] Test slug uniqueness enforcement

**Risk**: HIGH - Core functionality changes

---

## Phase 4: Route Structure Changes (Day 4)

### Move Files
- [ ] Move `app/maps/[slug]/[id]/page.tsx` → `app/maps/[slug]/page.tsx`
- [ ] Move `app/maps/[slug]/[id]/ClientMapPageComponent.tsx` → `app/maps/[slug]/ClientMapPageComponent.tsx`
- [ ] Move `app/maps/[slug]/[id]/edit/page.tsx` → `app/maps/[slug]/edit/page.tsx`
- [ ] Move `app/maps/[slug]/[id]/submit/page.tsx` → `app/maps/[slug]/submit/page.tsx`
- [ ] Delete empty `app/maps/[slug]/[id]/` directory

### Update TypeScript Interfaces
- [ ] Change `params: Promise<{ slug: string; id: string }>` to `params: Promise<{ slug: string }>` in:
  - [ ] `app/maps/[slug]/page.tsx`
  - [ ] `app/maps/[slug]/edit/page.tsx`
  - [ ] `app/maps/[slug]/submit/page.tsx`

### Update Route Parameter Usage
- [ ] In `app/maps/[slug]/page.tsx`:
  - [ ] Change `const { slug, id } = resolvedParams` to `const { slug } = resolvedParams`
  - [ ] Replace `getMapById(id)` with `getMapBySlug(slug)`
  - [ ] Remove slug validation/redirect logic (lines 143-175)
- [ ] In `app/maps/[slug]/edit/page.tsx`:
  - [ ] Change `const mapId = resolvedParams.id` to `const mapSlug = resolvedParams.slug`
  - [ ] Replace `getMapById(mapId)` with `getMapBySlug(mapSlug)`
- [ ] In `app/maps/[slug]/submit/page.tsx`:
  - [ ] Change `const mapId = resolvedParams.id` to `const mapSlug = resolvedParams.slug`
  - [ ] Replace `getMapById(mapId)` with `getMapBySlug(mapSlug)`

### Test Routing
- [ ] Test accessing a map: `/maps/test-map`
- [ ] Test edit page: `/maps/test-map/edit`
- [ ] Test submit page: `/maps/test-map/submit`
- [ ] Verify 404 for non-existent slugs

**Risk**: HIGH - Major structural changes

---

## Phase 5: URL Generation Updates (Day 5)

### Update All URL Generators (16 locations)
- [ ] `app/sitemap.ts` (line 39): Remove `/${map.id}` from URL
- [ ] `app/my-maps/page.tsx` (line 102): Change href to `/maps/${mapItem.slug}`
- [ ] `app/create-map/page.tsx` (line 113): Change redirect to `/maps/${mapData.slug}?expand=true`
- [ ] `app/page.tsx` (line 65): Change href to `/maps/${map.slug}`
- [ ] `app/maps/[slug]/page.tsx`:
  - [ ] Line 165: Change redirect to `/maps/${correctSlug}${expand}`
  - [ ] Line 188: Change JSON-LD url to `/maps/${slug}`
- [ ] `app/maps/[slug]/ClientMapPageComponent.tsx` (update all 7 instances):
  - [ ] Line 292: Edit link
  - [ ] Line 311: Submit link
  - [ ] Line 547: Submit button
  - [ ] Line 653: Edit button
  - [ ] Line 766: Edit button
  - [ ] Line 811: Submit button
  - [ ] Line 1021: Submit button
- [ ] `app/maps/[slug]/edit/page.tsx` (line 133): Change redirect to `/maps/${newSlug}`
- [ ] `app/maps/[slug]/submit/page.tsx`:
  - [ ] Line 254: Update email notification URL
  - [ ] Line 276: Change redirect to `/maps/${map.slug}`
- [ ] `components/custom-ui/ShareButton.tsx` (line 61): Change to `/maps/${slug}`
- [ ] `lib/supabase/mapSubmissionService.ts` (line 87): Change to `/maps/${mapSlug}`

### Manual Testing
- [ ] Test map creation → verify redirect URL
- [ ] Test map editing → verify redirect URL
- [ ] Test location submission → verify redirect URL
- [ ] Test share button → verify shared URL
- [ ] Test sitemap generation
- [ ] Test all navigation links on homepage

**Risk**: HIGH - Many user-facing features affected

---

## Phase 6: API Routes (Day 6)

### Rename and Update API Route
- [ ] Rename `app/api/maps/[id]/route.ts` to `app/api/maps/[slug]/route.ts`
- [ ] Update logic to use `slug` parameter instead of `id`
- [ ] Update `getMapById` call to `getMapBySlug`
- [ ] Test API endpoint with GET request

**Risk**: MEDIUM - May affect external consumers

---

## Phase 7: Error Handling (Day 7)

### Add 404 Handling
- [ ] Add 404 UI to `app/maps/[slug]/page.tsx` when map not found
  - Show "Map Not Found" message
  - Add "Back to Home" button
- [ ] Test 404 page with invalid slug

### Add Validation to Forms
- [ ] In map creation flow: check for reserved slugs
- [ ] In map update flow: check for reserved slugs
- [ ] Test creating map with reserved slug (should fail)
- [ ] Verify error messages display correctly

**Risk**: LOW - Improves user experience

---

## Phase 8: Full Testing (Day 8-9)

### Local Testing
- [ ] Run application locally
- [ ] Test creating a new map
- [ ] Test editing an existing map
- [ ] Test submitting a location to a map
- [ ] Test sharing a map
- [ ] Test navigation from homepage to map
- [ ] Test navigation from "My Maps" to map
- [ ] Test search functionality (if applicable)
- [ ] Test all error scenarios

### Staging Deployment
- [ ] Deploy to staging environment
- [ ] Run data migration on staging database
- [ ] Verify unique constraint was added
- [ ] Run E2E test suite
- [ ] Test SEO metadata (OpenGraph tags)
- [ ] Test Twitter card metadata
- [ ] Test sitemap XML
- [ ] Manual QA on staging
- [ ] Get stakeholder approval

**Risk**: MEDIUM

---

## Phase 9: Production Deployment (Day 10)

### Pre-Deployment
- [ ] **BACKUP PRODUCTION DATABASE**
- [ ] Verify rollback plan is ready
- [ ] Schedule deployment during low-traffic period
- [ ] Notify team of deployment

### Deployment Steps
- [ ] Run data migration script on production database
- [ ] Verify all slugs are unique
- [ ] Add unique constraint to production database
- [ ] Deploy code changes to production
- [ ] Verify deployment succeeded

### Post-Deployment Monitoring (First Hour)
- [ ] Monitor error logs for exceptions
- [ ] Check for 404 spikes
- [ ] Verify maps are loading correctly
- [ ] Test map creation
- [ ] Test map editing
- [ ] Test navigation
- [ ] Check analytics for traffic drop

### Extended Monitoring (48 Hours)
- [ ] Continue monitoring error logs
- [ ] Watch for unusual patterns
- [ ] Check user reports/feedback
- [ ] Verify no duplicate slug errors
- [ ] Monitor database performance

**Risk**: HIGH - Production changes

---

## Phase 10: Backwards Compatibility (Post-Launch - Optional)

### Add Middleware for Old URL Redirects
- [ ] Create `middleware.ts` at project root
- [ ] Implement redirect from `/maps/[slug]/[id]` to `/maps/[slug]`
- [ ] Use 307 (temporary) status code initially
- [ ] Test redirects work correctly
- [ ] Deploy middleware to production
- [ ] Monitor redirect metrics
- [ ] After 6-12 months, switch to 301 (permanent) status code
- [ ] After 12+ months, consider removing middleware

**Risk**: LOW - Optional enhancement

---

## Rollback Plan

If issues occur:
- [ ] Revert to previous git commit
- [ ] Redeploy previous version
- [ ] If database constraint causes issues: `ALTER TABLE maps DROP CONSTRAINT maps_slug_unique;`
- [ ] Restore database backup if necessary
- [ ] Investigate issues in staging environment
- [ ] Fix and redeploy

---

## Success Criteria

After deployment, verify:
- [ ] All URLs use `/maps/[slug]` format (no `/[id]` visible)
- [ ] All 16 URL generation locations updated
- [ ] No 404 errors from slug lookup failures in logs
- [ ] No duplicate slug errors in logs
- [ ] Sitemap contains correct URLs
- [ ] Social sharing uses correct URLs
- [ ] Analytics shows no drop in map page views
- [ ] No error spikes in production logs
- [ ] Search engines can crawl new URLs
- [ ] All user-facing features work correctly

---

## Files Summary

**Files to Modify** (13):
- [ ] `lib/supabase/mapsService.ts`
- [ ] `lib/supabase/api/updateMapAction.ts`
- [ ] `lib/supabase/mapSubmissionService.ts`
- [ ] `lib/utils/slugify.ts`
- [ ] `app/sitemap.ts`
- [ ] `app/my-maps/page.tsx`
- [ ] `app/create-map/page.tsx`
- [ ] `app/page.tsx`
- [ ] `app/maps/[slug]/page.tsx` (after moving)
- [ ] `app/maps/[slug]/ClientMapPageComponent.tsx` (after moving)
- [ ] `app/maps/[slug]/edit/page.tsx` (after moving)
- [ ] `app/maps/[slug]/submit/page.tsx` (after moving)
- [ ] `components/custom-ui/ShareButton.tsx`

**Files to Move** (4):
- [ ] `app/maps/[slug]/[id]/page.tsx` → `app/maps/[slug]/page.tsx`
- [ ] `app/maps/[slug]/[id]/ClientMapPageComponent.tsx` → `app/maps/[slug]/ClientMapPageComponent.tsx`
- [ ] `app/maps/[slug]/[id]/edit/page.tsx` → `app/maps/[slug]/edit/page.tsx`
- [ ] `app/maps/[slug]/[id]/submit/page.tsx` → `app/maps/[slug]/submit/page.tsx`

**Files to Create** (3):
- [ ] `app/api/maps/check-slug/route.ts` (slug availability API)
- [ ] `scripts/migrate-slugs.ts` (data migration script)
- [ ] `middleware.ts` (optional, for old URL redirects)

**API Route to Rename** (1):
- [ ] `app/api/maps/[id]/route.ts` → `app/api/maps/[slug]/route.ts`

---

## Critical Warnings

⚠️ **BACKUP DATABASE BEFORE PRODUCTION DEPLOYMENT**
⚠️ **TEST THOROUGHLY ON STAGING FIRST**
⚠️ **MONITOR LOGS CLOSELY FOR 48 HOURS POST-DEPLOYMENT**
⚠️ **HAVE ROLLBACK PLAN READY**
⚠️ **SCHEDULE DURING LOW-TRAFFIC PERIOD**

---

**Document Version**: 1.0
**Last Updated**: 2025-11-24
**Status**: Ready for implementation
