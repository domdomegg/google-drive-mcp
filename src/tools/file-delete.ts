import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeDriveApiCall} from '../utils/drive-api.js';
import {jsonResult} from '../utils/response.js';

const inputSchema = {
	fileId: z.string().describe('The ID of the file to permanently delete'),
	supportsAllDrives: z.boolean().default(true).describe('Support shared drives'),
};

const outputSchema = z.object({
	success: z.boolean(),
	message: z.string(),
});

export function registerFileDelete(server: McpServer, config: Config): void {
	server.registerTool(
		'file_delete',
		{
			title: 'Delete file permanently',
			description: 'Permanently delete a file. This cannot be undone. In almost all cases, you should use file_update with trashed:true instead, which moves the file to trash where it can be restored within 30 days.',
			inputSchema,
			outputSchema,
			annotations: {
				destructiveHint: true,
			},
		},
		async ({fileId, supportsAllDrives}) => {
			const params = new URLSearchParams();
			params.set('supportsAllDrives', String(supportsAllDrives));

			await makeDriveApiCall('DELETE', `/files/${fileId}?${params.toString()}`, config.token);
			return jsonResult({success: true, message: 'File permanently deleted'});
		},
	);
}
