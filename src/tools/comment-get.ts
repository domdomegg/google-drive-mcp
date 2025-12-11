import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeDriveApiCall} from '../utils/drive-api.js';
import {jsonResult} from '../utils/response.js';

const inputSchema = {
	fileId: z.string().describe('The ID of the file'),
	commentId: z.string().describe('The ID of the comment'),
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
}).passthrough();

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
	resolved: z.boolean().optional(),
	deleted: z.boolean().optional(),
	htmlContent: z.string().optional(),
	quotedFileContent: z.object({
		mimeType: z.string().optional(),
		value: z.string().optional(),
	}).optional(),
	anchor: z.string().optional(),
	replies: z.array(replySchema).optional(),
}).passthrough();

export function registerCommentGet(server: McpServer, config: Config): void {
	server.registerTool(
		'comment_get',
		{
			title: 'Get comment',
			description: 'Get a specific comment and its replies.',
			inputSchema,
			outputSchema,
			annotations: {
				readOnlyHint: true,
			},
		},
		async ({fileId, commentId, includeDeleted}) => {
			const params = new URLSearchParams();
			params.set('includeDeleted', String(includeDeleted));
			params.set('fields', 'id,content,createdTime,modifiedTime,author,resolved,deleted,htmlContent,quotedFileContent,anchor,replies');

			const result = await makeDriveApiCall('GET', `/files/${fileId}/comments/${commentId}?${params.toString()}`, config.token);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
