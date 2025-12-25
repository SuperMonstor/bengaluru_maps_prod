# Security Fixes - December 26, 2025

This document summarizes the security vulnerabilities that were fixed in this update.

## Summary

All **HIGH**, **MEDIUM**, and **MODERATE** severity vulnerabilities from the security audit have been addressed.

---

## HIGH Severity Fixes

### 1. ✅ Information Leak of Pending Locations

**Problem**: Any user (even unauthenticated) could view pending/unapproved location submissions.

**Files Fixed**:
- Created `supabase/migrations/20251226000000_add_locations_rls.sql`
- Updated `lib/supabase/api/getLocationDetailsAction.ts`
- Created `lib/supabase/api/fetchPendingSubmissionsAction.ts`
- Updated `app/my-maps/[mapId]/pending/page.tsx`

**Changes Made**:

1. **Added RLS policies to locations table**:
   - Public users can only view approved locations (`is_approved = true AND status = 'approved'`)
   - Map owners can update any location on their maps (for approval/rejection)
   - Users can only update their own pending locations
   - Proper delete policies for owners and creators

2. **Protected getLocationDetailsAction**:
   - Added security check to verify user is map owner or location creator before showing pending locations
   - Returns 403 error if unauthenticated user tries to view pending location

3. **Secured fetchPendingSubmissions**:
   - Converted from client-side function to secure server action
   - Verifies caller is the map owner before returning pending submissions
   - Returns proper error messages for unauthorized access

---

## MEDIUM Severity Fixes

### 2. ✅ Unprotected /my-maps Route

**Problem**: The `/my-maps` route was not protected by middleware, allowing unauthenticated users to access it.

**Files Fixed**:
- Updated `middleware.ts`

**Changes Made**:
- Added `/my-maps` to the list of protected routes that require authentication
- Added `/my-maps/:path*` to the middleware matcher configuration
- Unauthenticated users are now redirected to `/login`

---

### 3. ✅ Information Leak of Voting Activity

**Problem**: The RLS policy on `location_votes` allowed anyone (even unauthenticated users) to query who voted for what.

**Files Fixed**:
- Created `supabase/migrations/20251226000001_update_location_votes_rls.sql`

**Changes Made**:
- Replaced overly permissive "Anyone can view location votes" policy
- New policy: Only authenticated users can view vote data
- Prevents information leakage of user voting activity

---

## MODERATE Severity Fixes

### 4. ✅ Vulnerable NPM Dependency

**Problem**: `mdast-util-to-hast` dependency had a moderate severity vulnerability related to unsanitized class attributes.

**Changes Made**:
- Ran `npm audit fix`
- All dependencies updated
- No remaining vulnerabilities found

---

## Files Created/Modified

### New Files:
1. `supabase/migrations/20251226000000_add_locations_rls.sql` - RLS policies for locations
2. `supabase/migrations/20251226000001_update_location_votes_rls.sql` - Updated RLS for votes
3. `lib/supabase/api/fetchPendingSubmissionsAction.ts` - Secure server action for pending submissions

### Modified Files:
1. `lib/supabase/api/getLocationDetailsAction.ts` - Added pending location protection
2. `app/my-maps/[mapId]/pending/page.tsx` - Uses secure server action
3. `middleware.ts` - Added /my-maps route protection
4. `package-lock.json` - Updated dependencies

---

## Migration Instructions

To apply these security fixes to your Supabase database:

1. **Run the migrations**:
   ```bash
   npx supabase db push
   ```

2. **Verify RLS is enabled**:
   - Check Supabase Dashboard → Database → Tables
   - Verify `locations` table has RLS enabled
   - Verify `location_votes` table has updated policies

3. **Test the fixes**:
   - Try accessing pending submissions while logged out (should fail)
   - Try accessing `/my-maps` while logged out (should redirect to login)
   - Try viewing a pending location URL directly (should show "not approved" error)

---

## Remaining Informational Item

### Google Maps API Key Security

**Recommendation**: Verify in Google Cloud Console that your `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is properly restricted:

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Find your API key
3. Ensure **Application restrictions** are set:
   - HTTP referrers: Only allow your domain(s)
4. Ensure **API restrictions** are set:
   - Only enable the specific Google Maps APIs you use (Maps JavaScript API, Places API, etc.)

This prevents unauthorized use of your API key and potential billing abuse.

---

## Architecture Improvements Applied

✅ **Server Action Pattern**: Migrated security-critical functions to server actions
✅ **RLS Everywhere**: Enabled Row Level Security on all user-facing tables
✅ **Principle of Least Privilege**: Only grant minimum necessary permissions
✅ **Dependency Hygiene**: All dependencies updated and audited

---

## Testing Checklist

- [ ] Run migrations on Supabase: `npx supabase db push`
- [ ] Test pending submissions while logged out (should fail)
- [ ] Test `/my-maps` access while logged out (should redirect)
- [ ] Test viewing pending location details (should fail for non-owners)
- [ ] Test normal flow as map owner (should work)
- [ ] Verify Google Maps API key restrictions in console

---

**Security Status**: ✅ All critical vulnerabilities addressed
