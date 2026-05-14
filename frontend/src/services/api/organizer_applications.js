import { req } from './http.js';
import { mapOrganizerApplication, mapOrganizerApplicationList } from './mappers/organizer_application.mapper.js';

export const organizerApplicationsApi = {
  submit: async ({ businessName, motivation, paymentAmountMinor, currency, paymentReference, snapshotFile }) => {
    const form = new FormData();
    form.append('businessName',       businessName);
    form.append('motivation',         motivation);
    form.append('paymentAmountMinor', String(paymentAmountMinor));
    form.append('currency',           currency);
    form.append('paymentReference',   paymentReference);
    form.append('snapshot',           snapshotFile);
    const { application } = await req('/organizer-applications', { method: 'POST', body: form });
    return mapOrganizerApplication(application);
  },

  getMine: async () => {
    const { application } = await req('/organizer-applications/mine');
    return mapOrganizerApplication(application);
  },

  listPending: async () => {
    const { applications } = await req('/admin/organizer-applications');
    return mapOrganizerApplicationList(applications);
  },

  approve: async (id) => {
    const { application } = await req(`/admin/organizer-applications/${id}/approve`, { method: 'POST', body: JSON.stringify({}) });
    return mapOrganizerApplication(application);
  },

  reject: async (id, reason) => {
    const { application } = await req(`/admin/organizer-applications/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
    return mapOrganizerApplication(application);
  },
};
