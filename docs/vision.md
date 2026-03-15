# Helm Mode — Product Vision

## The Idea in One Sentence

Each widget in a dashboard is a mini app that can construct itself through conversation with an AI — HyperCard meets Claude Code.

## Background & Inspirations

### HyperCard (Apple, 1987)

HyperCard was revolutionary because it dissolved the boundary between user and developer. Every "card" was a mini application. Every button, field, and image was a programmable object with its own script (HyperTalk). A teacher could build a quiz app. A kid could make a game. You didn't need to be a programmer — you just told the objects what to do.

The key insight: **the tool and the thing you build with it are the same thing.** A card is both the UI and the program. There's no separate IDE, no compilation step, no deploy. You're always one click away from changing how something works.

### Notion Dashboards

Notion dashboards arrange widgets in a grid (max 4 per row, drag/resize). But Notion widgets are *views* — they display data from databases. They don't run code, don't have behaviors, don't talk to APIs. They're windows into data, not applications.

**What we take from Notion:** The layout model. Grid of resizable widgets, drag-and-drop reorder, view/edit modes. Habiscript already implements this (rows, cells, resize handles, FLIP animation).

**What we leave behind:** The idea that widgets are just data views. Our widgets do things.

### OpenUI / JSON Render

OpenUI and similar projects let AI generate UI from component libraries. The model outputs structured markup, a renderer turns it into React components. But the component library is predefined — the model can only arrange pieces that already exist. It's AI as a layout engine, not AI as a builder.

**What we take:** The idea that AI can generate UI from natural language descriptions. Habiscript's `become()` function already routes freeform descriptions to a meta widget.

**What we leave behind:** The constraint that components must be predefined. Our widgets can be anything.

## The Vision: Self-Constructing Widgets

### What Makes This Different

Most AI-UI approaches work top-down:
1. Developer defines component library
2. AI selects and arranges components
3. User sees the result

We work bottom-up:
1. User describes what they want (or AI proposes it)
2. A widget is born — empty, with an AI session attached
3. The AI builds the widget's UI, behavior, and state
4. The widget becomes a living mini app
5. User can talk to the widget to modify it further

**Each widget is a HyperCard card with Claude as HyperTalk.**

### The Widget Lifecycle

```
 "show me test results"
        │
        ▼
 ┌─────────────┐
 │  Empty Cell  │  ← user adds widget to dashboard
 └──────┬──────┘
        │ become("show me test results")
        ▼
 ┌─────────────┐
 │  Meta Widget │  ← AI session spawns, reads description
 │  (building)  │  ← AI generates HTML/CSS/JS using Habiscript
 └──────┬──────┘
        │ renders itself
        ▼
 ┌─────────────┐
 │  Test Runner │  ← live widget showing test results
 │  Widget      │  ← has its own state, event handlers, API calls
 └──────┬──────┘
        │ user says "add a filter by test suite"
        ▼
 ┌─────────────┐
 │  Test Runner │  ← widget modifies itself
 │  + Filter    │  ← AI edits the widget's code in-place
 └─────────────┘
```

### Concrete Examples

**Example 1: Terminal + Helm Side by Side**
```
┌──────────────────────────┬──────────────────────────┐
│  Terminal (xterm.js)     │  Helm Companion          │
│  $ claude                │  🔧 Edit: server.js      │
│  > fix the auth bug      │  📖 Read: lib/auth.js    │
│  ...                     │  ✅ Tests passing         │
└──────────────────────────┴──────────────────────────┘
```
Two registered widget types. Terminal is a standard katulong session. Helm is the Claude Code companion view (hook-powered).

**Example 2: AI-Generated Dashboard**
```
┌──────────────────────────┬──────────────────────────┐
│  "show git log as a      │  "file tree with quick   │
│   visual timeline"       │   preview on hover"      │
│                          │                          │
│  ● fix auth ─── ● v2.0  │  📁 src/                 │
│  │               │       │    📁 widget/             │
│  ● add tests    ● docs  │    📁 dashboard/          │
├──────────────────────────┼──────────────────────────┤
│  "test results with      │  "cpu and memory usage   │
│   pass/fail badges"      │   live chart"            │
│                          │                          │
│  ✅ auth.test.js (14/14) │  CPU ▁▂▃▅▇▅▃▂▁ 23%     │
│  ✅ http.test.js (11/11) │  MEM ▃▃▃▃▄▄▅▅▅ 61%     │
│  ❌ e2e.test.js (8/12)   │                          │
└──────────────────────────┴──────────────────────────┘
```
Each widget was described in natural language. Claude built it using Habiscript primitives. Each one is a live mini app — the test results widget watches for file changes, the CPU chart polls /proc/stat.

**Example 3: Conversational Refinement**
```
User clicks on the git timeline widget and says:
"make it interactive — clicking a commit shows the diff"

Claude modifies the widget's code in-place.
The widget now has click handlers and a diff viewer.
No page reload. No redeploy. Just... better.
```

### The Meta Widget

The meta widget is the bridge between human intent and widget creation. It's a Claude Code session that:

1. Receives a natural language description
2. Generates a widget using Habiscript primitives (`habiToHtml`, styles, event handlers)
3. Mounts the result into the cell
4. Stays available for follow-up modifications

This is `become("a widget that shows test results")` — the freeform mode of the `become()` function. It's what makes the whole system feel like HyperCard. You don't pick from a menu of predetermined widgets. You describe what you want and it materializes.

### How It Connects to Katulong

Katulong is the host. It provides:
- **The terminal** — tmux sessions, xterm.js rendering, WebSocket transport
- **The helm view** — Claude Code companion via hooks
- **The tunnel** — remote access via ngrok/Cloudflare
- **Authentication** — WebAuthn, setup tokens

Habiscript provides:
- **The widget protocol** — mount/update/unmount lifecycle
- **The dashboard layout** — grid, resize, drag-and-drop
- **The `become()` function** — widget creation from descriptions
- **DOM primitives** — `habiToHtml`, styles, elements

Yolo provides:
- **The launcher** — detects katulong, configures hooks, starts Claude Code
- **The hooks bridge** — streams Claude Code events to katulong

Together:
```
Yolo launches Claude Code
  → Claude Code hooks stream to katulong
    → Katulong renders events in helm widgets
      → Helm widgets live in a Habiscript dashboard
        → Dashboard widgets can be created/modified by AI
          → AI runs via Claude Code (full circle)
```

## Design Principles

### 1. Widgets Are Apps, Not Views
A widget can have state, event handlers, API calls, timers, WebSocket connections. It's not a passive rendering of data — it's a running program.

### 2. AI Is the Builder, Not the Renderer
AI doesn't just arrange predefined components. It writes the code that makes widgets work. Like HyperTalk, but the language is JavaScript and the runtime is the browser.

### 3. Everything Is Modifiable
Any widget can be talked to. "Make this chart bigger." "Add a dark mode toggle." "Connect this to the test runner." The AI modifies the widget's code in response. No deploy cycles.

### 4. The Dashboard Is a Workspace, Not a Page
It's where you work, not where you read. Terminal, files, monitoring, tests, docs — all in one view, all interactive, all modifiable.

### 5. Progressive Complexity
- **Level 0**: Use registered widgets (terminal, helm, file browser)
- **Level 1**: Describe a widget in natural language, AI builds it
- **Level 2**: Talk to a widget to modify its behavior
- **Level 3**: Widgets talk to each other (shared context, events)
- **Level 4**: AI proposes widgets based on what you're doing

### 6. Preserve State Across Changes
Habiscript's dashboard already detaches and re-inserts DOM nodes during layout changes. This means terminal sessions, WebSocket connections, and widget state survive rearrangement. This is critical — destroying a terminal to resize a column would be unacceptable.

## Implementation Roadmap

### Phase 1: Foundation (Current — PR #352, PR #1)
- ✅ Hook-based event streaming from Claude Code to katulong
- ✅ Helm companion view with tool call rendering
- ✅ Toggle between terminal and helm views
- ✅ PTY input from helm to terminal
- ✅ Habiscript widget protocol and dashboard layout (PR #1)

### Phase 2: Dashboard Integration
- [ ] Mount Habiscript dashboard as the helm view container
- [ ] Register `terminal` widget type (wraps xterm.js terminal pool)
- [ ] Register `helm` widget type (wraps current helm-component.js)
- [ ] Default layout: terminal + helm side by side
- [ ] Persist dashboard layout per session

### Phase 3: Meta Widget
- [ ] Implement meta widget that spawns a Claude Code session
- [ ] `become("description")` creates a widget from natural language
- [ ] Widget picker UI when adding cells to dashboard
- [ ] Widget modification via conversational follow-up

### Phase 4: Rich Widgets
- [ ] File browser widget (wraps existing katulong file browser)
- [ ] Diff viewer widget (renders git diffs with syntax highlighting)
- [ ] Log viewer widget (tails file or process output)
- [ ] Chart widget (renders time series, bar charts, etc.)

### Phase 5: Widget Communication
- [ ] Shared context bus between widgets
- [ ] Widget-to-widget events (e.g., file browser → editor)
- [ ] AI-proposed widgets based on current activity
- [ ] Dashboard templates (preset layouts for common workflows)

## Open Questions

1. **How does the meta widget run Claude Code?** Does it spawn a new `claude` process? Use the Agent SDK? Reuse the existing session's hooks?

2. **Security model for AI-generated widgets.** If a widget can run arbitrary JS, what are the boundaries? Sandboxed iframe? CSP restrictions? Same-origin only?

3. **State persistence.** When the user closes and reopens katulong, should widgets resume? Where is widget state stored?

4. **Multi-user.** If two people view the same katulong instance, do they see the same dashboard? Can they have independent layouts?

5. **Mobile.** The dashboard grid works on desktop. What's the mobile experience? Stack widgets vertically? Swipe between them?
