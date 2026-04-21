export const post = (app, url, body, headers = {}) =>
  app.inject({ method: 'POST', url, payload: body, headers: { 'content-type': 'application/json', ...headers } });

export const get = (app, url, token) =>
  app.inject({ method: 'GET', url, headers: token ? { authorization: `Bearer ${token}` } : {} });
