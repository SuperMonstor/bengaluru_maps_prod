# Bengaluru Maps - Design System & Style Guide

## Overview

This document defines the design system for Bengaluru Maps to ensure visual consistency, premium aesthetics, and intentional design across all components and pages.

---

## Design Principles

1. **Consistency First**: All components follow the same visual language
2. **Premium Feel**: Clean, modern, intentional design with attention to detail
3. **Visual Hierarchy**: Clear typography and spacing systems
4. **Purposeful Color**: Limited palette with strategic accent usage
5. **Smooth Interactions**: Subtle hover states and transitions

---

## Color System

### Grayscale (5-step system)
```
gray-900: #111111  - Primary text, headings
gray-700: #444444  - Secondary text
gray-500: #777777  - Tertiary text, disabled states
gray-300: #dddddd  - Borders, dividers
gray-100: #f5f5f5  - Backgrounds, subtle fills
```

### Brand Colors
```
Primary Orange:
  - Default: #FF6A00
  - Hover: #E55F00
  - Light: #FFF4E6

Primary Slate:
  - Default: #0F172A (used for primary text)
  - Light: #64748B (used for secondary text)
```

### Semantic Colors
```
Primary Blue (Secondary CTA):
  - Default: #3b82f6 (blue-600)
  - Hover: #1d4ed8 (blue-700)
  - Light: #eff6ff (blue-50)
  - Light border: #bfdbfe (blue-200)
  - Dark text: #1e40af (blue-800)

Success: #10b981
Error/Destructive: #ef4444
Warning: #f59e0b
```

### Usage Guidelines
- Use `gray-900` (#111) for primary headings and important text
- Use `gray-700` (#444) for body text
- Use `gray-500` (#777) for captions and metadata
- Use `gray-300` (#ddd) for borders and dividers
- Use `gray-100` (#f5f5f5) for subtle backgrounds
- Use brand orange (#FF6A00) only for primary actions and key interactions (one per section max)
- Use primary blue (#3b82f6) for secondary actions, selected states, and information

### Orange vs Blue Decision Tree
```
Use ORANGE (#FF6A00):
  ✓ Primary CTA on each page (Submit, Create Map, Save)
  ✓ Main action that users expect most
  ✓ Use sparingly to avoid overwhelming the interface
  ✗ Never more than one prominent orange per section

Use BLUE (#3b82f6):
  ✓ Secondary/alternative actions
  ✓ "Suggest", "Add", "Contribute" actions (community pattern)
  ✓ When orange would create visual clutter
  ✓ Selected/active states and highlighting
  ✓ External links (View on Maps, etc.)
  ✓ Information boxes, tips, and suggestions
```

---

## Typography

### Type Scale
```
H1: 28px / semibold / -0.02em tracking
H2: 22px / semibold / -0.01em tracking
H3: 18px / medium / -0.01em tracking
Body: 15px / regular / normal tracking
Body Small: 13px / regular / normal tracking
Caption: 12px / regular / normal tracking
```

### Font Weights
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700 (use sparingly)

### Line Heights
- Headings: 1.2
- Body text: 1.5
- Captions: 1.4

### Usage Guidelines
- Use H1 for page titles only
- Use H2 for major section headings
- Use H3 for subsection headings and card titles
- Body text should be 15px for optimal readability
- Captions for metadata, timestamps, and secondary info
- Never mix font sizes arbitrarily - stick to the scale

---

## Spacing System

### Scale
```
4px   - xs (micro spacing, icon gaps)
8px   - sm (tight spacing)
12px  - md (default gap between related elements)
16px  - lg (standard padding, comfortable spacing)
24px  - xl (section spacing, vertical rhythm)
32px  - 2xl (large gaps between major sections)
48px  - 3xl (page sections)
64px  - 4xl (hero sections)
```

### Container Padding
- Desktop: 32px (2xl)
- Tablet: 24px (xl)
- Mobile: 16px (lg)

### Vertical Rhythm
- All sections on the left column: 24px between sections
- Card internal spacing: 16px padding
- List items: 12px gap

### Layout Widths
- Left panel (desktop): 440px fixed
- Left panel content: max 380px
- Map index cards: max 800px centered
- Full content: max 1120px

---

## Components

### Buttons

#### Primary Button (Orange)
```
Purpose: Main CTA (Create Map, Submit, Save) - ONE per section max
Style:
  - Background: #FF6A00
  - Text: white
  - Border radius: 8px (rounded-lg)
  - Padding: 12px 24px (h-11 px-6)
  - Font: 15px semibold
  - Hover: #E55F00 + shadow-sm
  - Transition: 200ms ease
  - Touch target: 44x44px minimum
```

#### Secondary Button (Blue)
```
Purpose: Secondary/alternative CTAs (Suggest Location, Add Location, View on Maps)
When to use: When orange would overload, for user contribution actions, external links
Style:
  - Background: #3b82f6
  - Text: white
  - Border radius: 8px (rounded-lg) - NOT rounded-xl
  - Padding: 12px 24px (h-11 px-6)
  - Font: 15px semibold
  - Hover: #1d4ed8 + shadow-sm
  - Transition: 200ms ease
  - Touch target: 44x44px minimum
```

#### Outline Button (Secondary)
```
Purpose: Supporting actions (Share, Edit)
Style:
  - Background: transparent
  - Border: 1px solid #ddd
  - Text: #444
  - Border radius: 8px
  - Padding: 12px 24px (h-11 px-6)
  - Font: 15px medium
  - Hover: border #bbb, background #f5f5f5
  - Transition: 200ms ease
```

#### Tertiary Button
```
Purpose: Subtle actions (Cancel, Back)
Style:
  - Background: transparent
  - Border: none
  - Text: #64748B
  - Padding: 8px 16px
  - Font: 15px medium
  - Hover: text #111, background #f5f5f5
  - Transition: 200ms ease
```

#### Action Text Links
```
Purpose: Compact action links in headers/tight spaces (Edit, Invite, Share, More info)
Style:
  - Text: #3b82f6 (blue-600)
  - Hover: #1d4ed8 (blue-700) + underline
  - Font: 14px medium
  - Icon: h-4 w-4 before text
  - Gap: 4px (gap-1) between icon and text
  - MOBILE: Wrap in button with padding for 44x44px touch target
  - Transition: 200ms ease
```

#### Destructive Button
```
Purpose: Delete, Remove actions
Style:
  - Use secondary style with red accent
  - Border: 1px solid #fecaca
  - Text: #ef4444
  - Hover: background #fef2f2
```

#### Icon Buttons
```
Size: 40x40px (h-10 w-10) minimum, 44x44px (h-11 w-11) preferred on mobile
Icon size: 20px × 20px (h-5 w-5)
Padding: 10px (p-2.5) or inset with flexbox center
Border radius: 8px (rounded-lg)
Use case: Compact actions (close, edit, delete)

CRITICAL: Never smaller than 40px on desktop, 44px on mobile
Touch target must always be >= 44x44px
```

### Cards

#### Standard Card
```
Style:
  - Border radius: 12px
  - Border: 1px solid #eee (#eeeeee)
  - Shadow: 0 1px 3px rgba(0,0,0,0.06) (subtle)
  - Padding: 16px
  - Background: white
  - Hover: shadow 0 4px 12px rgba(0,0,0,0.08), scale(1.01)
  - Transition: 300ms ease

Image within card:
  - Aspect ratio: 16:9 (enforced)
  - Border radius: 8px
  - object-fit: cover
```

#### Map Preview Card (Homepage)
```
Special layout:
  - Reddit-style karma bar on left (56px width)
  - Main content area with horizontal layout
  - Image: 192px width, 16:9 ratio, rounded-xl
  - Content section with title + description + metadata
```

### Images

#### Global Image Rules
```
Aspect Ratio: 16:9 (enforced with aspect-[16/9])
Border Radius: 8px (rounded-lg) for inline images, 12px (rounded-xl) for featured
Object Fit: cover (always)
Loading: lazy (except above fold)
Quality: 75 (Next.js Image optimization)
```

### Avatars

#### Sizes
```
Small: 24px (h-6 w-6) - inline mentions
Default: 32px (h-8 w-8) - card footers, user info
Large: 48px (h-12 w-12) - profile headers
```

#### Style
```
Border radius: full (circular)
Border: 1px solid #eee (optional, use for contrast)
Fallback: initials with gray-100 background, gray-700 text
```

### Icons

#### System
```
Icon Set: Lucide React (consistent across app)
Stroke Width: 1.5px (default) or 2px (bold)
Sizes:
  - Small: 16px (h-4 w-4)
  - Default: 20px (h-5 w-5)
  - Large: 24px (h-6 w-6)
```

#### Map Markers
```
Style: Custom circular markers (not default Leaflet pins)
Default state:
  - Circle with orange fill (#FF6A00)
  - White border (2px)
  - 32px diameter
  - Subtle shadow

Selected state:
  - Larger (40px diameter)
  - Blue fill (#3b82f6)
  - Stronger shadow
```

---

## Map Styling

### Tile Provider
**Use ONE provider across entire app**: Carto Voyager

```
URL: https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png
Attribution: © OpenStreetMap contributors © CARTO
```

**Why Carto Voyager:**
- Clean, modern aesthetic
- Good balance of detail without visual clutter
- Consistent label hierarchy
- Works well in light mode
- Free tier available

### Map Container
```
Height: 100% of viewport minus header (calc(100vh - 72px))
Z-index: 0 (below overlays)
Background: #f5f5f5 (while loading)
```

---

## Layout Standards

### Left Panel (Map Detail Pages)

#### Desktop
```
Width: 440px (fixed)
Padding: 32px (p-8)
Content max-width: 380px
Background: white
Overflow-y: auto
```

#### Content Structure (order matters)
```
1. Action row (Edit button if owner)
2. Title (H1)
3. Action buttons (Contribute, Share)
4. Description
5. Metadata (avatar, username)
6. Stats (upvotes, locations, contributors)
7. Featured image
8. Body content (markdown)
```

#### Mobile
```
Fixed bottom sheet that slides up
Max height: 85vh
Padding: 16px (p-4)
Sticky header with collapse button
```

### Homepage Cards

#### Layout
```
Max width: 800px
Margin: 0 auto
Gap: 32px between cards
```

#### Card Structure
```
1. Reddit-style upvote column (left, 56px)
2. Horizontal layout: image (192px) + content
3. Footer with creator info
```

---

## Interaction & Animation

### Hover States

#### Cards
```
Default: border #eee, shadow subtle
Hover: border #ddd, shadow medium, scale(1.01)
Transition: 300ms ease
```

#### Buttons
```
Primary: darken background, increase shadow
Secondary: darken border, add subtle background
Tertiary: add background, darken text
Transition: 200ms ease
```

#### Links
```
Text links: underline on hover, color shift
Card links: entire card hover state
Icon buttons: background fill + scale(1.05)
```

### Transitions
```
Default: 200ms ease (buttons, small elements)
Medium: 300ms ease (cards, larger elements)
Slow: 500ms ease (page transitions, modals)

Properties to animate:
  - background-color
  - border-color
  - box-shadow
  - transform (scale, translate)
  - opacity

DO NOT animate:
  - width/height (use transform scale)
  - complex properties (causes jank)
```

### Loading States
```
Skeleton screens: gray-200 background, pulse animation
Spinners: only for async actions (button loading states)
Progress bars: for multi-step flows
```

---

## Responsive Breakpoints

```
Mobile: < 768px
Tablet: 768px - 1024px
Desktop: > 1024px
```

### Responsive Behavior
- Left panel becomes full-width bottom sheet on mobile
- Card layout stacks vertically on mobile
- Padding reduces: 32px → 24px → 16px
- Font sizes remain the same (don't scale down)
- Touch targets minimum 44px × 44px

---

## Accessibility

### Contrast
- Text on white: minimum 4.5:1 ratio
- Interactive elements: clear focus states (ring-2 ring-offset-2)
- Don't rely on color alone for meaning

### Focus States
```
Focus-visible: 2px ring with offset
Color: primary brand color or blue
Border radius: matches element
Transition: instant (no animation)
```

### Semantic HTML
- Use proper heading hierarchy
- Button vs link: buttons for actions, links for navigation
- Alt text for all images
- Aria labels for icon-only buttons

---

## Implementation Checklist

When creating a new component:

- [ ] Uses design tokens from Tailwind config
- [ ] Typography matches the scale (use responsive text-xs/sm/base/lg with md: breakpoint)
- [ ] Spacing uses the 4/8/12/16/24/32 system (responsive with sm:/md: prefixes)
- [ ] Colors from approved palette (orange #FF6A00, blue #3b82f6, or grayscale)
- [ ] Images are 16:9 with proper border radius (8px for inline, 12px for featured)
- [ ] **Buttons:**
  - [ ] Primary (orange): h-11 px-6 rounded-lg bg-[#FF6A00] hover:bg-[#E55F00]
  - [ ] Secondary (blue): h-11 px-6 rounded-lg bg-blue-600 hover:bg-blue-700
  - [ ] All buttons minimum 44x44px (touch target)
  - [ ] Outline buttons: border border-gray-300
  - [ ] Text links: text-blue-600 hover:text-blue-700 underline (in buttons for touch targets)
- [ ] Selected states use blue (bg-blue-50/50 border-blue-200) never orange
- [ ] Information boxes use blue (bg-blue-50 border-blue-100)
- [ ] Hover states are defined (with transition 200ms ease)
- [ ] Focus states accessible (ring-2 ring-offset-2)
- [ ] Icons are Lucide (consistent stroke, h-4/h-5/h-6 sizes)
- [ ] Transitions smooth (200ms for buttons, 300ms for cards, 500ms for modals)
- [ ] Responsive behavior considered (mobile first, single column default)
- [ ] Touch targets minimum 44x44px on all interactive elements
- [ ] Component is documented

---

## Common Patterns

### User Attribution
```
[Avatar] Started by [Username] • [Date]
Avatar: 32px (h-8 w-8)
Font: 13px (text-xs md:text-sm)
Color: gray-500 with username in gray-900
Gap: 8px (gap-2)
```

### Metadata Pills
```
Background: gray-100 (bg-gray-100)
Border radius: 9999px (rounded-full)
Padding: 6px 12px (px-3 py-1.5)
Font: 13px medium (text-xs md:text-sm font-medium)
Color: gray-500 (text-gray-500)
Icon + text gap: 6px (gap-1)
Usage: Status badges, location counts, contributor counts
```

### Selected/Highlighted State (Location Cards, Items)
```
Use case: When user selects/clicks a location card or collection item
Background: blue-50 (bg-blue-50/50)
Border: 1px solid blue-200 (border-blue-200)
Shadow: subtle (shadow-sm), hover: shadow-md
Text accent: blue-700 (text-blue-700)
Transition: all 200ms ease (transition-all)

Applied to:
  - LocationCard when clicked/selected
  - Any collection item when user selects it
  - Visual feedback: "this item is active"

IMPORTANT: Do NOT use orange for selection - blue is reserved for selected state
```

### Information/Suggestion Boxes
```
Use case: Tips, ideas, help text that needs visual distinction
Background: blue-50 (bg-blue-50)
Border: 1px solid blue-100 (border-blue-100)
Padding: 16px (p-4) mobile, 24px (p-6) desktop
Border radius: 12px (rounded-xl)
Heading: text-blue-800 semibold (text-sm md:text-base font-semibold)
Body text: text-blue-700 regular (text-xs md:text-sm)
Icon: h-5 w-5 text-blue-600
Button inside: text-blue-700 hover:text-blue-900 hover:bg-blue-100
Hover state: bg-blue-100 transition-colors

Example: "Need ideas for your map?" box on create-map page
```

### Section Dividers
```
Border: 1px solid gray-300 (border-gray-300)
Margin: 24px vertical (my-6)
Opacity: 1 (don't use opacity for grays)
Transition: none (instant, no animation)
```

### Empty States
```
Icon: 48px (h-12 w-12), gray-300 text
Title: H3 (18px semibold), gray-700
Description: Body (15px regular), gray-500
Action: Primary orange button
Spacing: Icon mb-4, Title mt-2, Button mt-6
Centered vertically and horizontally
```

---

## Examples

### Before/After: Button Styling

**Before (Inconsistent):**
```tsx
// Wrong: Different heights, missing h-11, wrong border radius
<Button className="bg-[#FF6A00] px-4 py-2 rounded-md">Create</Button>
<Button className="bg-blue-600 h-11 px-6 rounded-xl text-white">Suggest</Button>
<Button className="border px-6 py-3">Cancel</Button>
```

**After (Consistent):**
```tsx
// Correct: All buttons h-11, consistent border radius, proper sizing
<Button className="h-11 px-6 rounded-lg bg-[#FF6A00] hover:bg-[#E55F00] text-white">
  Create Map
</Button>
<Button className="h-11 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
  Suggest Location
</Button>
<Button variant="outline" className="h-11 px-6 rounded-lg">
  Cancel
</Button>
```

**Key fixes:**
- All buttons: `h-11` (44px minimum)
- All buttons: `rounded-lg` (8px, not 12px)
- Orange buttons: `bg-[#FF6A00] hover:bg-[#E55F00]`
- Blue buttons: `bg-blue-600 hover:bg-blue-700`
- Proper padding: `px-6` (24px)
```

### Before/After: Card Styling

**Before:**
```tsx
// Inconsistent
<div className="rounded-2xl shadow-lg border-2 p-8">
```

**After:**
```tsx
// Standard card
<Card className="rounded-xl border border-gray-300 p-4">
```

---

## Tools & Resources

### Tailwind Config
All design tokens are defined in `tailwind.config.ts`

### Component Library
Base components in `components/ui/`
Custom components in `components/custom-ui/`

### Testing Design Changes
1. Check homepage card grid
2. Check map detail page (desktop + mobile)
3. Check button variations
4. Check hover states
5. Check responsive behavior

---

## Maintenance

### When to Update This Guide
- Adding new component patterns
- Changing color palette
- Modifying spacing/typography scales
- Introducing new interaction patterns

### Review Schedule
- Review every quarter for consistency
- Update after major feature additions
- Audit usage when adding new designers/developers

---

## Questions?

If something isn't covered here, follow these principles:
1. Look for similar existing patterns first
2. Choose simplicity over complexity
3. Maintain visual consistency with existing components
4. When in doubt, ask before creating new patterns

---

## Recent Updates (Jan 2025)

### Added Blue as Official Secondary CTA Color
- **Blue (#3b82f6)** now officially documented as secondary CTA color
- Use for: suggestions, contributions, external links, selected states
- Paired with orange (#FF6A00) to create a two-tier button hierarchy
- Prevents visual fatigue from excessive orange buttons

### Formalized Touch Target Minimums
- All buttons must be h-11 (44x44px minimum) on mobile
- Icon buttons minimum 40x40px (h-10 w-10), prefer h-11 on mobile
- Text links wrapped in buttons for proper touch targets

### Standardized Button Border Radius
- All buttons: rounded-lg (8px) - NOT rounded-xl (12px)
- Consistent across primary, secondary, outline, and tertiary variants
- Icon buttons also rounded-lg for visual consistency

### Added Selected State Pattern
- Light blue background (bg-blue-50/50) with blue-200 border
- Provides clear visual feedback without using orange
- Applied consistently across location cards and collection items

### Added Information Box Pattern
- Blue background (bg-blue-50) with blue-100 border
- Used for tips, ideas, help text, suggestions
- Example: "Need ideas for your map?" box

### Implementation Checklist Enhanced
- Added specific button sizing requirements
- Emphasized touch target minimums
- Added color usage validation steps

---

*Last Updated: 2025-01-09*
*Version: 1.1*

**To update implementation:**
1. Search for buttons with `rounded-xl` and change to `rounded-lg`
2. Ensure all buttons have explicit `h-11` (or h-10 w-10 for icon buttons)
3. Update blue buttons to use `bg-blue-600 hover:bg-blue-700`
4. Update selected states to use blue (bg-blue-50/50 border-blue-200) instead of any custom colors
5. Wrap text action links in buttons with padding for mobile touch targets
