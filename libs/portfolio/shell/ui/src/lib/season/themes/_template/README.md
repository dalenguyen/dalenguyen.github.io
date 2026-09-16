# Adding a season

Four steps. Nothing shared needs editing beyond the first two.

1. **Window** — add a `SeasonId` and a `SEASON_WINDOWS` entry in
   `../../season.data.ts`. Keep it short (a week or so) and non-overlapping;
   the first matching window wins. A window whose `to` sorts before its `from`
   wraps the year end (`12-31` → `01-02`).

2. **Tokens** — add TWO blocks to `apps/blog-app/src/styles.css`, after the
   `.light` block:

   ```css
   [data-season='yours']       { /* dark  */ }
   .light[data-season='yours'] { /* light */ }
   ```

   Both are required. `[data-season='x']` has the same specificity as `.light`,
   so a token declared only in the bare block leaks into light mode and wrecks
   it. Measure contrast — every pairing must clear WCAG AA (4.5:1 for body
   text) against its own background, like the base themes do.

3. **Decorations** — copy this folder to `themes/yours/`, rename the component,
   and export it from `index.ts`. The glob in `season-decor.component.ts` picks
   it up; there is no registry to edit.

4. **Verify** — `?season=yours` forces it on out of calendar order, and
   `?season=none` forces it off. Check both light and dark, and check that the
   effects layer does not mount under `prefers-reduced-motion: reduce`.

## Rules for an effects layer

- `aria-hidden="true"` and `pointer-events: none` on anything purely decorative.
- Do not mount at all under `prefers-reduced-motion: reduce`. Skip it; do not
  merely slow it down.
- Prefer CSS animation or the Web Animations API when the motion is a fixed
  path — it runs on the compositor and costs no JS frames. Reach for a
  `requestAnimationFrame` loop only when the motion is genuinely simulated
  (Halloween's ghosts curve and bounce off the window edges, which keyframes
  cannot express). If you do use a loop:
  - cancel it in `ngOnDestroy`,
  - stop it entirely on `visibilitychange` and restart the clock on return,
  - cap the frame delta, so a backgrounded tab does not teleport everything on
    the first frame back,
  - write only `transform` and `opacity`, and never read element geometry in
    the loop — that forces layout every frame.
- Stay below the sticky header's stacking context (it is `z-50`).
- Render nothing until `afterNextRender`, so SSR and hydration agree.
