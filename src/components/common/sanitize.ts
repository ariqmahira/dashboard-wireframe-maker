import DOMPurify from 'dompurify';

export const purifyConfig = { ADD_ATTR: ['data-cwb-slot', 'target'] };

/**
 * Sanitize an HTML string with the app-wide DOMPurify config. Single source of
 * truth so anything that produces HTML (e.g. the visual editor) stays in sync
 * with what actually renders.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, purifyConfig);
}
