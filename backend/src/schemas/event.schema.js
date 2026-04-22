export const createEventBody = {
  type: 'object',
  required: ['title', 'description', 'category', 'location', 'startsAt', 'endsAt', 'capacity', 'ticketPrice'],
  properties: {
    title:          { type: 'string', minLength: 1, maxLength: 200 },
    description:    { type: 'string', minLength: 1 },
    category:       { type: 'string', minLength: 1 },
    location:       { type: 'string', minLength: 1 },
    startsAt:       { type: 'string' },
    endsAt:         { type: 'string' },
    capacity:       { type: 'integer', minimum: 1 },
    ticketPrice:    { type: 'number', minimum: 0 },
    imageUrl:       { type: 'string' },
    refundDeadline: { type: 'string' },
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
    ticketPrice:      { type: 'number', minimum: 0 },
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
