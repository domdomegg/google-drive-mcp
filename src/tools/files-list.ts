import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeDriveApiCall} from '../utils/drive-api.js';
import {jsonResult} from '../utils/response.js';

const inputSchema = {
	query: z.string().optional().describe('Search query using Drive search syntax (e.g., "name contains \'report\'" or "mimeType=\'application/pdf\'")'),
	pageSize: z.number().min(1).max(1000).default(100).describe('Maximum number of files to return (1-1000)'),
	pageToken: z.string().optional().describe('Token for pagination'),
	orderBy: z.string().optional().describe('Sort order (e.g., "modifiedTime desc", "name")'),
	fields: z.string().optional().describe('Fields to include in response. Defaults to common fields.'),
	spaces: z.enum(['drive', 'appDataFolder']).default('drive').describe('Spaces to search'),
	includeItemsFromAllDrives: z.boolean().default(true).describe('Include files from shared drives'),
	supportsAllDrives: z.boolean().default(true).describe('Support shared drives'),
};

const fileSchema = z.object({
	id: z.string(),
	name: z.string(),
	mimeType: z.string(),
	parents: z.array(z.string()).optional(),
	webViewLink: z.string().optional(),
	webContentLink: z.string().optional(),
	createdTime: z.string().optional(),
	modifiedTime: z.string().optional(),
	size: z.string().optional(),
	owners: z.array(z.object({
		displayName: z.string().optional(),
		emailAddress: z.string().optional(),
	})).optional(),
	shared: z.boolean().optional(),
	trashed: z.boolean().optional(),
}).passthrough();

const outputSchema = z.object({
	files: z.array(fileSchema),
	nextPageToken: z.string().optional(),
	incompleteSearch: z.boolean().optional(),
});

export function registerFilesList(server: McpServer, config: Config): void {
	server.registerTool(
		'files_list',
		{
			title: 'List files',
			description: 'List files in Google Drive. Use query parameter to filter results using Drive search syntax.',
			inputSchema,
			outputSchema,
			annotations: {
				readOnlyHint: true,
			},
		},
		async ({query, pageSize, pageToken, orderBy, fields, spaces, includeItemsFromAllDrives, supportsAllDrives}) => {
			const params = new URLSearchParams();

			if (query) {
				params.set('q', query);
			}

			params.set('pageSize', String(pageSize));
			if (pageToken) {
				params.set('pageToken', pageToken);
			}

			if (orderBy) {
				params.set('orderBy', orderBy);
			}

			params.set('spaces', spaces);
			params.set('includeItemsFromAllDrives', String(includeItemsFromAllDrives));
			params.set('supportsAllDrives', String(supportsAllDrives));

			// Default fields if not specified
			const defaultFields = 'nextPageToken,incompleteSearch,files(id,name,mimeType,parents,webViewLink,webContentLink,createdTime,modifiedTime,size,owners,shared,trashed)';
			params.set('fields', fields || defaultFields);

			const result = await makeDriveApiCall('GET', `/files?${params.toString()}`, config.token);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
