# Agent Jake Browser MCP Server

An MCP (Model Context Protocol) server that enables AI agents to automate Chrome browser interactions.

## Overview

This server implements the MCP protocol to expose browser automation tools to AI agents like Claude. It works in conjunction with [agent-jake-browser-mcp-extension](https://github.com/SnakeO/agent-jake-browser-mcp-extension) to provide full browser control.

## Architecture

```
┌─────────────────┐     stdio      ┌─────────────────┐   WebSocket    ┌──────────────────┐
│   AI Agent      │◄──────────────►│   MCP Server    │◄──────────────►│ Chrome Extension │
│ (Claude, etc.)  │   JSON-RPC     │  (This project) │   port 8765    │                  │
└─────────────────┘                └─────────────────┘                └────────┬─────────┘
                                                                               │
                                                                               │ Chrome
                                                                               │ Debugger
                                                                               │ API
                                                                               ▼
                                                                      ┌──────────────────┐
                                                                      │   Browser Tab    │
                                                                      │  (Any website)   │
                                                                      └──────────────────┘
```

## Installation

```bash
git clone https://github.com/SnakeO/agent-jake-browser-mcp-server.git
cd agent-jake-browser-mcp-server
npm install
npm run build
```

## Usage

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "browser": {
      "command": "node",
      "args": ["/path/to/agent-jake-browser-mcp-server/dist/index.js"]
    }
  }
}
```

### With VS Code / Cursor

Add to your MCP settings:

```json
{
  "mcp.servers": {
    "browser": {
      "command": "node",
      "args": ["/path/to/agent-jake-browser-mcp-server/dist/index.js"]
    }
  }
}
```

### CLI Options

```bash
node dist/index.js [options]

Options:
  --port <number>    WebSocket port for extension connection (default: 8765)
  --verbose          Enable verbose logging
  --help             Show help
```

## Tools

### Navigation (4 tools)

| Tool | Description |
|------|-------------|
| `browser_navigate` | Navigate to a URL |
| `browser_go_back` | Go back in browser history |
| `browser_go_forward` | Go forward in browser history |
| `browser_reload` | Reload the current page |

### Page Inspection (1 tool)

| Tool | Description |
|------|-------------|
| `browser_snapshot` | Get ARIA accessibility tree snapshot of the page |

### Interaction (6 tools)

| Tool | Description |
|------|-------------|
| `browser_click` | Click on an element |
| `browser_type` | Type text into an input field |
| `browser_hover` | Hover over an element |
| `browser_drag` | Drag an element to another location |
| `browser_select_option` | Select an option from a dropdown |
| `browser_press_key` | Press a keyboard key or combination |

### Element Queries (5 tools)

| Tool | Description |
|------|-------------|
| `browser_get_text` | Get text content of an element |
| `browser_get_attribute` | Get an attribute value from an element |
| `browser_is_visible` | Check if an element is visible |
| `browser_wait_for_element` | Wait for an element to appear |
| `browser_highlight` | Highlight an element for debugging |

### Tab Management (4 tools)

| Tool | Description |
|------|-------------|
| `browser_new_tab` | Open a URL in a new tab |
| `browser_list_tabs` | List all open browser tabs |
| `browser_switch_tab` | Switch to a different tab |
| `browser_close_tab` | Close a browser tab |

### Utility (3 tools)

| Tool | Description |
|------|-------------|
| `browser_wait` | Wait for a specified time |
| `browser_screenshot` | Take a screenshot of the page |
| `browser_get_console_logs` | Get console log messages |

## Example Usage

Once connected, the AI agent can use these tools:

```
AI: I'll help you fill out that form. First, let me take a snapshot of the page.
[calls browser_snapshot]

AI: I can see the form fields. Let me fill in your name.
[calls browser_type with ref="e12", text="John Doe"]

AI: Now I'll click the submit button.
[calls browser_click with ref="e15"]
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development with watch
npm run dev

# Run tests
npm test

# Type checking
npm run typecheck
```

## Project Structure

```
src/
├── index.ts           # Entry point
├── server.ts          # MCP server implementation
├── context.ts         # Extension communication context
├── ws-server.ts       # WebSocket server for extension
├── types.ts           # TypeScript type definitions
├── tools/             # Tool implementations
│   ├── index.ts       # Tool registry
│   ├── navigation.ts  # Navigate, back, forward, reload
│   ├── snapshot.ts    # ARIA snapshot
│   ├── interaction.ts # Click, type, hover, drag
│   ├── queries.ts     # Get text, attributes, visibility
│   ├── tabs.ts        # Tab management
│   └── utility.ts     # Wait, screenshot, console logs
└── utils/             # Utilities
    ├── logger.ts      # Logging
    └── port.ts        # Port management
```

## Tech Stack

- Node.js
- TypeScript
- MCP SDK (@anthropic/mcp-sdk)
- Zod for schema validation
- WebSocket (ws) for extension communication
- tsup for bundling

## Related

- [agent-jake-browser-mcp-extension](https://github.com/SnakeO/agent-jake-browser-mcp-extension) - Chrome extension that executes browser commands

## License

MIT - See [LICENSE](LICENSE)
