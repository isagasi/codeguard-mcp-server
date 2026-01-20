# Configuration Examples

## Claude Desktop Setup

Copy the contents of `claude-desktop-config.json` to:
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

Update the path to match your installation location, then restart Claude Desktop.

## GitHub Copilot Setup (VS Code)

Copy `github-copilot-mcp-config.json` to your project repository as:
```
your-project/
  .github/
    .mcp.json  ← Copy here
```

Update the path to match your CodeGuard server installation.

**Note:** GitHub Copilot MCP support is pending. Use with Claude Desktop for now.
