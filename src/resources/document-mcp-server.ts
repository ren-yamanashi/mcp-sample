#!/usr/bin/env node

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import pj from "../../package.json" with { type: "json" };
import { fetchDocs } from "../_shared/fetch-docs.ts";

const main = async () => {
  const server = new McpServer({
    name: "document-mcp-server",
    version: pj.version,
  });

  const docFiles = await fetchDocs();

  server.registerResource(
    "eslint-cdk-plugin",
    new ResourceTemplate("eslint-cdk-plugin://docs/rules/{path}", {
      list: () => ({
        resources: docFiles.map((doc) => ({
          name: doc.path.replace(".md", ""),
          uri: doc.path,
        })),
      }),
      complete: {
        path: (value) =>
          docFiles.reduce<string[]>(
            (acc, doc) => (doc.path.includes(value) ? [...acc, doc.path] : acc),
            []
          ),
      },
    }),
    {
      title: "cdk plugin Documentation Resources",
      description: `dynamic cdk plugin documentation generator`,
    },
    async (uri, { path }) => ({
      contents: [
        {
          uri: uri.href,
          text:
            docFiles.find((doc) => doc.path === path)?.content ?? "not found",
        },
      ],
    })
  );

  // for (const doc of docFiles) {
  //   if (doc.path === "index.md") continue;
  //   const name = doc.path.replace(".md", "");
  //   const resourceUri = `eslint-cdk-plugin://docs/rules/${doc.path}`;

  //   server.registerResource(
  //     name,
  //     resourceUri,
  //     {
  //       title: name,
  //       description: `Documentation for ${doc.path} from ${TARGET_REPOSITORY.NAME} repository.`,
  //     },
  //     async (uri) => ({
  //       contents: [
  //         {
  //           uri: uri.href,
  //           text: doc.content,
  //         },
  //       ],
  //     })
  //   );
  // }

  // // Register a resource that lists all available documents
  // server.registerResource(
  //   "index",
  //   "eslint-cdk-plugin://docs/rules/",
  //   {
  //     title: `${TARGET_REPOSITORY.NAME} Documentation Index`,
  //     description: `List of all available documentation files from ${TARGET_REPOSITORY.NAME} repository.`,
  //   },
  //   async (uri) => ({
  //     contents: [
  //       {
  //         uri: uri.href,
  //         text: docFiles
  //           .map(
  //             (doc) =>
  //               `- [${doc.path}](eslint-cdk-plugin://docs/rules/${doc.path})`
  //           )
  //           .join("\n"),
  //       },
  //     ],
  //   })
  // );

  const transport = new StdioServerTransport();
  await server.connect(transport);
};

main();
