export const createBookingBody = {
  type: 'object',
  required: ['eventId', 'quantity'],
  properties: {
    eventId:  { type: 'string', format: 'uuid' },
    quantity: { type: 'integer', minimum: 1 },
  },
  additionalProperties: false,
};
