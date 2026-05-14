const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const escapeHtml = (str) =>
  str == null ? '' : String(str).replace(/[&<>"']/g, (c) => ENTITIES[c]);
