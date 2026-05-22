# MonoWeather Design Guide

This document is the source of truth for visual design decisions in MonoWeather. Read it before adding UI, and update it when introducing a new pattern.

The aesthetic is **monospace brutalism**: sharp corners, thick black borders, offset drop shadows, all-caps labels, no rounded surfaces except for explicitly circular UI (loaders, close buttons, scale chips). Everything reads like a control-room printout. Resist softening — no `rounded-lg`, no subtle gradients, no glassmorphism, no light shadows on every card.

---

## 1. Color

### CSS variables (defined at `index.html:27` for light, `:40` for dark)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--accent-color` | `#f97316` (orange-500) | same | All interactive accents, focus, hovers. User-overridable from Settings. |
| `--bg-color` | `#f4f4f5` (zinc-100) | `#18181b` (zinc-900) | Page background |
| `--text-color` | `#18181b` | `#e4e4e7` (zinc-200) | All text and borders |
| `--card-bg` | `rgba(255,255,255,0.95)` | `rgba(24,24,27,0.95)` | Card surfaces, modal, dropdowns |
| `--card-border` | `rgba(0,0,0,0.1)` | `rgba(255,255,255,0.1)` | Subtle dividers, scrollbar thumb, slider track |
| `--handle-bg` / `--handle-text` | inverse of text/bg | inverse | Slider handle |

### Rules

- **Never hard-code `#18181b`, `#e4e4e7`, `#f4f4f5`, or `#f97316` in markup.** Use the variable so theme + accent switching keep working.
- The user picks the accent in Settings. Use `var(--accent-color)`, never the literal `#f97316`, for any element that should follow the accent.
- One exception: chart palettes (§5) use fixed metric-specific colors that do not theme.

---

## 2. Typography

- **Font**: `'Space Mono', monospace` is the only family. Loaded at `index.html:11`. Never introduce a second face.
- **Default weight**: `font-bold`. The design is overwhelmingly bold; plain weight is reserved for body prose inside the modal (`#modal-desc`).
- **All-caps labels with `tracking-widest`** is the dominant pattern for section headers, button labels, chips, and tile titles. Apply both together — never use `tracking-widest` on sentence-case text.
- **Lower-case body**: reserved for paragraph-style explanations (modal descriptions, info pages). Keep this rare.

### Size scale

| Token | Size | Use |
|---|---|---|
| `text-xs` | 0.75 rem | Section labels, captions, hint text under graphs, badges |
| `text-sm` | 0.875 rem | Inline metadata, small body |
| `text-base` | 1 rem | Default body inside info pages |
| `text-lg` | 1.125 rem | Modal description, primary body |
| `text-xl` | 1.25 rem | Card-level headings, tile values |
| `text-2xl` | 1.5 rem | Modal title, page-level headings |
| `text-3xl` | 1.875 rem | Large tile readouts (temp, wind, etc.) |
| `text-5xl` / `text-6xl` | 3 / 3.75 rem | Hero readout in modal (`#modal-value`) |

**Arbitrary sizes:** allowed only for purpose-built micro-labels (compass `N/S/E/W`, etc.). Currently sanctioned values: `text-[0.55rem]` (chart-internal compass), `text-[0.6rem]` (tile compass), `text-[0.7rem]` (chart axes, legend rows). Do **not** introduce other arbitrary sizes — use the scale above. `text-[0.75rem]` is forbidden; use `text-xs` (it's the same value).

### Opacity ladder for muted text

| Class | Meaning |
|---|---|
| `opacity-60` | Default muted — labels, captions, hints |
| `opacity-50` | Modal title (one tick more muted than its hero value) |
| `opacity-70` | Slightly emphasized legend row |
| `opacity-80` | Near-full strength, used sparingly |

Default to `opacity-60`. Use the others only when you have a reason.

---

## 3. Borders

Two widths only:

- **`border-4`** — the brutalist outline. All cards, modal, buttons, inputs, dropdowns, the radar viewport.
- **`border-2`** — internal panes, chart canvases, tooltips, scale chips.

Borders are always `border-[var(--text-color)]`. The one exception: a card accent stripe is achieved with `border-l-[16px] border-l-accent` on top of the 4-px outline (see the main weather card at `index.html:550`). When you need to highlight a card, follow this pattern — do not increase the border width or change its color globally.

**No rounded corners** except: `rounded-full` for circular UI (close button, loader, legend dot chips). Never use `rounded-sm`, `rounded-md`, `rounded-lg`, or `rounded-xl`.

---

## 4. Spacing & layout

Tailwind tokens; no arbitrary values unless absolutely necessary. Common combinations:

| Context | Padding | Gap |
|---|---|---|
| Card body | `p-6` or `p-8` | `gap-4` between groups, `gap-6` between columns |
| Tile/cell | `p-6` | `gap-3` internal |
| Button | `py-3` or `py-4`, `px-4` to `px-8` | — |
| Input | `px-4 py-3` | — |

Vertical rhythm in form-like surfaces: `space-y-5` between input groups, `mb-2` between a label and its control.

---

## 5. Components

### Card (`weather-card` class at `index.html:97`)

```html
<div class="weather-card p-6">
  <!-- title row, value, chart, etc. -->
</div>
```

- 2-px outline with a 6-px left border, 4-px offset drop shadow (`4px 4px 0px var(--card-border)`).
- `.interactive` modifier adds the hover lift (`translate(-2px, -2px)` + larger shadow + accent border).
- Use this for every tile on the home page.

### Hero card (single, top of WEATHER page)

Inline classes at `index.html:550`: `border-4 border-[var(--text-color)] border-l-[16px] border-l-accent bg-[var(--card-bg)] p-8 relative shadow-[8px_8px_0px_rgba(0,0,0,0.1)] mb-12`. The fatter shadow + thick accent stripe is reserved for this one hero element.

### Buttons

Default button:

```html
<button class="px-4 py-3 border-4 border-[var(--text-color)] font-bold tracking-widest transition-colors hover:bg-accent hover:text-white">
  LABEL
</button>
```

- Always `border-4`, always `font-bold`, always `tracking-widest` with an UPPERCASE label.
- Hover state is `bg-accent` + `text-white` — never use a different hover color.
- Sizes vary by context: tile-internal toggle uses `py-3`, primary action uses `py-4` or `py-6`, modal close uses the circular variant below.

Modal close button (circular accent, `index.html:1371`):

```html
<button class="absolute top-4 right-4 h-12 w-12 flex items-center justify-center bg-accent text-white rounded-full hover:scale-110 transition-transform shadow-lg border-2 border-transparent">
  <!-- × svg -->
</button>
```

This is the **only** sanctioned use of `rounded-full` on a button.

### Inputs

```html
<input class="w-full bg-transparent border-4 border-[var(--text-color)] px-4 py-3 font-bold outline-none">
```

For uppercase-canonicalized fields (city search, proxy URL) add `uppercase placeholder:lowercase`. Always `bg-transparent` so the card surface shows through.

### Modal (`<dialog id="detail-modal">`, `index.html:1368`)

Centered with `dialog` CSS at `:287`. 4-px outline, 10-px offset shadow, `rounded-none`, no inner padding on the dialog itself (the inner `<div>` carries `p-8`).

Modal structure is fixed; do not introduce a new modal pattern. Reuse `showDetail()` and write content into `#modal-extra`.

### Shadows

| Use | Value |
|---|---|
| Tiles (`weather-card`) | `4px 4px 0px var(--card-border)` (resting), `6px 6px 0px var(--card-border)` (hover) |
| Hero card, popup tooltips | `4px 4px 0px rgba(0,0,0,0.2)` (Tailwind: `shadow-[4px_4px_0px_rgba(0,0,0,0.2)]`) |
| Hero card outer | `8px 8px 0px rgba(0,0,0,0.1)` |
| Modal | `10px 10px 0px rgba(0,0,0,0.3)` |
| Slider handle | `4px 4px 0px rgba(0,0,0,0.2)` |

No soft `shadow-md` / `shadow-lg` (Tailwind defaults). All shadows are hard offset blocks. The one exception is `shadow-lg` on the modal close button.

### Transitions

`transition-colors` is the default. `transition-transform` for hover-lift and the modal close button. `transition-all` only when multiple unrelated properties animate together. Duration is the Tailwind default; never override unless matching the slider's `cubic-bezier(0.25, 1, 0.5, 1)` motion.

---

## 6. Chart palette

Each metric chart has a dedicated accent. Use hex; do not mix in `rgb()` or `rgba()` for solid colors. When a fill needs translucence, prefer Tailwind opacity classes or `style="background:<hex>; opacity:<n>"` over inline `rgba()`.

| Chart | Color | Hex |
|---|---|---|
| Temp — REAL line | Slate 300 | `#cbd5e1` |
| Temp — FEELS line | Green 300 | `#86efac` |
| Wind | Slate 300 | `#cbd5e1` |
| Humidity | Blue 700 | `#1d4ed8` |
| UV | Purple 500 | `#a855f7` |
| Visibility | Blue 400 | `#60a5fa` |
| Pressure | Yellow 500 | `#eab308` |
| Precipitation | Blue 800 | `#1e40af` |

The user-selected `--accent-color` is for app chrome (buttons, hovers, slider handle), **not** chart data lines. Keep these two palettes separate so accent personalization doesn't break chart legibility.

---

## 7. Iconography

- **Weather Icons** (`wi wi-…`) — the primary weather glyph set. Loaded at `index.html:13`.
- **Tabler Icons** (`ti ti-…`) — reserved for the mobile bottom-nav and small UI affordances. Loaded at `:15`.

Don't add a third icon library. If you need a glyph that's not in either, draw an inline SVG with `currentColor` and a thick stroke (`stroke-width="3"`) to match the brutalist line weight.

---

## 8. Accessibility & state

- All interactive elements must visibly change on hover. `transition-colors` + `hover:bg-accent hover:text-white` is the canonical hover.
- Focus is `outline-none` because the design relies on explicit hover/active state. Don't restore a default focus ring without also restyling it to match (4-px solid `--accent-color`).
- Disabled/loading state: drop opacity to `50`, never `30` or below.

---

## 9. When in doubt

Find the closest existing element and copy its classes verbatim. Consistency beats cleverness. If you genuinely need a new pattern, add it here in the same PR so the next contributor inherits the decision.
