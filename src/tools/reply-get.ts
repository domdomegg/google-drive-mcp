import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeDriveApiCall} from '../utils/drive-api.js';
import {jsonResult} from '../utils/response.js';
import {strictSchemaWithAliases} from '../utils/schema.js';

const inputSchema = strictSchemaWithAliases(
	{
		fileId: z.string().describe('The ID of the file'),
		commentId: z.string().describe('The ID of the comment'),
		replyId: z.string().describe('The ID of the reply'),
		includeDeleted: z.boolean().default(false).describe('Return the reply even if deleted'),
	},
	{},
);

const outputSchema = z.object({
	id: z.string(),
	content: z.string().optional(),
	createdTime: z.string().optional(),
	modifiedTime: z.string().optional(),
	author: z.object({
		displayName: z.string().optional(),
		emailAddress: z.string().optional(),
		photoLink: z.string().optional(),
	}).optional(),
	deleted: z.boolean().optional(),
	htmlContent: z.string().optional(),
	action: z.string().optional(),
}).passthrough();

export function registerReplyGet(server: McpServer, config: Config): void {
	server.registerTool(
		'reply_get',
		{
			title: 'Get reply',
			description: 'Get a specific reply to a comment.',
			inputSchema,
			outputSchema,
			annotations: {
				readOnlyHint: true,
			},
		},
		async ({fileId, commentId, replyId, includeDeleted}) => {
			const params = new URLSearchParams();
			params.set('includeDeleted', String(includeDeleted));
			params.set('fields', 'id,content,createdTime,modifiedTime,author,deleted,htmlContent,action');

			const result = await makeDriveApiCall('GET', `/files/${fileId}/comments/${commentId}/replies/${replyId}?${params.toString()}`, config.token);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
