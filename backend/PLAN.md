# Backend Implementation Plan

## Conventions (all phases)

| Rule | Detail |
|---|---|
| Bulk-as-base repos | `insertBulk(records[])` is the real impl. `insert(data)` = `insertBulk([data])[0]`. Same for updates. |
| IoC for auth | `authorize(policyFn)` is a hook factory — routes inject the predicate. No role string inside the hook. |
| Error handling | Services throw `AppError(message, statusCode)`. App-level `setErrorHandler` converts to JSON. Handlers have no try-catch. |
| Response shaping | `shapeX(raw)` functions strip internal fields before `reply.send`. Defined in handlers, exported for reuse. |
| Factories write | All INSERT data produced by factory (UUID, hash, QR, defaults). Repos receive plain ready-to-insert objects. |
| Commit policy | One commit per phase after module is end-to-end testable. |

---

## Phase 1 — User & Auth ✅

**Commit:** `feat(backend): Phase 1 — user model, auth service, JWT lifecycle hooks`

**API:** `POST /auth/register`, `POST /auth/login`, `GET /auth/profile`

**Key files:** `db/`, `models/user.model.js`, `utils/hashing.js`, `utils/errors.js`, `repos/user.repo.js`, `strategies/factories/user.factory.js`, `strategies/policies/auth.policy.js`, `services/auth.service.js`, `schemas/auth.schema.js`, `handlers/auth.handler.js`, `routes/auth.routes.js`, `hooks/{authenticate,authorize,requestLogger}.js`

**Sync strategy:** `syncModels()` called from `server.js` only when `NODE_ENV=development && SYNC_MODELS=true`. Tests call `sequelize.sync({ force: true })` directly.

---

## Phase 2 — Event Management

**Commit:** `feat(backend): Phase 2 — event model, state machine, admin approval`

**API:**
- `POST /events` (organizer) — creates event with `status=pending`, holds application fee
- `GET /events?category=&search=` — public, active events
- `GET /events/:id` — public
- `GET /events/:id/related` — public
- `GET /organizer/events` — organizer's own events
- `POST /admin/events/:id/approve` — admin only
- `POST /admin/events/:id/reject` — admin only
- `GET /admin/events?status=pending` — admin only
- `PATCH /events/:id` — organizer (limited fields while active)

**Key additions:**
- `models/event.model.js`, `models/application_fee.model.js`
- `repos/event.repo.js`, `repos/application_fee.repo.js`
- `strategies/event-state/{index,pending,active,cancelled,completed}.js` — State pattern. `transition(event, action)` looks up the state object; no switch/if on status.
- `strategies/factories/event.factory.js`
- `strategies/policies/event.policy.js` — `canCreate`, `canApprove`, `canEdit`, `canCancel`
- `services/event.service.js`
- `handlers/event.handler.js`, `handlers/admin.handler.js`
- `routes/event.routes.js`, `routes/admin.routes.js`
- Tests: `tests/events.test.js`

---

## Phase 3 — Booking, Tickets & Waitlist

**Commit:** `feat(backend): Phase 3 — booking flow, QR tickets, waitlist auto-promotion`

**API:**
- `POST /bookings` — customer; atomic decrement on `Event.remaining` (Sequelize transaction + `LOCK: UPDATE`)
- `DELETE /bookings/:id` — customer cancel (checks `refundDeadline`)
- `GET /my/bookings` — customer's bookings + ticket data
- `POST /waitlist` — join waitlist when event full
- `DELETE /waitlist/:eventId` — leave waitlist

**Key additions:**
- `models/{booking,ticket,waitlist_entry}.model.js`
- `repos/{booking,ticket,waitlist_entry}.repo.js`
- `strategies/factories/{booking,ticket}.factory.js` — `ticket.factory` calls `utils/qr.js` to generate QR PNG as base64
- `strategies/policies/booking.policy.js` — `canBook`, `canCancel`
- `services/booking.service.js` — Sequelize transaction wraps slot decrement
- `services/waitlist.service.js` — `join`, `promote` (sets `holdExpiresAt = now + WAITLIST_HOLD_MINUTES`), `expireHeld`
- `utils/qr.js` — thin wrapper around `qrcode` lib
- Tests: `tests/bookings.test.js`, `tests/waitlist.test.js`

---

## Phase 4 — Payments (Stripe)

**Commit:** `feat(backend): Phase 4 — Stripe strategy, escrow fee, refund flow`

**API:**
- `POST /payments/webhook` — Stripe webhook; verifies signature, dispatches event type
- (Charge/refund triggered internally by booking and event services, not exposed as HTTP)

**Key additions:**
- `models/payment.model.js`
- `repos/payment.repo.js`
- `strategies/payment/payment.strategy.js` — interface doc (charge, refund)
- `strategies/payment/stripe.strategy.js` — PaymentIntent create/confirm/refund
- `strategies/payment/index.js` — `resolvePaymentStrategy(name)` → only `'stripe'` for now
- `services/payment.service.js` — `chargeBooking`, `refundBooking`, `holdFee`, `consumeFee`, `refundFee`
- `handlers/payment.handler.js` — webhook only
- `routes/payment.routes.js`
- Tests: `tests/payments.test.js` (mocked Stripe responses)

---

## Phase 5 — Notifications (Email) ✅ SHIPPED

**Commit:** `feat(backend): Phase 5 — email channel, booking confirmation, waitlist alerts`

**Shipped:**
- `models/notification.model.js` — audit row per dispatch (`pending` / `sent` / `failed`).
- `repos/notification.repo.js` — `...base` only.
- `strategies/notification/{notification.strategy,email.channel,mock.channel,sms.channel,in_app.channel,index}.js` — env-driven resolver mirrors the payment-strategy pattern. SMS / in-app are interface-only stubs.
- `services/notification.service.js` — `notify({ user, type, payload })`. SoC: caller pre-loads `user`; no internal `userRepo` fetch. Error-isolated: failures land as `status='failed'` rows and never propagate.
- `configs/templates.config.js` — single config file with all 6 builders + `getTemplate(type)` getter (no per-template files).
- `utils/template.js` — `populateTemplate(type, payload)` + shared responsive themed `layout()` (inline-styled, `@media` mobile rules, table-based for Gmail/Outlook compat).
- Wired into: `booking.service.create` (auto-clear waitlist on book + `booking.confirmed` email), `booking.service.cancel` (`booking.cancelled` + promote first waiting entry → `waitlist.promoted` email), `waitlist.service.join` (`waitlist.joined`), `event.service.approve` (`event.approved` to organizer), `event.service.reject` (`event.rejected` with reason).
- `waitlist.service.promote(eventId)` — transitions first waiting entry to `held` with `holdExpiresAt = now + WAITLIST_HOLD_MINUTES`.
- `waitlist.service.listMine(userId)` + `GET /waitlist/my` — frontend uses for the new Leave Waitlist button on `EventDetails`.
- Frontend: `services/api/waitlist.js`, `mappers/waitlist.mapper.js`, `hooks/useWaitlist.js`, `EventDetails` Join↔Leave toggle.
- Tests: `tests/notifications.test.js` (63 assertions, including template responsive markers + failure path), extended `tests/waitlist.test.js` (+15 — promote-on-cancel, auto-clear, `GET /waitlist/my`), extended `tests/bookings.test.js` (+3 — email assertions on happy paths).

**Phase 4 follow-up:** `waitlist.promoted` *template* shipped & wired here; the *hold enforcement* (reserving the seat exclusively for the held user + sweep job that re-promotes on hold expiry) is Phase 4. v1 hold is advisory.

---

## Phase 6 — Hardening (cross-cutting cleanup)

Runs after all feature phases are merged. Refactor-only pass — no new endpoints, no behavior change.

**Commit:** `refactor(backend): Phase 6 — hardening sweep (bulk queries, error paths, response shaping)`

**Items:**
- **Bulk-query sweep** — audit every `services/*.js` for N+1 patterns and convert to the bulk equivalents enforced by `backend/CLAUDE.md` "Bulk operations are mandatory":
  - `Promise.all(xs.map(id => repo.findById(id)))` → `repo.findMany({ id: ids })`
  - `for (const x of xs) { await repo.insert(x); }` / `Promise.all(records.map(repo.insert))` → `repo.insertBulk(records)`
  - Same shape for updates and deletes.
  - Confirmed entry points to inspect: `booking.service.js`, `waitlist.service.js`, `event.service.js`, `auth.service.js`. Grep `services/` for `Promise.all`, `\.findById`, `await repo.insert(` to surface anything missed.
- **Error-handler polish** — map Sequelize `UniqueConstraintError` / `ValidationError` to 409 / 422 with the offending field name surfaced in the JSON body.
- **Response shaping consistency** — every handler returns `{ <resource>: shape(...) }` and never a raw Sequelize instance; verify with a one-pass review of all handlers.
- **Tests for concurrency-sensitive paths** — at minimum `bookingService.create` under simultaneous requests (the row-lock is currently untested).
