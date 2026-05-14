const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : null;

const mapEvent = (raw) => raw && ({
  id:                raw.id,
  title:             raw.title,
  location:          raw.location,
  startsAt:          raw.startsAt,
  startsAtFormatted: fmtDate(raw.startsAt),
  refundDeadline:    raw.refundDeadline ?? null,
  status:            raw.status,
});

export const mapWaitlistEntry = (raw) => ({
  id:            raw.id,
  userId:        raw.userId,
  eventId:       raw.eventId,
  status:        raw.status,
  joinedAt:      raw.joinedAt,
  holdExpiresAt: raw.holdExpiresAt ?? null,
  event:         mapEvent(raw.event),
});

export const mapWaitlistEntryList = (rawArr) => rawArr.map(mapWaitlistEntry);
