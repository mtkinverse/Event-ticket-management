import { formatMoney } from '../../../utils/currency.js';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmtDate = (iso) => {
  const d = new Date(iso);
  return { day: d.getDate(), month: MONTHS[d.getMonth()], full: d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) };
};

// Backend stores uploaded images as relative paths like `/uploads/events/<uuid>.png`.
// Externally-hosted URLs (https://…, data:…) are kept as-is.
const resolveImageUrl = (url) => {
  if (!url) return null;
  if (/^(https?:)?\/\//.test(url) || url.startsWith('data:')) return url;
  return `${import.meta.env.VITE_API_URL}${url}`;
};

export const mapEvent = (raw) => ({
  id: raw.id,
  organizerId: raw.organizerId,
  title: raw.title,
  description: raw.description,
  category: raw.category,
  location: raw.location,
  date: fmtDate(raw.startsAt),
  startsAt: raw.startsAt,
  endsAt: raw.endsAt,
  capacity: raw.capacity,
  remaining: raw.remaining,
  isSoldOut: raw.remaining === 0,
  isAlmostFull: raw.remaining > 0 && raw.remaining <= 10,
  priceMinor:     raw.ticketPriceMinor ?? 0,
  currency:       raw.currency ?? 'PKR',
  priceFormatted: formatMoney(raw.ticketPriceMinor ?? 0, raw.currency ?? 'PKR'),
  isFree:         (raw.ticketPriceMinor ?? 0) === 0,
  imageUrl: resolveImageUrl(raw.imageUrl),
  meetingUrl: raw.meetingUrl ?? null,
  status: raw.status,
  rejectionReason: raw.rejectionReason ?? null,
  refundDeadline: raw.refundDeadline,
  registrationOpen: raw.registrationOpen,
  createdAt: raw.createdAt,
});

export const mapEventList = (rawArr) => rawArr.map(mapEvent);
