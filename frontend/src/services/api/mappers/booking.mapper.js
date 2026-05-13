const fmtPrice = (dollars) => `$${Number(dollars).toFixed(2)}`;

const fmtBookingDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

const mapBookingEvent = (raw) => ({
  id:             raw.id,
  title:          raw.title,
  location:       raw.location,
  startsAt:       raw.startsAt,
  startsAtFormatted: fmtBookingDate(raw.startsAt),
  refundDeadline: raw.refundDeadline ?? null,
  status:         raw.status,
});

export const mapBooking = (raw) => ({
  id: raw.id,
  userId: raw.userId,
  eventId: raw.eventId,
  quantity: raw.quantity,
  tickets: raw.tickets ?? [],
  total: raw.totalAmount,
  totalFormatted: fmtPrice(raw.totalAmount),
  status: raw.status,
  placedAt: raw.placedAt,
  placedAtFormatted: new Date(raw.placedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
  cancelledAt: raw.cancelledAt ?? null,
  event: raw.event ? mapBookingEvent(raw.event) : null,
});

export const mapBookingList = (rawArr) => rawArr.map(mapBooking);
