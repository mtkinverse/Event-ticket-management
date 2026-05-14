import { v4 as uuidv4 } from 'uuid';

const history = [];

export const mockChannel = {
  name: 'mock',
  send: async ({ to, subject, html, attachments }) => {
    const providerId = `mock-${uuidv4()}`;
    history.push({ to, subject, html, attachments: attachments ?? [], providerId, at: new Date() });
    return { providerId };
  },
  // Test helpers — kept on the channel itself for ergonomic mocking.
  history,
  clear: () => { history.length = 0; },
  last:  () => history[history.length - 1] ?? null,
  count: (predicate) => predicate ? history.filter(predicate).length : history.length,
};
