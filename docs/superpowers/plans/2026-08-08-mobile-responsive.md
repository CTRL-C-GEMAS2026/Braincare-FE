# Mobile Responsive Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Dashboard, History, Upload, Profile, and Viewer usable on phone-width screens, without changing desktop (`>= md`) rendering at all.

**Architecture:** Pure Tailwind CSS class changes (`md:` responsive prefixes) plus one new component (`BottomNav`). No new dependencies, no changes to data fetching, state, or business logic — only `className` values and, in three table components, a `display: contents` regrouping trick that lets the same DOM nodes serve both a CSS-grid desktop row and a stacked flex-col mobile card.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, clsx. No test runner is wired up in this repo (Playwright is a devDependency but has no config/spec files) — verification is `tsc --noEmit` + `eslint` + manual browser check at mobile and desktop widths.

## Global Constraints

- Single breakpoint cutover at Tailwind's `md` (768px). `< md` = mobile layout, `>= md` = today's desktop layout.
- Desktop (`>= md`) visual output must remain pixel-identical to current behavior — every mobile-only class must be scoped so it has no effect at `md`+ (either the class itself is reverted with an `md:` override, or it's additive and harmless at `md`+).
- No new npm dependencies.
- `/login` (`app/(auth)/login/page.tsx`) and the landing page (`app/page.tsx`) are out of scope — do not touch them.
- No automated tests exist in this repo; do not add a test framework as part of this work. Verification is `npx tsc --noEmit`, `npm run lint`, and manual browser checks (see each task).
- Source spec: `docs/superpowers/specs/2026-08-08-mobile-responsive-design.md`.

---

### Task 1: App shell — BottomNav + Sidebar/Header/AppLayout

**Files:**
- Modify: `components/layout/Sidebar.tsx`
- Create: `components/layout/BottomNav.tsx`
- Modify: `components/layout/Header.tsx`
- Modify: `app/(app)/layout.tsx`

**Interfaces:**
- Produces: `NAV_ITEMS` becomes an exported `const` from `components/layout/Sidebar.tsx` — `{ href: string; label: string; icon: string }[]` — consumed by `BottomNav.tsx`.
- Produces: `BottomNav` — a zero-prop component exported from `components/layout/BottomNav.tsx`, rendered by `app/(app)/layout.tsx`.

- [ ] **Step 1: Export `NAV_ITEMS` and hide the sidebar below `md`**

Edit `components/layout/Sidebar.tsx`:

```tsx
export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Beranda', icon: 'M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6V11h-6v9zm0-16v5h6V4h-6z' },
  { href: '/upload', label: 'Unggah', icon: 'M12 16V4m0 0l-4 4m4-4l4 4M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3' },
  { href: '/history', label: 'Riwayat', icon: 'M12 8v4l3 3M4 12a8 8 0 108-8' },
];
```

(add `export` — the array contents are unchanged)

And change the root `<div>` className from:

```tsx
<div className="flex w-[76px] flex-shrink-0 flex-col items-center gap-7 border-r border-slate-200 bg-slate-50 py-5">
```

to:

```tsx
<div className="hidden w-[76px] flex-shrink-0 flex-col items-center gap-7 border-r border-slate-200 bg-slate-50 py-5 md:flex">
```

- [ ] **Step 2: Create `BottomNav`**

Create `components/layout/BottomNav.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { NAV_ITEMS } from './Sidebar';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 flex h-16 flex-shrink-0 items-stretch justify-around border-t border-slate-200 bg-white md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex flex-1 flex-col items-center justify-center gap-1',
              active ? 'text-brand-600' : 'text-slate-500'
            )}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d={item.icon} />
            </svg>
            <div className="text-[10px] font-semibold">{item.label}</div>
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Wire `BottomNav` into the app layout and reserve space for it**

Edit `app/(app)/layout.tsx`. Add the import:

```tsx
import { BottomNav } from '@/components/layout/BottomNav';
```

Change the return block from:

```tsx
  return (
    <div className="flex h-screen w-full overflow-hidden bg-white text-slate-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
```

to:

```tsx
  return (
    <div className="flex h-screen w-full overflow-hidden bg-white text-slate-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <div className="min-h-0 flex-1 overflow-auto pb-16 md:pb-0">{children}</div>
      </div>
      <BottomNav />
    </div>
  );
```

- [ ] **Step 4: Trim the header for mobile**

Edit `components/layout/Header.tsx`. Change the root className from:

```tsx
<div className="flex h-15 h-[60px] flex-shrink-0 items-center justify-between border-b border-slate-200 px-7">
```

to:

```tsx
<div className="flex h-15 h-[60px] flex-shrink-0 items-center justify-between border-b border-slate-200 px-4 md:px-7">
```

Change the hospital subtitle line from:

```tsx
<div className="text-[11px] text-slate-500">{profile?.hospital}</div>
```

to:

```tsx
<div className="hidden text-[11px] text-slate-500 md:block">{profile?.hospital}</div>
```

- [ ] **Step 5: Type-check, lint, and visually verify**

Run:

```bash
npx tsc --noEmit
npm run lint
```

Expected: both pass with no errors.

Start the dev server (`npm run dev`), open `/dashboard` in a browser:

- At a 375px-wide viewport: sidebar is gone, a bottom bar with Beranda/Unggah/Riwayat icons is fixed at the bottom, the active tab is highlighted in brand blue, page content isn't hidden behind the bar, header shows avatar without the hospital name line.
- At a 1280px-wide viewport: sidebar is back on the left exactly as before, no bottom bar, header shows the hospital name line — i.e. identical to the current `main` branch behavior.

- [ ] **Step 6: Commit**

```bash
git add components/layout/Sidebar.tsx components/layout/BottomNav.tsx components/layout/Header.tsx "app/(app)/layout.tsx"
git commit -m "feat: add mobile bottom nav and responsive app shell"
```

---

### Task 2: Dashboard page

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`
- Modify: `components/dashboard/StatCardsRow.tsx`
- Modify: `components/ui/StatCard.tsx`
- Modify: `components/dashboard/QueueTable.tsx`

**Interfaces:**
- Modifies: `StatCard` props — the `first?: boolean` prop and its border-l logic are removed (no longer needed; replaced by a gap+background grid-line technique that works identically in row and grid layouts). Update both call sites in `StatCardsRow.tsx`.

- [ ] **Step 1: Page padding and header row stacking**

Edit `app/(app)/dashboard/page.tsx`. Change:

```tsx
    <div className="max-w-[1200px] px-8 py-7">
      <div className="mb-5 flex items-end justify-between">
```

to:

```tsx
    <div className="max-w-[1200px] px-4 py-5 md:px-8 md:py-7">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
```

- [ ] **Step 2: StatCardsRow — 2×2 grid on mobile, row on desktop**

Edit `components/ui/StatCard.tsx`. Remove the `first` prop and its border logic. Change:

```tsx
export function StatCard({
  label,
  value,
  icon,
  iconBg,
  valueClassName,
  first,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  iconBg: string;
  valueClassName?: string;
  first?: boolean;
}) {
  return (
    <div
      className={clsx(
        'flex flex-1 items-center gap-3.5 px-5 py-4.5 py-[18px]',
        !first && 'border-l border-slate-200'
      )}
    >
```

to:

```tsx
export function StatCard({
  label,
  value,
  icon,
  iconBg,
  valueClassName,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  iconBg: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-1 items-center gap-3.5 bg-white px-5 py-4.5 py-[18px]">
```

(`clsx` stays imported — it's still used below for the icon wrapper and value `div` in this same file, only the outer wrapper's conditional class goes away)

Edit `components/dashboard/StatCardsRow.tsx`. Change the wrapper and drop the `first` prop from the first card:

```tsx
  return (
    <div className="mb-6 flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <StatCard
        first
        label="Total Pemeriksaan"
```

to:

```tsx
  return (
    <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-card md:flex">
      <StatCard
        label="Total Pemeriksaan"
```

(the parent's `bg-slate-200` shows through the `gap-px` gutters as 1px divider lines between cards — in both the 2×2 mobile grid and the desktop row — while each `StatCard`'s own `bg-white` covers the rest. This replaces the old `!first && border-l` approach, which only drew a correct line in a single row and would have misplaced borders in a 2-column grid.)

- [ ] **Step 3: QueueTable — stacked cards on mobile**

Edit `components/dashboard/QueueTable.tsx`. Change the header row from:

```tsx
      <div
        className="grid gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
        style={{ gridTemplateColumns: COLS }}
      >
```

to:

```tsx
      <div
        className="hidden gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid"
        style={{ gridTemplateColumns: COLS }}
      >
```

Change the row rendering from:

```tsx
          <div
            key={c.id}
            onClick={() => router.push(`/viewer/${c.id}?from=dashboard`)}
            className="grid cursor-pointer items-center gap-4 border-b border-slate-100 px-5 py-4 transition-colors last:border-b-0 hover:bg-slate-50"
            style={{ gridTemplateColumns: COLS }}
          >
            <div>
              <div className="text-sm font-semibold">{c.name}</div>
              <div className="mt-0.5 text-xs text-slate-500">{c.mrn}</div>
            </div>
            <div className="font-mono text-[13px] text-slate-700">{c.examDate}</div>
            <div className="text-[13px] text-slate-700">MRI Otak (T1/T2/FLAIR)</div>
            <div>
              <Badge label={st.label} className={st.className} />
            </div>
            <div>
              <Badge label={sev.label} className={sev.className} />
            </div>
            <div className="text-slate-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </div>
```

to:

```tsx
          <div
            key={c.id}
            onClick={() => router.push(`/viewer/${c.id}?from=dashboard`)}
            className="relative flex cursor-pointer flex-col gap-2 border-b border-slate-100 py-4 pl-5 pr-11 transition-colors last:border-b-0 hover:bg-slate-50 md:grid md:items-center md:gap-4 md:pr-5"
            style={{ gridTemplateColumns: COLS }}
          >
            <div>
              <div className="text-sm font-semibold">{c.name}</div>
              <div className="mt-0.5 text-xs text-slate-500">{c.mrn}</div>
            </div>
            <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500 md:contents">
              <span className="font-mono md:text-[13px] md:text-slate-700">{c.examDate}</span>
              <span className="md:text-[13px] md:text-slate-700">· MRI Otak (T1/T2/FLAIR)</span>
            </div>
            <div className="flex gap-2 md:contents">
              <Badge label={st.label} className={st.className} />
              <Badge label={sev.label} className={sev.className} />
            </div>
            <div className="absolute right-4 top-4 text-slate-400 md:static">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </div>
```

How this works: `COLS` (`'1.6fr 1fr 1fr 1fr 1fr 40px'`) still applies via the inline `style`, but only takes effect once `md:grid` switches `display` to `grid` — below `md` the row is `flex flex-col` and the style has no effect. `md:contents` on the date/type and badges wrapper `div`s makes those wrappers disappear from layout at `md`+, promoting their children to be direct grid items in the same order as before, so the desktop 6-column grid is unchanged. Below `md`, those same wrappers are normal `flex` rows, grouping the date+type and the two badges onto their own lines. The trailing chevron is pulled out of flow with `absolute` on mobile (top-right of the card, off to the side of the name) and returns to `static` (normal grid flow, last column) at `md`+; `pr-11` on the row reserves room for it on mobile, `md:pr-5` restores the original edge padding at `md`+.

- [ ] **Step 4: Type-check, lint, and visually verify**

```bash
npx tsc --noEmit
npm run lint
```

Expected: pass with no errors.

In the browser at 375px on `/dashboard`: stat cards show as a 2×2 grid with thin dividers, each queue row is a card (name/MRN on top, chevron top-right, status+severity badges on one line, date · exam type as small gray text), the column header row is gone, tapping a card still navigates to the viewer.

At 1280px: stat cards are back in a single row with vertical dividers, the queue table looks exactly like it did before this change (header row visible, 6-column grid rows).

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/dashboard/page.tsx" components/dashboard/StatCardsRow.tsx components/ui/StatCard.tsx components/dashboard/QueueTable.tsx
git commit -m "feat: make dashboard page responsive on mobile"
```

---

### Task 3: History page

**Files:**
- Modify: `app/(app)/history/page.tsx`
- Modify: `components/history/SeverityFilterChips.tsx`
- Modify: `components/history/HistoryTable.tsx`

- [ ] **Step 1: Page padding**

Edit `app/(app)/history/page.tsx`. Change:

```tsx
    <div className="max-w-[1200px] px-8 py-7">
```

to:

```tsx
    <div className="max-w-[1200px] px-4 py-5 md:px-8 md:py-7">
```

- [ ] **Step 2: Severity chips scroll horizontally instead of wrapping awkwardly**

Edit `components/history/SeverityFilterChips.tsx`. Change:

```tsx
    <div className="mb-5 flex gap-2">
```

to:

```tsx
    <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
```

- [ ] **Step 3: HistoryTable — stacked cards on mobile**

Edit `components/history/HistoryTable.tsx`. Change the header row from:

```tsx
      <div
        className="grid gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
        style={{ gridTemplateColumns: COLS }}
      >
```

to:

```tsx
      <div
        className="hidden gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid"
        style={{ gridTemplateColumns: COLS }}
      >
```

Change the row rendering from:

```tsx
          <div
            key={c.id}
            className="grid items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0"
            style={{ gridTemplateColumns: COLS }}
          >
            <div>
              <div className="text-sm font-semibold">{c.name}</div>
              <div className="mt-0.5 text-xs text-slate-500">{c.mrn}</div>
            </div>
            <div className="font-mono text-[13px] text-slate-700">{c.examDate}</div>
            <div className="text-[13px] text-slate-700">{c.tumorType}</div>
            <div>
              <Badge label={sev.label} className={sev.className} />
            </div>
            <div>
              <Badge label={rev.label} className={rev.className} />
            </div>
            <button
              onClick={() => router.push(`/viewer/${c.id}?from=history`)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.75 py-[7px] text-[12.5px] font-semibold text-brand-600 hover:bg-slate-50"
            >
              Bandingkan
            </button>
          </div>
```

to:

```tsx
          <div
            key={c.id}
            className="relative flex flex-col gap-2 border-b border-slate-100 py-4 pl-5 pr-5 last:border-b-0 md:grid md:items-center md:gap-4"
            style={{ gridTemplateColumns: COLS }}
          >
            <div className="pr-28 md:pr-0">
              <div className="text-sm font-semibold">{c.name}</div>
              <div className="mt-0.5 text-xs text-slate-500">{c.mrn}</div>
            </div>
            <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500 md:contents">
              <span className="font-mono md:text-[13px] md:text-slate-700">{c.examDate}</span>
              <span className="md:text-[13px] md:text-slate-700">· {c.tumorType}</span>
            </div>
            <div className="flex gap-2 md:contents">
              <Badge label={sev.label} className={sev.className} />
              <Badge label={rev.label} className={rev.className} />
            </div>
            <button
              onClick={() => router.push(`/viewer/${c.id}?from=history`)}
              className="absolute right-5 top-4 rounded-lg border border-slate-200 bg-white px-3 py-1.75 py-[7px] text-[12.5px] font-semibold text-brand-600 hover:bg-slate-50 md:static"
            >
              Bandingkan
            </button>
          </div>
```

Same `md:contents` / `md:grid` technique as `QueueTable` (Task 2, Step 3). The "Bandingkan" button is wider than the chevron icon it's paralleling in `QueueTable`, so the name block reserves more space for it on mobile (`pr-28` vs `pr-11`) — verify visually in Step 4 and widen further if the button still overlaps the MRN line on a 360px-wide screen.

- [ ] **Step 4: Type-check, lint, and visually verify**

```bash
npx tsc --noEmit
npm run lint
```

In the browser at 375px on `/history`: severity filter chips scroll sideways if they overflow, each case is a stacked card (name/MRN with the "Bandingkan" button pinned top-right and not overlapping the MRN text, severity+review badges on one line, date · tumor type as small gray text).

At 1280px: identical to current behavior — full 6-column grid with header row and inline "Bandingkan" button.

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/history/page.tsx" components/history/SeverityFilterChips.tsx components/history/HistoryTable.tsx
git commit -m "feat: make history page responsive on mobile"
```

---

### Task 4: Upload page

**Files:**
- Modify: `app/(app)/upload/page.tsx`

- [ ] **Step 1: Responsive padding and single-column form on mobile**

Change:

```tsx
    <div className="flex h-full items-center justify-center px-8 py-8">
      <div className="w-full max-w-[600px] rounded-2xl border border-slate-200 bg-white p-10 shadow-card">
```

to:

```tsx
    <div className="flex h-full items-center justify-center px-4 py-6 md:px-8 md:py-8">
      <div className="w-full max-w-[600px] rounded-2xl border border-slate-200 bg-white p-5 shadow-card md:p-10">
```

Change:

```tsx
        <div className="mb-5 grid grid-cols-2 gap-3">
```

to:

```tsx
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
```

Change the "Tanggal Periksa" field wrapper from:

```tsx
          <div className="col-span-2">
```

to:

```tsx
          <div className="sm:col-span-2">
```

(`col-span-2` on a grid with only one explicit column below `sm` would make the browser implicitly create a second, empty auto-sized column track — `sm:col-span-2` avoids that by only spanning 2 columns once 2 columns actually exist.)

- [ ] **Step 2: Type-check, lint, and visually verify**

```bash
npx tsc --noEmit
npm run lint
```

In the browser at 375px on `/upload`: the card fills the width with tighter padding, Nama/MRN/Umur/Jenis Kelamin/Tanggal Periksa fields are each full-width and stacked in a single column, no stray empty column or overflow.

At 1280px: identical to current behavior (centered 600px card, 2-column field grid).

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/upload/page.tsx"
git commit -m "feat: make upload page responsive on mobile"
```

---

### Task 5: Profile page

**Files:**
- Modify: `app/(app)/profile/page.tsx`
- Modify: `components/profile/ProfileCard.tsx`

- [ ] **Step 1: Page padding and single-column stacking**

Edit `app/(app)/profile/page.tsx`. Change:

```tsx
    <div className="max-w-[980px] px-8 py-7">
```

to:

```tsx
    <div className="max-w-[980px] px-4 py-5 md:px-8 md:py-7">
```

Change:

```tsx
        <div className="grid grid-cols-[1.7fr_1fr] items-start gap-5">
```

to:

```tsx
        <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[1.7fr_1fr]">
```

- [ ] **Step 2: ProfileCard padding and button wrap**

Edit `components/profile/ProfileCard.tsx`. Change:

```tsx
    <div className="mb-5 rounded-2xl border border-slate-200 p-7 shadow-card">
```

to:

```tsx
    <div className="mb-5 rounded-2xl border border-slate-200 p-5 shadow-card md:p-7">
```

Change:

```tsx
      <div className="mt-5.5 mt-[22px] flex gap-2.5 border-t border-slate-100 pt-5">
```

to:

```tsx
      <div className="mt-5.5 mt-[22px] flex flex-wrap gap-2.5 border-t border-slate-100 pt-5">
```

- [ ] **Step 3: Type-check, lint, and visually verify**

```bash
npx tsc --noEmit
npm run lint
```

In the browser at 375px on `/profile`: `ProfileCard` sits above `SecurityCard` (not side by side), card padding is tighter, edit/save buttons stay usable without overflowing the card.

At 1280px: identical to current behavior (two-column `1.7fr/1fr` layout, `p-7` padding).

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/profile/page.tsx" components/profile/ProfileCard.tsx
git commit -m "feat: make profile page responsive on mobile"
```

---

### Task 6: Viewer page

**Files:**
- Modify: `app/(app)/viewer/[caseId]/page.tsx`
- Modify: `components/viewer/ViewerHeader.tsx`
- Modify: `components/viewer/ViewerToolbar.tsx`
- Modify: `components/viewer/SliceControls.tsx`

- [ ] **Step 1: Stack the theater and side panel vertically on mobile**

Edit `app/(app)/viewer/[caseId]/page.tsx`. Change:

```tsx
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col bg-theater-950">
            <ViewerToolbar
              activeCase={activeCase}
              layerSeg={layerSeg}
              xaiLayer={xaiLayer}
              onToggleSeg={() => setLayerSeg((v) => !v)}
              onSelectXai={handleSelectXai}
              zoom={zoom}
              onZoomIn={() => setZoom((z) => Math.min(2.2, z + 0.2))}
              onZoomOut={() => setZoom((z) => Math.max(0.6, z - 0.2))}
              onZoomReset={() => setZoom(1)}
            />
            <div className="relative flex flex-1">
              <MriStage
                activeCase={activeCase}
                zoom={zoom}
                slice={slice}
                layerSeg={layerSeg}
                xaiLayer={xaiLayer}
              />
              <SliceControls
                slice={slice}
                onUp={() => setSlice((s) => Math.min(156, s + 1))}
                onDown={() => setSlice((s) => Math.max(1, s - 1))}
              />
            </div>
          </div>

          <div className="flex w-[400px] flex-shrink-0 flex-col border-l border-slate-200">
            <NarrativePanel activeCase={activeCase} xaiLayer={xaiLayer} />
            <ReviewPanel
              activeCase={activeCase}
              onUpdated={(updated) => {
                mutate(key, updated, false);
                mutate('/api/cases');
              }}
            />
          </div>
        </div>
```

to:

```tsx
        <div className="flex flex-col md:min-h-0 md:flex-1 md:flex-row">
          <div className="flex min-w-0 flex-col bg-theater-950 md:flex-1">
            <ViewerToolbar
              activeCase={activeCase}
              layerSeg={layerSeg}
              xaiLayer={xaiLayer}
              onToggleSeg={() => setLayerSeg((v) => !v)}
              onSelectXai={handleSelectXai}
              zoom={zoom}
              onZoomIn={() => setZoom((z) => Math.min(2.2, z + 0.2))}
              onZoomOut={() => setZoom((z) => Math.max(0.6, z - 0.2))}
              onZoomReset={() => setZoom(1)}
            />
            <div className="relative flex h-[45vh] md:h-auto md:flex-1">
              <MriStage
                activeCase={activeCase}
                zoom={zoom}
                slice={slice}
                layerSeg={layerSeg}
                xaiLayer={xaiLayer}
              />
              <SliceControls
                slice={slice}
                onUp={() => setSlice((s) => Math.min(156, s + 1))}
                onDown={() => setSlice((s) => Math.max(1, s - 1))}
              />
            </div>
          </div>

          <div className="flex w-full flex-shrink-0 flex-col border-t border-slate-200 md:w-[400px] md:border-l md:border-t-0">
            <NarrativePanel activeCase={activeCase} xaiLayer={xaiLayer} />
            <ReviewPanel
              activeCase={activeCase}
              onUpdated={(updated) => {
                mutate(key, updated, false);
                mutate('/api/cases');
              }}
            />
          </div>
        </div>
```

- [ ] **Step 2: ViewerHeader — padding, icon-only export button, truncating title**

Edit `components/viewer/ViewerHeader.tsx`. Change:

```tsx
    <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-7 py-3.5">
      <div className="flex items-center gap-3.5">
```

to:

```tsx
    <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3.5 md:px-7">
      <div className="flex min-w-0 items-center gap-3.5">
```

Change:

```tsx
        <div>
          <div className="text-[15px] font-bold">
            {activeCase.name} <span className="font-medium text-slate-400">· {activeCase.mrn}</span>
          </div>
          <div className="text-xs text-slate-500">
            {activeCase.age} th, {activeCase.gender} · MRI Otak · {activeCase.examDate}
          </div>
        </div>
```

to:

```tsx
        <div className="min-w-0">
          <div className="truncate text-[15px] font-bold">
            {activeCase.name} <span className="font-medium text-slate-400">· {activeCase.mrn}</span>
          </div>
          <div className="truncate text-xs text-slate-500">
            {activeCase.age} th, {activeCase.gender} · MRI Otak · {activeCase.examDate}
          </div>
        </div>
```

Change:

```tsx
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.75 gap-[7px] rounded-[9px] border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.8">
            <path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" />
            <path d="M15 2v5h5" />
            <path d="M9 15h6M9 18h6" />
          </svg>
          Ekspor PDF
        </button>
```

to:

```tsx
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.75 gap-[7px] rounded-[9px] border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 md:px-3.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.8">
            <path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" />
            <path d="M15 2v5h5" />
            <path d="M9 15h6M9 18h6" />
          </svg>
          <span className="hidden md:inline">Ekspor PDF</span>
        </button>
```

- [ ] **Step 3: ViewerToolbar — let chips and zoom controls wrap**

Edit `components/viewer/ViewerToolbar.tsx`. Change:

```tsx
    <div className="flex flex-shrink-0 items-center justify-between bg-theater-900 px-5 py-3">
      <div className="flex gap-2.5">
```

to:

```tsx
    <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-y-2 bg-theater-900 px-5 py-3">
      <div className="flex flex-wrap gap-2.5">
```

- [ ] **Step 4: SliceControls — narrower progress bar on mobile**

Edit `components/viewer/SliceControls.tsx`. Change:

```tsx
      <div className="h-1 w-24 overflow-hidden rounded-full bg-white/10">
```

to:

```tsx
      <div className="h-1 w-16 overflow-hidden rounded-full bg-white/10 md:w-24">
```

- [ ] **Step 5: Type-check, lint, and visually verify**

```bash
npx tsc --noEmit
npm run lint
```

In the browser at 375px on `/viewer/<any-case-id>` (pick any case id from `/dashboard`): the MRI image area sits at the top at a fixed height with the toolbar chips and zoom controls above it (wrapping to a second line if needed), slice controls are visible in the bottom-right of the image without crowding it, the case name truncates instead of pushing the header wider, "Ekspor PDF" shows as an icon-only button, and scrolling down reveals the Narasi Klinis panel and then the Tinjauan Dokter panel stacked full-width below the image — the whole page scrolls as one unit and the bottom nav from Task 1 doesn't cover the review buttons.

At 1280px: identical to current behavior — image area and 400px side panel side by side, full toolbar on one line, "Ekspor PDF" with its label.

- [ ] **Step 6: Commit**

```bash
git add "app/(app)/viewer/[caseId]/page.tsx" components/viewer/ViewerHeader.tsx components/viewer/ViewerToolbar.tsx components/viewer/SliceControls.tsx
git commit -m "feat: make viewer page responsive on mobile"
```
