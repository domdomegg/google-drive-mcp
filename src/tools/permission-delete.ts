import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeDriveApiCall} from '../utils/drive-api.js';
import {jsonResult} from '../utils/response.js';

const inputSchema = {
	fileId: z.string().describe('The ID of the file or shared drive'),
	permissionId: z.string().describe('The ID of the permission to delete'),
	supportsAllDrives: z.boolean().default(true).describe('Support shared drives'),
	useDomainAdminAccess: z.boolean().default(false).describe('Issue the request as a domain administrator'),
};

const outputSchema = z.object({
	success: z.boolean(),
	message: z.string(),
});

export function registerPermissionDelete(server: McpServer, config: Config): void {
	server.registerTool(
		'permission_delete',
		{
			title: 'Delete permission',
			description: 'Remove a permission from a file or shared drive, revoking access for that user/group/domain.',
			inputSchema,
			outputSchema,
		},
		async ({fileId, permissionId, supportsAllDrives, useDomainAdminAccess}) => {
			const params = new URLSearchParams();
			params.set('supportsAllDrives', String(supportsAllDrives));
			params.set('useDomainAdminAccess', String(useDomainAdminAccess));

			await makeDriveApiCall('DELETE', `/files/${fileId}/permissions/${permissionId}?${params.toString()}`, config.token);
			return jsonResult({success: true, message: 'Permission deleted successfully'});
		},
	);
}
