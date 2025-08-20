import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import pj from "../../package.json" with { type: "json" };
import { z } from "zod";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const main = async () => {
  const server = new McpServer({
    name: "translation-mcp-server",
    version: pj.version,
  });

  server.registerPrompt(
    "translation",
    {
      title: "Code Review",
      argsSchema: { text: z.string() },
    },
    ({ text }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please translate the following text into English:\n\n${text}`,
          },
        },
      ],
    })
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
};

main();
