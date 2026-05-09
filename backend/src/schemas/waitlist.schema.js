export const joinWaitlistBody = {
  type: 'object',
  required: ['eventId'],
  properties: {
    eventId: { type: 'string', format: 'uuid' },
  },
  additionalProperties: false,
};
