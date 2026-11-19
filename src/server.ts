#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TOOLS, runTool, type ToolDef } from "./tools.js";
import type { z } from "zod";

const server = new McpServer({ name: "bangla-calendar-mcp", version: "0.1.0" });

for (const def of TOOLS as ToolDef<z.ZodRawShape>[]) {
  server.registerTool(
    def.name,
    { description: def.description, inputSchema: def.shape, annotations: { readOnlyHint: true } },
    async (args: unknown) => {
      const { text, isError } = runTool(def, args);
      return { content: [{ type: "text" as const, text }], isError };
    },
  );
}

await server.connect(new StdioServerTransport());
