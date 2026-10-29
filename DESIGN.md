# AE Survey — Design System (`DESIGN.md`)

## 1. Visual Direction & Architectural Move (`Framed Sheet` App Specification)
- **Style:** Framed-Sheet Operational Workspace (`taste-skill` App Specification × `impeccable` Operate Mode)
- **The Move:** One low-chroma botanical stone frame (`#F4F6F4`) holds the `48px` top navigation bar; the working canvas sits on a crisp `#FFFFFF` sheet inset `8px` from the window's edges with `16px` corners, a `1px solid #E4E7E4` hairline edge, and **zero resting drop-shadow**.
- **Color Budget:** Under 3% saturated pixels. The brand hue (`#247B50`, `5.2:1` contrast on white) is reserved for the wordmark, the `2px` active tab underline, and primary data series; primary action buttons use near-black canopy ink (`#141A17`).

## 2. Foundations & Color Tokens
- **Chrome Ground (`--ground`):** `#F4F6F4` — Low-chroma green-stone frame (never yellow/Claude cream `#FAF9F5`).
- **Sheet & Panel Surface (`--surface`):** `#FFFFFF` with `1px solid #E4E7E4` panel borders and `#EFEFEF` internal table/list rules.
- **Raised Tray / Well (`--raised`):** `#F8F9F8` — Used for the Overview usage tray, Builder question option wells, and table sub-headers.
- **Control Border (`--control`):** `#CFD5D0` — One step stronger than panel borders so interactive inputs and buttons read clearly without shadows.
- **Primary Action Fill (`--primary`):** `#141A17` with `#FFFFFF` label.
- **Brand & Primary Data Series (`--accent` / `--positive`):** `#247B50` (WCAG AA `5.2:1` on white).
- **Text Hierarchy (All tiers pass WCAG AA `4.5:1`):**
  - **Primary (`--text`):** `#111613` (`17.8:1`)
  - **Secondary (`--muted`):** `#525B56` (`6.9:1`)
  - **Tertiary / Placeholders (`--faint`):** `#646E68` (`5.1:1`)
- **Semantic Status Pills (`16–22px` height, pale tint + dark ink of same hue):**
  - **Synced / Active:** `#DCFAE5` background with `#04250E` text
  - **Queued Offline / Draft:** `#FFFBEB` background with `#92400E` text
  - **Error / Destructive:** `#FFEDEA` background with `#831C1E` text

## 3. Typography & Numeric Discipline
- **Workhorse UI & Data Face:** `'Plus Jakarta Sans', system-ui, sans-serif` (400, 500, 600, 700) with `font-variant-numeric: tabular-nums` enforced on all KPIs, table cells, timestamps, coordinates, and yield metrics.
- **Respondent Greeting Face (Single Job):** `'Fraunces', Georgia, serif` (600 weight) used strictly once on the Respondent Survey Runner header (`Collect / Kiosk`) where editorial warmth belongs.
- **Literal Code & Record IDs:** `<code>` elements only (for `Code.gs`, `Resp_<id>`, and `clientResponseId` keys); never used as a decorative "technical costume" on UI numbers or badges.
- **Case & Scale:** Sentence case across all table headers (`12px`), KPI labels (`12px`), and form labels (`12–14px`). Zero uppercase letter-spaced micro-labels.

## 4. Anti-Slop Rules & Motion Polish (`emil-design-eng` & `animate`)
- **Zero AI-Slop Furniture:** No marketing hero banners inside the workspace, no eyebrow pills above headings, no icons in tinted squares/circles (`icon-chips`), no resting card box-shadows, and no decorative `01 / 02 / 03` numbering.
- **Divided KPI Strips:** KPIs sit inside a single flat container split by `1px solid #EFEFEF` hairlines; the primary figure leads at `28px` and sibling figures sit at `22px` with explicit baselines.
- **Transitions & Press Feedback:** Explicit property transitions (`transform 150ms cubic-bezier(0.23, 1, 0.32, 1), opacity 150ms cubic-bezier(0.23, 1, 0.32, 1)`), subtle `:active` `scale(0.98)` press feedback on buttons, hover states gated behind `@media (hover: hover) and (pointer: fine)`, and full `@media (prefers-reduced-motion: reduce)` support.

## 5. Enterprise Glassmorphism Specification (`glassmorphism` & `awesome-design`)
- **Architectural Scope:** Glassmorphism is strictly applied to **dynamic overlay layers** (app chrome, modals, toasts, and geospatial map HUD controls), never to dense data tables, chart series, or form inputs.
- **Opacity Floor (WCAG AA):** Light glass background opacity must remain `>= 0.82` (`rgba(255, 255, 255, 0.88)` standard, `>= 0.94` on modals); dark glass must remain `>= 0.88` (`rgba(20, 26, 23, 0.88)`). All text retains 100% opacity with `>= 7:1` operational contrast.
- **Optical Boundaries:** Every frosted acrylic surface is demarcated by a physical hairline edge (`1px solid rgba(228, 231, 228, 0.85)` or specular white `rgba(255, 255, 255, 0.90)`), ensuring clear perimeter definition even when overlay luminance matches background sheet luminance.
- **Single-Layer Blur Rule:** Nested `backdrop-filter` layers are strictly prohibited to prevent GPU fill-rate degradation on Android field tablets. Blurs are capped at `<= 16px`.
- **Field Sunlight Neutralization:** When Outdoor Sunlight Mode is active (`body.ae-sunlight`), all blurs and translucencies automatically collapse to 100% solid `#FFFFFF` with high-contrast `#000000` boundaries for zero-glare outdoor readability.
- **Reduced Transparency:** Full compliance with `@media (prefers-reduced-transparency: reduce)` stripping blurs and serving solid high-contrast surfaces.
