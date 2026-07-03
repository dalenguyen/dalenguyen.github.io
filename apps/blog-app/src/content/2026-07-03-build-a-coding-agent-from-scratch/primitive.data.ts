import type { Step } from './step-through.component'

// The three single requests from basics.py — each printed so the tool_calls
// shape is familiar before the loop is built around it.
export const PRIMITIVE_STEPS: Step[] = [
  {
    label: 'Plain chat',
    title: '1 · One request, no tools',
    phase: 'primitive',
    code: `ollama.chat(
    model=MODEL,
    messages=[{"role": "user",
               "content": "Say hello in one short sentence."}],
)`,
    desc:
      'The baseline every agent is built on: an ordinary chat call with no `tools=` argument. The reply is plain text and there is nothing to act on.',
    inspect: {
      kind: 'response',
      content: '"Hello there — nice to meet you!"',
      toolCalls: [],
    },
  },
  {
    label: 'Tool ignored',
    title: '2 · Tool available, not needed',
    phase: 'primitive',
    code: `ollama.chat(
    model=MODEL,
    messages=[{"role": "user",
               "content": "What is 2 + 2?"}],
    tools=READ_FILE_TOOL,   # available…
)`,
    desc:
      "Handing the model a tool doesn't force it to use one. The question has nothing to do with files, so it answers in plain text and tool_calls stays empty.",
    inspect: {
      kind: 'response',
      content: '"4"',
      toolCalls: [],
    },
  },
  {
    label: 'Tool called',
    title: '3 · Tool available, and needed',
    phase: 'primitive',
    code: `ollama.chat(
    model=MODEL,
    messages=[{"role": "user",
               "content": "Read notes.txt with the read_file tool."}],
    tools=READ_FILE_TOOL,
)`,
    desc:
      'Now the prompt needs the tool. content comes back empty and tool_calls has one entry — a name plus arguments. This structured response is the entire primitive an agent is built on.',
    inspect: {
      kind: 'response',
      content: 'None',
      toolCalls: ['read_file(path="notes.txt")'],
    },
  },
]
