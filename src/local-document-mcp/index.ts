#!/usr/bin/env node

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import pj from "../../package.json" with { type: "json" };
import { loadDocs } from "./load-docs.js";
import { searchDocs } from "../shared/search-docs.js";

const main = async () => {
  const server = new McpServer({
    name: "LocalDocsSearch",
    description: "local documentation search mcp server",
    version: pj.version,
  });
  const docFiles = await loadDocs();

  server.tool("read_docs", { path: z.string() }, async ({ path }) => {
    const doc = docFiles.find((doc) => doc.path === path);
    return {
      content: [{ type: "text", text: doc?.content ?? "document not found" }],
    };
  });

  server.tool(
    "search_docs",
    {
      query: z.string(),
      offset: z.number(),
      limit: z.number().default(20),
    },
    async ({ query, offset, limit }) => {
      const queries = query.toLowerCase().split(" ");
      const results = await searchDocs({
        docsIndexes: docFiles,
        queries,
        offset,
        limit,
      });

      if (results.length) {
        return { content: [{ type: "text", text: JSON.stringify(results) }] };
      }

      return {
        content: [
          {
            type: "text",
            text: `No docs for ${query} found in ${docFiles.length} pages.`,
          },
        ],
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
};

main();
