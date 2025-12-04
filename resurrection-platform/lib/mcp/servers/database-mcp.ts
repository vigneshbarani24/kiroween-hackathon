
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

/**
 * Database MCP Server
 * 
 * Provides "Introspection" capabilities to the Resurrection Platform.
 * Allows the workflow to inspect the local database state, verify insertions,
 * and check schema compliance.
 */
async function startServer() {
  const prisma = new PrismaClient();
  
  const server = new McpServer({
    name: 'database-mcp',
    version: '1.0.0'
  });

  // Tool: list_tables
  server.tool(
    'list_tables',
    {},
    async () => {
      console.error('[DatabaseMCP] Listing tables...');
      // In a real scenario, we'd query information_schema. 
      // For Prisma, we can list the models we know about or run a raw query.
      try {
        // SQLite specific query
        const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table';`;
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(tables, null, 2)
          }]
        };
      } catch (e) {
        return {
          content: [{ type: 'text', text: `Error: ${e}` }],
          isError: true
        };
      }
    }
  );

  // Tool: inspect_resurrection
  server.tool(
    'inspect_resurrection',
    {
      id: z.string().describe('The ID of the resurrection to inspect')
    },
    async ({ id }) => {
      console.error(`[DatabaseMCP] Inspecting resurrection: ${id}`);
      
      const resurrection = await prisma.resurrection.findUnique({
        where: { id },
        include: {
          workflowSteps: true,
          abapObjects: true
        }
      });

      if (!resurrection) {
        return {
          content: [{ type: 'text', text: 'Resurrection not found' }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            name: resurrection.name,
            status: resurrection.status,
            progress: `${resurrection.workflowSteps.filter(s => s.status === 'COMPLETED').length} / ${resurrection.workflowSteps.length} steps`,
            objects: resurrection.abapObjects.length
          }, null, 2)
        }]
      };
    }
  );

  // Connect transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[DatabaseMCP] Server started on stdio');
}

startServer().catch(console.error);
