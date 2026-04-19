const VARIANT_MAP = {
  active:    'active',
  pending:   'pending',
  cancelled: 'cancelled',
  confirmed: 'active',
  refunded:  'cancelled',
  sold_out:  'cancelled',
};

export function Badge({ label, variant }) {
  const v = variant || VARIANT_MAP[label?.toLowerCase()] || 'primary';
  return <span className={`badge badge--${v}`}>{label}</span>;
}
