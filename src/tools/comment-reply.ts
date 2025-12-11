import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeDriveApiCall} from '../utils/drive-api.js';
import {jsonResult} from '../utils/response.js';

const inputSchema = {
	fileId: z.string().describe('The ID of the file'),
	commentId: z.string().describe('The ID of the comment to reply to'),
	content: z.string().describe('The text content of the reply'),
};

const outputSchema = z.object({
	id: z.string(),
	content: z.string().optional(),
	createdTime: z.string().optional(),
	author: z.object({
		displayName: z.string().optional(),
		emailAddress: z.string().optional(),
	}).optional(),
}).passthrough();

export function registerCommentReply(server: McpServer, config: Config): void {
	server.registerTool(
		'comment_reply',
		{
			title: 'Reply to comment',
			description: 'Add a reply to an existing comment.',
			inputSchema,
			outputSchema,
		},
		async ({fileId, commentId, content}) => {
			const result = await makeDriveApiCall(
				'POST',
				`/files/${fileId}/comments/${commentId}/replies?fields=id,content,createdTime,author`,
				config.token,
				{content},
			);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
