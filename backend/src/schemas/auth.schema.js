export const registerBody = {
  type: 'object',
  required: ['name', 'email', 'password'],
  properties: {
    name:     { type: 'string', minLength: 1, maxLength: 100 },
    email:    { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 6 },
    phone:    { type: 'string', maxLength: 20 },
  },
  additionalProperties: false,
};

export const loginBody = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email:    { type: 'string', format: 'email' },
    password: { type: 'string' },
  },
  additionalProperties: false,
};
