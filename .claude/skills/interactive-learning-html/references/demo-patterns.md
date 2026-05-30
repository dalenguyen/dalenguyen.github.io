# Interactive Demo Patterns

## Demo by Concept Type

| Concept | Demo approach |
|---|---|
| Latency / speed | Animated race bars (width transition, staggered setTimeout) |
| State mutation | Live item list with apply/revert/reset buttons |
| Reactive updates | Clickable component tree that highlights affected nodes |
| Architecture flow | Stacked node diagram with hover tooltips |
| Bundle / size reduction | Animated horizontal bar chart |
| Animation properties | Clickable boxes demonstrating each CSS property live |
| Event / request lifecycle | Sequence timeline — steps reveal left-to-right with animated connector line |
| Conversion / drop-off | Funnel chart — tapering bars with stage labels and % drop shown on click |
| Modes / phases / protocols | State machine — clickable state boxes, valid transitions highlight, invalid dim |

---

## Animated Race Bars

```javascript
const raceData = [
  { id: 'race-local', pct: 2,  label: '~0.05ms' },
  { id: 'race-wifi',  pct: 25, label: '~30ms'   },
  { id: 'race-4g',    pct: 55, label: '~80ms'   },
];

function runRace() {
  raceData.forEach(r => { document.getElementById(r.id).style.width = '0%'; });
  setTimeout(() => {
    raceData.forEach((r, i) => setTimeout(() => {
      const el = document.getElementById(r.id);
      el.style.width = r.pct + '%';
      el.textContent = r.label;
    }, i * 120));
  }, 100);
}
```

```css
.race-track { flex: 1; height: 28px; background: var(--code-bg); border-radius: 6px; overflow: hidden; }
.race-fill  { height: 100%; border-radius: 6px; display: flex; align-items: center; padding-left: 10px;
              font-size: 12px; font-weight: 600; width: 0%; transition: width 0.8s cubic-bezier(0.22,1,0.36,1); }
.race-fill.fast   { background: linear-gradient(90deg, #4ade8066, #4ade80); color: #052e16; }
.race-fill.medium { background: linear-gradient(90deg, #fbbf2466, #fbbf24); color: #1c1003; }
.race-fill.slow   { background: linear-gradient(90deg, #ef444466, #ef4444); }
```

---

## Optimistic Update Demo

```javascript
let optimisticApplied = false;

function optimisticUpdate() {
  if (optimisticApplied) return;
  optimisticApplied = true;
  renderIssues([{ status: 'done', title: 'ENG-101', badge: 'optimistic' }, ...]);
  setLog('⚡ Applied locally. Syncing…');
  setTimeout(() => {
    renderIssues([{ status: 'done', title: 'ENG-101', badge: 'synced' }, ...]);
    setLog('✓ Server confirmed.');
  }, 1800);
}

function optimisticRevert() {
  if (!optimisticApplied) return;
  optimisticApplied = false;
  renderIssues([{ status: 'todo', title: 'ENG-101', badge: 'reverted' }, ...]);
  setLog('✗ Server rejected. Reverting…');
  setTimeout(() => renderIssues(originalIssues), 1500);
}
```

---

## Component Tree Reactivity

```javascript
const fieldMap = {
  status:   { nodes: ['node-issuerow', 'node-statusbadge'],    explanation: '...' },
  title:    { nodes: ['node-issuerow', 'node-titlelabel'],     explanation: '...' },
  priority: { nodes: ['node-issuerow', 'node-priorityicon'],   explanation: '...' },
  assignee: { nodes: ['node-issuerow', 'node-assigneeavatar'], explanation: '...' },
};

function simulateUpdate(field) {
  document.querySelectorAll('.comp-node').forEach(n => n.classList.remove('re-render'));
  fieldMap[field].nodes.forEach(id => document.getElementById(id)?.classList.add('re-render'));
  document.getElementById('react-explanation').innerHTML = fieldMap[field].explanation;
  setTimeout(() => document.querySelectorAll('.comp-node').forEach(n => n.classList.remove('re-render')), 2500);
}
```

```css
.comp-node.re-render { background: rgba(251,191,36,0.12); border-color: var(--amber); }
.comp-node.re-render .comp-dot { background: var(--amber); }
```

---

## Quiz Pattern

```javascript
const answers = {
  q1: { correct: 1, explanation: 'Because ...' },
};

function answer(btn, qid, isCorrect) {
  const opts = document.getElementById(qid + '-opts');
  if (opts.querySelector('.correct, .wrong')) return; // already answered
  opts.querySelectorAll('.quiz-opt').forEach(o => o.disabled = true);
  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  if (!isCorrect) opts.querySelectorAll('.quiz-opt')[answers[qid].correct].classList.add('correct');
  const fb = document.getElementById(qid + '-fb');
  fb.textContent = (isCorrect ? '✓ Correct — ' : '✗ Not quite — ') + answers[qid].explanation;
  fb.className = 'quiz-feedback show ' + (isCorrect ? 'correct-fb' : 'wrong-fb');
}
```

---

## Progress Tracking

```javascript
const opened = new Set();
const totalSections = 6;

function toggleSection(id) {
  const el = document.getElementById(id);
  el.classList.toggle('active');
  if (el.classList.contains('active')) {
    opened.add(id);
    const pct = (opened.size / totalSections) * 100;
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-text').innerText = `${opened.size} / ${totalSections} sections`;
    if (opened.size === totalSections) document.getElementById('completion-banner').classList.add('show');
  }
}
```

---

## Sequence Timeline

Steps reveal left-to-right. A connector line grows across as each step activates. Click a step to inspect its detail; clicking again collapses it. Works for request lifecycles, auth flows, build pipelines, any ordered event sequence.

```html
<div class="seq-track">
  <div class="seq-line-bg"><div class="seq-line-fill" id="seq-line"></div></div>
  <div class="seq-steps" id="seq-steps">
    <!-- steps injected by buildTimeline() -->
  </div>
</div>
<div class="seq-detail" id="seq-detail">Click a step to inspect it.</div>
<div style="display:flex;gap:8px;margin-top:14px;">
  <button class="btn" onclick="playTimeline()">Play</button>
  <button class="btn btn-outline" onclick="resetTimeline()">Reset</button>
</div>
```

```javascript
const timelineSteps = [
  { label: 'Client',     icon: '💻', detail: 'Browser sends GET /api/data with Authorization header.' },
  { label: 'DNS',        icon: '🔍', detail: 'Resolves hostname to IP. Cached after first lookup (~1ms).' },
  { label: 'TLS',        icon: '🔒', detail: 'Handshake negotiates cipher suite and verifies certificate.' },
  { label: 'Server',     icon: '⚙️',  detail: 'Request handler authenticates token and queries the database.' },
  { label: 'DB',         icon: '🗄️',  detail: 'Index scan returns matching rows in ~4ms.' },
  { label: 'Response',   icon: '📦', detail: 'JSON payload sent back, connection kept alive for reuse.' },
];

let timelineActive = -1;

function buildTimeline() {
  const container = document.getElementById('seq-steps');
  timelineSteps.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'seq-step';
    el.id = 'seq-step-' + i;
    el.innerHTML = `<div class="seq-dot" id="seq-dot-${i}"></div><div class="seq-label">${s.icon}<br><span>${s.label}</span></div>`;
    el.onclick = () => selectStep(i);
    container.appendChild(el);
  });
}

function selectStep(i) {
  if (timelineActive === i) {
    document.getElementById('seq-detail').textContent = 'Click a step to inspect it.';
    timelineActive = -1;
    return;
  }
  timelineActive = i;
  document.getElementById('seq-detail').textContent = timelineSteps[i].detail;
  document.querySelectorAll('.seq-step').forEach((el, j) => el.classList.toggle('seq-selected', j === i));
}

function playTimeline() {
  resetTimeline();
  const total = timelineSteps.length;
  timelineSteps.forEach((_, i) => {
    setTimeout(() => {
      document.getElementById('seq-dot-' + i).classList.add('seq-dot-active');
      document.getElementById('seq-step-' + i).classList.add('seq-revealed');
      document.getElementById('seq-line').style.width = ((i + 1) / total * 100) + '%';
    }, i * 380);
  });
}

function resetTimeline() {
  timelineActive = -1;
  document.getElementById('seq-line').style.width = '0%';
  document.getElementById('seq-detail').textContent = 'Click a step to inspect it.';
  timelineSteps.forEach((_, i) => {
    document.getElementById('seq-dot-' + i).classList.remove('seq-dot-active');
    document.getElementById('seq-step-' + i).classList.remove('seq-revealed', 'seq-selected');
  });
}
```

```css
.seq-track    { position: relative; padding: 24px 0 8px; }
.seq-line-bg  { position: absolute; top: 36px; left: 20px; right: 20px; height: 3px;
                background: var(--border); border-radius: 99px; }
.seq-line-fill { height: 100%; width: 0%; background: var(--accent); border-radius: 99px;
                 transition: width 0.35s ease; }
.seq-steps    { display: flex; justify-content: space-between; position: relative; }
.seq-step     { display: flex; flex-direction: column; align-items: center; gap: 8px;
                cursor: pointer; opacity: 0.3; transition: opacity 0.3s; min-width: 60px; }
.seq-step.seq-revealed  { opacity: 1; }
.seq-step.seq-selected .seq-dot { box-shadow: 0 0 0 3px var(--accent-glow); }
.seq-dot      { width: 18px; height: 18px; border-radius: 50%; background: var(--border);
                border: 2px solid var(--surface2); transition: background 0.3s; flex-shrink: 0; }
.seq-dot.seq-dot-active { background: var(--accent); border-color: var(--accent); }
.seq-label    { font-size: 11px; color: var(--muted); text-align: center; line-height: 1.4; }
.seq-detail   { margin-top: 16px; padding: 10px 14px; background: var(--surface2);
                border-radius: 8px; font-size: 13px; color: var(--text); min-height: 40px;
                border: 1px solid var(--border); line-height: 1.5; }
```

---

## Funnel Chart

Tapering horizontal bars show volume at each stage. Click any stage bar to reveal the drop-off explanation for that step. Good for conversion funnels, hiring pipelines, onboarding flows, request filtering chains.

```html
<div id="funnel-chart"></div>
<div class="funnel-detail" id="funnel-detail">Click a stage to see why users drop off here.</div>
<button class="btn" style="margin-top:12px;" onclick="animateFunnel()">Animate</button>
```

```javascript
const funnelStages = [
  { label: 'Visited landing page', value: 10000, color: 'var(--accent)',
    drop: null },
  { label: 'Started sign-up',      value: 4200,  color: '#7c86e0',
    drop: '58% left — most visitors are not ready to commit on first visit.' },
  { label: 'Verified email',       value: 2800,  color: '#a78bfa',
    drop: '33% dropped — verification emails land in spam or users lose interest.' },
  { label: 'Completed onboarding', value: 1600,  color: '#c084fc',
    drop: '43% dropped — onboarding is too long or asks for info users don\'t have handy.' },
  { label: 'Converted to paid',    value: 420,   color: 'var(--green)',
    drop: '74% dropped — free tier meets their needs or pricing feels too high.' },
];

function buildFunnel() {
  const container = document.getElementById('funnel-chart');
  const max = funnelStages[0].value;
  funnelStages.forEach((s, i) => {
    const pct = (s.value / max) * 100;
    const dropLabel = i > 0
      ? `<span class="funnel-drop">▼ ${Math.round((1 - s.value / funnelStages[i-1].value) * 100)}% drop</span>`
      : '';
    const row = document.createElement('div');
    row.className = 'funnel-row';
    row.innerHTML = `
      <div class="funnel-meta">
        <span class="funnel-label">${s.label}</span>
        <span class="funnel-count">${s.value.toLocaleString()}</span>
        ${dropLabel}
      </div>
      <div class="funnel-track">
        <div class="funnel-bar" id="fbar-${i}" data-pct="${pct}"
             style="width:0%;background:${s.color};" onclick="showFunnelDetail(${i})"></div>
      </div>`;
    container.appendChild(row);
  });
}

function animateFunnel() {
  funnelStages.forEach((_, i) => {
    setTimeout(() => {
      const bar = document.getElementById('fbar-' + i);
      bar.style.width = bar.dataset.pct + '%';
    }, i * 160);
  });
}

function showFunnelDetail(i) {
  const detail = document.getElementById('funnel-detail');
  detail.textContent = i === 0
    ? 'Top of funnel — this is the baseline 100%.'
    : funnelStages[i].drop;
  document.querySelectorAll('.funnel-bar').forEach((b, j) => b.classList.toggle('funnel-bar-selected', j === i));
}
```

```css
.funnel-row   { margin-bottom: 10px; }
.funnel-meta  { display: flex; align-items: baseline; gap: 10px; margin-bottom: 4px; }
.funnel-label { font-size: 13px; font-weight: 500; flex: 1; }
.funnel-count { font-size: 12px; color: var(--muted); }
.funnel-drop  { font-size: 11px; color: var(--red); font-weight: 600; }
.funnel-track { height: 28px; background: var(--surface2); border-radius: 6px; overflow: hidden; }
.funnel-bar   { height: 100%; border-radius: 6px; cursor: pointer; width: 0%;
                transition: width 0.6s cubic-bezier(0.22,1,0.36,1), opacity 0.2s; }
.funnel-bar:hover            { opacity: 0.85; }
.funnel-bar.funnel-bar-selected { outline: 2px solid var(--accent); outline-offset: 1px; }
.funnel-detail { margin-top: 12px; padding: 10px 14px; background: var(--surface2);
                 border-radius: 8px; font-size: 13px; color: var(--text); min-height: 38px;
                 border: 1px solid var(--border); line-height: 1.5; }
```

---

## State Machine

Clickable boxes represent states. Clicking a state makes it "current" — valid transitions to neighbouring states highlight in green, invalid ones dim. A log line explains what triggered the transition. Good for connection lifecycle, auth states, order status, feature flag rollout phases.

```html
<div class="sm-graph" id="sm-graph"><!-- built by buildStateMachine() --></div>
<div class="sm-log" id="sm-log">Select a state to begin.</div>
```

```javascript
// Define states and which transitions are valid FROM each state.
// Each transition has a label describing the trigger event.
const smStates = {
  idle:        { label: 'Idle',         icon: '⬜', transitions: { connecting: 'user calls connect()' } },
  connecting:  { label: 'Connecting',   icon: '🔄', transitions: { open: 'handshake succeeded', closed: 'handshake failed' } },
  open:        { label: 'Open',         icon: '🟢', transitions: { closing: 'client calls close()' } },
  closing:     { label: 'Closing',      icon: '🟡', transitions: { closed: 'drain complete' } },
  closed:      { label: 'Closed',       icon: '🔴', transitions: { connecting: 'user calls connect()' } },
};

let smCurrent = null;

function buildStateMachine() {
  const graph = document.getElementById('sm-graph');
  Object.entries(smStates).forEach(([id, s]) => {
    const el = document.createElement('div');
    el.className = 'sm-node';
    el.id = 'smn-' + id;
    el.innerHTML = `<span class="sm-icon">${s.icon}</span><span class="sm-label">${s.label}</span>`;
    el.onclick = () => smTransition(id);
    graph.appendChild(el);
  });
}

function smTransition(toId) {
  const validFrom = smCurrent ? smStates[smCurrent].transitions : {};

  // If no current state, just select this one as starting point
  if (!smCurrent) {
    smCurrent = toId;
    document.getElementById('sm-log').textContent = `Started in "${smStates[toId].label}" state.`;
    highlightSM();
    return;
  }

  if (toId === smCurrent) return;

  if (validFrom[toId]) {
    document.getElementById('sm-log').textContent =
      `✓ "${smStates[smCurrent].label}" → "${smStates[toId].label}" — trigger: ${validFrom[toId]}`;
    smCurrent = toId;
  } else {
    document.getElementById('sm-log').textContent =
      `✗ Cannot go from "${smStates[smCurrent].label}" to "${smStates[toId].label}" — invalid transition.`;
  }
  highlightSM();
}

function highlightSM() {
  const validTargets = smCurrent ? Object.keys(smStates[smCurrent].transitions) : [];
  Object.keys(smStates).forEach(id => {
    const el = document.getElementById('smn-' + id);
    el.classList.remove('sm-current', 'sm-reachable', 'sm-unreachable');
    if (id === smCurrent)          el.classList.add('sm-current');
    else if (validTargets.includes(id)) el.classList.add('sm-reachable');
    else if (smCurrent)            el.classList.add('sm-unreachable');
  });
}
```

```css
.sm-graph      { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; }
.sm-node       { display: flex; flex-direction: column; align-items: center; gap: 6px;
                 padding: 14px 18px; border-radius: 10px; border: 1px solid var(--border);
                 background: var(--surface2); cursor: pointer; transition: all 0.2s;
                 min-width: 90px; }
.sm-node:hover { border-color: var(--accent); }
.sm-icon       { font-size: 20px; }
.sm-label      { font-size: 12px; font-weight: 600; color: var(--muted); }
.sm-node.sm-current    { border-color: var(--accent); background: var(--accent-glow);
                          box-shadow: 0 0 0 1px var(--accent-glow); }
.sm-node.sm-current .sm-label { color: var(--accent); }
.sm-node.sm-reachable  { border-color: var(--green); background: rgba(74,222,128,0.06); }
.sm-node.sm-reachable .sm-label { color: var(--green); }
.sm-node.sm-unreachable { opacity: 0.35; }
.sm-log        { padding: 10px 14px; background: var(--surface2); border-radius: 8px;
                 font-size: 13px; color: var(--text); border: 1px solid var(--border);
                 min-height: 38px; line-height: 1.5; }
```
