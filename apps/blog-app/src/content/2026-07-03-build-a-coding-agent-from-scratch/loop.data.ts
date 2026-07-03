import type { Step } from './step-through.component'

// The core of agent.py's run_agentic_loop plus the two guardrails that make it
// trustworthy. Code condensed only for width; behaviour matches the repo.
export const LOOP_STEPS: Step[] = [
  {
    label: 'The loop',
    title: '1 · Wrap the primitive in a loop',
    phase: 'loop',
    code: `for turn in range(MAX_TOOL_ROUNDS):
    tool_calls, content = backend.step(messages)
    if not tool_calls:
        return content          # plain text → done
    for call in tool_calls:
        result = run_tool(repo_root, call["name"],
                          call["arguments"])
        backend.append_tool_result(messages, call, result)`,
    desc:
      'That is the whole core: ask the model, run the tool calls it returns, append the results, repeat. Plain text instead of a tool call means the run is over.',
    inspect: {
      kind: 'state',
      rows: [
        { k: 'turn 0', v: 'read_file("app.py")', tone: 'muted' },
        { k: 'turn 1', v: 'write_file("app.py", …)', tone: 'accent' },
        { k: 'turn 2', v: 'run_command("pytest")', tone: 'muted' },
        { k: 'turn 3', v: '"Done — added the fn." ✓', tone: 'good' },
      ],
    },
  },
  {
    label: 'Round budget',
    title: '2 · Cap the loop, then nudge it to act',
    phase: 'guardrail',
    code: `remaining = MAX_TOOL_ROUNDS - turn - 1
if write_count == 0 and remaining <= MAX_TOOL_ROUNDS // 2:
    messages.append({"role": "user", "content":
        "[You've used half your rounds and written "
        "nothing. Stop exploring and call write_file now.]"})`,
    desc:
      'MAX_TOOL_ROUNDS stops a confused run from looping forever. Past the halfway mark with nothing written, a nudge pushes the model to stop exploring and actually change a file.',
    inspect: {
      kind: 'state',
      rows: [
        { k: 'round', v: '11 / 20', tone: 'muted' },
        { k: 'writes', v: '0', tone: 'warn' },
        { k: 'action', v: 'inject "stop exploring" nudge', tone: 'warn' },
      ],
    },
  },
  {
    label: 'Self-check',
    title: '3 · Don\'t trust "I\'m done"',
    phase: 'guardrail',
    code: `if not tool_calls:                    # model says done
    test_files = changed_test_files(repo_root)
    if test_files:
        passed, output = run_pytest(repo_root, test_files)
        if not passed:
            messages.append({"role": "user", "content":
                f"Self-check: your tests are FAILING. "
                f"Fix them.\\n\\n{output}"})
            continue                     # back into the loop
    return content`,
    desc:
      'Before accepting "done", rerun any test files the model touched. If they fail, feed the failure back and loop again (capped by MAX_SELFCHECK_ROUNDS). This is what separates a real agent from one that only claims success.',
    inspect: {
      kind: 'state',
      rows: [
        { k: 'model', v: '"All finished."', tone: 'muted' },
        { k: 'pytest', v: '1 failed', tone: 'warn' },
        { k: 'action', v: 'send failure back → loop', tone: 'accent' },
      ],
    },
  },
]
