import { eventRepo }           from '../repos/event.repo.js';
import { applicationFeeRepo }  from '../repos/application_fee.repo.js';
import { userRepo }            from '../repos/user.repo.js';
import { createEvent, createApplicationFee } from '../strategies/factories/event.factory.js';
import { canEditEvent }        from '../strategies/policies/event.policy.js';
import { transition }          from '../strategies/event-state/index.js';
import { resolvePaymentStrategy } from '../strategies/payment/index.js';
import { notificationService } from './notification.service.js';
import { config }              from '../configs/index.js';
import { AppError }            from '../utils/errors.js';

const slimEvent = (e) => e && ({
  id:             e.id,
  title:          e.title,
  location:       e.location,
  startsAt:       e.startsAt,
  refundDeadline: e.refundDeadline,
  status:         e.status,
});

export const eventService = {
  async create(data, organizerId) {
    const event = createEvent({ ...data, organizerId });
    const saved = await eventRepo.insert(event);

    const payment = await resolvePaymentStrategy(config.paymentGateway).charge({
      amount:   config.applicationFeeAmount,
      metadata: { eventId: saved.id, organizerId },
    });

    const fee = createApplicationFee({
      organizerId,
      eventId:                saved.id,
      amount:                 config.applicationFeeAmount,
      gatewayPaymentIntentId: payment.gatewayPaymentIntentId,
    });
    await applicationFeeRepo.insert(fee);

    return saved;
  },

  getAll(filters) {
    return eventRepo.findActive(filters);
  },

  getTop() {
    return eventRepo.findTop();
  },

  async getOne(id) {
    const event = await eventRepo.findById(id);
    if (!event) throw new AppError('Event not found', 404);
    return event;
  },

  async getRelated(id) {
    const event = await eventRepo.findById(id);
    if (!event) throw new AppError('Event not found', 404);
    return eventRepo.findRelated(id, event.category);
  },

  getOrganizerEvents(organizerId) {
    return eventRepo.findByOrganizer(organizerId);
  },

  getPending() {
    return eventRepo.findPending();
  },

  async approve(id) {
    const event = await eventRepo.findById(id);
    if (!event) throw new AppError('Event not found', 404);

    const patch = transition(event, 'approve');
    const saved = await eventRepo.updateById(id, patch);

    const fee = await applicationFeeRepo.findByEvent(id);
    if (fee) {
      await applicationFeeRepo.updateById(fee.id, { status: 'consumed', resolvedAt: new Date() });
    }

    const organizer = await userRepo.findById(event.organizerId);
    await notificationService.notify({
      user: organizer,
      type: 'event.approved',
      payload: { event: slimEvent(saved) },
    });

    return saved;
  },

  async reject(id, reason) {
    const event = await eventRepo.findById(id);
    if (!event) throw new AppError('Event not found', 404);

    const patch = transition(event, 'reject');
    const saved = await eventRepo.updateById(id, { ...patch, rejectionReason: reason });

    const fee = await applicationFeeRepo.findByEvent(id);
    if (fee) {
      await resolvePaymentStrategy(config.paymentGateway).refund({
        gatewayPaymentIntentId: fee.gatewayPaymentIntentId,
        amount: fee.amount,
      });
      await applicationFeeRepo.updateById(fee.id, { status: 'refunded', resolvedAt: new Date() });
    }

    const organizer = await userRepo.findById(event.organizerId);
    await notificationService.notify({
      user: organizer,
      type: 'event.rejected',
      payload: { event: slimEvent(saved), reason },
    });

    return saved;
  },

  async update(id, data, user) {
    const event = await eventRepo.findById(id);
    if (!event) throw new AppError('Event not found', 404);
    if (!canEditEvent(user, event)) throw new AppError('Forbidden', 403);

    const ACTIVE_ALLOWED  = ['description', 'imageUrl', 'refundDeadline', 'registrationOpen'];
    const PENDING_ALLOWED = ['title', 'description', 'category', 'location', 'startsAt', 'endsAt', 'capacity', 'ticketPrice', 'imageUrl', 'refundDeadline', 'registrationOpen'];
    const allowed = event.status === 'active' ? ACTIVE_ALLOWED : PENDING_ALLOWED;

    const patch = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
    return eventRepo.updateById(id, patch);
  },
};
