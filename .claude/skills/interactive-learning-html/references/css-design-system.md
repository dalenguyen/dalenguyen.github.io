# CSS Design System

## CSS Variables

```css
:root {
  --bg: #0f0f13;
  --surface: #1a1a22;
  --surface2: #22222e;
  --border: #2e2e3e;
  --accent: #5e6ad2;
  --accent-glow: rgba(94,106,210,0.25);
  --green: #4ade80;
  --amber: #fbbf24;
  --red: #f87171;
  --text: #e8e8f0;
  --muted: #7a7a99;
  --code-bg: #12121a;
}
```

## Key Component Styles

### Section Card
Collapsible card. **Must keep `overflow: hidden`** for border-radius clipping — use fixed-position tooltips to escape it.

```css
.section {
  margin-bottom: 32px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  overflow: hidden;
  transition: border-color 0.2s;
}
.section.active { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent-glow), 0 8px 32px rgba(0,0,0,0.4); }
.section-body { display: none; padding: 0 24px 24px; }
.section.active .section-body { display: block; }
```

### Tabs

```css
.tab { padding: 6px 14px; border-radius: 8px; border: 1px solid var(--border); background: none; color: var(--muted); font-size: 13px; cursor: pointer; }
.tab.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.tab-panel { display: none; }
.tab-panel.active { display: block; }
```

### Callout / Highlight Block

```css
.callout {
  border-left: 3px solid var(--accent);
  background: rgba(94,106,210,0.06);
  border-radius: 0 8px 8px 0;
  padding: 12px 16px;
  font-size: 14px;
  margin: 16px 0;
}
```

### Key-Value Chips

```css
.kv-chip { display: flex; border-radius: 6px; border: 1px solid var(--border); overflow: hidden; font-size: 12px; }
.kv-chip-key { padding: 4px 9px; background: var(--surface2); color: var(--muted); font-weight: 500; }
.kv-chip-val { padding: 4px 9px; color: var(--text); }
```

### Quiz Options

```css
.quiz-opt { padding: 10px 14px; border-radius: 7px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 14px; text-align: left; cursor: pointer; }
.quiz-opt:hover:not(:disabled) { border-color: var(--accent); }
.quiz-opt.correct { border-color: var(--green); background: rgba(74,222,128,0.08); color: var(--green); }
.quiz-opt.wrong   { border-color: var(--red);   background: rgba(248,113,113,0.08); color: var(--red); }
```

### Progress Bar

```css
.progress-bar-track { flex: 1; height: 4px; background: var(--border); border-radius: 99px; overflow: hidden; }
.progress-bar-fill  { height: 100%; width: 0%; background: var(--accent); border-radius: 99px; transition: width 0.4s ease; }
```
