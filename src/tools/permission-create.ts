import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeDriveApiCall} from '../utils/drive-api.js';
import {jsonResult} from '../utils/response.js';
import {strictSchemaWithAliases} from '../utils/schema.js';

const inputSchema = strictSchemaWithAliases(
	{
		fileId: z.string().describe('The ID of the file or shared drive'),
		type: z.enum(['user', 'group', 'domain', 'anyone']).describe('The type of grantee: user, group, domain, or anyone'),
		role: z.enum(['owner', 'organizer', 'fileOrganizer', 'writer', 'commenter', 'reader']).describe('The role granted by this permission'),
		emailAddress: z.string().optional().describe('Email address of user or group (required for type user/group)'),
		domain: z.string().optional().describe('Domain (required for type domain, e.g. "example.com")'),
		sendNotificationEmail: z.boolean().default(true).describe('Send a notification email when sharing'),
		emailMessage: z.string().optional().describe('Custom message to include in the notification email'),
		transferOwnership: z.boolean().default(false).describe('Whether to transfer ownership to the specified user (role must be owner)'),
		moveToNewOwnersRoot: z.boolean().default(false).describe('Move the file to the new owner\'s My Drive root folder (only for transferOwnership)'),
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
}).passthrough();

export function registerPermissionCreate(server: McpServer, config: Config): void {
	server.registerTool(
		'permission_create',
		{
			title: 'Create permission',
			description: 'Share a file or shared drive by creating a new permission. Grants access to a user, group, domain, or anyone.',
			inputSchema,
			outputSchema,
		},
		async ({fileId, type, role, emailAddress, domain, sendNotificationEmail, emailMessage, transferOwnership, moveToNewOwnersRoot, supportsAllDrives, useDomainAdminAccess}) => {
			const params = new URLSearchParams();
			params.set('supportsAllDrives', String(supportsAllDrives));
			params.set('useDomainAdminAccess', String(useDomainAdminAccess));

			// sendNotificationEmail is only applicable for user/group permissions
			if (type === 'user' || type === 'group') {
				params.set('sendNotificationEmail', String(sendNotificationEmail));
			}

			if (transferOwnership) {
				params.set('transferOwnership', 'true');
			}

			if (moveToNewOwnersRoot) {
				params.set('moveToNewOwnersRoot', 'true');
			}

			if (emailMessage && (type === 'user' || type === 'group')) {
				params.set('emailMessage', emailMessage);
			}

			const body: Record<string, unknown> = {
				type,
				role,
			};

			if (emailAddress) {
				body.emailAddress = emailAddress;
			}

			if (domain) {
				body.domain = domain;
			}

			const result = await makeDriveApiCall('POST', `/files/${fileId}/permissions?${params.toString()}`, config.token, body);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
