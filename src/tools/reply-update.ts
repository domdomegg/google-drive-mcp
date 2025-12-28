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
		replyId: z.string().describe('The ID of the reply to update'),
		content: z.string().describe('The updated text content of the reply'),
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
	}).optional(),
}).passthrough();

export function registerReplyUpdate(server: McpServer, config: Config): void {
	server.registerTool(
		'reply_update',
		{
			title: 'Update reply',
			description: 'Update the content of an existing reply.',
			inputSchema,
			outputSchema,
		},
		async ({fileId, commentId, replyId, content}) => {
			const result = await makeDriveApiCall(
				'PATCH',
				`/files/${fileId}/comments/${commentId}/replies/${replyId}?fields=id,content,createdTime,modifiedTime,author`,
				config.token,
				{content},
			);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
