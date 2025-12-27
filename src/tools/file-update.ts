import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {uploadFile, makeDriveApiCall} from '../utils/drive-api.js';
import {jsonResult} from '../utils/response.js';
import {strictSchemaWithAliases} from '../utils/schema.js';

const inputSchema = strictSchemaWithAliases(
	{
		fileId: z.string().describe('The ID of the file to update'),
		content: z.string().optional().describe('New content for the file'),
		mimeType: z.string().optional().describe('MIME type of the content (required if content is provided)'),
		name: z.string().optional().describe('New name for the file'),
		description: z.string().optional().describe('New description for the file'),
		starred: z.boolean().optional().describe('Star or unstar the file'),
		trashed: z.boolean().optional().describe('Move to trash (true) or restore from trash (false). Trashed files can be restored within 30 days.'),
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
	modifiedTime: z.string().optional(),
}).passthrough();

export function registerFileUpdate(server: McpServer, config: Config): void {
	server.registerTool(
		'file_update',
		{
			title: 'Update file',
			description: 'Update a file\'s content or metadata. Provide content to update file content, or just metadata fields to update metadata only.',
			inputSchema,
			outputSchema,
		},
		async ({fileId, content, mimeType, name, description, starred, trashed, supportsAllDrives}) => {
			const metadata: Record<string, unknown> = {};

			if (name !== undefined) {
				metadata.name = name;
			}

			if (description !== undefined) {
				metadata.description = description;
			}

			if (starred !== undefined) {
				metadata.starred = starred;
			}

			if (trashed !== undefined) {
				metadata.trashed = trashed;
			}

			let result;

			if (content !== undefined) {
				// Update content using multipart upload
				if (!mimeType) {
					throw new Error('mimeType is required when updating content');
				}

				result = await uploadFile(config.token, metadata, content, mimeType, fileId);
			} else {
				// Metadata-only update
				const params = new URLSearchParams();
				params.set('supportsAllDrives', String(supportsAllDrives));

				result = await makeDriveApiCall('PATCH', `/files/${fileId}?${params.toString()}`, config.token, metadata);
			}

			return jsonResult(outputSchema.parse(result));
		},
	);
}
