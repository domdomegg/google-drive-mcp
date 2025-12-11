// Google Drive API configuration and utilities

export const DRIVE_API_BASE_URL = 'https://www.googleapis.com/drive/v3';
export const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';

// Common helper to create base headers
function createBaseHeaders(accessToken: string): Record<string, string> {
	return {
		Authorization: `Bearer ${accessToken}`,
		Accept: 'application/json',
	};
}

// Common helper to handle API errors
async function handleApiError(response: Response): Promise<never> {
	const errorText = await response.text();
	throw new Error(`Drive API error: ${response.status} ${response.statusText} - ${errorText}`);
}

// Common helper to parse response based on content type
async function parseResponse(response: Response): Promise<unknown> {
	if (!response.ok) {
		await handleApiError(response);
	}

	const contentType = response.headers.get('content-type');

	if (contentType?.includes('application/json')) {
		const responseText = await response.text();

		if (!responseText.trim()) {
			return {success: true, message: 'Operation completed successfully'};
		}

		try {
			return JSON.parse(responseText);
		} catch (error) {
			throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	return (await response.text()) || 'Success';
}

// Utility function to make authenticated API calls
export async function makeDriveApiCall(
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
	endpoint: string,
	accessToken: string,
	body?: unknown,
) {
	const url = `${DRIVE_API_BASE_URL}${endpoint}`;
	const headers = createBaseHeaders(accessToken);

	if (body) {
		headers['Content-Type'] = 'application/json';
	}

	const fetchOptions: RequestInit = {
		method,
		headers,
	};

	if (body) {
		fetchOptions.body = JSON.stringify(body);
	}

	const response = await fetch(url, fetchOptions);
	return parseResponse(response);
}

// Multipart upload for creating/updating files with content
export async function uploadFile(
	accessToken: string,
	metadata: Record<string, unknown>,
	content: string | Buffer,
	mimeType: string,
	fileId?: string,
): Promise<unknown> {
	const boundary = '-------314159265358979323846';
	const delimiter = `\r\n--${boundary}\r\n`;
	const closeDelimiter = `\r\n--${boundary}--`;

	const metadataJson = JSON.stringify(metadata);

	// Determine if content is base64 encoded binary or plain text
	const contentBytes = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;

	const multipartBody = Buffer.concat([
		Buffer.from(delimiter),
		Buffer.from('Content-Type: application/json; charset=UTF-8\r\n\r\n'),
		Buffer.from(metadataJson),
		Buffer.from(delimiter),
		Buffer.from(`Content-Type: ${mimeType}\r\n\r\n`),
		contentBytes,
		Buffer.from(closeDelimiter),
	]);

	const url = fileId
		? `${DRIVE_UPLOAD_URL}/files/${fileId}?uploadType=multipart`
		: `${DRIVE_UPLOAD_URL}/files?uploadType=multipart`;

	const response = await fetch(url, {
		method: fileId ? 'PATCH' : 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': `multipart/related; boundary="${boundary}"`,
		},
		body: multipartBody,
	});

	return parseResponse(response);
}

// Download file content
export async function downloadFile(
	accessToken: string,
	fileId: string,
): Promise<{content: string; mimeType: string}> {
	const url = `${DRIVE_API_BASE_URL}/files/${fileId}?alt=media`;

	const response = await fetch(url, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	if (!response.ok) {
		await handleApiError(response);
	}

	const mimeType = response.headers.get('content-type') || 'application/octet-stream';
	const content = await response.text();

	return {content, mimeType};
}

// Export file (for Google Docs, Sheets, etc. to different formats)
export async function exportFile(
	accessToken: string,
	fileId: string,
	exportMimeType: string,
): Promise<{content: string; mimeType: string}> {
	const url = `${DRIVE_API_BASE_URL}/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`;

	const response = await fetch(url, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	if (!response.ok) {
		await handleApiError(response);
	}

	const content = await response.text();
	return {content, mimeType: exportMimeType};
}
