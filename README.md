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
