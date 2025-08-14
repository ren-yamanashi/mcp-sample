#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import pj from "../../package.json" with { type: "json" };
import { fetchDocs } from "./fetch-docs.ts";
import { TARGET_REPOSITORY } from "../shared/repository.ts";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const main = async () => {
  const server = new McpServer({
    name: "loadResource",
    description: "load documentation resource mcp server",
    version: pj.version,
  });

  const docFiles = await fetchDocs();

  // Register each document as an individual resource
  for (const doc of docFiles) {
    const resourceUri = `eslint-cdk-plugin://docs/rules/${doc.path}`;

    server.registerResource(
      doc.path,
      resourceUri,
      {
        title: doc.path.replace(".md", ""),
        description: `Documentation for ${doc.path} from ${TARGET_REPOSITORY.NAME} repository.`,
      },
      async (uri) => ({
        contents: [
          {
            uri: uri.href,
            text: doc.content,
          },
        ],
      })
    );
  }

  // Register a resource that lists all available documents
  server.registerResource(
    "index",
    "eslint-cdk-plugin://docs/rules/",
    {
      title: `${TARGET_REPOSITORY.NAME} Documentation Index`,
      description: `List of all available documentation files from ${TARGET_REPOSITORY.NAME} repository.`,
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: docFiles
            .map(
              (doc) =>
                `- [${doc.path}](eslint-cdk-plugin://docs/rules/${doc.path})`
            )
            .join("\n"),
        },
      ],
    })
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
};

main();
