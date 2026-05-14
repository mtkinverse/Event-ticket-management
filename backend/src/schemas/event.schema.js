const CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP', 'AED'];

export const createEventBody = {
  type: 'object',
  required: ['title', 'description', 'category', 'location', 'startsAt', 'endsAt', 'capacity'],
  properties: {
    title:            { type: 'string', minLength: 1, maxLength: 200 },
    description:      { type: 'string', minLength: 1 },
    category:         { type: 'string', minLength: 1 },
    location:         { type: 'string', minLength: 1 },
    startsAt:         { type: 'string' },
    endsAt:           { type: 'string' },
    capacity:         { type: 'integer', minimum: 1 },
    ticketPriceMinor: { type: 'integer', minimum: 0 },
    currency:         { type: 'string', enum: CURRENCIES },
    meetingUrl:       { type: 'string', pattern: '^https://' },
    imageUrl:         { type: 'string' },
    refundDeadline:   { type: 'string' },
  },
  additionalProperties: false,
};

export const updateEventBody = {
  type: 'object',
  properties: {
    title:            { type: 'string', minLength: 1, maxLength: 200 },
    description:      { type: 'string', minLength: 1 },
    category:         { type: 'string', minLength: 1 },
    location:         { type: 'string', minLength: 1 },
    startsAt:         { type: 'string' },
    endsAt:           { type: 'string' },
    capacity:         { type: 'integer', minimum: 1 },
    ticketPriceMinor: { type: 'integer', minimum: 0 },
    currency:         { type: 'string', enum: CURRENCIES },
    meetingUrl:       { type: 'string', pattern: '^https://' },
    imageUrl:         { type: 'string' },
    refundDeadline:   { type: 'string' },
    registrationOpen: { type: 'boolean' },
  },
  additionalProperties: false,
};

export const rejectBody = {
  type: 'object',
  required: ['reason'],
  properties: {
    reason: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
};

export const eventQueryParams = {
  type: 'object',
  properties: {
    category: { type: 'string' },
    location: { type: 'string' },
    search:   { type: 'string' },
  },
};
