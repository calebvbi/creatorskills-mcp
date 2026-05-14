#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE =
  process.env.CREATORSKILLS_API_URL ?? "https://creatorskills.co/api/mcp";
const APP_URL = "https://creatorskills.co";

async function apiFetch<T>(
  path: string
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "User-Agent": "creatorskills-mcp/1.0" },
    });
    if (!res.ok) {
      const body = await res.text();
      return {
        data: null,
        error: `API error ${res.status}: ${body.slice(0, 200)}`,
      };
    }
    return { data: (await res.json()) as T, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  CONTENT_REPURPOSING: "Content Repurposing",
  TITLES_THUMBNAILS: "Titles & Thumbnails",
  SCRIPTS_OUTLINES: "Scripts & Outlines",
  ANALYTICS_OPTIMIZATION: "Analytics & Optimization",
  SPONSOR_BRAND_DEALS: "Sponsor & Brand Deals",
  COMMUNITY_ENGAGEMENT: "Community Engagement",
  COURSE_CREATION: "Course Creation",
  FREELANCE_CLIENT: "Freelance & Client Work",
  EMAIL_NEWSLETTER: "Email & Newsletter",
  IMAGE_GENERATION_THUMBNAILS: "Image Generation (Thumbnails)",
  IMAGE_GENERATION_BRANDING: "Image Generation (Branding)",
  IMAGE_EDITING: "Image Editing",
  PODCASTING: "Podcasting",
  PRODUCT_CREATION: "Product Creation",
  OTHER: "Other",
};

function formatPrice(price: number): string {
  return price === 0 ? "Free" : `$${price.toFixed(2)}`;
}

function skillUrl(slug: string): string {
  return `${APP_URL}/skills/${slug}`;
}

function checkoutUrl(slug: string, utmSource = "mcp"): string {
  return `${APP_URL}/skills/${slug}?utm_source=${utmSource}&utm_medium=mcp&utm_campaign=mcp-tool`;
}

type SkillItem = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description?: string;
  price: number;
  category: string;
  platforms: string[];
  tags: string[];
  thumbnailUrl: string | null;
  averageRating: number | null;
  reviewCount: number;
  downloadCount: number;
  minutesSavedPerUse: number;
  usesPerMonth: number;
  featured: boolean;
  createdAt?: string;
};

type ListResponse = {
  items: SkillItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
};

function formatSkillSummary(skill: SkillItem): string {
  const lines = [
    `**${skill.name}** (${formatPrice(skill.price)})`,
    `Slug: \`${skill.slug}\``,
    `Category: ${CATEGORY_LABELS[skill.category] ?? skill.category}`,
    `Platforms: ${skill.platforms.join(", ")}`,
    skill.averageRating
      ? `Rating: ${skill.averageRating.toFixed(1)}/5 (${skill.reviewCount} reviews)`
      : `Rating: No reviews yet`,
    `Downloads: ${skill.downloadCount}`,
    ``,
    skill.shortDescription,
    ``,
    `URL: ${skillUrl(skill.slug)}`,
  ];
  return lines.join("\n");
}

function formatSkillDetail(skill: SkillItem): string {
  const lines = [
    `# ${skill.name}`,
    ``,
    `**Price:** ${formatPrice(skill.price)}`,
    `**Category:** ${CATEGORY_LABELS[skill.category] ?? skill.category}`,
    `**Platforms:** ${skill.platforms.join(", ")}`,
    `**Tags:** ${skill.tags.join(", ") || "none"}`,
    skill.averageRating
      ? `**Rating:** ${skill.averageRating.toFixed(1)}/5 (${skill.reviewCount} reviews)`
      : `**Rating:** No reviews yet`,
    `**Downloads:** ${skill.downloadCount}`,
    `**Time saved per use:** ~${skill.minutesSavedPerUse} minutes`,
    `**Typical uses per month:** ${skill.usesPerMonth}`,
    ``,
    `## Description`,
    ``,
    skill.description ?? skill.shortDescription,
    ``,
    `## Links`,
    ``,
    `- **View skill:** ${skillUrl(skill.slug)}`,
    `- **Checkout:** ${checkoutUrl(skill.slug)}`,
  ];
  return lines.join("\n");
}

const server = new McpServer({
  name: "creatorskills",
  version: "1.0.0",
});

server.tool(
  "list_skills",
  "Browse the CreatorSkills catalog. Returns paginated AI skills for content creators. Use this to discover what is available before recommending a skill.",
  {
    page: z
      .number()
      .int()
      .min(1)
      .optional()
      .default(1)
      .describe("Page number (1-based)"),
    page_size: z
      .number()
      .int()
      .min(1)
      .max(20)
      .optional()
      .default(10)
      .describe("Skills per page (max 20)"),
    category: z
      .string()
      .optional()
      .describe(
        "Category filter. Valid values: CONTENT_REPURPOSING, TITLES_THUMBNAILS, SCRIPTS_OUTLINES, ANALYTICS_OPTIMIZATION, SPONSOR_BRAND_DEALS, COMMUNITY_ENGAGEMENT, COURSE_CREATION, FREELANCE_CLIENT, EMAIL_NEWSLETTER, IMAGE_GENERATION_THUMBNAILS, IMAGE_GENERATION_BRANDING, IMAGE_EDITING, PODCASTING, PRODUCT_CREATION, OTHER"
      ),
    platform: z
      .enum(["CLAUDE", "CHATGPT", "UNIVERSAL"])
      .optional()
      .describe("Filter by AI platform"),
    price: z
      .enum(["free", "paid"])
      .optional()
      .describe("Filter by price type"),
    sort: z
      .enum(["newest", "popular", "top-rated", "price-low", "price-high"])
      .optional()
      .default("popular")
      .describe("Sort order"),
  },
  async ({ page = 1, page_size = 10, category, platform, price, sort = "popular" }) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(page_size),
      sort,
    });
    if (category) params.set("category", category);
    if (platform) params.set("platform", platform);
    if (price) params.set("price", price);

    const { data, error } = await apiFetch<ListResponse>(`/skills?${params}`);

    if (error || !data) {
      return {
        content: [{ type: "text", text: `Error fetching skills: ${error}` }],
        isError: true,
      };
    }

    const { items, pagination } = data;
    const offset = (page - 1) * page_size;

    const lines = [
      `## CreatorSkills Catalog (Page ${pagination.page} of ${pagination.totalPages})`,
      `*${pagination.total} skills total*`,
      ``,
      ...items.map((s, i) => `### ${offset + i + 1}. ${formatSkillSummary(s)}`),
      ``,
      `---`,
      pagination.hasNextPage
        ? `Page ${pagination.page} of ${pagination.totalPages} -- call list_skills with page=${pagination.page + 1} for more`
        : `Page ${pagination.page} of ${pagination.totalPages}`,
    ];

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

server.tool(
  "get_skill",
  "Get full details for a specific skill by its slug. Use this after list_skills or search_skills to get the complete description, use cases, and checkout link.",
  {
    slug: z
      .string()
      .describe(
        "The skill's URL slug (e.g. 'viral-hook-generator'). Visible in the URL on creatorskills.co/skills/<slug>."
      ),
  },
  async ({ slug }) => {
    const { data, error } = await apiFetch<SkillItem>(`/skills/${encodeURIComponent(slug)}`);

    if (error) {
      return {
        content: [{ type: "text", text: `Error fetching skill: ${error}` }],
        isError: true,
      };
    }

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: `No approved skill found with slug "${slug}". Use list_skills or search_skills to find valid slugs.`,
          },
        ],
        isError: true,
      };
    }

    return { content: [{ type: "text", text: formatSkillDetail(data) }] };
  }
);

server.tool(
  "search_skills",
  "Search the CreatorSkills catalog by keyword. Matches skill names, descriptions, and tags. Use this when a user describes a workflow or problem and you need to find the most relevant skill.",
  {
    query: z
      .string()
      .min(2)
      .describe(
        "Search query. Can be a workflow description, keyword, or problem statement (e.g. 'repurpose YouTube video into tweets', 'write better titles', 'sponsorship pitch')."
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .default(5)
      .describe("Max results to return (1-10)"),
    platform: z
      .enum(["CLAUDE", "CHATGPT", "UNIVERSAL"])
      .optional()
      .describe("Optionally restrict results to one platform"),
    price: z
      .enum(["free", "paid"])
      .optional()
      .describe("Optionally restrict to free or paid skills"),
  },
  async ({ query, limit = 5, platform, price }) => {
    const params = new URLSearchParams({
      q: query,
      pageSize: String(Math.min(limit, 10)),
      sort: "popular",
    });
    if (platform) params.set("platform", platform);
    if (price) params.set("price", price);

    const { data, error } = await apiFetch<ListResponse>(`/skills?${params}`);

    if (error || !data) {
      return {
        content: [{ type: "text", text: `Search error: ${error}` }],
        isError: true,
      };
    }

    const skills = data.items;

    if (skills.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No skills found matching "${query}". Try a broader search or use list_skills to browse the full catalog.`,
          },
        ],
      };
    }

    const lines = [
      `## Search results for "${query}"`,
      ``,
      ...skills.map((s, i) => `### ${i + 1}. ${formatSkillSummary(s)}`),
      ``,
      `---`,
      `Use get_skill with a slug to see the full description and checkout link.`,
    ];

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

server.tool(
  "get_checkout_url",
  "Generate a direct checkout URL for a skill. Use this when a user is ready to purchase -- returns a link that opens the skill page with checkout.",
  {
    slug: z
      .string()
      .describe("The skill's URL slug (e.g. 'viral-hook-generator')"),
    utm_source: z
      .string()
      .optional()
      .default("mcp")
      .describe("UTM source tag for attribution tracking"),
  },
  async ({ slug, utm_source = "mcp" }) => {
    const { data, error } = await apiFetch<SkillItem>(
      `/skills/${encodeURIComponent(slug)}`
    );

    if (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
        isError: true,
      };
    }

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: `No approved skill found with slug "${slug}".`,
          },
        ],
        isError: true,
      };
    }

    const url = checkoutUrl(data.slug, utm_source);
    const isFree = data.price === 0;

    const lines = [
      `## ${data.name}`,
      ``,
      `**Price:** ${formatPrice(data.price)}`,
      ``,
      isFree
        ? `This skill is free. Click the link below to download it directly:`
        : `Click the link below to purchase this skill:`,
      ``,
      `**${isFree ? "Download" : "Checkout"} URL:** ${url}`,
    ];

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
