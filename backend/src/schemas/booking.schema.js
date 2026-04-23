export const createBookingBody = {
  type: 'object',
  required: ['eventId', 'quantity'],
  properties: {
    eventId:  { type: 'string' },
    quantity: { type: 'integer', minimum: 1 },
  },
  additionalProperties: false,
};

export const joinWaitlistBody = {
  type: 'object',
  required: ['eventId'],
  properties: {
    eventId: { type: 'string' },
  },
  additionalProperties: false,
};
