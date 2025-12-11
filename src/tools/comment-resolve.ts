import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeDriveApiCall} from '../utils/drive-api.js';
import {jsonResult} from '../utils/response.js';

const inputSchema = {
	fileId: z.string().describe('The ID of the file'),
	commentId: z.string().describe('The ID of the comment to resolve or reopen'),
	action: z.enum(['resolve', 'reopen']).default('resolve').describe('Action to perform: "resolve" to mark as resolved, "reopen" to unresolve'),
	content: z.string().optional().describe('Optional message to include with the action'),
};

const outputSchema = z.object({
	id: z.string(),
	action: z.string().optional(),
	content: z.string().optional(),
	author: z.object({
		displayName: z.string().optional(),
	}).optional(),
}).passthrough();

export function registerCommentResolve(server: McpServer, config: Config): void {
	server.registerTool(
		'comment_resolve',
		{
			title: 'Resolve or reopen comment',
			description: 'Resolve or reopen a comment by posting a reply with the specified action.',
			inputSchema,
			outputSchema,
		},
		async ({fileId, commentId, action, content}) => {
			const body: Record<string, string> = {action};

			if (content) {
				body.content = content;
			}

			const result = await makeDriveApiCall(
				'POST',
				`/files/${fileId}/comments/${commentId}/replies?fields=id,action,content,author`,
				config.token,
				body,
			);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
