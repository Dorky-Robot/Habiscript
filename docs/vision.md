# Helm Mode — Product Vision

## The Idea in One Sentence

Katulong has two modes: **Terminal Mode** (tmux sessions — what it is today) and **Helm Mode** (a dashboard of programmable widgets — Excel for the AI era).

## The Two Modes

### Terminal Mode
What katulong is today. Tabs across the top, each tab is a tmux session, xterm.js renders the terminal. You manage sessions, run commands, use Claude Code. It's a remote terminal multiplexer.

### Helm Mode
A completely different interface. The tabs disappear. The terminal chrome disappears. The entire viewport becomes a **dashboard** — a grid of cells, each containing a widget. Each widget is a mini app. Widgets have APIs. Widgets talk to each other. You build dashboards to suit your needs.

A single button on the island toggles between the two modes.

```
┌─────────────────────────────────────────────────────────┐
│  Terminal Mode                                          │
│  ┌─────┬─────────┬──────────┐                          │
│  │ dev │ staging │ claude   │  ← tabs (tmux sessions)  │
│  ├─────┴─────────┴──────────┤                          │
│  │ $ npm test                │                          │
│  │ ✓ 42 tests passed        │  ← xterm.js terminal     │
│  │ $                         │                          │
│  └───────────────────────────┘                          │
│                                    [🤖] ← toggle       │
└─────────────────────────────────────────────────────────┘

                        ↕ toggle

┌─────────────────────────────────────────────────────────┐
│  Helm Mode                                              │
│  ┌──────────────────┬──────────────────┐                │
│  │  Claude Companion │  Test Runner     │                │
│  │  🔧 Edit server.js│  ✅ auth (14/14) │                │
│  │  📖 Read auth.js  │  ❌ e2e  (8/12)  │                │
│  ├──────────────────┼──────────────────┤                │
│  │  Terminal         │  Git Timeline    │                │
│  │  $ npm test       │  ●─●─●─● v2.0   │                │
│  │  ✓ 42 passed      │                  │                │
│  └──────────────────┴──────────────────┘                │
│                                    [🤖] ← toggle       │
└─────────────────────────────────────────────────────────┘
```

## The Mental Model Shift

**Terminal Mode thinks in sessions.** You have tmux sessions. You switch between them. You see one at a time. It's a multiplexer.

**Helm Mode thinks in dashboards and widgets.** You have a grid of cells. Each cell is a widget. You see everything at once. It's a workspace.

This is the same shift that happened from **command-line to spreadsheet**. The CLI is powerful but serial — one thing at a time. The spreadsheet is parallel — everything is visible, everything is connected.

## The Excel Analogy

This is the core of the idea. Excel revolutionized computing because:

1. **Cells are the universal unit.** Simple, uniform, infinitely flexible.
2. **Formulas reference other cells.** `=A1+B1` — cells compose.
3. **Anyone can use it.** No programming required to get value.
4. **Power users go deep.** VBA, pivot tables, macros — progressive complexity.
5. **It's both the tool and the product.** You don't "deploy" a spreadsheet. You just share it.

Helm Mode follows the same pattern:

| Excel | Helm Mode |
|-------|-----------|
| Cell | Widget |
| Formula | AI-generated behavior |
| Cell reference (`=A1`) | Widget API (`widget.api.getData()`) |
| Spreadsheet | Dashboard |
| Share via email/link | Publish via tunnel |
| VBA macros | Claude Code sessions |
| Pivot table | Meta widget (describe → build) |

### Cells Have APIs, Not Formulas

In Excel, a cell's formula references other cells: `=SUM(A1:A10)`.

In Helm Mode, a widget's API exposes data and actions to other widgets:

```
┌──────────────────┬──────────────────┐
│  Test Runner     │  Coverage Chart   │
│  widget.api:     │  widget.api:      │
│    getResults()  │    setData(data)  │
│    onUpdate(cb)  │    highlight(file)│
│                  │                   │
│  Runs tests,     │  Subscribes to    │
│  exposes results │  test runner,     │
│  via API         │  charts coverage  │
└──────────────────┴──────────────────┘

// The coverage chart "references" the test runner:
testRunner.api.onUpdate((results) => {
  coverageChart.api.setData(results.coverage);
});
```

This is `=A1` but for apps. Widgets compose by connecting their APIs.

### Publishing via Tunnels

Katulong already has tunnel support (ngrok, Cloudflare). This means:

- **A dashboard is URL-addressable.** Share `https://your-tunnel.trycloudflare.com/helm` and someone sees your dashboard.
- **A widget is URL-addressable.** Share a single widget as a standalone page.
- **Anyone with the link can interact.** They don't need katulong installed. They just open a URL.

This is "share a spreadsheet" for the AI era. You don't deploy your dashboard. You just share the tunnel URL.

## Background & Inspirations

### HyperCard (Apple, 1987)

HyperCard dissolved the boundary between user and developer. Every "card" was a mini application. Every button, field, and image was a programmable object with its own script (HyperTalk). A teacher could build a quiz app. A kid could make a game. You didn't need to be a programmer — you just told the objects what to do.

The key insight: **the tool and the thing you build with it are the same thing.** A card is both the UI and the program. There's no separate IDE, no compilation step, no deploy. You're always one click away from changing how something works.

**What we take:** The philosophy. Widgets are programmable objects. Users can modify them. The dashboard is both the tool and the product.

### Notion Dashboards

Notion dashboards arrange widgets in a grid (max 4 per row, drag/resize). But Notion widgets are *views* — they display data from databases. They don't run code, don't have behaviors, don't talk to APIs.

**What we take:** The layout model. Grid, resize, drag-and-drop, view/edit modes. Habiscript already implements this.

**What we leave behind:** Widgets as passive data views.

### Excel

Excel made computation accessible through cells, formulas, and references. Anyone could build a financial model, a project tracker, an inventory system — without writing code.

**What we take:** The mental model. Cells (widgets) are the universal unit. They reference each other (APIs). The spreadsheet (dashboard) is both the tool and the product. You share it, not deploy it.

**What we leave behind:** The 2D grid constraint. Our cells are resizable mini apps, not text boxes.

### OpenUI / JSON Render

OpenUI lets AI generate UI from component libraries. But the components must be predefined.

**What we take:** AI can generate UI from natural language.

**What we leave behind:** Predefined component libraries. Our widgets can be anything.

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
4. The widget becomes a living mini app with an API
5. User can talk to the widget to modify it further
6. Other widgets can connect to its API

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
        │ renders itself, exposes API
        ▼
 ┌─────────────┐
 │  Test Runner │  ← live widget with state, events, API
 │  widget.api: │
 │   getResults │  ← other widgets can connect
 │   onUpdate   │
 └──────┬──────┘
        │ user says "add a filter by test suite"
        ▼
 ┌─────────────┐
 │  Test Runner │  ← widget modifies itself
 │  + Filter    │  ← AI edits the widget's code in-place
 │  + api.filter│  ← new API method exposed
 └─────────────┘
```

### Concrete Examples

**Example 1: Developer Workspace**
```
┌──────────────────────────┬──────────────────────────┐
│  Terminal                │  Claude Companion         │
│  (xterm.js, tmux)        │  (hook-powered)           │
│  $ claude                │  🔧 Edit: server.js       │
│  > fix the auth bug      │  📖 Read: lib/auth.js     │
│  ...                     │  ✅ Tests passing          │
├──────────────────────────┼──────────────────────────┤
│  File Browser            │  Live Diff                │
│  📁 src/                 │  server.js +3 -1          │
│    📁 lib/               │  + validateToken(req)     │
│    📄 server.js ←changed │  - checkAuth(req)         │
└──────────────────────────┴──────────────────────────┘
```
Four registered widget types. File browser watches the filesystem. Live diff subscribes to Claude Companion's edit events via API.

**Example 2: AI-Built Dashboard**
User says: "set up a dashboard for monitoring my Node.js app"

AI creates four widgets:
```
┌──────────────────────────┬──────────────────────────┐
│  Request Latency         │  Error Log               │
│  p50: 12ms  p99: 340ms  │  [ERROR] auth timeout     │
│  ▁▂▃▂▁▃▅▇▅▃▂▁          │  [WARN] slow query 2.1s   │
├──────────────────────────┼──────────────────────────┤
│  Health Check            │  Deploy Status            │
│  ● API: healthy          │  main: deployed 2h ago    │
│  ● DB: healthy           │  staging: building...     │
│  ● Redis: degraded       │  PR #352: tests passing   │
└──────────────────────────┴──────────────────────────┘
```
Each widget is a live mini app. Error Log subscribes to Health Check's API. Clicking a deploy shows the git diff. The whole thing was described in one sentence.

**Example 3: Composing Widgets**
```
// The error log widget exposes an API:
errorLog.api.onError((error) => { ... })
errorLog.api.getRecent(n)
errorLog.api.filter(severity)

// The health check widget references it:
errorLog.api.onError((error) => {
  if (error.service === "redis") {
    healthCheck.api.markDegraded("redis");
  }
});
```
This is `=A1+B1` but for apps. Widgets reference each other through APIs.

**Example 4: Publishing**
You built a monitoring dashboard. Share it:
```
https://your-tunnel.trycloudflare.com/helm/dashboard/monitoring
```
A colleague opens the URL. They see your dashboard. They can interact with it. They can't modify it (view mode). If you give them edit access, they can add widgets, rearrange, modify.

### The Meta Widget

The meta widget is the bridge between human intent and widget creation. It's powered by Claude Code:

1. Receives a natural language description
2. Generates a widget using Habiscript primitives (`habiToHtml`, styles, event handlers)
3. Defines the widget's API (what data/actions it exposes)
4. Mounts the result into the cell
5. Stays available for follow-up modifications

This is `become("a widget that shows test results")` — the freeform mode of the `become()` function. You don't pick from a menu. You describe what you want and it materializes.

## How It Connects

### Katulong — The Host
- **Terminal Mode** — tmux sessions, xterm.js, tabs (existing)
- **Helm Mode** — dashboard container, widget lifecycle, mode toggle
- **Tunnel** — remote access, widget publishing, URL-addressable dashboards
- **Auth** — WebAuthn, setup tokens, view/edit permissions

### Habiscript — The Widget System
- **Widget protocol** — mount/update/unmount lifecycle
- **Dashboard layout** — grid, resize, drag-and-drop, FLIP animation
- **`become()` function** — widget creation from descriptions
- **Widget registry** — register/create/list widget types
- **DOM primitives** — `habiToHtml`, styles, elements

### Yolo — The AI Bridge
- **Launcher** — detects katulong, configures hooks, starts Claude Code
- **Hooks** — streams Claude Code events to katulong's helm view
- **Meta widget backend** — Claude Code sessions that build widgets

### The Full Circle
```
User toggles to Helm Mode
  → Dashboard loads with widgets
    → User adds a cell: "show me test results"
      → Meta widget spawns Claude Code session
        → Claude builds the widget using Habiscript
          → Widget mounts, exposes API
            → Other widgets connect to its API
              → User publishes via tunnel
                → Colleague opens URL, sees live dashboard
```

## Design Principles

### 1. Two Modes, One App
Terminal Mode and Helm Mode are peers, not parent-child. Toggle between them like switching desks in an office. Terminal is your workbench. Helm is your dashboard wall.

### 2. Widgets Are Apps, Not Views
A widget can have state, event handlers, API calls, timers, WebSocket connections. It's a running program, not a rendering of data.

### 3. Cells Have APIs
Like Excel cells reference each other with formulas, widgets reference each other with APIs. This is what makes dashboards more than a collection of isolated panels.

### 4. AI Is the Builder
AI doesn't just arrange predefined components. It writes the code that makes widgets work. The "formula language" is a conversation with Claude.

### 5. Everything Is Modifiable
Any widget can be talked to. "Make this chart bigger." "Add a dark mode toggle." "Connect this to the test runner." The AI modifies the widget in response.

### 6. Share, Don't Deploy
Tunnels make dashboards URL-addressable. Share a link. Someone opens it. No install, no deploy, no infrastructure. Like sharing a Google Sheet.

### 7. Progressive Complexity
- **Level 0**: Toggle to Helm, use built-in widgets (terminal, file browser)
- **Level 1**: Describe a widget, AI builds it
- **Level 2**: Modify a widget by talking to it
- **Level 3**: Connect widgets via APIs
- **Level 4**: Publish dashboards via tunnel
- **Level 5**: AI proposes widgets based on what you're doing

### 8. Preserve State
Habiscript's dashboard detaches and re-inserts DOM nodes during layout changes. Terminal sessions, WebSocket connections, and widget state survive rearrangement.

## Implementation Roadmap

### Phase 1: Foundation (Done)
- ✅ Hook-based event streaming from Claude Code to katulong
- ✅ Helm companion view with tool call rendering
- ✅ Toggle between terminal and helm views
- ✅ PTY input from helm to terminal
- ✅ Habiscript widget protocol and dashboard layout

### Phase 2: Mode Toggle & Dashboard Shell
- [ ] Island button toggles between Terminal Mode and Helm Mode
- [ ] Helm Mode replaces entire viewport with Habiscript dashboard
- [ ] Register `terminal` widget type (wraps xterm.js from terminal pool)
- [ ] Register `helm-companion` widget type (wraps current helm-component.js)
- [ ] Default Helm layout: terminal + companion side by side
- [ ] Persist dashboard layout per user/session
- [ ] Bundle Habiscript into katulong's vendor assets

### Phase 3: Widget API Protocol
- [ ] Define widget API contract (`widget.api = { ... }`)
- [ ] Widget registry with API schema declaration
- [ ] Inter-widget references (widget A subscribes to widget B's API)
- [ ] Dashboard-level event bus for widget communication
- [ ] API inspector/debugger widget (like Excel's formula bar)

### Phase 4: Meta Widget & AI Generation
- [ ] Implement meta widget that spawns Claude Code to build widgets
- [ ] `become("description")` creates widgets from natural language
- [ ] Widget picker UI (registered types + freeform description)
- [ ] Conversational modification of existing widgets
- [ ] Widget saves its own source for persistence/sharing

### Phase 5: Rich Built-in Widgets
- [ ] File browser widget (wraps existing katulong file browser)
- [ ] Diff viewer widget (syntax-highlighted git diffs)
- [ ] Log viewer widget (tails file or process output)
- [ ] Chart widget (time series, bar, pie)
- [ ] Markdown viewer widget
- [ ] Image/media widget

### Phase 6: Publishing & Sharing
- [ ] Dashboard URL routes (`/helm/dashboard/:name`)
- [ ] Single-widget URL routes (`/helm/widget/:id`)
- [ ] View/edit mode permissions
- [ ] Dashboard templates (preset layouts for common workflows)
- [ ] Export/import dashboard configs

## Open Questions

1. **Widget sandboxing.** If a meta widget generates arbitrary JS, what are the security boundaries? Same-origin iframe? CSP? Do we trust AI-generated code in the main frame?

2. **API discovery.** How does widget B know what APIs widget A exposes? A registry? Runtime introspection? Something like Excel's autocomplete for cell references?

3. **State persistence.** When katulong restarts, do widgets resume? Is widget state stored on disk? Just the layout config + widget source?

4. **Mobile experience.** Dashboard grid works on desktop/tablet. On phone, stack widgets vertically? Swipe between them? Or is phone always Terminal Mode?

5. **Multi-user dashboards.** If two people view the same tunnel, do they see the same dashboard? Independent layouts? Real-time collaboration (like Google Sheets)?

6. **Widget marketplace.** Can users share widget types (not just instances)? A community registry of reusable widgets?
