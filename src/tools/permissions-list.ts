import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeDriveApiCall} from '../utils/drive-api.js';
import {jsonResult} from '../utils/response.js';
import {strictSchemaWithAliases} from '../utils/schema.js';

const inputSchema = strictSchemaWithAliases(
	{
		fileId: z.string().describe('The ID of the file or shared drive'),
		pageSize: z.number().min(1).max(100).default(100).describe('Maximum number of permissions to return (1-100)'),
		pageToken: z.string().optional().describe('Token for pagination'),
		supportsAllDrives: z.boolean().default(true).describe('Support shared drives'),
		useDomainAdminAccess: z.boolean().default(false).describe('Issue the request as a domain administrator'),
	},
	{},
);

const permissionSchema = z.object({
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

const outputSchema = z.object({
	permissions: z.array(permissionSchema),
	nextPageToken: z.string().optional(),
});

export function registerPermissionsList(server: McpServer, config: Config): void {
	server.registerTool(
		'permissions_list',
		{
			title: 'List permissions',
			description: 'List all permissions on a file or shared drive. Shows who has access and their role.',
			inputSchema,
			outputSchema,
			annotations: {
				readOnlyHint: true,
			},
		},
		async ({fileId, pageSize, pageToken, supportsAllDrives, useDomainAdminAccess}) => {
			const params = new URLSearchParams();
			params.set('pageSize', String(pageSize));
			params.set('supportsAllDrives', String(supportsAllDrives));
			params.set('useDomainAdminAccess', String(useDomainAdminAccess));
			params.set('fields', 'nextPageToken,permissions(id,type,role,emailAddress,domain,displayName,photoLink,expirationTime,deleted,pendingOwner,permissionDetails)');

			if (pageToken) {
				params.set('pageToken', pageToken);
			}

			const result = await makeDriveApiCall('GET', `/files/${fileId}/permissions?${params.toString()}`, config.token);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
