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
Success: #10b981
Error/Destructive: #ef4444
Warning: #f59e0b
Info: #3b82f6
```

### Usage Guidelines
- Use `gray-900` (#111) for primary headings and important text
- Use `gray-700` (#444) for body text
- Use `gray-500` (#777) for captions and metadata
- Use `gray-300` (#ddd) for borders and dividers
- Use `gray-100` (#f5f5f5) for subtle backgrounds
- Use brand orange only for primary actions and key interactions

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

#### Primary Button
```
Purpose: Main actions (Create Map, Submit, Save)
Style:
  - Background: #FF6A00
  - Text: white
  - Border radius: 8px
  - Padding: 12px 24px (h-11 px-6)
  - Font: 15px medium
  - Hover: #E55F00 + subtle shadow
  - Transition: 200ms ease
```

#### Secondary Button
```
Purpose: Supporting actions (Share, Edit)
Style:
  - Background: transparent
  - Border: 1px solid #ddd
  - Text: #444
  - Border radius: 8px
  - Padding: 12px 24px
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
Size: 40px × 40px
Icon size: 20px × 20px
Padding: 10px
Border radius: 8px
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
- [ ] Typography matches the scale
- [ ] Spacing uses the 4/8/12/16/24/32 system
- [ ] Colors from the 5-step grayscale or brand palette
- [ ] Images are 16:9 with proper border radius
- [ ] Buttons follow the 3-level system
- [ ] Hover states are defined
- [ ] Focus states are accessible
- [ ] Icons are Lucide with consistent stroke
- [ ] Transitions are smooth (200-300ms)
- [ ] Responsive behavior is considered
- [ ] Component is documented

---

## Common Patterns

### User Attribution
```
[Avatar] Started by [Username] • [Date]
Avatar: 32px
Font: 13px
Color: gray-500 with username in gray-900
Gap: 8px
```

### Metadata Pills
```
Background: gray-100
Border radius: 9999px (full rounded)
Padding: 6px 12px
Font: 13px medium
Color: gray-500
Icon + text gap: 6px
```

### Section Dividers
```
Border: 1px solid gray-300
Margin: 24px vertical
Opacity: 1 (don't use opacity for grays)
```

### Empty States
```
Icon: 48px, gray-300
Title: H3, gray-700
Description: Body, gray-500
Action: Primary button
Centered vertically and horizontally
```

---

## Examples

### Before/After: Button Inconsistency

**Before:**
```tsx
// Mixed styles
<button className="bg-red-500 px-4 py-2">Save</button>
<button className="border px-6 py-3">Cancel</button>
```

**After:**
```tsx
// Consistent system
<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>
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

*Last Updated: 2025-11-26*
*Version: 1.0*
