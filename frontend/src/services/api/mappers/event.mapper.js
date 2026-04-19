const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmtPrice = (cents) =>
  cents === 0 ? 'Free' : `$${(cents / 100).toFixed(2)}`;

const fmtDate = (iso) => {
  const d = new Date(iso);
  return { day: d.getDate(), month: MONTHS[d.getMonth()], full: d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) };
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
  price: raw.ticketPrice / 100,
  priceFormatted: fmtPrice(raw.ticketPrice),
  imageUrl: raw.imageUrl,
  status: raw.status,
  refundDeadline: raw.refundDeadline,
  registrationOpen: raw.registrationOpen,
  createdAt: raw.createdAt,
});

export const mapEventList = (rawArr) => rawArr.map(mapEvent);
