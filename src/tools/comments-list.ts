import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeDriveApiCall} from '../utils/drive-api.js';
import {jsonResult} from '../utils/response.js';
import {strictSchemaWithAliases} from '../utils/schema.js';

const inputSchema = strictSchemaWithAliases(
	{
		fileId: z.string().describe('The ID of the file'),
		pageSize: z.number().min(1).max(100).default(20).describe('Maximum number of comments to return (1-100)'),
		pageToken: z.string().optional().describe('Token for pagination'),
		includeDeleted: z.boolean().default(false).describe('Include deleted comments'),
		startModifiedTime: z.string().optional().describe('Only return comments modified after this time (RFC 3339)'),
	},
	{},
);

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

const commentSchema = z.object({
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

const outputSchema = z.object({
	comments: z.array(commentSchema),
	nextPageToken: z.string().optional(),
});

export function registerCommentsList(server: McpServer, config: Config): void {
	server.registerTool(
		'comments_list',
		{
			title: 'List comments',
			description: 'List comments on a file. Works with Google Docs, Sheets, Slides, and other Drive files.',
			inputSchema,
			outputSchema,
			annotations: {
				readOnlyHint: true,
			},
		},
		async ({fileId, pageSize, pageToken, includeDeleted, startModifiedTime}) => {
			const params = new URLSearchParams();
			params.set('pageSize', String(pageSize));
			params.set('includeDeleted', String(includeDeleted));
			params.set('fields', 'nextPageToken,comments(id,content,createdTime,modifiedTime,author,resolved,deleted,htmlContent,quotedFileContent,anchor,replies)');

			if (pageToken) {
				params.set('pageToken', pageToken);
			}

			if (startModifiedTime) {
				params.set('startModifiedTime', startModifiedTime);
			}

			const result = await makeDriveApiCall('GET', `/files/${fileId}/comments?${params.toString()}`, config.token);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
