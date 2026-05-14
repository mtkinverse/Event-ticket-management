import { v4 as uuidv4 } from 'uuid';

export const createOrganizerApplication = ({
  userId, businessName, motivation,
  paymentSnapshotPath, paymentAmountMinor, currency = 'PKR', paymentReference,
}) => ({
  id:                  uuidv4(),
  userId,
  businessName,
  motivation,
  paymentSnapshotPath,
  paymentAmountMinor,
  currency,
  paymentReference,
  status:              'pending',
  reviewedBy:          null,
  reviewedAt:          null,
  rejectionReason:     null,
  submittedAt:         new Date(),
});
