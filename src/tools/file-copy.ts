import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeDriveApiCall} from '../utils/drive-api.js';
import {jsonResult} from '../utils/response.js';
import {strictSchemaWithAliases} from '../utils/schema.js';

const inputSchema = strictSchemaWithAliases(
	{
		fileId: z.string().describe('The ID of the file to copy'),
		name: z.string().optional().describe('Name for the copy. If not specified, uses "Copy of [original name]"'),
		parents: z.array(z.string()).optional().describe('Parent folder IDs for the copy'),
		supportsAllDrives: z.boolean().default(true).describe('Support shared drives'),
	},
	{},
);

const outputSchema = z.object({
	id: z.string(),
	name: z.string(),
	mimeType: z.string(),
	parents: z.array(z.string()).optional(),
	webViewLink: z.string().optional(),
}).passthrough();

export function registerFileCopy(server: McpServer, config: Config): void {
	server.registerTool(
		'file_copy',
		{
			title: 'Copy file',
			description: 'Create a copy of a file.',
			inputSchema,
			outputSchema,
		},
		async ({fileId, name, parents, supportsAllDrives}) => {
			const params = new URLSearchParams();
			params.set('supportsAllDrives', String(supportsAllDrives));

			const body: Record<string, unknown> = {};
			if (name) {
				body.name = name;
			}

			if (parents?.length) {
				body.parents = parents;
			}

			const result = await makeDriveApiCall('POST', `/files/${fileId}/copy?${params.toString()}`, config.token, body);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
