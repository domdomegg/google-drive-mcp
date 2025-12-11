import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeDriveApiCall} from '../utils/drive-api.js';
import {jsonResult} from '../utils/response.js';

const inputSchema = {
	fileId: z.string().describe('The ID of the file or shared drive'),
	permissionId: z.string().describe('The ID of the permission to update'),
	role: z.enum(['owner', 'organizer', 'fileOrganizer', 'writer', 'commenter', 'reader']).describe('The new role for the permission'),
	expirationTime: z.string().optional().describe('Expiration time in RFC 3339 format. Setting to null removes expiration.'),
	removeExpiration: z.boolean().default(false).describe('Remove the expiration time'),
	transferOwnership: z.boolean().default(false).describe('Whether to transfer ownership (role must be owner)'),
	supportsAllDrives: z.boolean().default(true).describe('Support shared drives'),
	useDomainAdminAccess: z.boolean().default(false).describe('Issue the request as a domain administrator'),
};

const outputSchema = z.object({
	id: z.string(),
	type: z.enum(['user', 'group', 'domain', 'anyone']),
	role: z.enum(['owner', 'organizer', 'fileOrganizer', 'writer', 'commenter', 'reader']),
	emailAddress: z.string().optional(),
	domain: z.string().optional(),
	displayName: z.string().optional(),
	photoLink: z.string().optional(),
	expirationTime: z.string().optional(),
	deleted: z.boolean().optional(),
	pendingOwner: z.boolean().optional(),
}).passthrough();

export function registerPermissionUpdate(server: McpServer, config: Config): void {
	server.registerTool(
		'permission_update',
		{
			title: 'Update permission',
			description: 'Update an existing permission on a file or shared drive. Can change role or expiration.',
			inputSchema,
			outputSchema,
		},
		async ({fileId, permissionId, role, expirationTime, removeExpiration, transferOwnership, supportsAllDrives, useDomainAdminAccess}) => {
			const params = new URLSearchParams();
			params.set('supportsAllDrives', String(supportsAllDrives));
			params.set('useDomainAdminAccess', String(useDomainAdminAccess));

			if (transferOwnership) {
				params.set('transferOwnership', 'true');
			}

			if (removeExpiration) {
				params.set('removeExpiration', 'true');
			}

			const body: Record<string, unknown> = {
				role,
			};

			if (expirationTime) {
				body.expirationTime = expirationTime;
			}

			const result = await makeDriveApiCall('PATCH', `/files/${fileId}/permissions/${permissionId}?${params.toString()}`, config.token, body);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
