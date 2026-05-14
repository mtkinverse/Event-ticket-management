import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:5173',

  databaseUrl: process.env.DATABASE_URL,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  paymentGateway: process.env.PAYMENT_GATEWAY || 'mock',
  applicationFee: {
    amountMinor: Number(process.env.APPLICATION_FEE_AMOUNT_MINOR) || 500000,  // ₨ 5,000 default
    currency:    process.env.APPLICATION_FEE_CURRENCY || 'PKR',
  },
  waitlistHoldMinutes: Number(process.env.WAITLIST_HOLD_MINUTES) || 15,

  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
  },
};
