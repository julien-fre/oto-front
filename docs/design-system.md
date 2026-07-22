---
version: alpha
name: oto
description: Oto's design system, Light theme. Adapted from Folk's design system as the starting reference for Oto's UI — dark theme not yet defined.

colors:
  # Semantic
  background: "#ffffff"
  border: "#d9d9e0"
  muted: "#60646c"
  icon: "#60646c"
  placeholder: "#6d7078" # darkened from gray-9 for WCAG AA text contrast (4.7:1 on gray-2)
  focus-ring: "#0090ff" # blue-9; blue-7 fails the 3:1 non-text contrast minimum for focus indicators
  interactive-hovered: "#1c20240f"
  interactive-checked: "#1c202417"

  # Gray scale — cool-tinted (Radix Slate): a few degrees toward blue so
  # surfaces read crisp rather than flat
  gray-1: "#fcfcfd"
  gray-2: "#f9f9fb"
  gray-3: "#f0f0f3"
  gray-4: "#e8e8ec"
  gray-5: "#e0e1e6"
  gray-6: "#d9d9e0"
  gray-7: "#cdced6"
  gray-8: "#b9bbc6"
  gray-9: "#8b8d98"
  gray-10: "#80838d"
  gray-11: "#60646c"
  gray-12: "#1c2024"

  # Chromatic — functional use only
  red-9: "#e5484d"
  red-11: "#ce2c31"
  green-9: "#30a46c"
  green-11: "#218358"
  blue-7: "#8ec8f6"
  blue-9: "#0090ff"
  yellow-9: "#ffe629"
  yellow-11: "#9e6c00"
  amber-9: "#ffc53d"
  amber-11: "#ab6400"
  orange-9: "#f76b15"
  orange-11: "#cc4e00"

# Per-item identity colors for tree rows (dots and leading icons). Not a
# semantic scale — assigned by position, user-assignable later.
# Lives in src/lib/mock-data.ts as LABEL_DOT_COLORS until the back end owns it.
label-dots:
  - "#3e63dd" # indigo
  - "#0d9488" # teal
  - "#c2740a" # amber
  - "#e93d82" # pink
  - "#3d9a50" # grass
  - "#0090ff" # blue
  - "#ef5f00" # orange
  - "#6e56cf" # violet
  - "#ab4aba" # plum

typography:
  title:
    fontFamily: "Inter var, ui-sans-serif" # placeholder — Folk uses Uxum Grotesque, not licensed for Oto yet
    fontSize: 20px
    fontWeight: 500
    lineHeight: 30px
    letterSpacing: -0.019em
  text:
    fontFamily: "Inter var, ui-sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 18px
    letterSpacing: -0.002em
  text-medium:
    fontFamily: "Inter var, ui-sans-serif"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 18px
    letterSpacing: -0.002em
  caption:
    fontFamily: "Inter var, ui-sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
    letterSpacing: -0.002em
  button:
    fontFamily: "Inter var, ui-sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 19px

rounded:
  none: 0px
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  full: 9999px

spacing:
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  5: 20px
  6: 24px
  8: 32px
  10: 40px
  12: 48px

# Fixed measurements the shell depends on. Change these here and in the file
# named beside them — nowhere else.
layout:
  breakpoint-shell: 52rem # --breakpoint-shell (globals.css) + DESKTOP_QUERY (sidebar-provider.tsx)
  top-bar-height: 40px # h-10
  page-inset: 8px # the white page panel's gap from the shell edges
  page-padding: 24px 48px # py-6 px-12
  page-max-width: 72rem # max-w-6xl, only for wide grids
  sidebar-width: 240px # DEFAULT_SIDEBAR_WIDTH, resizable 200–360px
  sidebar-peek-width: 224px
  drawer-width: 240px # w-60, below the shell breakpoint
  side-panel-width: 384px # w-96
  modal-width: 320px # w-80
  palette-width: 576px # max-w-xl

control-heights:
  row: 28px # h-7 — nav rows, in-panel buttons, dense controls
  control: 32px # h-8 — standard buttons, inputs, filters, tabs
  icon-button: 28px # size-7
  top-bar: 40px # h-10
  sidebar-header: 48px # h-12

layers:
  in-surface-backdrop: 10 # click-away catcher for a menu inside a surface
  in-surface-menu: 20
  scrim: 30
  floating-surface: 40 # side panels, drawers, peek
  stacked-scrim: 40 # a dialog opened on top of a floating surface
  stacked-surface: 50 # modals, command palette

---

# Oto Design System

## Overview

This is adapted from [Folk's design system](https://folk.app) as the starting reference for Oto's UI — same principles, same tokens, reapplied to Oto ("the company brain"). Every decision should reduce visual noise, not add to it. When unsure whether to add an element, a color, or a shadow, don't.

Surfaces stack in gray scale steps separated by hairline borders. Chromatic color signals state only: errors, success, warnings. Spacing is tight and rhythmic. Interactive elements are pill-shaped. Prioritize clarity and density, and use color to signal state or hierarchy, never for decoration.

- **Purposeful**: Optimize for specific journeys. Remove decisions the user shouldn't make.
- **Simple**: Reduce choices, steps, and visual noise. Clarity over minimalism.
- **Predictable**: Same pattern, same language, same behavior everywhere.

## Start here

Building a new surface? In order:

1. Read [Adding a new section](#adding-a-new-section) — it is the checklist, and it covers the two things that are not obvious from the code you'll be looking at (the top bar owns page titles; the sidebar owns navigation).
2. Copy the class strings from [Component patterns](#component-patterns) rather than composing new ones. Everything there is lifted verbatim from shipped code, so a pattern copied from here matches the rest of the app by construction.
3. Anything not covered there: derive it from [Colors](#colors), [Typography](#typography), [Shapes](#shapes), and [Elevation](#elevation--depth) — and add it back to this doc.

Two rules that override taste: never invent a token value (size, color, radius, duration) outside the scales below, and never ship an interactive element without `focusRing` and a `motion-reduce:` escape hatch.

One codebase note before you write React: this is Next.js 16, and it differs from what you (and your AI tools) remember. `PageProps<"/route">` / `LayoutProps<"/">` are global types, `params` is a promise, `cookies()` is async. Read `node_modules/next/dist/docs/` for the relevant guide before writing route code — see [`AGENTS.md`](../AGENTS.md).

Where things live:

```
src/app/<section>/page.tsx     routes; server components unless they hold state
src/app/globals.css            every token, wired into Tailwind v4 via @theme
src/components/shell/          the frame: top bar, sidebar, nav rows, palette, provider
src/components/<section>-*.tsx section-specific components
src/components/icons.tsx       every icon in the app
src/lib/cn.ts                  cn() + focusRing
src/lib/mock-data.ts           fixtures and accessors until the back end lands
```

## Implementation

The tokens above are wired into Tailwind v4 via `@theme` in [`src/app/globals.css`](../src/app/globals.css):

| Design system token | Tailwind utility |
| --- | --- |
| `colors.gray-1`…`gray-12` | `bg-gray-1`…`bg-gray-12`, `text-gray-*`, `border-gray-*` |
| `colors.red-9` / `red-11` (etc.) | `bg-red-9`, `text-red-11`, … |
| `colors.background`, `border`, `muted`, `icon`, `placeholder`, `focus-ring` | `bg-background`, `border-border`, `text-muted`, … |
| `colors.interactive-hovered` / `interactive-checked` | `hover:bg-interactive-hovered`, `bg-interactive-checked` |
| `typography.title` | `text-title` |
| `typography.text` | `text-body` |
| `typography.text-medium` | `text-body-medium` |
| `typography.caption` | `text-caption` |
| `typography.button` | `text-button` |
| `rounded.sm` … `rounded.xl` | `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl` |
| `rounded.none` / `rounded.full` | Tailwind defaults: `rounded-none`, `rounded-full` |
| `spacing.*` | Tailwind defaults, no change needed: the default 4px scale already matches (`p-1` = 4px … `p-12` = 48px) |
| `layout.breakpoint-shell` | the `shell:` variant (`shell:mx-2`, `shell:hidden`, …) |
| Dropdown / High shadows | `shadow-dropdown`, `shadow-high` |
| `animate-fade-in`, `animate-panel-in` | motion keyframes, pair with `motion-reduce:animate-none` |

Two helpers in [`src/lib/cn.ts`](../src/lib/cn.ts) are used everywhere:

```tsx
import { cn, focusRing } from "@/lib/cn";
// cn(...classes) — filter falsy, join. No tailwind-merge: don't rely on
// later classes overriding earlier ones, write conditional branches instead.
// focusRing — the single focus treatment for the whole app.
```

`text-title` currently renders with the `text` utility's font family (Inter var) rather than Uxum Grotesque — Folk's display font isn't licensed for Oto. Swap `--font-title` in `globals.css` once a display font is chosen.

## Colors

`{colors.background}` (#ffffff) is the content surface: the page panel, cards, menus, modals, panels. The app *behind* it is `{colors.gray-2}` (see [The app shell](#the-app-shell)). Text on a solid `gray-12` fill uses `text-background`, not `text-white`.

Each gray scale step encodes intent:
- `1`–`2`: subtle backgrounds. `2` is the app shell's background and the hover for large surfaces (tables, lists, cards, menu items)
- `3`: hover state for most interactive components. Also banners and neutral chips.
- `4`: active/selected state, avatar and logo placeholders
- `5`: structural borders and separators (list dividers, tree guides)
- `6`: interactive borders, inputs, textareas, checkboxes, neutral CTAs
- `7`: hover of `6`; underline color for inline links
- `8`: low-contrast glyphs that aren't content — breadcrumb chevrons
- `9`: placeholders and empty interactive text — for text, use the `placeholder` token (#6d7078), darkened off this step to clear WCAG AA
- `11`: muted text, captions, secondary labels (= the `muted` and `icon` tokens)
- `12`: primary text, body, titles, badges. Also the solid fill for the primary button.

`interactive-hovered` / `interactive-checked` are translucent black overlays. Use them for hover and selected states on elements that sit on an unknown or tinted surface (nav rows, icon buttons, filter pills); use `gray-2` / `gray-3` where the element sits on a known white surface (cards, list rows, menu items).

Chromatic scales carry meaning only, never decoration. Red for errors, green for success or "active", amber for warnings or "paused", blue-9 for focus rings (blue-7 is too light to meet the 3:1 non-text contrast minimum against white or gray-2). The `-9` step is the solid fill, `-11` the readable text on a light tint — a status pill is `bg-green-9/15 text-green-11`, never `bg-green-9 text-white`.

The `label-dots` list is the one exception to "color signals state": it is identity color, used to tell sibling rows apart in a tree, and it only ever appears as a small dot or a leading icon — never as a background, a border, or text.

## Typography

Inter var sets everything: titles, labels, body, buttons, captions — until Oto has its own display font, `title` also renders in Inter var (see [Implementation](#implementation)). The `typography` tokens above carry concrete `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, and `letterSpacing`.

- `title`: 20px. Reserved for the header of a floating surface (side panel, dialog). Pages do not use it — the top bar carries the page name at `text-body-medium` (see [The app shell](#the-app-shell)).
- `text`: 13px regular, the default for all running text, field values, and descriptions.
- `text-medium`: 13px medium, for emphasized labels, section headings inside a page (`<h2>`), active nav items, and selected states. Use it to signal hierarchy within the same size, not to introduce a new size.
- `caption`: 12px, for metadata, counts, timestamps, status pills, and secondary information.
- `button`: 13px, for all button labels and compact controls.

`text` and `text-medium` cover most of the interface, the distinction between them is weight, not size. Two sizes (13px and 12px) handle everything below the title level. Never introduce intermediate sizes.

Hierarchy on a page comes from weight, color, and spacing — not size. A section is `<h2 className="text-body-medium text-gray-12">` with a `mt-1 text-caption text-muted` description under it, separated from the previous section by `mt-8`.

## The app shell

Defined in [`app-shell.tsx`](../src/components/shell/app-shell.tsx). Understand this before adding a route.

```
┌───────────┬──────────────────────────────────┐  bg-gray-2 (the app background)
│ Sidebar   │ ╭──────────────────────────────╮ │
│ (no       │ │ TopBar — h-10, breadcrumb    │ │  the page: white, rounded-xl,
│ surface   │ ├──────────────────────────────┤ │  1px border, inset 8px
│ of its    │ │ <main> — your page renders   │ │
│ own)      │ │ inside here                  │ │
│           │ ╰──────────────────────────────╯ │
└───────────┴──────────────────────────────────┘
```

- The app background is `{colors.gray-2}` — the same surface the sidebar sits on. The page is a white panel inset 8px with `{rounded.xl}` corners and a 1px border, layered over it. The sidebar carries no surface or border of its own, so it reads as a frame wrapping around the page rather than a column bolted beside it.
- Below the `shell` breakpoint (52rem) the page goes full-bleed and the sidebar becomes an overlay drawer — there is no column next to it to wrap anything.
- **The top bar belongs to the page panel, not the window.** Docked, it starts beside the sidebar; collapsed, the panel spans the full width so the bar starts at the left edge and grows a reopen toggle. It never sits above the sidebar — the sidebar has its own header at that height.
- **The top bar owns the page title.** The trailing breadcrumb crumb is the page's `<h1>`, rendered at `text-body-medium`. Pages must not render their own heading — a page whose first element is an `<h1>` will duplicate the breadcrumb. (There used to be a `PageHeader` component; it's gone.)
- Everything behind an open modal, drawer, or palette receives `inert`, including the top bar. Follow that when you add a floating surface.

Page bodies are:

```tsx
<div className="px-12 py-6">…</div>            {/* standard */}
<div className="max-w-6xl px-12 py-6">…</div>  {/* card/grid layouts, so they don't stretch full-bleed */}
```

Sidebar state (open/collapsed, expanded groups, width) is server-rendered from cookies in [`layout.tsx`](../src/app/layout.tsx) so there's no hydration flash. That read makes every route dynamic — intentional, don't move it client-side.

## Navigation

The sidebar is where a new section becomes visible to the user, so its rules are part of the design system rather than an implementation detail. [`sidebar.tsx`](../src/components/shell/sidebar.tsx) holds all three of its modes; `SidebarContent` is rendered identically in each.

**Regions**, top to bottom: a `h-12` header (workspace switcher + collapse button), the `h-7` search row that opens the command palette, the scrolling `<nav>` (sections separated by `gap-4`), and a footer separated by `border-t border-border` (settings + account). New destinations go in the `<nav>`; nothing else earns a region.

**Three rows, three meanings** — pick by what the thing *is*, not by how deep it sits:

| Component | Use for | Behavior |
| --- | --- | --- |
| [`NavLink`](../src/components/shell/nav-link.tsx) | a destination | navigates; `aria-current="page"` when active |
| [`NavSection`](../src/components/shell/nav-section.tsx) | a destination that has children | label navigates, chevron expands, `+` adds |
| [`NavFolder`](../src/components/shell/nav-folder.tsx) | grouping that isn't a page | the whole row toggles; no href, ever |

Shared row grammar: `h-7`, `rounded-full`, `gap-2`, active is `bg-interactive-checked` + `text-body-medium`, idle hover is `bg-interactive-hovered`. Nested rows sit inside `treeGuide` (`ml-3 border-l border-gray-5 pl-1`, exported from `nav-folder.tsx`) — use it for every level so the tree lines up, rather than padding rows by hand. Nested `NavLink`s take `indent`, which swaps their label to `text-muted` until hover.

Two behaviors worth copying when you build any dense row:

- **The leading glyph doubles as the disclosure control.** In `NavSection` the section icon cross-fades to a chevron on `group-hover/row` *and* `group-focus-within/row`, so the row shows identity at rest and affordance on approach — one 20px target, not two.
- **Row actions appear on hover.** The `+` button is `opacity-0`, revealed by `group-hover/row:opacity-100` and `focus-visible:opacity-100`. Always both: keyboard users can't hover.

**Modes.** Docked (`shell:` and up, width persisted per user, resizable 200–360px by the [`SidebarRail`](../src/components/shell/sidebar-rail.tsx) — a real `role="separator"` splitter with arrow-key resize, not a styled div). Collapsed leaves the docked column at width 0 and floats a 224px peek panel on left-edge hover, inset and shadowed so it reads as a card over the page. Below `shell` it becomes an `aria-modal` drawer behind a scrim. Section code shouldn't need to know which mode is active — read state from `useSidebar()` rather than measuring.

A section that should reveal itself when the user lands on one of its routes adds an `expandGroup` call in the pathname effect in `sidebar.tsx`; a manual collapse then sticks until the next navigation.

## Layout & Spacing

Spacing follows the 4px scale. Keep the rhythm:

| Distance | Value | Where |
| --- | --- | --- |
| Inside a component | 8px (`gap-2`, `p-2`) | icon-to-label, chip padding |
| Between components in a group | 12–16px (`gap-3`, `gap-4`) | filter row, card grid, form fields |
| Between sections | 24–32px (`mt-6`, `mt-8`) | a page's `<section>`s |
| Page gutter | 48px × 24px (`px-12 py-6`) | the page body |

No decorative whitespace. Spacing is structural, it separates things that need separation, nothing more. When in doubt, go tighter.

Control heights come from a two-step scale: `h-7` (28px) for dense rows and in-panel buttons, `h-8` (32px) for standard buttons, inputs, filters, and tabs. Icon-only buttons are `size-7`. Nothing else.

## Shapes

Surfaces are rounded, not sharp. Pills stay for the things you click directly;
everything that holds content takes a step from the radius scale.

- Nav rows, buttons, badges, tags, avatars, icon buttons, status dots: `{rounded.full}` (9999px)
- Small controls and tags that are not pills: `{rounded.sm}` (4px)
- Inputs and text fields: `{rounded.md}` (6px)
- Cards, menus, popovers: `{rounded.lg}` (8px)
- Page surface, modals, side panels, command palette: `{rounded.xl}` (12px)
- Full-bleed dividers and edge-to-edge lists: `{rounded.none}` (0px)

Use the scale, never a value outside it. When surfaces nest, the inner one takes
the next step down so the corners stay concentric.

## Motion

Motion is feedback, never decoration. It should be felt, not watched.

- Color, background, and opacity changes: 100–150ms, default easing (`transition-colors duration-100`).
- Structural changes (sidebar width, drawer slide, peek panel): 200ms ease-out.
- Entering floating surfaces: `animate-panel-in` (150ms fade, settling down from 4px above at 98% scale); simple reveals: `animate-fade-in`.
- Pressed feedback on icon-only buttons: scale to 0.95 while active. Note: Tailwind v4 compiles scale/rotate to their own CSS properties — transition `scale`/`rotate`, not `transform` (`transition-[background-color,scale]`).
- Hover affordances that appear on demand (a row's `+` button, a chevron replacing an icon) cross-fade at 100–150ms, and must also appear on `group-focus-within` — keyboard users can't hover.
- Never bounce, never spring, nothing longer than 300ms. Every transition and
  animation carries `motion-reduce:transition-none` / `motion-reduce:animate-none`.

## Elevation & Depth

Hierarchy comes from tonal surfaces and borders first, so shadows stay subtle. Use them only for floating surfaces that need to separate from the canvas.

**Dropdown** (`shadow-dropdown`). Dropdowns, popovers, context menus, tooltips, command palette:
`0px 0px 1px 0px rgba(24,26,27,0.04), 0px 3px 6px 0px rgba(24,26,27,0.08), 0px 9px 24px 0px rgba(24,26,27,0.16), 0 0 0 1px rgba(141,141,141,0.24)`

**High** (`shadow-high`). Sidepanels, modals, dialogs, the drawer and peek panel:
`0px 0px 1px 0px rgba(24,26,27,0.04), 0px 3px 6px 0px rgba(24,26,27,0.08), 0px 9px 88px 0px rgba(24,26,27,0.28), 0 0 0 1px rgba(141,141,141,0.24)`

Don't add shadows to cards or static surfaces, only to floating surfaces (dropdowns, modals, panels).

**Layering.** Scrims are `bg-black/20`, never darker. The `layers` block in the frontmatter is the whole scale — a floating surface takes `z-40` with its scrim at `z-30`; a dialog opened *from* that surface takes `z-50` with its scrim at `z-40`; a menu inside a surface stays local (`z-20` with a `fixed inset-0 z-10` click-away catcher). Don't introduce a z value outside those five.

## Component patterns

Copy these. Every string here is in shipped code; the file reference is where to look for the full component including its behavior.

### Buttons

```tsx
// Primary — one per view, for the single most important action.
<button className={cn("h-8 rounded-full bg-gray-12 px-3 text-button text-background hover:opacity-90", focusRing)}>

// Secondary / neutral.
<button className={cn("h-7 rounded-full border border-border px-3 text-button text-gray-12 hover:bg-gray-2", focusRing)}>

// Icon-only — always with an aria-label.
<button aria-label="Close" className={cn(
  "flex size-7 shrink-0 items-center justify-center rounded-full text-icon transition-[background-color,scale] duration-100 hover:bg-interactive-hovered active:scale-95 motion-reduce:transition-none",
  focusRing)}>

// Toggleable filter / segmented control — aria-pressed, not a checkbox.
<button aria-pressed={on} className={cn(
  "flex h-8 items-center gap-1 rounded-full px-3 text-button",
  on ? "bg-interactive-checked text-gray-12" : "text-muted hover:bg-interactive-hovered",
  focusRing)}>
```

Destructive actions aren't in the app yet; when they arrive they take `text-red-11` on the neutral (bordered or ghost) shell, not a solid red fill — red is for the state of a thing, and a filled red button reads as a status badge here.
See [`connector-credential-modal.tsx`](../src/components/connector-credential-modal.tsx), [`connectors-browser.tsx`](../src/components/connectors-browser.tsx).

### Inputs

```tsx
<label className="text-caption text-gray-12">API key</label>
<input className={cn(
  "mt-1 h-8 w-full rounded-md border border-border bg-background px-2 text-body text-gray-12 placeholder:text-placeholder focus:outline-none",
  focusRing)} />
```

`focus:outline-none` is only ever paired with `focusRing` — it kills the browser ring to replace it, never to remove it.

A search field puts the ring on the wrapper so the icon is inside the focused box:

```tsx
<div className={cn("flex h-8 w-64 items-center gap-2 rounded-md border border-border px-2",
  "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring")}>
  <SearchIcon className="shrink-0 text-icon" />
  <input aria-label="Search connectors" placeholder="Search connectors"
    className="w-full min-w-0 bg-transparent text-body text-gray-12 placeholder:text-placeholder focus:outline-none" />
</div>
```

### Lists

The default way to show a collection. Full-bleed rows, hairline dividers, no cards:

```tsx
<div className="divide-y divide-gray-5 border-y border-gray-5">
  <Link className="flex items-baseline gap-4 px-2 py-2 transition-colors duration-100 hover:bg-gray-2 motion-reduce:transition-none">
    <span className="min-w-0 flex-1">
      <span className="block truncate text-body text-gray-12">{title}</span>
      <span className="block truncate text-caption text-muted">{excerpt}</span>
    </span>
    <span className="shrink-0 text-caption text-muted">{meta}</span>
  </Link>
</div>
```

`items-baseline` aligns the primary text with the trailing metadata; every text cell truncates. A settings-style list of toggles uses `border-t border-border py-2 first:border-t-0` on each `<li>` instead of `divide-y`.
See [`knowledge/page.tsx`](../src/app/knowledge/page.tsx), [`processes/page.tsx`](../src/app/processes/page.tsx).

### Cards

Only where a collection needs a logo or a preview — otherwise use a list.

```tsx
<button className={cn("rounded-lg border border-border p-3 text-left hover:bg-gray-2", focusRing)}>
```

In a grid: `grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3`, inside a `max-w-6xl` page.
See [`connector-card.tsx`](../src/components/connector-card.tsx).

### Status

Two forms, one meaning. A pill where status is plain display, a dot where it labels a control:

```tsx
// Pill — tinted background, -11 text.
<span className="shrink-0 rounded-full px-2 py-0.5 text-caption bg-green-9/15 text-green-11">Active</span>
// Dot — inside a button or a row.
<span className="size-1.5 shrink-0 rounded-full bg-green-9" />
```

Map states to tone in one place, next to the type, the way [`connector-status.ts`](../src/lib/connector-status.ts) does — never inline the color at the call site. Green = healthy/active, amber = degraded/paused, red = error, `gray-4`/`gray-6` = absent. Always pair the color with its text label.

### Tabs

```tsx
<div className="flex items-center gap-1 border-b border-border">
  <button role="tab" aria-selected={active} className={cn("h-8 border-b-2 px-1 text-button",
    active ? "border-gray-12 text-gray-12" : "border-transparent text-muted hover:text-gray-12", focusRing)}>
</div>
```

### Menus

```tsx
{open && (
  <>
    <div className="fixed inset-0 z-10" onClick={close} />           {/* click-away */}
    <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-32 rounded-lg border border-border bg-background py-1 shadow-dropdown">
      <button role="menuitem" className={cn("block w-full px-3 py-1.5 text-left text-body text-gray-12 hover:bg-gray-2", focusRing)}>
    </div>
  </>
)}
```

The trigger carries `aria-haspopup="menu"` and `aria-expanded`. See [`connector-detail-panel.tsx`](../src/components/connector-detail-panel.tsx).

### Modals

```tsx
<div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-40 bg-black/20" />
<div role="dialog" aria-modal="true" aria-label={title}
  className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-4 shadow-high">
  <div className="flex items-center justify-between">
    <p className="text-body-medium text-gray-12">{title}</p>
    {/* icon-only close button */}
  </div>
  <div className="mt-4 flex flex-col gap-3">…</div>
</div>
```

### Side panels

The detail view for an item in a list — inset from the viewport edges so it reads as a card, not a docked column:

```tsx
<div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-30 bg-black/20" />
<div role="dialog" aria-modal="true" aria-label={name}
  className="fixed inset-y-2 right-2 z-40 flex w-96 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-high">
  <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3">…</div>
  <div className="flex-1 overflow-y-auto px-4 py-4">…</div>
</div>
```

`overflow-hidden` on the panel plus `overflow-y-auto` on the body — without both, long content escapes the rounded corners. Rows inside the body separate with `mt-3 border-t border-border pt-3`. The header is the one place `text-title` appears.

### Chips, avatars, links

```tsx
// Chip / tag — read-only, no hover.
<li className="rounded-full bg-gray-3 px-3 py-1 text-caption text-gray-11">{skill.name}</li>
// Avatar / logo placeholder — size-6 in nav, size-8 beside a title.
<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-4 text-body-medium text-gray-11">{initial}</span>
// Inline link in prose or a panel.
"text-gray-11 underline decoration-gray-7 underline-offset-2 hover:text-gray-12"
```

### Switches

Use [`<Toggle>`](../src/components/toggle.tsx) — `role="switch"`, `bg-green-9` when on, `bg-gray-6` when off, always with a `label` prop for the accessible name. Don't build checkboxes; a boolean setting in a row is a Toggle.

### Icons

[`src/components/icons.tsx`](../src/components/icons.tsx) — Lucide paths (ISC), rendered at 15px with 1.75 stroke via `IconBase`, `aria-hidden` by default, colored by `currentColor`. Add new ones there by pasting the Lucide path into an `IconBase`; never import an icon package, and never mix stroke widths. Icons sitting beside text take `className="shrink-0 text-icon"`.

15px is the default because it matches the `h-7` row. The one override in the app is the breadcrumb separator at `size={13}`, sized down to sit between 13px labels — treat that as the exception, not a second size to choose from.

`DottedIcon` composes a neutral glyph with an identity color dot for tree rows: the glyph inherits `text-icon`, the dot carries the `label-dots` identity color. That split is the rule — a leading icon never takes an identity color on its stroke *and* a dot.

[`OtoMark`](../src/components/oto-mark.tsx) is the brand mark — an open "O", monochrome via `currentColor`, 16px. It appears once, in the sidebar header. Don't tint it, don't scale it into a page as a decorative element.

### Empty states

A single line of `text-body text-muted` (or `text-caption text-muted` inside a panel), naming the first action: `No settings yet. Connect the back end to manage your workspace.` No illustration, no card, no centered hero.

## Interaction & accessibility

Non-negotiable, because the app is dense and keyboard-heavy:

- **Focus.** Every interactive element composes `focusRing`. Never remove an outline without replacing it.
- **Floating surfaces.** `role="dialog" aria-modal="true"` + an `aria-label`; Escape closes; focus moves in on open (to the first field, else the close button) and returns to the trigger on close — record the trigger before opening, as [`connectors-browser.tsx`](../src/components/connectors-browser.tsx) does with `restoreFocusRef`. Everything behind gets `inert`.
- **Disclosure.** `aria-expanded` + `aria-controls` pointing at the group's id. If the component can render twice on one page (like the sidebar's desktop and drawer copies), prefix those ids per instance.
- **State.** `aria-pressed` for filters, `aria-selected` + `role="tab"` for tabs, `aria-current="page"` for the active nav row, `role="switch" aria-checked` for toggles.
- **Hover-only affordances** must also appear on `group-focus-within`.
- **Motion.** Every `transition-*` gets `motion-reduce:transition-none`, every `animate-*` gets `motion-reduce:animate-none`.
- **Contrast.** Body text is `gray-12`, secondary is `muted`/`gray-11`; `gray-9` and lighter are for placeholders and non-content glyphs only, never for text a user has to read.

## Voice & Content

- Use sentence case for every component label, button, and title.
- Name actions with a verb and a noun (`New person`, `Delete member`), never `Confirm`, `OK`, or a bare verb.
- Write errors as what happened plus what to do next: `CSV import failed. File exceeds 10MB, split it into smaller files and try again.`
- Toasts name the specific thing that changed, drop the trailing period, never say `successfully`: `Contact deleted`, not `Successfully deleted the contact.`
- Empty states point to the first action: `No contacts yet. Connect an account or import contacts.`
- Use the present participle with an ellipsis for in-progress states: `Saving...`, `Importing...`
- Use numerals (`3 contacts`), curly quotes, and the ellipsis character. Skip `please` and marketing superlatives.
- Product vocabulary: they're **processes**, never "projects"; skills are parts of a process, not a top-level thing.

## Adding a new section

Say the section is `Reports`. In order:

1. **Route.** `src/app/reports/page.tsx`, plus `src/app/reports/[slug]/page.tsx` if items have detail pages. Export `metadata` — the root layout's `title.template` appends `· Oto`, so `export const metadata = { title: "Reports" }` is enough. (Same-segment exception: the root `page.tsx` needs `title: { absolute: … }`.) Detail pages use `generateMetadata` with the awaited `params`.
2. **Body.** `<div className="px-12 py-6">`, `max-w-6xl` too if it's a card grid. No `<h1>`.
3. **Breadcrumb.** Add a branch to `crumbsFor()` in [`top-bar.tsx`](../src/components/shell/top-bar.tsx). Ancestors get an `href`, the trailing crumb doesn't; a grouping that isn't a page (a folder) gets a crumb with no href.
4. **Navigation.** Add to `SidebarContent` in [`sidebar.tsx`](../src/components/shell/sidebar.tsx) — see [Navigation](#navigation) for which row component to use. A `<NavSection>` needs a stable `id`: that id is what the expanded-groups cookie persists, so renaming it silently resets everyone's sidebar.
5. **Data.** Until the back end lands, shapes and fixtures go in [`src/lib/mock-data.ts`](../src/lib/mock-data.ts) with the accessors beside them. Preformat dates as display strings so server and client can't disagree on locale.
6. **Components.** Section-specific components go in `src/components/<section>-*.tsx`; anything the shell uses lives in `src/components/shell/`. Client components only where there's state — pages stay server components.
7. **Verify.** `npm run lint` and `npx tsc --noEmit`, then check the section at both sides of the 52rem `shell` breakpoint, with the sidebar collapsed and open, and tab through it once.

## Do's and Don'ts

- Use `{colors.border}` at 1px for all borders. Use `{colors.gray-12}` for primary text, never pure black.
- Pair color with an icon or text label to signal state, never color alone.
- Apply typography tokens instead of setting font size, line height, or weight by hand.
- Keep solid accent color for the single most important action on a view.
- Reach for an existing pattern in [Component patterns](#component-patterns) before composing a new one; when you do compose one, add it there.
- Don't use chromatic color for decoration, only for errors, success, warnings, and state.
- Don't introduce font sizes outside 12/13/20px or weights outside 400/500.
- Don't add shadows to cards or static surfaces, only to floating surfaces (dropdowns, modals, panels).
- Don't invent radii, heights, durations, or z values — take them from the scales above.
- Don't render a page-level `<h1>`; the top bar breadcrumb is the page title.
- Don't hide an affordance behind hover alone — reveal it on `group-focus-within` too.
- Don't add decorative whitespace. Oto is dense.
