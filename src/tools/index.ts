import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';

// Files
import {registerFilesList} from './files-list.js';
import {registerFileGet} from './file-get.js';
import {registerFileDownload} from './file-download.js';
import {registerFileUpload} from './file-upload.js';
import {registerFileUpdate} from './file-update.js';
import {registerFileCopy} from './file-copy.js';
import {registerFileMove} from './file-move.js';
import {registerFileDelete} from './file-delete.js';

// Folders
import {registerFolderCreate} from './folder-create.js';

// Comments
import {registerCommentsList} from './comments-list.js';
import {registerCommentGet} from './comment-get.js';
import {registerCommentCreate} from './comment-create.js';
import {registerCommentReply} from './comment-reply.js';
import {registerCommentResolve} from './comment-resolve.js';

// Replies
import {registerRepliesList} from './replies-list.js';
import {registerReplyGet} from './reply-get.js';
import {registerReplyUpdate} from './reply-update.js';
import {registerReplyDelete} from './reply-delete.js';

// Permissions
import {registerPermissionsList} from './permissions-list.js';
import {registerPermissionGet} from './permission-get.js';
import {registerPermissionCreate} from './permission-create.js';
import {registerPermissionUpdate} from './permission-update.js';
import {registerPermissionDelete} from './permission-delete.js';

export type {Config} from './types.js';

export function registerAll(server: McpServer, config: Config): void {
	// Files
	registerFilesList(server, config);
	registerFileGet(server, config);
	registerFileDownload(server, config);
	registerFileUpload(server, config);
	registerFileUpdate(server, config);
	registerFileCopy(server, config);
	registerFileMove(server, config);
	registerFileDelete(server, config);

	// Folders
	registerFolderCreate(server, config);

	// Comments
	registerCommentsList(server, config);
	registerCommentGet(server, config);
	registerCommentCreate(server, config);
	registerCommentReply(server, config);
	registerCommentResolve(server, config);

	// Replies
	registerRepliesList(server, config);
	registerReplyGet(server, config);
	registerReplyUpdate(server, config);
	registerReplyDelete(server, config);

	// Permissions
	registerPermissionsList(server, config);
	registerPermissionGet(server, config);
	registerPermissionCreate(server, config);
	registerPermissionUpdate(server, config);
	registerPermissionDelete(server, config);
}
