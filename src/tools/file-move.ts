import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeDriveApiCall} from '../utils/drive-api.js';
import {jsonResult} from '../utils/response.js';

const inputSchema = {
	fileId: z.string().describe('The ID of the file to move'),
	addParents: z.array(z.string()).describe('Folder IDs to add as parents (where to move the file)'),
	removeParents: z.array(z.string()).optional().describe('Folder IDs to remove as parents (current locations)'),
	supportsAllDrives: z.boolean().default(true).describe('Support shared drives'),
};

const outputSchema = z.object({
	id: z.string(),
	name: z.string(),
	mimeType: z.string(),
	parents: z.array(z.string()).optional(),
}).passthrough();

export function registerFileMove(server: McpServer, config: Config): void {
	server.registerTool(
		'file_move',
		{
			title: 'Move file',
			description: 'Move a file to a different folder by changing its parents.',
			inputSchema,
			outputSchema,
		},
		async ({fileId, addParents, removeParents, supportsAllDrives}) => {
			const params = new URLSearchParams();
			params.set('supportsAllDrives', String(supportsAllDrives));

			if (addParents.length) {
				params.set('addParents', addParents.join(','));
			}

			if (removeParents?.length) {
				params.set('removeParents', removeParents.join(','));
			}

			const result = await makeDriveApiCall('PATCH', `/files/${fileId}?${params.toString()}`, config.token, {});
			return jsonResult(outputSchema.parse(result));
		},
	);
}
