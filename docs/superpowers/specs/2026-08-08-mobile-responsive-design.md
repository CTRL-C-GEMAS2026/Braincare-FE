# Mobile Responsive Layout — Dashboard, History, Upload, Profile, Viewer

## Context

BrainCare (Next.js 16 + React 19 + Tailwind v4) is currently a desktop-only,
fixed-pixel layout: a fixed 76px icon sidebar, fixed-height header, CSS-grid
tables with pixel-ish column templates, and a viewer page that splits the
screen into a theater area (MRI stage) and a fixed 400px side panel. None of
it degrades on narrow (phone-width) viewports — the sidebar eats horizontal
space, table rows overflow, and the viewer's two-pane split has no room to
exist below ~900px wide.

Scope of this spec: make the five authenticated app pages usable on phone
screens — **Dashboard, History, Upload, Profile, Viewer** — plus the shared
`AppLayout` shell (`Sidebar`, `Header`) they all sit inside. The `/login`
page and marketing landing page (`app/page.tsx`) are out of scope.

## Breakpoint strategy

Single cutover at Tailwind's `md` (768px):

- **`< md`** — mobile layout: bottom tab bar navigation, stacked/card
  layouts, single-column forms.
- **`>= md`** — today's existing desktop layout, pixel-for-pixel unchanged.

No intermediate tablet-specific layout is introduced; `md` and above all get
the current desktop treatment as-is.

## App shell

**`components/layout/Sidebar.tsx`**
Wrap the existing sidebar markup with `hidden md:flex` (currently `flex`).
No internal changes.

**`components/layout/BottomNav.tsx`** (new)
Fixed bottom bar, `flex md:hidden`, reusing the same `NAV_ITEMS` list
(Beranda / Unggah / Riwayat) and active-route highlighting logic as
`Sidebar`. Icon above label, same active/inactive color treatment as the
sidebar's current items. Height ~64px including safe-area bottom inset
(`env(safe-area-inset-bottom)`) for notched phones.

`NAV_ITEMS` moves to a small shared module (or `Sidebar` exports it) so both
components consume the same source of truth instead of duplicating the list.

**`app/(app)/layout.tsx`**
Render `<BottomNav />` alongside `<Sidebar />`. The scrollable content
region (`min-h-0 flex-1 overflow-auto`) gets `pb-16 md:pb-0` so the last bit
of page content isn't hidden behind the fixed bottom bar.

**`components/layout/Header.tsx`**
- Horizontal padding `px-4 md:px-7`.
- The profile trigger's hospital-name subtitle (`profile?.hospital`) is
  hidden below `md` (`hidden md:block`) — name + avatar + chevron remain.
- Title text (`titleFor(pathname)`) keeps `truncate` so long case names
  don't force horizontal scroll.

## Dashboard (`app/(app)/dashboard/page.tsx`)

- Page padding `px-4 py-5 md:px-8 md:py-7`.
- Header row (title + "Unggah Pemeriksaan Baru" button): switches from
  `justify-between` on one line to stacking (`flex-col gap-3 md:flex-row
  md:items-end md:justify-between`) so the button doesn't force the title to
  wrap into it.

**`components/dashboard/StatCardsRow.tsx`**
`flex` row of 4 → `grid grid-cols-2 md:flex` below `md`. Replace the
first-item `border-l` divider logic with `divide-x divide-y divide-slate-200
md:divide-y-0` (2×2 grid needs both axes divided; row layout only needs
vertical dividers) so cards read as a clean 2×2 grid instead of touching
without separation.

**`components/dashboard/QueueTable.tsx`** and
**`components/history/HistoryTable.tsx`**
Both currently render a CSS-grid header row + CSS-grid data rows sharing one
`gridTemplateColumns` string. Below `md`:

- The header row (`Pasien | Tanggal | ...` labels) is hidden: `hidden
  md:grid`.
- Each data row switches from `grid` to a stacked card: className becomes
  `flex flex-col gap-2 md:grid`. The row's inline `style={{ gridTemplateColumns:
  COLS }}` stays applied unconditionally — `grid-template-columns` has no
  effect while `display: flex` is active below `md`, and takes over once
  `md:grid` switches `display` back to `grid`, so no JS branching is needed.
- Inside each row, name+MRN stays as the lead line; status/severity (or
  severity/review) badges render on their own `flex gap-2` line; date and
  exam-type/tumor-type become small `text-slate-500` meta text under the
  badges. The trailing chevron (QueueTable) / "Bandingkan" button
  (HistoryTable) moves to the top-right of the card via a small header row
  (`flex items-start justify-between`) instead of trailing off to the right.
- Row padding/border treatment (`border-b`, `px-5 py-4`) stays; only the
  internal arrangement changes.

## History (`app/(app)/history/page.tsx`)

- Page padding matches Dashboard's mobile/desktop split.
- `components/history/SeverityFilterChips.tsx`: wrap in a horizontally
  scrollable container (`flex gap-2 overflow-x-auto pb-1`) so chips that
  don't fit scroll sideways instead of wrapping awkwardly.
- `SearchBar` is unaffected (already `flex-1`, stacks naturally above chips
  since they're separate block-level rows).

## Upload (`app/(app)/upload/page.tsx`)

- Outer wrapper padding `px-4 py-6 md:px-8 md:py-8`.
- Card padding `p-5 md:p-10`.
- Patient-data field grid: `grid-cols-1 sm:grid-cols-2` (currently always
  `grid-cols-2`) — the "Tanggal Periksa" field's `col-span-2` still spans
  correctly at both breakpoints.
- Mode toggle, dropzone, file-ready row, and submit button are already
  full-width flex/block elements — no change needed.

## Profile (`app/(app)/profile/page.tsx`)

- Page padding matches Dashboard's mobile/desktop split.
- Layout grid `grid-cols-[1.7fr_1fr]` → `grid-cols-1 md:grid-cols-[1.7fr_1fr]`,
  so `ProfileCard` stacks above `SecurityCard` on phones.

**`components/profile/ProfileCard.tsx`**
- Outer padding `p-5 md:p-7`.
- Header row (avatar + name/specialty/SIP, or the editing inputs) stays
  `flex items-start gap-5` — already narrow-friendly since the text side is
  `flex-1` and wraps.
- Action buttons row (`Edit Profil` / `Batal` + `Simpan Perubahan`): drop
  `whitespace-nowrap`'s implicit width pressure by allowing wrap on very
  narrow screens — `flex-wrap gap-2.5`.
- "Data Fasilitas Kesehatan" inner grid stays `grid-cols-2`: labels
  (Rumah Sakit / Departemen / Email / Telepon) and typical values are short
  enough to fit two-up at 360px+ widths; not changed.

**`components/profile/SecurityCard.tsx`** — already single-column and
narrow-safe; no changes.

## Viewer (`app/(app)/viewer/[caseId]/page.tsx`)

This is the biggest structural change. Today the post-analysis view is a
single-row flex (`flex min-h-0 flex-1`) splitting theater area (`flex-1`)
and a fixed `w-[400px]` side panel, both relying on the parent's fixed
height to size themselves and scroll independently.

- The row wrapper becomes `flex flex-col md:min-h-0 md:flex-1 md:flex-row`.
  Below `md` it's a normal block-flow column that grows with its content
  instead of being height-constrained — the page scrolls as a whole (the
  `AppLayout` content region is already `overflow-auto`).
- Theater container (`flex min-w-0 flex-1 flex-col bg-theater-950`): image
  area within it gets `h-[45vh] md:h-auto` on the `MriStage` wrapper so
  there's a bounded, sensible height for the MRI image on mobile before the
  panel content continues below.
- Side panel container: `w-full md:w-[400px] md:flex-shrink-0` (currently
  always `w-[400px] flex-shrink-0`), border switches from `border-l` to
  `border-t md:border-l md:border-t-0` since it now sits below, not beside.

**`components/viewer/ViewerHeader.tsx`**
- Padding `px-4 md:px-7`.
- "Ekspor PDF" button: label text wrapped in `hidden md:inline` so only the
  document icon shows on mobile, keeping the button compact next to the
  severity badge.

**`components/viewer/ViewerToolbar.tsx`**
- Outer row: `flex-wrap gap-y-2 md:flex-nowrap` so if chips + zoom controls
  don't fit one line, zoom controls wrap to a second line instead of being
  squeezed or overflowing.
- Chip group: `flex-wrap gap-2` (already `gap-2.5` flex; add wrap).

**`components/viewer/SliceControls.tsx`**
- Progress bar width `w-16 md:w-24` so the absolutely-positioned control
  cluster takes less horizontal room over the (now shorter) mobile image
  area.

**`components/viewer/MriStage.tsx`**, **`NarrativePanel.tsx`**,
**`ReviewPanel.tsx`**, **`AnalyzingState.tsx`** — no structural changes;
they already use relative/flexible sizing (`max-h-[70vh] max-w-full`,
`grid-cols-2` info cards with short labels, full-width buttons). Padding on
`NarrativePanel`/`ReviewPanel` stays as-is (`px-6`), acceptable at 360px+
widths.

## Out of scope

- `/login` page and the public landing page (`app/page.tsx`).
- Any change to desktop (`>= md`) visual output — must remain pixel-identical
  to today.
- Tablet-specific intermediate layout (single cutover at `md` only).
- Touch gestures (pinch-zoom, swipe) for the MRI viewer — zoom stays
  button-driven, same as desktop.

## Testing

Manual verification via the existing Playwright setup or browser dev-tools
device emulation at common phone widths (375px, 390px, 414px) and confirming
`>= md` (e.g. 1024px+) renders unchanged from current behavior. No new
automated tests are required by this spec; existing component behavior
(state, API calls, actions) is untouched — only layout classes change.
