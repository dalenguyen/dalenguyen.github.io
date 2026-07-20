import { Component, OnDestroy, computed, signal, ViewEncapsulation } from '@angular/core'

interface Step {
  label: string
  title: string
  code: string
  desc: string
  worker: 'online' | 'offline' | 'resumed'
  historyAdd: string[]
}

// Each step maps directly onto the demo project: workflows.py (DataPipelineWorkflow),
// activities.py (validate_input, write_output), worker.py, and run.py.
const STEPS: Step[] = [
  {
    label: 'Start',
    title: '1 · Client starts the workflow',
    code: 'client.execute_workflow(\n  DataPipelineWorkflow,\n  args=[raw_data, "schema_v3_final", job_id],\n  id=job_id,\n  task_queue="data-pipeline-queue",\n)',
    desc: 'run.py sends a StartWorkflowExecution request. The Temporal Server persists a WorkflowExecutionStarted event before a single line of your workflow code runs.',
    worker: 'online',
    historyAdd: ['WorkflowExecutionStarted'],
  },
  {
    label: 'Schedule',
    title: '2 · The worker picks up the first task',
    code: 'worker = Worker(\n  client,\n  task_queue="data-pipeline-queue",\n  workflows=[DataPipelineWorkflow],\n  activities=[validate_input, write_output],\n)',
    desc: 'worker.py long-polls "data-pipeline-queue". It runs the workflow function up to the first await, and asks the server to schedule the validate_input activity.',
    worker: 'online',
    historyAdd: ['WorkflowTaskCompleted', 'ActivityTaskScheduled · validate_input'],
  },
  {
    label: 'Activity 1',
    title: '3 · validate_input runs — and completes',
    code: 'async def validate_input(data, schema_version):\n    await asyncio.sleep(1.5)\n    return "VALIDATED: 25 records parsed, schema v3 compliant"',
    desc: 'The activity runs as an ordinary coroutine — side effects are allowed here. On success the server persists ActivityTaskCompleted: the result is now durable, not just sitting in this process’s memory.',
    worker: 'online',
    historyAdd: ['ActivityTaskCompleted · validate_input'],
  },
  {
    label: 'Crash',
    title: '4 · The worker process dies',
    code: '$ kill -9 $(pgrep -f worker.py)\n# or: the host reboots, the pod is evicted, a deploy rolls',
    desc: 'Every local variable, the call stack, the fact that step 1 just finished — all of it lived in that process and is now gone. It doesn’t matter. None of it was the source of truth.',
    worker: 'offline',
    historyAdd: [],
  },
  {
    label: 'Resume',
    title: '5 · A new worker resumes — from history, not memory',
    code: '$ python worker.py\nWorker running, Ctrl + C to stop',
    desc: 'A brand-new process starts, polls the same task queue, and gets a workflow task. Before running any of your code, the SDK replays the event history — sees validate_input already completed — and does NOT re-execute it. Execution resumes at the next await.',
    worker: 'resumed',
    historyAdd: ['(replay) validate_input already completed — skipped'],
  },
  {
    label: 'Activity 2',
    title: '6 · write_output runs and completes',
    code: 'async def write_output(results, target_path):\n    await asyncio.sleep(0.8)\n    return f"Results written to s3://data-lake/reports/{target_path}/batch.parquet"',
    desc: 'The resumed workflow schedules write_output, the new worker executes it, and the server persists ActivityTaskCompleted for step 2 — exactly one write, never two.',
    worker: 'resumed',
    historyAdd: ['ActivityTaskScheduled · write_output', 'ActivityTaskCompleted · write_output'],
  },
  {
    label: 'Complete',
    title: '7 · Workflow completes, the client gets its result',
    code: 'result = await client.execute_workflow(...)\nresult["status"]\n# "completed"',
    desc: 'The server persists WorkflowExecutionCompleted. run.py’s execute_workflow call — blocked the entire time — returns the final dict. From the caller’s side, this looked like one uninterrupted function call. The crash included.',
    worker: 'resumed',
    historyAdd: ['WorkflowExecutionCompleted'],
  },
]

/**
 * Interactive walkthrough of durable execution: a Temporal workflow surviving a
 * worker crash by replaying its durably-persisted event history instead of
 * re-running already-completed activities. Grounded in the post's demo project
 * (DataPipelineWorkflow: validate_input → write_output).
 */
@Component({
  selector: 'blog-durable-flow',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">Surviving a worker crash, step by step</span>
        <span class="counter">Step {{ idx() + 1 }} / {{ steps.length }}</span>
      </div>

      <div class="stepper">
        @for (s of steps; track s.label; let i = $index) {
          <button
            class="seg"
            [class.active]="i === idx()"
            [class.done]="i < idx()"
            [class.crash]="s.worker === 'offline'"
            (click)="go(i)"
            [attr.aria-current]="i === idx() ? 'step' : null"
          >
            <span class="dot">{{ i + 1 }}</span>
            <span class="seg-label">{{ s.label }}</span>
          </button>
        }
      </div>

      <div class="body">
        <div class="panel">
          <p class="panel-title">{{ step().title }}</p>
          <pre class="code">{{ step().code }}</pre>
          <p class="desc">{{ step().desc }}</p>
        </div>

        <div class="side">
          <div class="worker-box" [attr.data-state]="step().worker">
            <span class="tag">Worker process</span>
            <span class="worker-status">
              @switch (step().worker) {
                @case ('online') { ● running }
                @case ('offline') { ✖ killed }
                @case ('resumed') { ● new process }
              }
            </span>
          </div>

          <div class="history-box">
            <span class="tag">Event history · Temporal Server</span>
            <ul class="history-list">
              @for (ev of historySoFar(); track ev) {
                <li>{{ ev }}</li>
              }
            </ul>
          </div>
        </div>
      </div>

      <div class="controls">
        <button class="btn" (click)="prev()" [disabled]="idx() === 0">‹ Prev</button>
        <button class="btn play" (click)="togglePlay()">{{ playing() ? '❚❚ Pause' : '▶ Play' }}</button>
        <button class="btn" (click)="next()" [disabled]="idx() === steps.length - 1">Next ›</button>
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
        gap: 4px;
        flex-wrap: wrap;
      }
      .seg {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 6px;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 9px;
        padding: 6px 8px;
        cursor: pointer;
        color: #9aa7b5;
        font: inherit;
        font-size: 11.5px;
        transition: all 0.15s;
      }
      .seg:hover {
        border-color: #4a5568;
      }
      .seg .dot {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #21262d;
        font-size: 11px;
        font-weight: 700;
        flex-shrink: 0;
      }
      .seg-label {
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
      .seg.crash.active {
        border-color: #ef6f8c;
        background: #ef6f8c1a;
      }
      .seg.crash.active .dot {
        background: #ef6f8c;
        color: #08111f;
      }
      .body {
        display: grid;
        grid-template-columns: 1fr 220px;
        gap: 16px;
      }
      @media (max-width: 560px) {
        .body {
          grid-template-columns: 1fr;
        }
      }
      .panel .panel-title {
        margin: 0 0 8px;
        font-size: 14px;
        font-weight: 700;
        color: #7c9cff;
      }
      .code {
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 8px;
        padding: 10px 12px;
        margin: 0 0 10px;
        font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
        font-size: 12px;
        line-height: 1.5;
        color: #cdd6e0;
        white-space: pre-wrap;
        word-break: break-word;
        overflow-x: auto;
      }
      .desc {
        margin: 0;
        font-size: 13.5px;
        color: #9aa7b5;
      }
      .side {
        display: grid;
        gap: 12px;
        align-content: start;
      }
      .worker-box,
      .history-box {
        background: #0b0f16;
        border: 1px dashed #30363d;
        border-radius: 10px;
        padding: 12px;
        position: relative;
        min-height: 56px;
      }
      .tag {
        display: block;
        font-size: 10.5px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #8b98a8;
        margin-bottom: 8px;
      }
      .worker-box[data-state='online'] {
        border-style: solid;
        border-color: #2ea04366;
        background: #0d1f15;
      }
      .worker-box[data-state='offline'] {
        border-style: solid;
        border-color: #ef6f8c66;
        background: #241014;
      }
      .worker-box[data-state='resumed'] {
        border-style: solid;
        border-color: #7c9cff66;
        background: #10162a;
      }
      .worker-status {
        font-size: 13px;
        font-weight: 600;
      }
      .worker-box[data-state='online'] .worker-status {
        color: #5ad19a;
      }
      .worker-box[data-state='offline'] .worker-status {
        color: #ef6f8c;
      }
      .worker-box[data-state='resumed'] .worker-status {
        color: #7c9cff;
      }
      .history-list {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 6px;
        max-height: 150px;
        overflow-y: auto;
      }
      .history-list li {
        font-size: 11.5px;
        font-family: ui-monospace, Menlo, Consolas, monospace;
        color: #cdd6e0;
        border-left: 2px solid #7c9cff;
        padding-left: 8px;
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
export class DurableFlowComponent implements OnDestroy {
  readonly steps = STEPS
  readonly idx = signal(0)
  readonly playing = signal(false)
  readonly step = computed(() => this.steps[this.idx()])
  readonly historySoFar = computed(() => this.steps.slice(0, this.idx() + 1).flatMap((s) => s.historyAdd))

  private timer: ReturnType<typeof setInterval> | null = null

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
    }, 1700)
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
