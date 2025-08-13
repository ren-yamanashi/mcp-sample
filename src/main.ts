#!/usr/bin/env node

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import pj from "../package.json" with { type: "json" };
import { loadDocs } from "./load-docs.js";
import { searchDocs } from "./search-docs.js";

const main = async () => {
  const server = new McpServer({
    name: "DocsSearch",
    description: "documentation search mcp server",
    version: pj.version
  })
  const docsIndexes = await loadDocs();

	server.tool(
		"search_docs",
		{
			query: z.string(),
			offset: z.number(),
			limit: z.number().default(20),
		},
		async ({ query, offset, limit }) => {
			const queries = query.toLowerCase().split(" ");
			// 1. prioritize title match
			const results = await searchDocs(docsIndexes, queries, offset, limit);

			if (!results.length) {
				return {
					content: [
						{
							type: "text",
							text: `No docs for ${query} found in ${docsIndexes.length} pages.`,
						},
					],
				};
			}

			return {
				content: [{ type: "text", text: JSON.stringify(results) }],
			};
		},
	);

  // NOTE: read_docs might not be called because search_docs contains contents.
	server.tool("read_docs", { path: z.string() }, async ({ path }) => {
		const doc = docsIndexes.find((doc) => doc.path === path);
		return {
			content: [{ type: "text", text: doc?.content ?? "document not found" }],
		};
	});

	// Start receiving messages on stdin and sending messages on stdout
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

main();