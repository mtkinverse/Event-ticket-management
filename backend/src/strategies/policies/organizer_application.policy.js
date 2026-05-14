export const canSubmitOrganizerApplication = (user) => user.role === 'customer';

export const canReviewOrganizerApplications = (user) => user.role === 'admin';
