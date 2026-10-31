# Design Tokens & Computed Styles Specification

Extracted directly via Chrome DevTools Protocol (CDP) on `https://nahian.bd` at **1920×1080 viewport, 100% zoom** (`deviceScaleFactor: 1`).

---

## 1. Global Viewport & Base Proportions (at 1920×1080)

At `viewport width >= 1536px` (96rem), the base root scale is `112.5%` (`18px`).
- **Base Root Font Size (`html`):** `18px` (`112.5%`)
- **Page Container Max Width:** `1575px` (`max-w-350` / `87.5rem` = `87.5 × 18px`)
- **Left Sidebar:** `292.5px` (`xl:w-65` / `16.25rem` = `16.25 × 18px`)
- **Main Column (Center):** `877.5px` (`flex-1` fluid = `1575px - 292.5px - 405px`)
- **Right Column:** `405px` (`xl:w-90` / `22.5rem` = `22.5 × 18px`)
- **Dividers:** `1px solid var(--line)` between left sidebar & main, and main & right sidebar

---

## 2. Color System Tokens

### Light Mode (`:root`)
| Token | Computed Hex / CSS Value | Description |
|---|---|---|
| `--surface` | `#ffffff` (`rgb(255, 255, 255)`) | Page background & primary card surface |
| `--surface-2` | `#f7f7f7` (`rgb(247, 247, 247)`) | Hover states, raised gradients, subtle surfaces |
| `--surface-3` | `#efefef` (`rgb(239, 239, 239)`) | Tertiary elements & recessed controls |
| `--line` | `#e8e8e8` (`rgb(232, 232, 232)`) | Subtle column & card divider borders |
| `--line-strong` | `#d6d6d6` (`rgb(214, 214, 214)`) | Active/hover border highlights |
| `--ink` | `#171717` (`rgb(23, 23, 23)`) | Primary high-contrast text |
| `--ink-2` | `#525252` (`rgb(82, 82, 82)`) | Secondary metadata / subheadings |
| `--ink-3` | `#6b6b6b` (`rgb(107, 107, 107)`) | Tertiary muted captions & time stamps |
| `--link` | `#0a7f4f` (`var(--color-brand-600)`) | Interactive accent & brand links |
| `--brand-400` | `#22a86a` (`rgb(34, 168, 106)`) | Button top specular gradient start |
| `--brand-600` | `#0a7f4f` (`rgb(10, 127, 79)`) | Button gradient midtone |
| `--brand-800` | `#075234` (`rgb(7, 82, 52)`) | Button gradient bottom shadow tone |

### Dark Mode (`.dark`)
| Token | Computed Hex / CSS Value | Description |
|---|---|---|
| `--surface` | `#0d0d0e` (`rgb(13, 13, 14)`) | Dark page background |
| `--surface-2` | `#17171a` (`rgb(23, 23, 26)`) | Dark card elevated base |
| `--surface-3` | `#222226` (`rgb(34, 34, 38)`) | Dark card gradient top & hover surface |
| `--line` | `#2b2b30` (`rgb(43, 43, 48)`) | Dark column & card dividers |
| `--line-strong` | `#3d3d43` (`rgb(61, 61, 67)`) | Dark card hover border |
| `--ink` | `#ededed` (`rgb(237, 237, 237)`) | Dark primary text |
| `--ink-2` | `#b4b4b8` (`rgb(180, 180, 184)`) | Dark secondary metadata |
| `--ink-3` | `#9a9aa0` (`rgb(154, 154, 160)`) | Dark tertiary muted labels |
| `--link` | `#57c48c` (`var(--color-brand-300)`) | Dark active link / bright emerald |

---

## 3. Element-by-Element Computed Styles (1920×1080)

### 1. Left Sidebar (`aside:first-child`)
- **Width:** `292.5px` (`16.25rem` / `w-65`)
- **Height:** `1080px` (`h-dvh`, sticky `top-0`)
- **Padding:** `0px 18px 22.5px` (`px-4 pb-5`)
- **Gap:** `flex flex-col justify-between`
- **Border-Right:** `1px solid var(--line)` (`#e8e8e8` light / `#2b2b30` dark)
- **Background:** Transparent (reveals `body` background `#ffffff` / `#0d0d0e`)
- **Active Nav Item:**
  - **Height:** `51.75px` (`2.875rem`)
  - **Padding:** `11.25px 13.5px` (`px-3 py-2.5`)
  - **Border Radius:** `13.5px` (`rounded-xl` = `0.75rem`)
  - **Background (Light):** `rgba(247, 247, 247, 0.7)` (`bg-surface-2/70`)
  - **Background (Dark):** `rgba(34, 34, 38, 0.7)`
  - **Font Size:** `19.125px` (`1.0625rem` = `text-lead`), **Weight:** `600` (semibold), **Color:** `var(--ink)`
- **Inactive Nav Item:**
  - **Padding:** `11.25px 13.5px`
  - **Border Radius:** `13.5px`
  - **Font Size:** `19.125px`, **Weight:** `400` (regular), **Color:** `var(--ink)`
- **Bottom Circular Buttons (Theme, Sound, Collapse):**
  - **Size:** `40.5px × 40.5px` (`size-9` = `2.25rem`)
  - **Border Radius:** `9999px` (`rounded-full`)
  - **Light Background:** `linear-gradient(180deg, #ffffff 0%, #f7f7f7 100%)`
  - **Light Shadow:** `0 0 0 1px #e8e8e8, 0 1px 2px rgba(0,0,0,0.06), 0 4px 12px -4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.7)`
  - **Dark Background:** `linear-gradient(180deg, #222226 0%, #17171a 100%)`
  - **Dark Shadow:** `0 0 0 1px #2b2b30, 0 4px 12px -4px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)`

---

### 2. Main Column (`main`)
- **Width:** `877.5px` (`flex-1`, fluid)
- **Border:** `1px solid var(--line)` on left and right (`border-x border-line`)
- **Padding:** `0px` outer, with child sections having `px-8` (`36px`)
- **Background:** `var(--surface)`

---

### 3. Right Column (`aside:last-child`)
- **Width:** `405px` (`22.5rem` / `w-90`)
- **Height:** `100%` (`sticky top-0 h-dvh`)
- **Padding:** `0px 27px 31.5px` (`px-6 py-7`)
- **Gap between cards:** `36px` (`space-y-8` = `2rem × 1.125 = 2.25rem = 36px` / `margin-bottom: 36px`)
- **Border-Right:** `1px solid var(--line)`

---

### 4. Sticky Header Top Bar
Inside `main` and `right aside` at `top-0 z-20` (both perfectly aligned at `h-17.5`):
- **Height:** `78.75px` (`17.5 × 4.5px` = `4.375rem`)
- **Padding (Main):** `0px 36px` (`px-8`)
- **Padding (Right Aside):** `0px 27px` (`px-6`)
- **Border-Bottom:** `1px solid var(--line)`
- **Background (Light):** `rgba(255, 255, 255, 0.8)` with `backdrop-filter: blur(12px)`
- **Background (Dark):** `rgba(13, 13, 14, 0.8)` with `backdrop-filter: blur(12px)`
- **Contents (Main Sticky):** Avatar `36px` circular (`ring-1 ring-line`), Name `Al Nahian`, Followers label `483 followers on GitHub`, Share button (`40.5px` square `rounded-xl`), and Primary Tactile Button (`Get in touch`).
- **Contents (Right Sticky):** Dark/Obsidian Follow Button (`Follow` with X logo).

---

### 5. Banner (`main > div:nth-child(3)`)
- **Height:** `234px` (`h-52` = `13rem × 18px`)
- **Width:** `875.5px` (100% of main column width minus 2px borders)
- **Border Radius:** `0px` (flush full-width to column edges)
- **Overflow:** `hidden`
- **Effect:** Chunky interactive emerald slats / matrix ripple canvas.

---

### 6. Profile Avatar (`main img.rounded-full`)
- **Width × Height:** `117px × 117px` (`size-26` = `6.5rem × 18px`)
- **Border Radius:** `9999px` (`rounded-full`)
- **Top Margin Overlap:** `-58.5px` (`-mt-13` = `-3.25rem × 18px`)
- **Ring (Light Mode):** `4px solid #ffffff` (`ring-4 ring-surface`)
- **Ring (Dark Mode):** `4px solid #0d0d0e` (`ring-4 ring-surface`)
- **Box Shadow:** `none` (clean white/black ring provides the boundary)

---

### 7. Heading 1 (`h1` Profile Name)
- **Font Size:** `24.75px` (`1.375rem` = `text-title`)
- **Font Weight:** `700` (`font-bold`)
- **Line Height:** `31.5px` (`1.75rem`)
- **Letter Spacing:** `-0.61875px` (`-0.025em` / `tracking-tight`)
- **Margin Top:** `13.5px` (`mt-3` = `0.75rem`)
- **Color:** `#171717` (light) / `#ededed` (dark)

---

### 8. Tagline
- **Font Size:** `19.125px` (`1.0625rem` = `text-lead`)
- **Font Weight:** `400` (`font-normal`)
- **Line Height:** `29.25px` (`1.625rem`)
- **Margin Top:** `4.5px` (`mt-1` = `0.25rem`)
- **Color:** `#171717` (light) / `#ededed` (dark)

---

### 9. Status Chip ("Open to new conversations")
- **Width:** `235.08px`, **Height:** `31.5px`
- **Padding:** `4.5px 13.5px` (`py-1 px-3`)
- **Border Radius:** `9999px` (`rounded-full`)
- **Font Size:** `14.625px` (`0.8125rem` = `text-meta`), **Weight:** `600` (semibold), **Line Height:** `22.5px`
- **Light Mode:**
  - Background: `rgba(15, 148, 89, 0.1)` (`bg-brand-500/10`)
  - Border Ring: `1px solid rgba(15, 148, 89, 0.25)` (`ring-1 ring-brand-500/25`)
  - Text Color: `#08673f` (`text-brand-700`)
- **Dark Mode:**
  - Background: `rgba(15, 148, 89, 0.1)`
  - Border Ring: `1px solid rgba(15, 148, 89, 0.25)`
  - Text Color: `#57c48c` (`text-brand-300`)

---

### 10. Tech Pills (`.pill` / `.ai-pill`)
- **Border Radius:** `9999px` (`rounded-full`)
- **Height:** `29px`
- **Padding:** `3.25px 11.25px 3.25px 9px`
- **Gap:** `5.625px`
- **Font Size:** `14.625px` (`text-meta`), **Weight:** `500` (medium), **Line Height:** `22.5px`
- **Light Mode:**
  - Background: `linear-gradient(180deg, #ffffff 0%, #f7f7f7 100%)`
  - Border: `1px solid #e8e8e8`
  - Box Shadow: `0 1px 2px rgba(0, 0, 0, 0.05)`
  - Text Color: `#171717`
- **Dark Mode:**
  - Background: `linear-gradient(180deg, #222226 0%, #0d0d0e 100%)`
  - Border: `1px solid rgba(255, 255, 255, 0.1)`
  - Box Shadow: `none`
  - Text Color: `#ededed`

---

### 11. Primary Tactile Button ("Get in touch")
- **Height:** `45px` (`h-10` = `2.5rem × 18px`)
- **Padding:** `0px 20.25px` (`px-4.5` = `1.125rem × 18px`)
- **Border Radius:** `13.5px` (`rounded-xl` = `0.75rem × 18px`)
- **Font Size:** `16.875px` (`0.9375rem` = `text-body`), **Weight:** `600`, **Line Height:** `27px`
- **Letter Spacing:** `-0.16875px` (`-0.01em`)
- **Text Color:** `#ffffff`
- **Text Shadow:** `0 1px 0 rgba(0, 0, 0, 0.18)`
- **Background Gradient:**
  `linear-gradient(180deg, #22a86a 0%, #0a7f4f 45%, #075234 100%)`
- **Box Shadow (Tactile Bevel & Specular Glow):**
  `0 0 0 4px rgba(15, 148, 89, 0.14), 0 8px 22px -6px rgba(10, 127, 79, 0.55), inset 0 1px 6px 0 rgba(255, 255, 255, 0.22)`
- **Hover State:**
  `box-shadow: 0 0 0 6px rgba(15, 148, 89, 0.18), 0 12px 28px -6px rgba(10, 127, 79, 0.65), inset 0 1px 6px rgba(255, 255, 255, 0.28)`

---

### 12. Dark / Obsidian Follow Button (Top Bar)
- **Height:** `45px` (`h-10`)
- **Padding:** `0px 20.25px` (`px-4.5`)
- **Border Radius:** `13.5px` (`rounded-xl`)
- **Font Size:** `16.875px`, **Weight:** `600`, **Letter Spacing:** `-0.16875px`
- **Light Mode (`btn-inverse` obsidian):**
  - Text Color: `#ffffff`
  - Background: `linear-gradient(180deg, #4a4a4f 0%, #1c1c1f 45%, #050506 100%)`
  - Box Shadow: `0 0 0 4px rgba(0, 0, 0, 0.06), 0 8px 22px -8px rgba(0, 0, 0, 0.5), inset 0 1px 6px rgba(255, 255, 255, 0.18)`
- **Dark Mode (`btn-inverse` silver gloss):**
  - Text Color: `#0d0d0e`
  - Background: `linear-gradient(180deg, #ffffff 0%, #e9e9ec 50%, #c9c9cf 100%)`
  - Box Shadow: `0 0 0 4px rgba(255, 255, 255, 0.07), 0 8px 22px -8px rgba(255, 255, 255, 0.25), inset 0 1px 6px rgba(255, 255, 255, 0.6)`

---

### 13. Secondary Follow Button ("Who to follow" row)
- **Height:** `36px` (`h-8` = `2rem × 18px`)
- **Padding:** `0px 15.75px` (`px-3.5` = `0.875rem × 18px`)
- **Border Radius:** `13.5px` (`rounded-xl`)
- **Font Size:** `14.625px` (`text-meta`), **Weight:** `600`, **Line Height:** `22.5px`
- **Light Mode:**
  - Text Color: `#171717`
  - Background: `linear-gradient(180deg, #ffffff 0%, #f7f7f7 100%)`
  - Box Shadow: `0 0 0 1px #e8e8e8, 0 1px 2px rgba(0,0,0,0.06), 0 4px 12px -4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.7)`
- **Dark Mode:**
  - Text Color: `#ededed`
  - Background: `linear-gradient(180deg, #222226 0%, #17171a 100%)`
  - Box Shadow: `0 0 0 1px #2b2b30, 0 4px 12px -4px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)`

---

### 14. Right Column Cards

#### Card 1: "Open to new conversations" (`.halo` + `.glass`)
- **Width:** `350px`, **Height:** `189px`
- **Margin Bottom:** `36px`
- **Border Radius:** `27px` (`rounded-3xl` = `1.5rem × 18px`)
- **Padding:** `18px` (`p-4`)
- **Structure:**
  - Outer Wrapper (`.halo`): `relative rounded-3xl`
  - Ambient Glow (`.halo-glow`): `absolute inset-1 blur-[22px] opacity-35 hover:opacity-60 transition-opacity` with rotating conic-gradient beam.
  - Inner Surface (`.glass`):
    - Light Mode: `background: rgba(255, 255, 255, 0.78); backdrop-filter: blur(20px) saturate(1.6);`
      `box-shadow: inset 0 1px rgba(255,255,255,0.6), inset 0 -1px rgba(255,255,255,0.08), 0 18px 40px -24px rgba(0,0,0,0.35);`
    - Dark Mode: `background: rgba(23, 23, 26, 0.72); backdrop-filter: blur(20px) saturate(1.6);`
      `box-shadow: inset 0 1px rgba(255,255,255,0.1), inset 0 -1px rgba(255,255,255,0.03), 0 18px 40px -24px rgba(0,0,0,0.9);`
  - Interactive Hover Spot (`.halo-spot`): `opacity-0 hover:opacity-100 transition-opacity` with radial mint gradient following cursor.
  - "Let's talk" Button: `h-8` (`36px`), `px-3.5` (`15.75px`), `rounded-xl` (`13.5px`), identical green tactile gradient to primary button.

#### Card 2: "Who to follow" (`.card-raised`)
- **Width:** `350px`, **Height:** `328.5px`
- **Margin Bottom:** `36px`
- **Border Radius:** `27px` (`rounded-3xl`)
- **Padding:** `18px` (`p-4`)
- **Light Mode:**
  - Background: `linear-gradient(180deg, #ffffff 0%, #f7f7f7 100%)`
  - Border Ring: `1px solid #e8e8e8`
  - Box Shadow: `0 0 0 1px #e8e8e8, 0 1px 2px rgba(0,0,0,0.05), 0 14px 32px -22px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.7)`
  - Hover: `translate-y-[-2px]`, `box-shadow: 0 0 0 1px #d6d6d6, 0 2px 4px rgba(0,0,0,0.05), 0 22px 40px -22px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.7)`
- **Dark Mode:**
  - Background: `linear-gradient(180deg, #222226 0%, #17171a 100%)`
  - Border Ring: `1px solid #2b2b30`
  - Box Shadow: `0 0 0 1px #2b2b30, 0 14px 32px -22px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)`
  - Hover: `translate-y-[-2px]`, `box-shadow: 0 0 0 1px #3d3d43, 0 22px 40px -22px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.08)`

#### Card 3: "Find me on" (`section`)
- **Width:** `350px`
- **Padding:** `0px` outer, `px-2 py-2` on each row
- **Margin Bottom:** `36px`
- **Items:** 4 social links (GitHub, X, LinkedIn, Facebook) with circular `40.5px` secondary tactile icons and hover highlight `rounded-xl hover:bg-surface-2`.


---

## 5. Precise Fact Cards & Right-Column Computed Styles (CDP Extracted)

### Light Mode Tokens

#### basedInHalo (`DIV` `halo relative rounded-3xl`)
- **Dimensions:** width: `395px`, height: `229.5px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `27px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### basedInGlass (`DIV` `glass h-full overflow-hidden p-5`)
- **Dimensions:** width: `395px`, height: `229.5px`, padding: `22.5px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `color(srgb 1 1 1 / 0.78) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `27px`, shadow: `rgba(255, 255, 255, 0.6) 0px 1px 0px 0px inset, rgba(255, 255, 255, 0.08) 0px -1px 0px 0px inset, rgba(0, 0, 0, 0.35) 0px 18px 40px -24px`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### basedInLabelP (`P` `flex items-center gap-2 text-meta font-medium text-ink-2`)
- **Dimensions:** width: `350px`, height: `22.5px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `500`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(38, 38, 38)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(38, 38, 38)`, radius: `0px`, shadow: `none`
- **Layout:** display: `flex`, alignItems: `center`, justifyContent: `normal`, gap: `9px`

#### basedInLabelIcon (`svg` ``)
- **Dimensions:** width: `18px`, height: `18px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `500`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(10, 127, 79)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(10, 127, 79)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### basedInHeading (`P` `mt-1 text-lead font-semibold`)
- **Dimensions:** width: `350px`, height: `29.25px`, padding: `0px`, margin: `4.5px 0px 0px`
- **Typography:** fontSize: `19.125px`, fontWeight: `600`, lineHeight: `29.25px`, letterSpacing: `normal`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### clockTime (`SPAN` `col-start-1 row-start-1`)
- **Dimensions:** width: `182.34375px`, height: `40.5px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `40.5px`, fontWeight: `700`, lineHeight: `40.5px`, letterSpacing: `-1.0125px`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### clockGmt (`SPAN` `pb-1 text-meta font-medium text-ink-2`)
- **Dimensions:** width: `48.265625px`, height: `27px`, padding: `0px 0px 4.5px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `500`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(38, 38, 38)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(38, 38, 38)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### clockStatus (`P` `mt-2 inline-flex items-center gap-1.5 text-meta text-ink-2`)
- **Dimensions:** width: `139.96875px`, height: `22.5px`, padding: `0px`, margin: `9px 0px 0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `400`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(38, 38, 38)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(38, 38, 38)`, radius: `0px`, shadow: `none`
- **Layout:** display: `inline-flex`, alignItems: `center`, justifyContent: `normal`, gap: `6.75px`

#### moonIcon (`svg` ``)
- **Dimensions:** width: `0px`, height: `0px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `400`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(63, 63, 63)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(63, 63, 63)`, radius: `0px`, shadow: `none`
- **Layout:** display: `none`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### worksCard (`DIV` `card-raised p-5`)
- **Dimensions:** width: `395px`, height: `229.5px`, padding: `22.5px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) linear-gradient(rgb(255, 255, 255) 0%, rgb(247, 247, 247) 100%) repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `27px`, shadow: `rgb(232, 232, 232) 0px 0px 0px 1px, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px, rgba(0, 0, 0, 0.35) 0px 14px 32px -22px, rgba(255, 255, 255, 0.7) 0px 1px 0px 0px inset`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### worksLabelP (`P` `flex items-center gap-2 text-meta font-medium text-ink-2`)
- **Dimensions:** width: `350px`, height: `22.5px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `500`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(82, 82, 82)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(82, 82, 82)`, radius: `0px`, shadow: `none`
- **Layout:** display: `flex`, alignItems: `center`, justifyContent: `normal`, gap: `9px`

#### worksLabelIcon (`svg` ``)
- **Dimensions:** width: `18px`, height: `18px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `500`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(10, 127, 79)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(10, 127, 79)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### worksHeading (`P` `mt-1 text-lead font-semibold`)
- **Dimensions:** width: `350px`, height: `29.25px`, padding: `0px`, margin: `4.5px 0px 0px`
- **Typography:** fontSize: `19.125px`, fontWeight: `600`, lineHeight: `29.25px`, letterSpacing: `normal`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### worksDesc (`P` `mt-1 text-meta text-ink-2`)
- **Dimensions:** width: `350px`, height: `45px`, padding: `0px`, margin: `4.5px 0px 0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `400`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(82, 82, 82)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(82, 82, 82)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### checkChipFirst (`LI` `inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-0.5 text-meta text-ink-2 ring-1 ring-line`)
- **Dimensions:** width: `90.25px`, height: `27px`, padding: `2.25px 9px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `400`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(82, 82, 82)`
- **Surface & Border:** bg: `rgb(247, 247, 247) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(82, 82, 82)`, radius: `6.75px`, shadow: `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(232, 232, 232) 0px 0px 0px 1px, rgba(0, 0, 0, 0) 0px 0px 0px 0px`
- **Layout:** display: `flex`, alignItems: `center`, justifyContent: `normal`, gap: `4.5px`

#### checkChipsUl (`UL` `mt-4 flex flex-wrap gap-1.5`)
- **Dimensions:** width: `350px`, height: `60.75px`, padding: `0px`, margin: `18px 0px 0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `0px`, shadow: `none`
- **Layout:** display: `flex`, alignItems: `normal`, justifyContent: `normal`, gap: `6.75px`

#### languagesCard (`DIV` `card-raised p-5 sm:col-span-2`)
- **Dimensions:** width: `803.5px`, height: `207px`, padding: `22.5px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) linear-gradient(rgb(255, 255, 255) 0%, rgb(247, 247, 247) 100%) repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `27px`, shadow: `rgb(232, 232, 232) 0px 0px 0px 1px, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px, rgba(0, 0, 0, 0.35) 0px 14px 32px -22px, rgba(255, 255, 255, 0.7) 0px 1px 0px 0px inset`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### languagesLabelP (`P` `flex items-center gap-2 text-meta font-medium text-ink-2`)
- **Dimensions:** width: `758.5px`, height: `22.5px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `500`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(82, 82, 82)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(82, 82, 82)`, radius: `0px`, shadow: `none`
- **Layout:** display: `flex`, alignItems: `center`, justifyContent: `normal`, gap: `9px`

#### languagesLabelIcon (`svg` ``)
- **Dimensions:** width: `18px`, height: `18px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `500`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(10, 127, 79)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(10, 127, 79)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### langName (`SPAN` `text-body font-semibold`)
- **Dimensions:** width: `59.3125px`, height: `27px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `16.875px`, fontWeight: `600`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### speakerBtn (`BUTTON` `voice`)
- **Dimensions:** width: `31.5px`, height: `31.5px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(107, 107, 107)`
- **Surface & Border:** bg: `rgb(247, 247, 247) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(107, 107, 107)`, radius: `9999px`, shadow: `rgb(214, 214, 214) 0px 0px 0px 1px`
- **Layout:** display: `grid`, alignItems: `center`, justifyContent: `normal`, gap: `normal`

#### meterSegmentsActive (`SPAN` `h-1.5 flex-1 rounded-full bg-gradient-to-r from-brand-400 to-brand-600`)
- **Dimensions:** width: `43.953125px`, height: `6.75px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) linear-gradient(to right in oklab, rgb(34, 168, 106) 0%, rgb(10, 127, 79) 100%) repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `3.35544e+07px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### meterSegmentsInactive (`SPAN` `h-1.5 flex-1 rounded-full bg-gradient-to-r from-brand-400 to-brand-600`)
- **Dimensions:** width: `43.96875px`, height: `6.75px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) linear-gradient(to right in oklab, rgb(34, 168, 106) 0%, rgb(10, 127, 79) 100%) repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `3.35544e+07px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### levelPill (`SPAN` `badge mt-3`)
- **Dimensions:** width: `115.265625px`, height: `29.25px`, padding: `3.375px 11.25px 3.375px 9px`, margin: `13.5px 0px 0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `500`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(82, 82, 82)`
- **Surface & Border:** bg: `rgb(247, 247, 247) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(82, 82, 82)`, radius: `9999px`, shadow: `rgb(214, 214, 214) 0px 0px 0px 1px, rgba(255, 255, 255, 0.6) 0px 1px 0px 0px inset`
- **Layout:** display: `inline-flex`, alignItems: `center`, justifyContent: `normal`, gap: `7.875px`

#### noteText (`P` `mt-2 text-meta text-ink-3`)
- **Dimensions:** width: `237.828125px`, height: `22.5px`, padding: `0px`, margin: `9px 0px 0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `400`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(107, 107, 107)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(107, 107, 107)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### whoToFollowSection (`SECTION` `card-raised p-4 hover:translate-0`)
- **Dimensions:** width: `350px`, height: `328.5px`, padding: `18px`, margin: `0px 0px 36px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) linear-gradient(rgb(255, 255, 255) 0%, rgb(247, 247, 247) 100%) repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `27px`, shadow: `rgb(232, 232, 232) 0px 0px 0px 1px, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px, rgba(0, 0, 0, 0.35) 0px 14px 32px -22px, rgba(255, 255, 255, 0.7) 0px 1px 0px 0px inset`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### whoRow (`LI` `flex items-center gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2`)
- **Dimensions:** width: `332px`, height: `67.5px`, padding: `9px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `13.5px`, shadow: `none`
- **Layout:** display: `flex`, alignItems: `center`, justifyContent: `normal`, gap: `9px`

#### whoAvatar (`IMG` `rounded-full object-cover size-9 text-meta ring-1 ring-line`)
- **Dimensions:** width: `40.5px`, height: `40.5px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `400`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `3.35544e+07px`, shadow: `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(232, 232, 232) 0px 0px 0px 1px, rgba(0, 0, 0, 0) 0px 0px 0px 0px`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### whoBadge (`SPAN` `absolute grid place-items-center rounded-full bg-surface text-ink shadow-sm ring-2 ring-surface size-4.5 -right-0.5 -bottom-0.5`)
- **Dimensions:** width: `20.25px`, height: `20.25px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgb(255, 255, 255) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `3.35544e+07px`, shadow: `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(255, 255, 255) 0px 0px 0px 2px, rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px`
- **Layout:** display: `grid`, alignItems: `center`, justifyContent: `normal`, gap: `normal`

#### whoName (`SPAN` `block truncate text-body font-semibold`)
- **Dimensions:** width: `174.140625px`, height: `27px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `16.875px`, fontWeight: `600`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### whoRole (`SPAN` `block truncate text-meta text-ink-3`)
- **Dimensions:** width: `174.140625px`, height: `22.5px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `400`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(107, 107, 107)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(107, 107, 107)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### whoFollowBtn (`A` `inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl font-semibold tracking-[-0.01em] whitespace-nowrap select-none btn btn-secondary h-8 px-3.5 text-meta`)
- **Dimensions:** width: `76.859375px`, height: `36px`, padding: `0px 15.75px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `600`, lineHeight: `22.5px`, letterSpacing: `-0.14625px`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) linear-gradient(rgb(255, 255, 255) 0%, rgb(247, 247, 247) 100%) repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `13.5px`, shadow: `rgb(232, 232, 232) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px, rgba(0, 0, 0, 0.1) 0px 4px 12px -4px, rgba(255, 255, 255, 0.7) 0px 1px 0px 0px inset`
- **Layout:** display: `flex`, alignItems: `center`, justifyContent: `center`, gap: `normal`

#### whoFooterLink (`A` `-mx-2 mt-1 flex items-center justify-between gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2`)
- **Dimensions:** width: `332px`, height: `49.5px`, padding: `9px`, margin: `4.5px -9px 0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `13.5px`, shadow: `none`
- **Layout:** display: `flex`, alignItems: `center`, justifyContent: `space-between`, gap: `9px`

#### whoFooterFaces (`SPAN` `facepile [--face:1.75rem] [--overlap:0.5rem]`)
- **Dimensions:** width: `99px`, height: `31.5px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `0px`, shadow: `none`
- **Layout:** display: `flex`, alignItems: `center`, justifyContent: `normal`, gap: `normal`

#### findMeSection (`SECTION` ``)
- **Dimensions:** width: `350px`, height: `355.5px`, padding: `0px`, margin: `0px 0px 36px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### findMeRow (`A` `group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2`)
- **Dimensions:** width: `368px`, height: `67.5px`, padding: `9px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `13.5px`, shadow: `none`
- **Layout:** display: `flex`, alignItems: `center`, justifyContent: `normal`, gap: `13.5px`

#### findMeIconCircle (`SPAN` `btn btn-secondary grid size-9 place-items-center rounded-full`)
- **Dimensions:** width: `40.5px`, height: `40.5px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) linear-gradient(rgb(255, 255, 255) 0%, rgb(247, 247, 247) 100%) repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `3.35544e+07px`, shadow: `rgb(232, 232, 232) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px, rgba(0, 0, 0, 0.1) 0px 4px 12px -4px, rgba(255, 255, 255, 0.7) 0px 1px 0px 0px inset`
- **Layout:** display: `grid`, alignItems: `center`, justifyContent: `normal`, gap: `normal`

#### findMeName (`SPAN` `block text-body font-medium`)
- **Dimensions:** width: `264.5px`, height: `27px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `16.875px`, fontWeight: `500`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### findMeHandle (`SPAN` `block truncate text-meta text-ink-3`)
- **Dimensions:** width: `264.5px`, height: `22.5px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `400`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(107, 107, 107)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(107, 107, 107)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### findMeArrow (`svg` ``)
- **Dimensions:** width: `18px`, height: `18px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### gridContainer (`DIV` `grid gap-3 sm:grid-cols-2`)
- **Dimensions:** width: `803.5px`, height: `450px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(23, 23, 23)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(23, 23, 23)`, radius: `0px`, shadow: `none`
- **Layout:** display: `grid`, alignItems: `normal`, justifyContent: `normal`, gap: `13.5px`


### Dark Mode Tokens

#### basedInHalo (`DIV` `halo relative rounded-3xl`)
- **Dimensions:** width: `395px`, height: `229.5px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `27px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### basedInGlass (`DIV` `glass h-full overflow-hidden p-5`)
- **Dimensions:** width: `395px`, height: `229.5px`, padding: `22.5px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `color(srgb 0.0901961 0.0901961 0.101961 / 0.72) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `27px`, shadow: `rgba(255, 255, 255, 0.1) 0px 1px 0px 0px inset, rgba(255, 255, 255, 0.03) 0px -1px 0px 0px inset, rgba(0, 0, 0, 0.9) 0px 18px 40px -24px`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### basedInLabelP (`P` `flex items-center gap-2 text-meta font-medium text-ink-2`)
- **Dimensions:** width: `350px`, height: `22.5px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `500`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(218, 218, 222)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(218, 218, 222)`, radius: `0px`, shadow: `none`
- **Layout:** display: `flex`, alignItems: `center`, justifyContent: `normal`, gap: `9px`

#### basedInLabelIcon (`svg` ``)
- **Dimensions:** width: `18px`, height: `18px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `500`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(87, 196, 140)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(87, 196, 140)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### basedInHeading (`P` `mt-1 text-lead font-semibold`)
- **Dimensions:** width: `350px`, height: `29.25px`, padding: `0px`, margin: `4.5px 0px 0px`
- **Typography:** fontSize: `19.125px`, fontWeight: `600`, lineHeight: `29.25px`, letterSpacing: `normal`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### clockTime (`SPAN` `col-start-1 row-start-1`)
- **Dimensions:** width: `182.34375px`, height: `40.5px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `40.5px`, fontWeight: `700`, lineHeight: `40.5px`, letterSpacing: `-1.0125px`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### clockGmt (`SPAN` `pb-1 text-meta font-medium text-ink-2`)
- **Dimensions:** width: `48.265625px`, height: `27px`, padding: `0px 0px 4.5px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `500`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(218, 218, 222)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(218, 218, 222)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### clockStatus (`P` `mt-2 inline-flex items-center gap-1.5 text-meta text-ink-2`)
- **Dimensions:** width: `139.96875px`, height: `22.5px`, padding: `0px`, margin: `9px 0px 0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `400`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(218, 218, 222)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(218, 218, 222)`, radius: `0px`, shadow: `none`
- **Layout:** display: `inline-flex`, alignItems: `center`, justifyContent: `normal`, gap: `6.75px`

#### moonIcon (`svg` ``)
- **Dimensions:** width: `0px`, height: `0px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `400`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(196, 196, 202)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(196, 196, 202)`, radius: `0px`, shadow: `none`
- **Layout:** display: `none`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### worksCard (`DIV` `card-raised p-5`)
- **Dimensions:** width: `395px`, height: `229.5px`, padding: `22.5px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) linear-gradient(rgb(34, 34, 38) 0%, rgb(23, 23, 26) 100%) repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `27px`, shadow: `rgb(43, 43, 48) 0px 0px 0px 1px, rgba(0, 0, 0, 0.8) 0px 14px 32px -22px, rgba(255, 255, 255, 0.06) 0px 1px 0px 0px inset`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### worksLabelP (`P` `flex items-center gap-2 text-meta font-medium text-ink-2`)
- **Dimensions:** width: `350px`, height: `22.5px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `500`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(180, 180, 184)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(180, 180, 184)`, radius: `0px`, shadow: `none`
- **Layout:** display: `flex`, alignItems: `center`, justifyContent: `normal`, gap: `9px`

#### worksLabelIcon (`svg` ``)
- **Dimensions:** width: `18px`, height: `18px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `500`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(87, 196, 140)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(87, 196, 140)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### worksHeading (`P` `mt-1 text-lead font-semibold`)
- **Dimensions:** width: `350px`, height: `29.25px`, padding: `0px`, margin: `4.5px 0px 0px`
- **Typography:** fontSize: `19.125px`, fontWeight: `600`, lineHeight: `29.25px`, letterSpacing: `normal`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### worksDesc (`P` `mt-1 text-meta text-ink-2`)
- **Dimensions:** width: `350px`, height: `45px`, padding: `0px`, margin: `4.5px 0px 0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `400`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(180, 180, 184)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(180, 180, 184)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### checkChipFirst (`LI` `inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-0.5 text-meta text-ink-2 ring-1 ring-line`)
- **Dimensions:** width: `90.25px`, height: `27px`, padding: `2.25px 9px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `400`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(180, 180, 184)`
- **Surface & Border:** bg: `rgb(23, 23, 26) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(180, 180, 184)`, radius: `6.75px`, shadow: `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(43, 43, 48) 0px 0px 0px 1px, rgba(0, 0, 0, 0) 0px 0px 0px 0px`
- **Layout:** display: `flex`, alignItems: `center`, justifyContent: `normal`, gap: `4.5px`

#### checkChipsUl (`UL` `mt-4 flex flex-wrap gap-1.5`)
- **Dimensions:** width: `350px`, height: `60.75px`, padding: `0px`, margin: `18px 0px 0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `0px`, shadow: `none`
- **Layout:** display: `flex`, alignItems: `normal`, justifyContent: `normal`, gap: `6.75px`

#### languagesCard (`DIV` `card-raised p-5 sm:col-span-2`)
- **Dimensions:** width: `803.5px`, height: `207px`, padding: `22.5px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) linear-gradient(rgb(34, 34, 38) 0%, rgb(23, 23, 26) 100%) repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `27px`, shadow: `rgb(43, 43, 48) 0px 0px 0px 1px, rgba(0, 0, 0, 0.8) 0px 14px 32px -22px, rgba(255, 255, 255, 0.06) 0px 1px 0px 0px inset`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### languagesLabelP (`P` `flex items-center gap-2 text-meta font-medium text-ink-2`)
- **Dimensions:** width: `758.5px`, height: `22.5px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `500`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(180, 180, 184)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(180, 180, 184)`, radius: `0px`, shadow: `none`
- **Layout:** display: `flex`, alignItems: `center`, justifyContent: `normal`, gap: `9px`

#### languagesLabelIcon (`svg` ``)
- **Dimensions:** width: `18px`, height: `18px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `500`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(87, 196, 140)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(87, 196, 140)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### langName (`SPAN` `text-body font-semibold`)
- **Dimensions:** width: `59.3125px`, height: `27px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `16.875px`, fontWeight: `600`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### speakerBtn (`BUTTON` `voice`)
- **Dimensions:** width: `31.5px`, height: `31.5px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(154, 154, 160)`
- **Surface & Border:** bg: `rgb(23, 23, 26) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(154, 154, 160)`, radius: `9999px`, shadow: `rgb(61, 61, 67) 0px 0px 0px 1px`
- **Layout:** display: `grid`, alignItems: `center`, justifyContent: `normal`, gap: `normal`

#### meterSegmentsActive (`SPAN` `h-1.5 flex-1 rounded-full bg-gradient-to-r from-brand-400 to-brand-600`)
- **Dimensions:** width: `43.953125px`, height: `6.75px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) linear-gradient(to right in oklab, rgb(34, 168, 106) 0%, rgb(10, 127, 79) 100%) repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `3.35544e+07px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### meterSegmentsInactive (`SPAN` `h-1.5 flex-1 rounded-full bg-gradient-to-r from-brand-400 to-brand-600`)
- **Dimensions:** width: `43.96875px`, height: `6.75px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) linear-gradient(to right in oklab, rgb(34, 168, 106) 0%, rgb(10, 127, 79) 100%) repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `3.35544e+07px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### levelPill (`SPAN` `badge mt-3`)
- **Dimensions:** width: `115.265625px`, height: `29.25px`, padding: `3.375px 11.25px 3.375px 9px`, margin: `13.5px 0px 0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `500`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(180, 180, 184)`
- **Surface & Border:** bg: `rgb(34, 34, 38) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(180, 180, 184)`, radius: `9999px`, shadow: `rgb(61, 61, 67) 0px 0px 0px 1px, rgba(255, 255, 255, 0.06) 0px 1px 0px 0px inset`
- **Layout:** display: `inline-flex`, alignItems: `center`, justifyContent: `normal`, gap: `7.875px`

#### noteText (`P` `mt-2 text-meta text-ink-3`)
- **Dimensions:** width: `237.828125px`, height: `22.5px`, padding: `0px`, margin: `9px 0px 0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `400`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(154, 154, 160)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(154, 154, 160)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### whoToFollowSection (`SECTION` `card-raised p-4 hover:translate-0`)
- **Dimensions:** width: `350px`, height: `328.5px`, padding: `18px`, margin: `0px 0px 36px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) linear-gradient(rgb(34, 34, 38) 0%, rgb(23, 23, 26) 100%) repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `27px`, shadow: `rgb(43, 43, 48) 0px 0px 0px 1px, rgba(0, 0, 0, 0.8) 0px 14px 32px -22px, rgba(255, 255, 255, 0.06) 0px 1px 0px 0px inset`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### whoRow (`LI` `flex items-center gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2`)
- **Dimensions:** width: `332px`, height: `67.5px`, padding: `9px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `13.5px`, shadow: `none`
- **Layout:** display: `flex`, alignItems: `center`, justifyContent: `normal`, gap: `9px`

#### whoAvatar (`IMG` `rounded-full object-cover size-9 text-meta ring-1 ring-line`)
- **Dimensions:** width: `40.5px`, height: `40.5px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `400`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `3.35544e+07px`, shadow: `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(43, 43, 48) 0px 0px 0px 1px, rgba(0, 0, 0, 0) 0px 0px 0px 0px`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### whoBadge (`SPAN` `absolute grid place-items-center rounded-full bg-surface text-ink shadow-sm ring-2 ring-surface size-4.5 -right-0.5 -bottom-0.5`)
- **Dimensions:** width: `20.25px`, height: `20.25px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgb(13, 13, 14) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `3.35544e+07px`, shadow: `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(13, 13, 14) 0px 0px 0px 2px, rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px`
- **Layout:** display: `grid`, alignItems: `center`, justifyContent: `normal`, gap: `normal`

#### whoName (`SPAN` `block truncate text-body font-semibold`)
- **Dimensions:** width: `174.140625px`, height: `27px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `16.875px`, fontWeight: `600`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### whoRole (`SPAN` `block truncate text-meta text-ink-3`)
- **Dimensions:** width: `174.140625px`, height: `22.5px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `400`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(154, 154, 160)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(154, 154, 160)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### whoFollowBtn (`A` `inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl font-semibold tracking-[-0.01em] whitespace-nowrap select-none btn btn-secondary h-8 px-3.5 text-meta`)
- **Dimensions:** width: `76.859375px`, height: `36px`, padding: `0px 15.75px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `600`, lineHeight: `22.5px`, letterSpacing: `-0.14625px`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) linear-gradient(rgb(34, 34, 38) 0%, rgb(23, 23, 26) 100%) repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `13.5px`, shadow: `rgb(43, 43, 48) 0px 0px 0px 1px, rgba(0, 0, 0, 0.6) 0px 4px 12px -4px, rgba(255, 255, 255, 0.06) 0px 1px 0px 0px inset`
- **Layout:** display: `flex`, alignItems: `center`, justifyContent: `center`, gap: `normal`

#### whoFooterLink (`A` `-mx-2 mt-1 flex items-center justify-between gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2`)
- **Dimensions:** width: `332px`, height: `49.5px`, padding: `9px`, margin: `4.5px -9px 0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `13.5px`, shadow: `none`
- **Layout:** display: `flex`, alignItems: `center`, justifyContent: `space-between`, gap: `9px`

#### whoFooterFaces (`SPAN` `facepile [--face:1.75rem] [--overlap:0.5rem]`)
- **Dimensions:** width: `99px`, height: `31.5px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `0px`, shadow: `none`
- **Layout:** display: `flex`, alignItems: `center`, justifyContent: `normal`, gap: `normal`

#### findMeSection (`SECTION` ``)
- **Dimensions:** width: `350px`, height: `355.5px`, padding: `0px`, margin: `0px 0px 36px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### findMeRow (`A` `group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2`)
- **Dimensions:** width: `368px`, height: `67.5px`, padding: `9px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `13.5px`, shadow: `none`
- **Layout:** display: `flex`, alignItems: `center`, justifyContent: `normal`, gap: `13.5px`

#### findMeIconCircle (`SPAN` `btn btn-secondary grid size-9 place-items-center rounded-full`)
- **Dimensions:** width: `40.5px`, height: `40.5px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) linear-gradient(rgb(34, 34, 38) 0%, rgb(23, 23, 26) 100%) repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `3.35544e+07px`, shadow: `rgb(43, 43, 48) 0px 0px 0px 1px, rgba(0, 0, 0, 0.6) 0px 4px 12px -4px, rgba(255, 255, 255, 0.06) 0px 1px 0px 0px inset`
- **Layout:** display: `grid`, alignItems: `center`, justifyContent: `normal`, gap: `normal`

#### findMeName (`SPAN` `block text-body font-medium`)
- **Dimensions:** width: `264.5px`, height: `27px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `16.875px`, fontWeight: `500`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### findMeHandle (`SPAN` `block truncate text-meta text-ink-3`)
- **Dimensions:** width: `264.5px`, height: `22.5px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `14.625px`, fontWeight: `400`, lineHeight: `22.5px`, letterSpacing: `normal`, color: `rgb(154, 154, 160)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(154, 154, 160)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### findMeArrow (`svg` ``)
- **Dimensions:** width: `18px`, height: `18px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `0px`, shadow: `none`
- **Layout:** display: `block`, alignItems: `normal`, justifyContent: `normal`, gap: `normal`

#### gridContainer (`DIV` `grid gap-3 sm:grid-cols-2`)
- **Dimensions:** width: `803.5px`, height: `450px`, padding: `0px`, margin: `0px`
- **Typography:** fontSize: `18px`, fontWeight: `400`, lineHeight: `27px`, letterSpacing: `normal`, color: `rgb(237, 237, 237)`
- **Surface & Border:** bg: `rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box`, border: `0px solid rgb(237, 237, 237)`, radius: `0px`, shadow: `none`
- **Layout:** display: `grid`, alignItems: `normal`, justifyContent: `normal`, gap: `13.5px`

