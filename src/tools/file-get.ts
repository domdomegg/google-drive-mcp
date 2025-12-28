import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeDriveApiCall} from '../utils/drive-api.js';
import {jsonResult} from '../utils/response.js';
import {strictSchemaWithAliases} from '../utils/schema.js';

const inputSchema = strictSchemaWithAliases(
	{
		fileId: z.string().describe('The ID of the file to retrieve'),
		fields: z.string().optional().describe('Fields to include in response. Defaults to all common fields.'),
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
	webContentLink: z.string().optional(),
	createdTime: z.string().optional(),
	modifiedTime: z.string().optional(),
	size: z.string().optional(),
	description: z.string().optional(),
	starred: z.boolean().optional(),
	trashed: z.boolean().optional(),
	owners: z.array(z.object({
		displayName: z.string().optional(),
		emailAddress: z.string().optional(),
	})).optional(),
	lastModifyingUser: z.object({
		displayName: z.string().optional(),
		emailAddress: z.string().optional(),
	}).optional(),
	shared: z.boolean().optional(),
	capabilities: z.record(z.boolean()).optional(),
}).passthrough();

export function registerFileGet(server: McpServer, config: Config): void {
	server.registerTool(
		'file_get',
		{
			title: 'Get file metadata',
			description: 'Get metadata for a specific file by ID. Use file_download to get the file content.',
			inputSchema,
			outputSchema,
			annotations: {
				readOnlyHint: true,
			},
		},
		async ({fileId, fields, supportsAllDrives}) => {
			const params = new URLSearchParams();
			params.set('supportsAllDrives', String(supportsAllDrives));

			// Default fields if not specified
			const defaultFields = 'id,name,mimeType,parents,webViewLink,webContentLink,createdTime,modifiedTime,size,description,starred,trashed,owners,lastModifyingUser,shared,capabilities';
			params.set('fields', fields || defaultFields);

			const result = await makeDriveApiCall('GET', `/files/${fileId}?${params.toString()}`, config.token);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
