import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeDriveApiCall} from '../utils/drive-api.js';
import {jsonResult} from '../utils/response.js';
import {strictSchemaWithAliases} from '../utils/schema.js';

const inputSchema = strictSchemaWithAliases(
	{
		fileId: z.string().describe('The ID of the file or shared drive'),
		permissionId: z.string().describe('The ID of the permission'),
		supportsAllDrives: z.boolean().default(true).describe('Support shared drives'),
		useDomainAdminAccess: z.boolean().default(false).describe('Issue the request as a domain administrator'),
	},
	{},
);

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
	permissionDetails: z.array(z.object({
		permissionType: z.string().optional(),
		inheritedFrom: z.string().optional(),
		role: z.string().optional(),
		inherited: z.boolean().optional(),
	})).optional(),
}).passthrough();

export function registerPermissionGet(server: McpServer, config: Config): void {
	server.registerTool(
		'permission_get',
		{
			title: 'Get permission',
			description: 'Get a specific permission by ID on a file or shared drive.',
			inputSchema,
			outputSchema,
			annotations: {
				readOnlyHint: true,
			},
		},
		async ({fileId, permissionId, supportsAllDrives, useDomainAdminAccess}) => {
			const params = new URLSearchParams();
			params.set('supportsAllDrives', String(supportsAllDrives));
			params.set('useDomainAdminAccess', String(useDomainAdminAccess));
			params.set('fields', 'id,type,role,emailAddress,domain,displayName,photoLink,expirationTime,deleted,pendingOwner,permissionDetails');

			const result = await makeDriveApiCall('GET', `/files/${fileId}/permissions/${permissionId}?${params.toString()}`, config.token);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
