/**
 * Interface contract for notification channels. JSDoc-only — no runtime export.
 *
 * @typedef {Object} NotificationMessage
 * @property {string} to       - Recipient address (email, phone, etc.)
 * @property {string} subject  - Subject line / push title
 * @property {string} html     - Rendered body (HTML for email, plaintext for SMS)
 * @property {Array<{filename: string, path: string, cid?: string}>} [attachments]
 *
 * @typedef {Object} NotificationChannel
 * @property {string} name
 * @property {(msg: NotificationMessage) => Promise<{ providerId?: string }>} send
 */
