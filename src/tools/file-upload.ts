import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {uploadFile} from '../utils/drive-api.js';
import {jsonResult} from '../utils/response.js';
import {strictSchemaWithAliases} from '../utils/schema.js';

const inputSchema = strictSchemaWithAliases(
	{
		name: z.string().describe('The name of the file'),
		content: z.string().describe('The content of the file. For binary files (images, PDFs, etc.), provide base64-encoded content.'),
		mimeType: z.string().describe('The MIME type of the file (e.g., "text/plain", "image/jpeg", "application/pdf")'),
		isBase64: z.boolean().optional().describe('Set to true if content is base64-encoded (required for binary files like images)'),
		parents: z.array(z.string()).optional().describe('Parent folder IDs. If not specified, file is created in root.'),
		description: z.string().optional().describe('Description of the file'),
	},
	{},
);

const outputSchema = z.object({
	id: z.string(),
	name: z.string(),
	mimeType: z.string(),
	parents: z.array(z.string()).optional(),
	webViewLink: z.string().optional(),
	webContentLink: z.string().optional(),
}).passthrough();

export function registerFileUpload(server: McpServer, config: Config): void {
	server.registerTool(
		'file_upload',
		{
			title: 'Upload file',
			description: 'Upload a new file to Google Drive.',
			inputSchema,
			outputSchema,
		},
		async ({name, content, mimeType, isBase64, parents, description}) => {
			const metadata: Record<string, unknown> = {name, mimeType};

			if (parents?.length) {
				metadata.parents = parents;
			}

			if (description) {
				metadata.description = description;
			}

			// Decode base64 content for binary files
			const fileContent = isBase64 ? Buffer.from(content, 'base64') : content;

			const result = await uploadFile(config.token, metadata, fileContent, mimeType);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
