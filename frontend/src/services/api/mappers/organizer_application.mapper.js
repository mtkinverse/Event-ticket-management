import { formatMoney } from '../../../utils/currency.js';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : null;

export const mapOrganizerApplication = (raw) => raw && ({
  id:                  raw.id,
  userId:              raw.userId,
  businessName:        raw.businessName,
  motivation:          raw.motivation,
  paymentSnapshotPath: raw.paymentSnapshotPath,
  paymentSnapshotUrl:  raw.paymentSnapshotPath
    ? `${import.meta.env.VITE_API_URL}${raw.paymentSnapshotPath}`
    : null,
  paymentAmountMinor:  raw.paymentAmountMinor,
  paymentFormatted:    formatMoney(raw.paymentAmountMinor, raw.currency),
  currency:            raw.currency,
  paymentReference:    raw.paymentReference,
  status:              raw.status,
  reviewedBy:          raw.reviewedBy,
  reviewedAt:          raw.reviewedAt,
  rejectionReason:     raw.rejectionReason,
  submittedAt:         raw.submittedAt,
  submittedAtFormatted: fmtDate(raw.submittedAt),
});

export const mapOrganizerApplicationList = (rawArr) => rawArr.map(mapOrganizerApplication);
