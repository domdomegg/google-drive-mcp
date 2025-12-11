import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeDriveApiCall} from '../utils/drive-api.js';
import {jsonResult} from '../utils/response.js';

const inputSchema = {
	fileId: z.string().describe('The ID of the file to comment on'),
	content: z.string().describe('The text content of the comment'),
	anchor: z.string().optional().describe('JSON anchor for positioned comments on images. Format: [null,[null,[x,y,width,height]],null,null] where x,y,width,height are fractions 0-1. Example: [null,[null,[0.1,0.1,0.3,0.3]],null,null] for top-left region. Does NOT work on Google Docs/Sheets/Slides.'),
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

export function registerCommentCreate(server: McpServer, config: Config): void {
	server.registerTool(
		'comment_create',
		{
			title: 'Create comment',
			description: `Add a comment to a file.

For images: supports anchored comments using the anchor parameter with format [null,[null,[x,y,width,height]],null,null] where coordinates are fractions 0-1.

For Google Docs/Sheets/Slides: only unanchored comments work (appear in sidebar). Anchored comments cannot be created via API due to proprietary formats. See: https://issuetracker.google.com/issues/36763384. However, you can use comment_reply to reply to existing anchored comments.`,
			inputSchema,
			outputSchema,
		},
		async ({fileId, content, anchor}) => {
			const body: Record<string, unknown> = {content};

			if (anchor) {
				body.anchor = anchor;
			}

			const result = await makeDriveApiCall('POST', `/files/${fileId}/comments?fields=id,content,createdTime,author,anchor`, config.token, body);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
