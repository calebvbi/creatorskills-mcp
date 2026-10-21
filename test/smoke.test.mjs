import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

test("built MCP server starts and serves all tools on the supported Node runtime", { timeout: 15000 }, async (t) => {
  const skill = {
    id: "test-skill",
    slug: "test-skill",
    name: "Test skill",
    shortDescription: "A local test fixture",
    price: 0,
    category: "OTHER",
    platforms: ["UNIVERSAL"],
    tags: [],
    thumbnailUrl: null,
    averageRating: null,
    reviewCount: 0,
    downloadCount: 0,
    minutesSavedPerUse: 5,
    usesPerMonth: 1,
    featured: false,
  };
  const api = createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(req.url.startsWith("/skills?") ? {
      items: [skill],
      pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1, hasNextPage: false },
    } : skill));
  });
  await new Promise((resolve) => api.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => api.close(resolve)));
  const client = new Client({ name: "node-security-smoke", version: "1.0.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["dist/index.js"],
    env: { CREATORSKILLS_API_URL: `http://127.0.0.1:${api.address().port}` },
  });
  t.after(() => client.close());
  await client.connect(transport);
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map(({ name }) => name).sort(), [
    "get_checkout_url", "get_skill", "list_skills", "search_skills",
  ]);
  for (const [name, args] of [
    ["list_skills", {}],
    ["search_skills", { query: "test" }],
    ["get_skill", { slug: "test-skill" }],
    ["get_checkout_url", { slug: "test-skill" }],
  ]) {
    const result = await client.callTool({ name, arguments: args });
    assert.notEqual(result.isError, true, name);
    assert.match(result.content[0].text, /Test skill/, name);
  }
});
