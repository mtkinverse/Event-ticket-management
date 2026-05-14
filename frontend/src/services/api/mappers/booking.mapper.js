import { formatMoney } from '../../../utils/currency.js';

const fmtBookingDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

const mapBookingEvent = (raw) => ({
  id:                raw.id,
  title:             raw.title,
  location:          raw.location,
  startsAt:          raw.startsAt,
  startsAtFormatted: fmtBookingDate(raw.startsAt),
  refundDeadline:    raw.refundDeadline ?? null,
  meetingUrl:        raw.meetingUrl ?? null,
  ticketPriceMinor:  raw.ticketPriceMinor ?? 0,
  currency:          raw.currency ?? 'PKR',
  status:            raw.status,
});

export const mapBooking = (raw) => {
  const currency = raw.currency ?? 'PKR';
  const totalMinor = raw.totalAmountMinor ?? 0;
  return {
    id: raw.id,
    userId: raw.userId,
    eventId: raw.eventId,
    quantity: raw.quantity,
    tickets: raw.tickets ?? [],
    totalMinor,
    currency,
    totalFormatted: formatMoney(totalMinor, currency),
    isFree:         totalMinor === 0,
    status: raw.status,
    placedAt: raw.placedAt,
    placedAtFormatted: new Date(raw.placedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    cancelledAt: raw.cancelledAt ?? null,
    event: raw.event ? mapBookingEvent(raw.event) : null,
  };
};

export const mapBookingList = (rawArr) => rawArr.map(mapBooking);
