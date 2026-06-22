import {describe, expect, test} from 'vitest';
import {isTextMimeType} from './drive-api.js';

describe('isTextMimeType', () => {
	test.each([
		'text/plain',
		'text/csv',
		'text/html; charset=utf-8',
		'application/json',
		'application/json; charset=UTF-8',
		'application/xml',
		'application/javascript',
		'application/yaml',
		'application/rtf',
		'application/ld+json',
		'image/svg+xml',
	])('returns true for %s', (mimeType) => {
		expect(isTextMimeType(mimeType)).toBe(true);
	});

	test.each([
		'application/pdf',
		'application/octet-stream',
		'image/png',
		'image/jpeg',
		'application/zip',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'video/mp4',
	])('returns false for %s', (mimeType) => {
		expect(isTextMimeType(mimeType)).toBe(false);
	});
});
