# CreatorSkills MCP Server

Browse, search, and install AI skills for content creators — directly from Claude, Cursor, Cline, and any MCP-compatible AI assistant.

**Homepage:** https://creatorskills.co  
**Docs:** https://creatorskills.co/docs/mcp

## Tools

| Tool | Description |
|------|-------------|
| `list_skills` | Browse the full catalog with filters (category, platform, price, sort) |
| `get_skill` | Get full details for a specific skill by slug |
| `search_skills` | Semantic keyword search across the catalog |
| `get_checkout_url` | Generate a checkout URL with UTM attribution |

## Requirements

Use Node.js 22.23.4 or later in the 22.x line, 24.22.1 or later in 24.x, or 26.12.1 or later in 26.x. Older patch releases and end-of-life Node.js versions are not supported. The development and release baseline is pinned in `.node-version`.

## Install

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "creatorskills": {
      "command": "npx",
      "args": ["-y", "creatorskills-mcp"]
    }
  }
}
```

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "creatorskills": {
      "command": "npx",
      "args": ["-y", "creatorskills-mcp"]
    }
  }
}
```

### Cline

Open Cline settings → MCP Servers → Add:

```json
{
  "creatorskills": {
    "command": "npx",
    "args": ["-y", "creatorskills-mcp"]
  }
}
```

## Example tool calls

**Browse the catalog:**
```
list_skills(category="CONTENT_REPURPOSING", sort="popular")
```

**Search for a skill:**
```
search_skills(query="repurpose YouTube video to tweets")
```

**Get a checkout link:**
```
get_checkout_url(slug="viral-hook-generator")
```

## License

MIT
