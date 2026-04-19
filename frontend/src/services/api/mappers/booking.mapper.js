const fmtPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

export const mapBooking = (raw) => ({
  id: raw.id,
  userId: raw.userId,
  eventId: raw.eventId,
  quantity: raw.quantity,
  total: raw.totalAmount / 100,
  totalFormatted: fmtPrice(raw.totalAmount),
  status: raw.status,
  placedAt: raw.placedAt,
  placedAtFormatted: new Date(raw.placedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
});

export const mapBookingList = (rawArr) => rawArr.map(mapBooking);
