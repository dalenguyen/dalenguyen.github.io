# Tooltip Pattern (Overflow-Safe)

## The Problem

Section cards use `overflow: hidden` for border-radius clipping. Any `position: absolute` tooltip inside will be **clipped** by that boundary.

## The Fix: `position: fixed` + JS Positioning

### CSS
```css
.tooltip {
  display: none;
  position: fixed;      /* NOT absolute — escapes overflow:hidden */
  z-index: 1000;
  pointer-events: none;
  width: 220px;
  background: var(--surface2);
  border: 1px solid var(--accent);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--text);
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}
/* No :hover rule — JS handles show/hide */
```

### JS — Smart Positioning (right → left → below)
```javascript
function initTooltips() {
  document.querySelectorAll('.arch-node').forEach(node => {
    const tooltip = node.querySelector('.arch-tooltip');
    if (!tooltip) return;

    node.addEventListener('mouseenter', () => {
      const rect = node.getBoundingClientRect();
      const ttWidth = 230, gap = 12;

      tooltip.style.display = 'block';
      tooltip.style.top = (rect.top + rect.height / 2) + 'px';
      tooltip.style.transform = 'translateY(-50%)';

      if (window.innerWidth - rect.right - gap >= ttWidth) {
        tooltip.style.left = (rect.right + gap) + 'px';           // right
      } else if (rect.left - gap >= ttWidth) {
        tooltip.style.left = (rect.left - ttWidth - gap) + 'px';  // left
      } else {
        tooltip.style.top = (rect.bottom + gap) + 'px';           // below
        tooltip.style.left = Math.max(8, rect.left + rect.width / 2 - ttWidth / 2) + 'px';
        tooltip.style.transform = 'none';
      }
    });

    node.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  });
}
```

Call `initTooltips()` inside `window.addEventListener('load', ...)`.
