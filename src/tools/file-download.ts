import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {downloadFile, exportFile} from '../utils/drive-api.js';
import {jsonResult} from '../utils/response.js';

const inputSchema = {
	fileId: z.string().describe('The ID of the file to download'),
	exportMimeType: z.string().optional().describe('For Google Docs/Sheets/Slides, the MIME type to export as (e.g., "text/plain", "application/pdf", "text/csv")'),
};

const outputSchema = z.object({
	content: z.string(),
	mimeType: z.string(),
});

export function registerFileDownload(server: McpServer, config: Config): void {
	server.registerTool(
		'file_download',
		{
			title: 'Download file content',
			description: 'Download the content of a file. For Google Docs/Sheets/Slides, use exportMimeType to specify the format (e.g., "text/plain" for Docs, "text/csv" for Sheets).',
			inputSchema,
			outputSchema,
			annotations: {
				readOnlyHint: true,
			},
		},
		async ({fileId, exportMimeType}) => {
			let result;

			if (exportMimeType) {
				// Export Google Workspace files to specified format
				result = await exportFile(config.token, fileId, exportMimeType);
			} else {
				// Download regular files
				result = await downloadFile(config.token, fileId);
			}

			return jsonResult(outputSchema.parse(result));
		},
	);
}
