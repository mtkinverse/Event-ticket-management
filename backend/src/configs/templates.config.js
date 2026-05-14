import { config } from './index.js';
import { escapeHtml as h } from '../utils/html.js';
import { AppError } from '../utils/errors.js';

const firstName = (user) => (user?.name ? String(user.name).split(' ')[0] : 'there');

const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

const heading = (text) =>
  `<h1 class="h1" style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#0F1B3D;font-weight:700;">${h(text)}</h1>`;

const para = (html) =>
  `<p style="margin:0 0 12px;color:#111827;">${html}</p>`;

const muted = (html) =>
  `<p style="margin:0 0 12px;color:#6B7280;font-size:13px;">${html}</p>`;

const metaBlock = (rows) =>
  `<div style="background:#F4F6F9;border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin:16px 0;">
    ${rows.map(([label, value]) =>
      `<div style="margin-bottom:8px;font-size:14px;color:#111827;">
        <span style="color:#6B7280;display:inline-block;min-width:90px;">${h(label)}</span>
        <strong>${h(value)}</strong>
      </div>`
    ).join('')}
  </div>`;

const eventUrl = (event) => `${config.appUrl}/events/${event.id}`;
const dashboardUrl = `${config.appUrl}/dashboard`;

export const templates = {
  'booking.confirmed': ({ user, event, tickets = [], booking }) => ({
    subject: `Your tickets for ${event.title}`,
    body: `
      ${heading(`You're in, ${firstName(user)}!`)}
      ${para(`Your booking for <strong>${h(event.title)}</strong> is confirmed.`)}
      ${metaBlock([
        ['Event', event.title],
        ['When',  fmtDateTime(event.startsAt)],
        ['Where', event.location],
        ['Qty',   `${booking.quantity} ticket${booking.quantity > 1 ? 's' : ''}`],
        ['Total', `$${Number(booking.totalAmount).toFixed(2)}`],
      ])}
      ${muted(`Your ${tickets.length} ticket${tickets.length > 1 ? 's are' : ' is'} attached as QR code${tickets.length > 1 ? 's' : ''}. Show them at the entrance.`)}
      ${tickets.length > 0
        ? `<div style="margin:16px 0;">${tickets.map(t => `<img src="cid:qr-${t.id}" alt="${h(t.ticketNumber)}" width="160" style="display:inline-block;margin:8px;border:1px solid #E5E7EB;border-radius:8px;image-rendering:pixelated;">`).join('')}</div>`
        : ''}
    `,
    attachments: tickets.map((t) => ({
      filename: `${t.ticketNumber}.png`,
      path:     t.qrCode,
      cid:      `qr-${t.id}`,
    })),
    ctaLabel: 'View my tickets',
    ctaUrl:   dashboardUrl,
  }),

  'booking.cancelled': ({ user, event, booking }) => ({
    subject: `Booking cancelled — ${event.title}`,
    body: `
      ${heading(`Booking cancelled`)}
      ${para(`Hi ${h(firstName(user))}, your booking for <strong>${h(event.title)}</strong> has been cancelled.`)}
      ${metaBlock([
        ['Event', event.title],
        ['When',  fmtDateTime(event.startsAt)],
        ['Qty',   `${booking.quantity} ticket${booking.quantity > 1 ? 's' : ''}`],
        ['Refund', booking.totalAmount ? `$${Number(booking.totalAmount).toFixed(2)} (processed separately)` : 'N/A'],
      ])}
      ${muted(`The seats have been released back to availability. If this was a mistake, you can book again from the event page.`)}
    `,
    ctaLabel: 'Browse events',
    ctaUrl:   `${config.appUrl}/events`,
  }),

  'waitlist.joined': ({ user, event }) => ({
    subject: `You're on the waitlist for ${event.title}`,
    body: `
      ${heading(`You're on the waitlist`)}
      ${para(`Hi ${h(firstName(user))}, we'll email you the moment a seat opens up for <strong>${h(event.title)}</strong>.`)}
      ${metaBlock([
        ['Event', event.title],
        ['When',  fmtDateTime(event.startsAt)],
        ['Where', event.location],
      ])}
      ${muted(`No further action needed — your spot in line is saved.`)}
    `,
    ctaLabel: 'View event',
    ctaUrl:   eventUrl(event),
  }),

  'waitlist.promoted': ({ user, event, holdExpiresAt }) => ({
    subject: `A seat opened up — ${event.title}`,
    body: `
      ${heading(`Good news, ${firstName(user)} — a seat is yours`)}
      ${para(`A seat just opened up for <strong>${h(event.title)}</strong>. Book before this hold expires:`)}
      ${metaBlock([
        ['Event',      event.title],
        ['When',       fmtDateTime(event.startsAt)],
        ['Hold until', fmtDateTime(holdExpiresAt)],
      ])}
      ${muted(`Tap the button below to claim your seat. After the hold expires the seat may be offered to the next person.`)}
    `,
    ctaLabel: 'Book my seat',
    ctaUrl:   eventUrl(event),
  }),

  'event.approved': ({ user, event }) => ({
    subject: `Your event is live — ${event.title}`,
    body: `
      ${heading(`Your event is approved`)}
      ${para(`Hi ${h(firstName(user))}, <strong>${h(event.title)}</strong> is now live and open for bookings.`)}
      ${metaBlock([
        ['Event', event.title],
        ['When',  fmtDateTime(event.startsAt)],
        ['Where', event.location],
      ])}
      ${muted(`Share the event link to drive registrations.`)}
    `,
    ctaLabel: 'View live event',
    ctaUrl:   eventUrl(event),
  }),

  'event.rejected': ({ user, event, reason }) => ({
    subject: `Action needed — ${event.title}`,
    body: `
      ${heading(`Your event needs changes`)}
      ${para(`Hi ${h(firstName(user))}, your submission <strong>${h(event.title)}</strong> wasn't approved.`)}
      ${metaBlock([
        ['Event',  event.title],
        ['Reason', reason || 'No reason provided'],
      ])}
      ${muted(`You can edit the event in the organizer dashboard and submit again.`)}
    `,
    ctaLabel: 'Open organizer dashboard',
    ctaUrl:   `${config.appUrl}/organizer`,
  }),
};

export const getTemplate = (type) => {
  const t = templates[type];
  if (!t) throw new AppError(`Unknown notification type: ${type}`, 500);
  return t;
};
