const SYMBOLS = { USD: '$', PKR: '₨', EUR: '€', GBP: '£', AED: 'AED ' };

// Most ISO-4217 currencies use 100 minor units per major; override exceptions here.
const MINOR_DIVISOR = { JPY: 1 };

export const SUPPORTED_CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP', 'AED'];

export const formatMoney = (amountMinor, currency = 'USD') => {
  if (!amountMinor) return 'Free';
  const divisor = MINOR_DIVISOR[currency] ?? 100;
  const major   = (amountMinor / divisor).toLocaleString('en-US', { minimumFractionDigits: 2 });
  return `${SYMBOLS[currency] ?? currency + ' '}${major}`;
};
