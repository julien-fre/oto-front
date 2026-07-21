---
version: alpha
name: oto
description: Oto's design system, Light theme. Adapted from Folk's design system as the starting reference for Oto's UI — dark theme not yet defined.

colors:
  # Semantic
  background: "#ffffff"
  border: "#d9d9d9"
  muted: "#626262"
  icon: "#626262"
  placeholder: "#8c8c8c"
  focus-ring: "#8ec8f6"
  interactive-hovered: "#0000000e"
  interactive-checked: "#00000016"

  # Gray scale
  gray-1: "#fdfdfd"
  gray-2: "#f9f9f9"
  gray-3: "#f1f1f1"
  gray-4: "#e9e9e9"
  gray-5: "#e1e1e1"
  gray-6: "#d9d9d9"
  gray-7: "#cecece"
  gray-8: "#bbb"
  gray-9: "#8c8c8c"
  gray-10: "#828282"
  gray-11: "#626262"
  gray-12: "#202020"

  # Chromatic — functional use only
  red-9: "#e5484d"
  red-11: "#ce2c31"
  green-9: "#30a46c"
  green-11: "#218358"
  blue-7: "#8ec8f6"
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
    fontWeight: 400
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
- `9`: placeholders and empty interactive text
- `11`: muted text, captions, secondary labels
- `12`: primary text, body, titles, badges

`interactive-hovered` / `interactive-checked` are translucent black overlays, use them for hover states and overlays that layer cleanly over any surface.

Chromatic scales carry meaning only, never decoration. Red for errors, green for success, amber for warnings, blue-7 for focus rings.

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

## Elevation & Depth

Hierarchy comes from tonal surfaces and borders first, so shadows stay subtle. Use them only for floating surfaces that need to separate from the canvas.

**Dropdown.** Dropdowns, popovers, context menus, tooltips, action bar:
`0px 0px 1px 0px rgba(24,26,27,0.04), 0px 3px 6px 0px rgba(24,26,27,0.08), 0px 9px 24px 0px rgba(24,26,27,0.16), 0 0 0 1px rgba(141,141,141,0.24)`

**High.** Sidepanels, modals, dialogs:
`0px 0px 1px 0px rgba(24,26,27,0.04), 0px 3px 6px 0px rgba(24,26,27,0.08), 0px 9px 88px 0px rgba(24,26,27,0.28), 0 0 0 1px rgba(141,141,141,0.24)`

Don't add shadows to cards or static surfaces, only to floating surfaces (dropdowns, modals, panels).

## Shapes

Exactly two border radius values. Everything interactive is pill-shaped. Everything else is sharp.

- Buttons, badges, tags: `{rounded.full}` (9999px)
- Inputs, textareas, and all other elements: `{rounded.none}` (0px)

Never introduce intermediate radius values.

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
