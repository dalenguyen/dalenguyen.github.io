import { Component, OnDestroy, computed, signal, ViewEncapsulation } from '@angular/core'

interface Node {
  key: string
  label: string
  sub: string
}

interface Step {
  label: string
  title: string
  desc: string
  activeNodes: number[]
  activeEdges: number[]
  showCondition?: boolean
}

const NODES: Node[] = [
  { key: 'gha', label: 'GitHub Actions', sub: 'workflow run' },
  { key: 'pool', label: 'WIF Pool', sub: 'validates issuer' },
  { key: 'sa', label: 'Deploy SA', sub: 'github-deploy' },
  { key: 'run', label: 'Cloud Run', sub: 'deploy target' },
]

const STEPS: Step[] = [
  {
    label: 'Request',
    title: '1 · The workflow requests a token',
    desc: 'permissions: id-token: write tells GitHub Actions this run may mint a short-lived OIDC token. Nothing is stored yet — the token doesn’t exist until a step asks for it.',
    activeNodes: [0],
    activeEdges: [],
  },
  {
    label: 'Sign & send',
    title: '2 · GitHub signs the JWT',
    desc: 'google-github-actions/auth@v2 asks GitHub’s own OIDC endpoint for a token, then sends it to Google’s Workload Identity Pool. The JWT’s claims include repository, ref, and workflow — GitHub is vouching for who’s asking.',
    activeNodes: [0, 1],
    activeEdges: [0],
  },
  {
    label: 'Verify',
    title: '3 · The pool checks who’s asking',
    desc: 'The pool trusts GitHub as an issuer, then applies --attribute-condition. Only a token whose repository claim equals my-org/my-repo passes — a token from any other repo is rejected right here, before it is ever exchanged for a credential.',
    activeNodes: [1],
    activeEdges: [],
    showCondition: true,
  },
  {
    label: 'Exchange',
    title: '4 · Google issues short-lived credentials',
    desc: 'On a match, Google STS exchanges the JWT for short-lived Google credentials scoped to impersonate github-deploy. No service-account key was ever created, so there was never a key to leak.',
    activeNodes: [1, 2],
    activeEdges: [1],
  },
  {
    label: 'Deploy',
    title: '5 · gcloud deploys as the service account',
    desc: 'The workflow now holds credentials as github-deploy, with exactly the roles it was granted. gcloud run deploy ships the new revision — and the credentials expire minutes later, whether the run succeeded or not.',
    activeNodes: [2, 3],
    activeEdges: [2],
  },
]

/**
 * Node/edge walkthrough of Workload Identity Federation: a GitHub Actions
 * workflow trades a self-signed OIDC token for short-lived Google credentials,
 * with no long-lived key ever stored in the repo.
 */
@Component({
  selector: 'blog-wif-flow',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">How WIF secures the pipeline</span>
        <span class="counter">Step {{ idx() + 1 }} / {{ steps.length }}</span>
      </div>

      <div class="stepper">
        @for (s of steps; track s.label; let i = $index) {
          <button
            class="seg"
            [class.active]="i === idx()"
            [class.done]="i < idx()"
            (click)="go(i)"
            [attr.aria-current]="i === idx() ? 'step' : null"
          >
            <span class="dot">{{ i + 1 }}</span>
            <span class="seg-label">{{ s.label }}</span>
          </button>
        }
      </div>

      <div class="graph" role="img" [attr.aria-label]="step().title">
        @for (n of nodes; track n.key; let i = $index) {
          <div class="node" [class.active]="isNodeActive(i)">
            <span class="node-label">{{ n.label }}</span>
            <span class="node-sub">{{ n.sub }}</span>
          </div>
          @if (i < nodes.length - 1) {
            <span class="arrow" [class.active]="isEdgeActive(i)">&#8594;</span>
          }
        }
      </div>

      @if (step().showCondition) {
        <div class="condition-row">
          <span class="chip ok">&#10003; my-org/my-repo</span>
          <span class="chip bad">&#10007; any other repo</span>
        </div>
      }

      <div class="panel">
        <p class="panel-title">{{ step().title }}</p>
        <p class="desc">{{ step().desc }}</p>
      </div>

      <div class="controls">
        <button class="btn" (click)="prev()" [disabled]="idx() === 0">&#8249; Prev</button>
        <button class="btn play" (click)="togglePlay()">{{ playing() ? '❚❚ Pause' : '▶ Play' }}</button>
        <button class="btn" (click)="next()" [disabled]="idx() === steps.length - 1">Next &#8250;</button>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        text-align: left;
        color: #e6edf3;
        font: 16px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      }
      .card {
        background: #161b22;
        border: 1px solid #30363d;
        border-radius: 14px;
        padding: 20px;
        margin: 22px 0;
        display: grid;
        gap: 16px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 10px;
        flex-wrap: wrap;
      }
      .title {
        font-size: 15px;
        font-weight: 700;
      }
      .counter {
        font-size: 12px;
        color: #9aa7b5;
        font-variant-numeric: tabular-nums;
      }
      .stepper {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .seg {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 7px;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 9px;
        padding: 7px 9px;
        cursor: pointer;
        color: #9aa7b5;
        font: inherit;
        font-size: 12.5px;
        transition: all 0.15s;
      }
      .seg:hover {
        border-color: #4a5568;
      }
      .seg .dot {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #21262d;
        font-size: 11px;
        font-weight: 700;
        flex-shrink: 0;
      }
      .seg .seg-label {
        white-space: nowrap;
      }
      .seg.done {
        color: #cdd6e0;
      }
      .seg.done .dot {
        background: #2ea04326;
        color: #5ad19a;
      }
      .seg.active {
        border-color: #7c9cff;
        color: #e6edf3;
        background: #7c9cff1a;
      }
      .seg.active .dot {
        background: #7c9cff;
        color: #08111f;
      }
      .graph {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        flex-wrap: wrap;
        padding: 10px 4px;
      }
      .node {
        flex: 0 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 10px;
        padding: 10px 12px;
        min-width: 96px;
        text-align: center;
        transition: all 0.2s;
      }
      .node-label {
        font-size: 12.5px;
        font-weight: 700;
        color: #cdd6e0;
      }
      .node-sub {
        font-size: 10.5px;
        color: #7e8a99;
      }
      .node.active {
        border-color: #7c9cff;
        background: #7c9cff1a;
      }
      .node.active .node-label {
        color: #e6edf3;
      }
      .node.active .node-sub {
        color: #a9b6ff;
      }
      .arrow {
        flex: 0 0 auto;
        font-size: 18px;
        color: #30363d;
        transition: color 0.2s;
      }
      .arrow.active {
        color: #7c9cff;
      }
      @media (max-width: 480px) {
        .graph {
          flex-direction: column;
        }
        .arrow {
          transform: rotate(90deg);
        }
      }
      .condition-row {
        display: flex;
        gap: 8px;
        justify-content: center;
        flex-wrap: wrap;
      }
      .chip {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 11.5px;
        border-radius: 999px;
        padding: 4px 10px;
        border: 1px solid #30363d;
      }
      .chip.ok {
        color: #5ad19a;
        border-color: #2ea04366;
        background: #0d1f15;
      }
      .chip.bad {
        color: #ff8a5c;
        border-color: #ff8a5c66;
        background: #241209;
      }
      .panel .panel-title {
        margin: 0 0 6px;
        font-size: 14px;
        font-weight: 700;
        color: #7c9cff;
      }
      .desc {
        margin: 0;
        font-size: 13.5px;
        color: #9aa7b5;
      }
      .controls {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
      .btn {
        background: #21262d;
        border: 1px solid #30363d;
        border-radius: 8px;
        color: #e6edf3;
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        padding: 7px 14px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .btn:hover:not(:disabled) {
        border-color: #7c9cff;
      }
      .btn:disabled {
        opacity: 0.4;
        cursor: default;
      }
      .btn.play {
        background: #7c9cff;
        color: #08111f;
        border-color: #7c9cff;
        margin-right: auto;
      }
    `,
  ],
})
export class WifFlowComponent implements OnDestroy {
  readonly nodes = NODES
  readonly steps = STEPS
  readonly idx = signal(0)
  readonly playing = signal(false)
  readonly step = computed(() => this.steps[this.idx()])

  private timer: ReturnType<typeof setInterval> | null = null

  isNodeActive(i: number): boolean {
    return this.step().activeNodes.includes(i)
  }

  isEdgeActive(i: number): boolean {
    return this.step().activeEdges.includes(i)
  }

  go(i: number) {
    this.stop()
    this.idx.set(i)
  }

  prev() {
    this.stop()
    this.idx.update((i) => Math.max(0, i - 1))
  }

  next() {
    this.stop()
    this.idx.update((i) => Math.min(this.steps.length - 1, i + 1))
  }

  togglePlay() {
    if (this.playing()) {
      this.stop()
      return
    }
    if (this.idx() === this.steps.length - 1) this.idx.set(0)
    this.playing.set(true)
    this.timer = setInterval(() => {
      if (this.idx() >= this.steps.length - 1) {
        this.stop()
        return
      }
      this.idx.update((i) => i + 1)
    }, 1800)
  }

  private stop() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.playing.set(false)
  }

  ngOnDestroy() {
    this.stop()
  }
}
