import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeDriveApiCall} from '../utils/drive-api.js';
import {jsonResult} from '../utils/response.js';

const inputSchema = {
	fileId: z.string().describe('The ID of the file'),
	commentId: z.string().describe('The ID of the comment'),
	pageSize: z.number().min(1).max(100).default(20).describe('Maximum number of replies to return (1-100)'),
	pageToken: z.string().optional().describe('Token for pagination'),
	includeDeleted: z.boolean().default(false).describe('Include deleted replies'),
};

const replySchema = z.object({
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

const outputSchema = z.object({
	replies: z.array(replySchema),
	nextPageToken: z.string().optional(),
});

export function registerRepliesList(server: McpServer, config: Config): void {
	server.registerTool(
		'replies_list',
		{
			title: 'List replies',
			description: 'List replies to a comment.',
			inputSchema,
			outputSchema,
			annotations: {
				readOnlyHint: true,
			},
		},
		async ({fileId, commentId, pageSize, pageToken, includeDeleted}) => {
			const params = new URLSearchParams();
			params.set('pageSize', String(pageSize));
			params.set('includeDeleted', String(includeDeleted));
			params.set('fields', 'nextPageToken,replies(id,content,createdTime,modifiedTime,author,deleted,htmlContent,action)');

			if (pageToken) {
				params.set('pageToken', pageToken);
			}

			const result = await makeDriveApiCall('GET', `/files/${fileId}/comments/${commentId}/replies?${params.toString()}`, config.token);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
