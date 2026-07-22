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

---

# Oto Design System

## Overview

This is adapted from [Folk's design system](https://folk.app) as the starting reference for Oto's UI — same principles, same tokens, reapplied to Oto ("the company brain"). Every decision should reduce visual noise, not add to it. When unsure whether to add an element, a color, or a shadow, don't.

Surfaces stack in gray scale steps separated by hairline borders. Chromatic color signals state only: errors, success, warnings. Spacing is tight and rhythmic. Interactive elements are pill-shaped. Prioritize clarity and density, and use color to signal state or hierarchy, never for decoration.

- **Purposeful**: Optimize for specific journeys. Remove decisions the user shouldn't make.
- **Simple**: Reduce choices, steps, and visual noise. Clarity over minimalism.
- **Predictable**: Same pattern, same language, same behavior everywhere.

## Implementation

The tokens above are wired into Tailwind v4 via `@theme` in [`src/app/globals.css`](../src/app/globals.css):

| Design system token | Tailwind utility |
| --- | --- |
| `colors.gray-1`…`gray-12` | `bg-gray-1`…`bg-gray-12`, `text-gray-*`, `border-gray-*` |
| `colors.red-9` / `red-11` (etc.) | `bg-red-9`, `text-red-11`, … |
| `colors.background`, `border`, `muted`, `icon`, `placeholder`, `focus-ring` | `bg-background`, `border-border`, `text-muted`, … |
| `typography.title` | `text-title` |
| `typography.text` | `text-body` |
| `typography.text-medium` | `text-body-medium` |
| `typography.caption` | `text-caption` |
| `typography.button` | `text-button` |
| `rounded.none` / `rounded.full` | Tailwind defaults, no change needed: `rounded-none`, `rounded-full` |
| `spacing.*` | Tailwind defaults, no change needed: the default 4px scale already matches (`p-1` = 4px … `p-12` = 48px) |
| Dropdown / High shadows | `shadow-dropdown`, `shadow-high` |

`text-title` currently renders with the `text` utility's font family (Inter var) rather than Uxum Grotesque — Folk's display font isn't licensed for Oto. Swap `--font-title` in `globals.css` once a display font is chosen.

## Colors

The app background is white (`{colors.background}` #ffffff). Each gray scale step encodes intent:
- `1`–`2`: subtle backgrounds. `2` for hover on large surfaces (tables, lists, search)
- `3`: hover state for most interactive components. Also used as background for banners.
- `4`: active/selected state
- `5`: structural borders and separators
- `6`: interactive borders, inputs, textareas, checkboxes, neutral CTAs
- `7`: hover of `6`
- `9`: placeholders and empty interactive text — for text, use the `placeholder` token (#6d7078), darkened off this step to clear WCAG AA
- `11`: muted text, captions, secondary labels
- `12`: primary text, body, titles, badges

`interactive-hovered` / `interactive-checked` are translucent black overlays, use them for hover states and overlays that layer cleanly over any surface.

Chromatic scales carry meaning only, never decoration. Red for errors, green for success, amber for warnings, blue-9 for focus rings (blue-7 is too light to meet the 3:1 non-text contrast minimum against white or gray-2).

## Typography

Inter var sets everything: titles, labels, body, buttons, captions — until Oto has its own display font, `title` also renders in Inter var (see [Implementation](#implementation)). The `typography` tokens above carry concrete `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, and `letterSpacing`.

- `title`: 20px, for page headers and section titles only. Never for body copy or labels.
- `text`: 13px regular, the default for all running text, field values, and descriptions.
- `text-medium`: 13px medium, for emphasized labels, active nav items, and selected states. Use it to signal hierarchy within the same size, not to introduce a new size.
- `caption`: 12px, for metadata, counts, timestamps, and secondary information.
- `button`: 13px, for all button labels and compact controls.

`text` and `text-medium` cover most of the interface, the distinction between them is weight, not size. Two sizes (13px and 12px) handle everything below the title level. Never introduce intermediate sizes.

## Layout & Spacing

Spacing follows a 4px scale: 4, 8, 12, 16, 24, 32, 40px. Keep a three-step rhythm: 8px inside a component, 16px between components in a group, 32–40px between sections.

No decorative whitespace. Spacing is structural, it separates things that need separation, nothing more. When in doubt, go tighter.

## Motion

Motion is feedback, never decoration. It should be felt, not watched.

- Color, background, and opacity changes: 100–150ms, default easing (`transition-colors duration-100`).
- Structural changes (sidebar width, drawer slide): 200ms ease-out.
- Entering floating surfaces: `animate-panel-in` (150ms fade, settling down from 4px above at 98% scale); simple reveals: `animate-fade-in`.
- Pressed feedback on icon-only buttons: scale to 0.95 while active. Note: Tailwind v4 compiles scale/rotate to their own CSS properties — transition `scale`/`rotate`, not `transform`.
- Never bounce, never spring, nothing longer than 300ms. Every transition and
  animation carries `motion-reduce:transition-none` / `motion-reduce:animate-none`.

## Elevation & Depth

Hierarchy comes from tonal surfaces and borders first, so shadows stay subtle. Use them only for floating surfaces that need to separate from the canvas.

**Dropdown.** Dropdowns, popovers, context menus, tooltips, action bar:
`0px 0px 1px 0px rgba(24,26,27,0.04), 0px 3px 6px 0px rgba(24,26,27,0.08), 0px 9px 24px 0px rgba(24,26,27,0.16), 0 0 0 1px rgba(141,141,141,0.24)`

**High.** Sidepanels, modals, dialogs:
`0px 0px 1px 0px rgba(24,26,27,0.04), 0px 3px 6px 0px rgba(24,26,27,0.08), 0px 9px 88px 0px rgba(24,26,27,0.28), 0 0 0 1px rgba(141,141,141,0.24)`

Don't add shadows to cards or static surfaces, only to floating surfaces (dropdowns, modals, panels).

## Shapes

Surfaces are rounded, not sharp. Pills stay for the things you click directly;
everything that holds content takes a step from the radius scale.

- Nav rows, buttons, badges, tags, avatars, icon buttons: `{rounded.full}` (9999px)
- Small controls and tags that are not pills: `{rounded.sm}` (4px)
- Inputs and text fields: `{rounded.md}` (6px)
- Cards, menus, popovers: `{rounded.lg}` (8px)
- Page surface, modals, side panels, command palette: `{rounded.xl}` (12px)
- Full-bleed dividers and edge-to-edge lists: `{rounded.none}` (0px)

Use the scale, never a value outside it. When surfaces nest, the inner one takes
the next step down so the corners stay concentric.

## The page surface

The app background is `{colors.gray-2}` — the same surface the sidebar sits on. The
page is a white panel inset 8px from the edges with `{rounded.xl}` corners and a 1px
border, layered over that background. The sidebar carries no surface or border of its
own, so it reads as a frame wrapping around the page rather than a column bolted
beside it. Below the shell breakpoint the page goes full-bleed, since there is no
sidebar next to it to wrap anything.

## Voice & Content

- Use sentence case for every component label, button, and title.
- Name actions with a verb and a noun (`New person`, `Delete member`), never `Confirm`, `OK`, or a bare verb.
- Write errors as what happened plus what to do next: `CSV import failed. File exceeds 10MB, split it into smaller files and try again.`
- Toasts name the specific thing that changed, drop the trailing period, never say `successfully`: `Contact deleted`, not `Successfully deleted the contact.`
- Empty states point to the first action: `No contacts yet. Connect an account or import contacts.`
- Use the present participle with an ellipsis for in-progress states: `Saving...`, `Importing...`
- Use numerals (`3 contacts`), curly quotes, and the ellipsis character. Skip `please` and marketing superlatives.

## Do's and Don'ts

- Use `{colors.border}` at 1px for all borders. Use `{colors.gray-12}` for primary text, never pure black.
- Pair color with an icon or text label to signal state, never color alone.
- Apply typography tokens instead of setting font size, line height, or weight by hand.
- Keep solid accent color for the single most important action on a view.
- Don't use chromatic color for decoration, only for errors, success, and warnings.
- Don't introduce font sizes outside 12/13/20px or weights outside 400/500.
- Don't add shadows to cards or static surfaces, only to floating surfaces (dropdowns, modals, panels).
- Don't use intermediate border radius values, only `none` or `full`.
- Don't add decorative whitespace. Oto is dense.
