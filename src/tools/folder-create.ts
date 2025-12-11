import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeDriveApiCall} from '../utils/drive-api.js';
import {jsonResult} from '../utils/response.js';

const inputSchema = {
	name: z.string().describe('The name of the folder'),
	parents: z.array(z.string()).optional().describe('Parent folder IDs. If not specified, folder is created in root.'),
	description: z.string().optional().describe('Description of the folder'),
};

const outputSchema = z.object({
	id: z.string(),
	name: z.string(),
	mimeType: z.string(),
	parents: z.array(z.string()).optional(),
	webViewLink: z.string().optional(),
}).passthrough();

export function registerFolderCreate(server: McpServer, config: Config): void {
	server.registerTool(
		'folder_create',
		{
			title: 'Create folder',
			description: 'Create a new folder in Google Drive.',
			inputSchema,
			outputSchema,
		},
		async ({name, parents, description}) => {
			const body: Record<string, unknown> = {
				name,
				mimeType: 'application/vnd.google-apps.folder',
			};

			if (parents?.length) {
				body.parents = parents;
			}

			if (description) {
				body.description = description;
			}

			const result = await makeDriveApiCall('POST', '/files', config.token, body);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
