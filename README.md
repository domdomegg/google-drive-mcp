# google-drive-mcp

MCP server for Google Drive - list, search, upload, download, and manage files and folders.

## Use Cases

**Answer from files**: "What was our revenue target in the Q2 board deck?" → searches Drive, reads the relevant doc, and answers your question.

**Project scaffolding**: Starting a new vendor onboarding → creates a folder structure with subfolders for contracts, compliance, deliverables, and meeting notes, plus template docs and sheets.

**Feedback synthesis**: "Summarize the feedback from my manager across my last 10 presentation decks" → reads comments from multiple files and identifies themes and development areas.

**Localization workflow**: "We're onboarding contractors in Japan - translate the onboarding folder from English to Japanese and flag anything that needs local adaptation (HR policies, holidays, etc.)" → reads multiple docs, translates, and highlights areas needing review.

(These are just examples - any workflow that needs file search, reading, or organization can use this. Use in combination with [google-docs-mcp](https://github.com/domdomegg/google-docs-mcp) for reading/editing Google Docs, or [google-sheets-mcp](https://github.com/domdomegg/google-sheets-mcp) for Google Sheets.)

## Setup

### 1. Create Google OAuth credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable the Google Drive API
4. Go to **APIs & Services** → **OAuth consent screen**, set up consent screen
5. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
6. Choose **Web application**
7. Add `http://localhost:3000/callback` to **Authorized redirect URIs**
8. Note your Client ID and Client Secret

### 2. Run the server

```bash
GOOGLE_CLIENT_ID='your-client-id' \
GOOGLE_CLIENT_SECRET='your-client-secret' \
MCP_TRANSPORT=http \
npm start
```

The server runs on `http://localhost:3000` by default. Change with `PORT=3001`.

### 3. Add to your MCP client

```bash
claude mcp add --transport http google-drive-mcp http://localhost:3000/mcp
```

## Architecture

This server acts as an **OAuth proxy** to Google:

```mermaid
graph LR
    A[MCP client] <--> B[google-drive-mcp] <--> C[Google OAuth/API]
```

1. Server advertises itself as an OAuth authorization server via `/.well-known/oauth-authorization-server`
2. `/register` returns the Google OAuth client credentials
3. `/authorize` redirects to Google, encoding the client's callback URL in state
4. `/callback` receives the code from Google and forwards to the client's callback
5. `/token` proxies token requests to Google, injecting client credentials
6. `/mcp` handles MCP requests, using the bearer token to call Drive API

The server holds no tokens or state - it just proxies OAuth to Google.

## Tools

| Tool | Description |
|------|-------------|
| **Files** | |
| `files_list` | List/search files using Drive query syntax |
| `file_get` | Get file metadata |
| `file_download` | Download file content (supports export for Google Docs/Sheets) |
| `file_upload` | Upload a new file |
| `file_update` | Update file content or metadata |
| `file_copy` | Copy a file |
| `file_move` | Move a file to a different folder |
| `file_trash` | Move to trash |
| `file_untrash` | Restore from trash |
| `file_delete` | Permanently delete |
| **Folders** | |
| `folder_create` | Create a new folder |
| **Comments** | |
| `comments_list` | List comments on a file |
| `comment_get` | Get a comment and its replies |
| `comment_create` | Add a comment to a file |
| `comment_reply` | Reply to a comment |
| `comment_resolve` | Resolve or unresolve a comment |
| **Replies** | |
| `replies_list` | List replies to a comment |
| `reply_get` | Get a specific reply |
| `reply_update` | Update a reply |
| `reply_delete` | Delete a reply |
| **Permissions** | |
| `permissions_list` | List who has access to a file |
| `permission_get` | Get a specific permission |
| `permission_create` | Share a file with a user, group, domain, or anyone |
| `permission_update` | Change a user's access level |
| `permission_delete` | Revoke access to a file |

## Drive Query Syntax

The `files_list` tool supports Drive's query syntax for filtering:

```
# By name
name contains 'report'
name = 'Budget 2024'

# By type
mimeType = 'application/pdf'
mimeType = 'application/vnd.google-apps.folder'
mimeType = 'application/vnd.google-apps.document'

# By folder
'folder-id' in parents

# By ownership
'user@example.com' in owners

# Combined
name contains 'report' and mimeType = 'application/pdf'
```

## Google Drive API Scopes

- `drive` - Full access to Drive files

## Contributing

Pull requests are welcomed on GitHub! To get started:

1. Install Git and Node.js
2. Clone the repository
3. Install dependencies with `npm install`
4. Run `npm run test` to run tests
5. Build with `npm run build`

## Releases

Versions follow the [semantic versioning spec](https://semver.org/).

To release:

1. Use `npm version <major | minor | patch>` to bump the version
2. Run `git push --follow-tags` to push with tags
3. Wait for GitHub Actions to publish to the NPM registry.
