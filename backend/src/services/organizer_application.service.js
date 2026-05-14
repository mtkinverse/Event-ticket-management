import { organizerApplicationRepo } from '../repos/organizer_application.repo.js';
import { userRepo }                 from '../repos/user.repo.js';
import { createOrganizerApplication } from '../strategies/factories/organizer_application.factory.js';
import {
  canSubmitOrganizerApplication,
  canReviewOrganizerApplications,
} from '../strategies/policies/organizer_application.policy.js';
import { notificationService } from './notification.service.js';
import { AppError }            from '../utils/errors.js';

const slimApplication = ({ updatedAt, createdAt, ...a }) => a;

export const organizerApplicationService = {
  async submit(data, user) {
    if (!canSubmitOrganizerApplication(user)) {
      throw new AppError('Only customers can apply to be organizers', 403);
    }

    const existing = await organizerApplicationRepo.findMany({ userId: user.id, status: 'pending' });
    if (existing.length > 0) {
      throw new AppError('You already have a pending application', 409);
    }

    const row   = createOrganizerApplication({ ...data, userId: user.id });
    const saved = await organizerApplicationRepo.insert(row);

    await notificationService.notify({
      user,
      type: 'organizer.application.submitted',
      payload: { application: slimApplication(saved) },
    });

    return saved;
  },

  async getMine(userId) {
    const rows = await organizerApplicationRepo.findMany({ userId });
    return rows[0] ?? null;
  },

  async listPending(actor) {
    if (!canReviewOrganizerApplications(actor)) {
      throw new AppError('Forbidden', 403);
    }
    return organizerApplicationRepo.findMany({ status: 'pending' });
  },

  async approve(applicationId, admin) {
    if (!canReviewOrganizerApplications(admin)) throw new AppError('Forbidden', 403);

    const app = await organizerApplicationRepo.findById(applicationId);
    if (!app)                       throw new AppError('Application not found', 404);
    if (app.status !== 'pending')   throw new AppError(`Application is ${app.status}`, 422);

    const result = await organizerApplicationRepo.withTransaction(async (t) => {
      await userRepo.updateById(app.userId, { role: 'organizer' }, { transaction: t });
      const reviewedAt = new Date();
      await organizerApplicationRepo.updateById(applicationId, {
        status:     'approved',
        reviewedBy: admin.id,
        reviewedAt,
      }, { transaction: t });
      return { ...app, status: 'approved', reviewedBy: admin.id, reviewedAt };
    });

    const applicant = await userRepo.findById(result.userId);
    await notificationService.notify({
      user: applicant,
      type: 'organizer.application.approved',
      payload: { application: slimApplication(result) },
    });

    return result;
  },

  async reject(applicationId, reason, admin) {
    if (!canReviewOrganizerApplications(admin)) throw new AppError('Forbidden', 403);

    const app = await organizerApplicationRepo.findById(applicationId);
    if (!app)                       throw new AppError('Application not found', 404);
    if (app.status !== 'pending')   throw new AppError(`Application is ${app.status}`, 422);

    const reviewedAt = new Date();
    await organizerApplicationRepo.updateById(applicationId, {
      status:          'rejected',
      reviewedBy:      admin.id,
      reviewedAt,
      rejectionReason: reason,
    });
    const result = { ...app, status: 'rejected', reviewedBy: admin.id, reviewedAt, rejectionReason: reason };

    const applicant = await userRepo.findById(result.userId);
    await notificationService.notify({
      user: applicant,
      type: 'organizer.application.rejected',
      payload: { application: slimApplication(result), reason },
    });

    return result;
  },
};
