import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeDriveApiCall} from '../utils/drive-api.js';
import {jsonResult} from '../utils/response.js';

const inputSchema = {
	fileId: z.string().describe('The ID of the file'),
	commentId: z.string().describe('The ID of the comment'),
	replyId: z.string().describe('The ID of the reply to delete'),
};

const outputSchema = z.object({
	success: z.boolean(),
	message: z.string(),
});

export function registerReplyDelete(server: McpServer, config: Config): void {
	server.registerTool(
		'reply_delete',
		{
			title: 'Delete reply',
			description: 'Delete a reply from a comment.',
			inputSchema,
			outputSchema,
		},
		async ({fileId, commentId, replyId}) => {
			await makeDriveApiCall(
				'DELETE',
				`/files/${fileId}/comments/${commentId}/replies/${replyId}`,
				config.token,
			);
			return jsonResult({success: true, message: 'Reply deleted successfully'});
		},
	);
}
